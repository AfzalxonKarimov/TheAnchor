import { supabase } from './client';

// Fetch today's sessions for the current user
export const getTodaySessions = async () => {
  const { data: { user } } = await supabase.auth.getUser();
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

// Calculate XP for a session
// Base: 20 XP per session
// Bonus: +1 XP per minute, capped at +30 XP (30 min or more)
// Max: 50 XP per session
export const calculateSessionXP = (durationSeconds) => {
  const minutes = Math.floor(durationSeconds / 60);
  const baseXP = 20;
  const bonusXP = Math.min(minutes, 30);
  return baseXP + bonusXP; // Max 50 XP
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