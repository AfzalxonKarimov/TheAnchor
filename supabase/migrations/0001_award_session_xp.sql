-- 0001_award_session_xp.sql
-- Atomic XP award + level recompute on check-in (session) completion.
--
-- Why an RPC instead of client-side read-modify-write:
--   The old flow did `select total_xp` then `update total_xp = <new>` from the
--   client. Two check-ins finishing close together could both read the same
--   old value and the second write would clobber the first, losing XP. Doing it
--   in one function with `select ... for update` serializes per-user writes and
--   keeps profiles.level always consistent with total_xp.
--
-- Call from the app as:
--   select * from award_session_xp(p_anchor_id, p_duration_seconds);

-- ---------------------------------------------------------------------------
-- Level curve. MUST stay in sync with LEVEL_THRESHOLDS in lib/leveling.js.
-- Returns the highest level whose required XP is <= p_total_xp (min level 1).
-- Caps at level 10 like the JS table; extend both together past level 10.
-- ---------------------------------------------------------------------------
create or replace function public.level_from_xp(p_total_xp integer)
returns integer
language sql
immutable
as $$
  with thresholds(level, required) as (
    values
      (1, 0), (2, 100), (3, 250), (4, 450), (5, 700),
      (6, 1000), (7, 1400), (8, 1900), (9, 2500), (10, 3200)
  )
  select coalesce(max(level), 1)
  from thresholds
  where required <= greatest(coalesce(p_total_xp, 0), 0);
$$;

-- ---------------------------------------------------------------------------
-- Award XP for one completed check-in, atomically.
-- ---------------------------------------------------------------------------
create or replace function public.award_session_xp(
  p_anchor_id uuid,
  p_duration_seconds integer
)
returns table (
  xp_awarded   integer,
  new_total_xp integer,
  old_level    integer,
  new_level    integer,
  leveled_up   boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_xp        integer;
  v_old_total integer;
  v_old_level integer;
  v_new_total integer;
  v_new_level integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_duration_seconds is null or p_duration_seconds <= 0 then
    raise exception 'duration_seconds must be greater than 0';
  end if;

  -- Ownership check (defense in depth alongside RLS): the anchor must be the
  -- caller's, so a user can't log time against someone else's anchor.
  if not exists (
    select 1 from anchors a
    where a.id = p_anchor_id and a.user_id = v_user_id
  ) then
    raise exception 'Anchor % not found for current user', p_anchor_id;
  end if;

  -- XP formula (matches calculateCheckInXP in lib/leveling.js):
  --   20 base + 1 per whole minute, bonus capped at +30  => max 50 XP.
  v_xp := 20 + least(floor(p_duration_seconds / 60.0)::int, 30);

  -- Record the session.
  insert into sessions (anchor_id, user_id, duration_seconds, xp)
  values (p_anchor_id, v_user_id, p_duration_seconds, v_xp);

  -- Lock the profile row so concurrent check-ins can't clobber total_xp.
  select total_xp, level
    into v_old_total, v_old_level
  from profiles
  where id = v_user_id
  for update;

  v_old_total := coalesce(v_old_total, 0);
  v_old_level := coalesce(v_old_level, 1);
  v_new_total := v_old_total + v_xp;
  v_new_level := public.level_from_xp(v_new_total);

  update profiles
     set total_xp = v_new_total,
         level    = v_new_level
   where id = v_user_id;

  return query
    select v_xp, v_new_total, v_old_level, v_new_level, (v_new_level > v_old_level);
end;
$$;

grant execute on function public.level_from_xp(integer) to authenticated;
grant execute on function public.award_session_xp(uuid, integer) to authenticated;
