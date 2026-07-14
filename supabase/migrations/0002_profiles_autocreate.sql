-- 0002_profiles_autocreate.sql
-- Guarantee every user has a profiles row, so XP/level always persist.
--
-- Bug this fixes: nothing in the app ever called createProfile(), so users had
-- no profiles row. award_session_xp() inserted the session then ran
-- `update profiles ... where id = uid`, which matched 0 rows — XP silently
-- vanished while the UI still showed "+20 XP".
--
-- Three layers:
--   1. Trigger on auth.users so every NEW signup gets a profile automatically.
--   2. One-time backfill for EXISTING users (sums their existing sessions so
--      already-logged XP is credited, not lost).
--   3. award_session_xp() self-heals (creates the profile if missing) as
--      defense in depth. Runs as SECURITY DEFINER, so it bypasses RLS.

-- ---------------------------------------------------------------------------
-- 1. Auto-create a profile whenever a new auth user is created.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, total_xp, level, momentum)
  values (
    new.id,
    'user_' || substr(new.id::text, 1, 8),
    0, 1, 50
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Backfill existing users who have no profile row.
--    Credit any XP they already earned from prior sessions.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, username, total_xp, level, momentum)
select
  u.id,
  'user_' || substr(u.id::text, 1, 8),
  coalesce(s.total_xp, 0),
  public.level_from_xp(coalesce(s.total_xp, 0)),
  50
from auth.users u
left join (
  select user_id, sum(xp)::int as total_xp
  from public.sessions
  group by user_id
) s on s.user_id = u.id
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- For users who already HAD a profile but whose total_xp drifted from their
-- session history (e.g. earlier failed writes), leave their stored total alone —
-- we only reconcile brand-new backfilled rows above to avoid clobbering data.

-- ---------------------------------------------------------------------------
-- 3. Make award_session_xp self-healing: create the profile if it's missing
--    before locking/updating it. Everything else is unchanged from 0001.
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

  -- Ownership check (defense in depth alongside RLS).
  if not exists (
    select 1 from anchors a
    where a.id = p_anchor_id and a.user_id = v_user_id
  ) then
    raise exception 'Anchor % not found for current user', p_anchor_id;
  end if;

  -- Self-heal: ensure the profile exists so the UPDATE below can't no-op.
  insert into profiles (id, username, total_xp, level, momentum)
  values (v_user_id, 'user_' || substr(v_user_id::text, 1, 8), 0, 1, 50)
  on conflict (id) do nothing;

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

grant execute on function public.award_session_xp(uuid, integer) to authenticated;
