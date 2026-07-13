import { supabase } from './client';

/**
 * Calculate the current streak (consecutive days with sessions)
 * @returns {Promise<number>} Number of consecutive days
 */
export const getStreak = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  // Get sessions from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('sessions')
    .select('created_at')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions for streak:', error);
    return 0;
  }

  if (!data || data.length === 0) return 0;

  // Extract unique days (ignoring time)
  const sessionDays = new Set(
    data.map(s => new Date(s.created_at).toDateString())
  );

  // Count consecutive days from today
  let streak = 0;
  const today = new Date();
  while (true) {
    const date = new Date(today);
    date.setDate(date.getDate() - streak);
    if (sessionDays.has(date.toDateString())) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};