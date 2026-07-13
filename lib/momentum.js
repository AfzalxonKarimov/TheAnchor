/**
 * Momentum Score System
 *
 * Momentum represents your consistency over time. It:
 * - Never resets to zero (floor of 10)
 * - Increases with completed sessions
 * - Decreases when you miss days
 * - Based on: daily completion rate, session quality, streak length
 */

// Momentum decays by this amount when you miss a day
const MOMENTUM_DECAY = 5;

// Momentum gains per session completed (base)
const MOMENTUM_PER_SESSION = 2;

// Momentum bonus for streak milestones
const STREAK_BONUS = {
  3: 5,
  7: 10,
  14: 15,
  30: 25,
};

/**
 * Calculate momentum change for a completed session
 * @param {Object} params
 * @param {number} params.xp Earned XP for the session
 * @param {number} params.duration Seconds of session duration
 * @param {number} params.currentMomentum Current momentum score
 * @param {number} params.streak Current streak count
 * @returns {number} Momentum change (positive or negative)
 */
export function calculateMomentumChange({ xp, duration, currentMomentum, streak }) {
  let change = MOMENTUM_PER_SESSION;

  // Bonus for session duration (longer = more momentum)
  const minutes = Math.floor(duration / 60);
  if (minutes >= 15) {
    change += 1; // Bonus for 15+ min sessions
  }
  if (minutes >= 30) {
    change += 1; // Bonus for 30+ min sessions
  }

  // Streak milestone bonuses
  const streakBonus = STREAK_BONUS[streak] || 0;
  change += streakBonus;

  // Cap at reasonable maximum
  const maxMomentum = 100;
  return Math.min(change, maxMomentum - (currentMomentum || 0));
}

/**
 * Update momentum in the database after session completion
 * @param {Object} params
 * @param {string} params.userId User ID
 * @param {number} params.xpEarned XP from session
 * @param {number} params.durationSeconds Session duration
 * @param {number} params.streak Current streak
 */
export async function updateMomentum({ userId, xpEarned, durationSeconds, streak }) {
  const { supabase } = await import('../src/supabase/client');

  // Get current momentum
  const { data: profile } = await supabase
    .from('profiles')
    .select('momentum')
    .eq('id', userId)
    .single();

  const currentMomentum = profile?.momentum || 50;
  const change = calculateMomentumChange({
    xp: xpEarned,
    duration: durationSeconds,
    currentMomentum,
    streak,
  });

  const newMomentum = Math.max(10, currentMomentum + change);

  await supabase
    .from('profiles')
    .update({ momentum: newMomentum })
    .eq('id', userId);

  return newMomentum;
}