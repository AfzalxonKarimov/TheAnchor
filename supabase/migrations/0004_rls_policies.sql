-- 0004_rls_policies.sql
-- Phase 4 RLS hardening: replace the permissive dev policies with strict
-- per-user ownership (auth.uid() = owner column). Must run AFTER 0002, so every
-- existing user already has a profiles row before writes are locked down.
--
-- Ownership columns: anchors.user_id, sessions.user_id, profiles.id.
--
-- Note on writes that intentionally bypass these policies:
--   * award_session_xp() is SECURITY DEFINER — it inserts sessions and updates
--     profiles regardless of RLS, so no session UPDATE/DELETE policy is needed.
--   * Deleting an anchor cascades to its sessions via the FK (also bypasses RLS).
-- Momentum, however, is written CLIENT-SIDE (settleMomentum/updateMomentum in
-- lib/momentum.js) and profile edits go through updateProfile — both need the
-- profiles UPDATE policy below, or those writes silently affect 0 rows.

-- ---------------------------------------------------------------------------
-- anchors — full CRUD, owner only
-- ---------------------------------------------------------------------------
alter table public.anchors enable row level security;

drop policy if exists "anchors_insert_own" on public.anchors;
create policy "anchors_insert_own" on public.anchors
  for insert with check (auth.uid() = user_id);

drop policy if exists "anchors_select_own" on public.anchors;
create policy "anchors_select_own" on public.anchors
  for select using (auth.uid() = user_id);

drop policy if exists "anchors_update_own" on public.anchors;
create policy "anchors_update_own" on public.anchors
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "anchors_delete_own" on public.anchors;
create policy "anchors_delete_own" on public.anchors
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- sessions — insert + select own. Session rows are only ever written by the
-- SECURITY DEFINER RPC (award_session_xp) and removed via anchor cascade, so no
-- client-facing UPDATE/DELETE policy is required.
-- ---------------------------------------------------------------------------
alter table public.sessions enable row level security;

drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own" on public.sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own" on public.sessions
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- profiles — ownership column is `id` (not user_id). INSERT + SELECT + UPDATE
-- own. UPDATE is required for client-side momentum writes and profile edits.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
