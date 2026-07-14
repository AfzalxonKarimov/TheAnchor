import { supabase } from './client';
import { calculateCheckInXP, getRankFromLevel } from '../../lib/leveling';

// Fetch today's sessions for the current user
export const getTodaySessions = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('getTodaySessions - user:', user?.id || 'no user');
  if (!user) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from('sessions')
    .select('*, anchors(*)')
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching today sessions:', error);
    throw error;
  }

  console.log('getTodaySessions - found sessions:', data?.length || 0);
  return data || [];
};

// Fetch all sessions for an anchor
export const getSessionsByAnchor = async (anchorId) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('anchor_id', anchorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions by anchor:', error);
    throw error;
  }

  return data || [];
};

// Create a new session (called when timer finishes)
export const createSession = async ({ anchorId, durationSeconds, xp }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      anchor_id: anchorId,
      user_id: user.id,
      duration_seconds: durationSeconds,
      xp: xp,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    throw error;
  }

  return data;
};

// Note: XP calculation is now handled by lib/leveling.js (calculateCheckInXP)
// This function is kept for backward compatibility but delegates to the canonical source
export const calculateSessionXP = (durationSeconds) => {
  return calculateCheckInXP(durationSeconds);
};

/**
 * Award XP for a completed check-in via the atomic Supabase RPC.
 *
 * This is the canonical write path on session finish. In a single transaction the
 * `award_session_xp` function inserts the session row, increments profiles.total_xp,
 * and recomputes profiles.level server-side — so concurrent check-ins can't clobber
 * XP (no client read-modify-write race) and the stored level always matches total_xp.
 *
 * Rank is derived here in JS (from getRankFromLevel) rather than duplicated in SQL.
 *
 * @param {Object} params
 * @param {string} params.anchorId          Anchor being checked in
 * @param {number} params.durationSeconds    Tracked duration in seconds (> 0)
 * @returns {Promise<{
 *   xpAwarded: number,
 *   newTotalXP: number,
 *   oldLevel: number,
 *   newLevel: number,
 *   leveledUp: boolean,
 *   oldRank: string,
 *   newRank: string,
 *   rankChanged: boolean,
 * }>}
 */
export const awardSessionXP = async ({ anchorId, durationSeconds }) => {
  // Ensure profile exists before awarding XP (handles new users who never created a profile).
  // The RPC does SELECT ... FOR UPDATE then UPDATE profiles WHERE id = user_id,
  // which silently succeeds (0 rows updated) if the profile row is missing.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    if (!profile) {
      // Race-condition safe: if another session creates the profile concurrently,
      // the insert fails with unique violation but that's fine — the profile exists.
      try {
        await supabase.from('profiles').insert({
          id: user.id,
          username: `user_${user.id.slice(0, 8)}`,
          total_xp: 0,
          level: 1,
          momentum: 50,
        });
      } catch (e) {
        // Profile may have been created by another concurrent session — ignore.
      }
    }
  }

  const { data, error } = await supabase.rpc('award_session_xp', {
    p_anchor_id: anchorId,
    p_duration_seconds: durationSeconds,
  });

  if (error) {
    console.error('award_session_xp RPC failed:', error);
    throw error;
  }

  // A table-returning function comes back as an array of rows.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error('award_session_xp returned no data');
  }

  const oldLevel = row.old_level;
  const newLevel = row.new_level;
  const oldRank = getRankFromLevel(oldLevel);
  const newRank = getRankFromLevel(newLevel);

  return {
    xpAwarded: row.xp_awarded,
    newTotalXP: row.new_total_xp,
    oldLevel,
    newLevel,
    leveledUp: row.leveled_up,
    oldRank,
    newRank,
    rankChanged: newRank !== oldRank,
  };
};

// Get total session time for current user
export const getTotalSessionTime = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data, error } = await supabase
    .from('sessions')
    .select('duration_seconds')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error getting total session time:', error);
    return 0;
  }

  return (data || []).reduce((total, session) => total + session.duration_seconds, 0);
};

// Get session count for current user
export const getTotalSessionCount = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error getting session count:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Get session counts bucketed by week for the current user, oldest → newest.
 *
 * Used by the Progress screen's momentum chart. Since momentum itself isn't stored
 * as a time series, weekly session activity is the honest underlying driver.
 *
 * @param {number} weeks - number of weekly buckets to return (default 8)
 * @returns {Promise<number[]>} array of length `weeks`, counts oldest → newest ([] if no user)
 */
export const getWeeklySessionCounts = async (weeks = 8) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const startMs = now - weeks * weekMs;

  const { data, error } = await supabase
    .from('sessions')
    .select('created_at')
    .eq('user_id', user.id)
    .gte('created_at', new Date(startMs).toISOString());

  if (error) {
    console.error('Error fetching weekly session counts:', error);
    return new Array(weeks).fill(0);
  }

  const buckets = new Array(weeks).fill(0);
  for (const s of data || []) {
    const t = new Date(s.created_at).getTime();
    if (isNaN(t)) continue;
    let idx = Math.floor((t - startMs) / weekMs);
    if (idx < 0) idx = 0;
    if (idx > weeks - 1) idx = weeks - 1;
    buckets[idx] += 1;
  }
  return buckets;
};

/**
 * Compute a rolling consistency score (0–100) for an anchor from its session history.
 *
 * Definition: over the last 7 days, count the number of distinct days with a
 * completed session, divide by the anchor's weekly target (`targetDays`), and cap at 100.
 * A brand-new anchor with no sessions scores 0 (null-safe, never NaN/undefined).
 *
 * @param {Array<{created_at: string}>} sessions - session rows for the anchor
 * @param {number} targetDays - anchor's target sessions per week
 * @returns {number} consistency percentage (0–100)
 */
export const computeConsistency = (sessions, targetDays) => {
  if (!sessions || sessions.length === 0) return 0;

  const expected = Math.max(Number(targetDays) || 1, 1);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const activeDays = new Set();
  for (const s of sessions) {
    const d = new Date(s.created_at);
    if (!isNaN(d.getTime()) && d >= weekAgo) {
      activeDays.add(d.toDateString());
    }
  }

  const ratio = activeDays.size / expected;
  return Math.min(Math.round(ratio * 100), 100);
};

// Subscribe to session changes in real-time (async to get user)
export const subscribeToSessions = async (callback) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const subscription = supabase
    .channel('sessions-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sessions',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return subscription;
};