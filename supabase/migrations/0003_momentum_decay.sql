-- 0003_momentum_decay.sql
-- Support lazy momentum decay.
--
-- Momentum should drift DOWN when a user stops showing up (never resetting to
-- zero — floor of 10). Rather than a cron job, decay is computed lazily: we
-- store when momentum was last settled, and on the next read/write we subtract
-- MOMENTUM_DECAY per full day elapsed (see lib/momentum.js applyDecay).
--
-- This migration is schema-only; the decay math lives in the client.

alter table public.profiles
  add column if not exists momentum_updated_at timestamptz;

-- Backfill: anchor decay to each user's real last activity (their most recent
-- session), falling back to account creation. Honest starting point so an
-- already-inactive user sees the accrued decay on next load. The floor of 10
-- prevents any harsh drop.
update public.profiles p
set momentum_updated_at = coalesce(
  (select max(s.created_at) from public.sessions s where s.user_id = p.id),
  p.created_at,
  now()
)
where momentum_updated_at is null;

-- New rows (via handle_new_user trigger / award_session_xp self-heal) get now().
alter table public.profiles
  alter column momentum_updated_at set default now();
