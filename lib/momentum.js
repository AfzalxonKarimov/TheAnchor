/**
 * Momentum Score System
 *
 * Momentum represents your consistency over time. It:
 * - Never resets to zero (floor of 10)
 * - Increases with completed sessions
 * - Decays gradually when you miss days (lazy decay — see applyDecay/settleMomentum)
 * - Is capped at 100
 *
 * Decay is computed lazily rather than via a cron job: profiles.momentum_updated_at
 * records when momentum was last settled, and the next read (settleMomentum) or
 * write (updateMomentum) subtracts MOMENTUM_DECAY per full calendar day elapsed.
 * Calendar days use device-local time to match getStreak().
 */

// Momentum lost per full day with no activity.
const MOMENTUM_DECAY = 5;

// Momentum never drops below this — one bad stretch shouldn't erase everything.
const MOMENTUM_FLOOR = 10;

// Momentum can never exceed this.
const MOMENTUM_CEILING = 100;

// Default momentum for a fresh profile.
const MOMENTUM_DEFAULT = 50;

// Momentum gained per completed session (base). Every time you show up, momentum
// moves forward — this is the whole point of the metric.
const MOMENTUM_PER_SESSION = 6;

/**
 * Calculate momentum GAINED for a completed session (always >= 0).
 *
 * Momentum is deliberately NOT derived from streaks. Streaks punish missed days;
 * momentum rewards the act of showing up and gently decays over time (see
 * applyDecay). The only signals here are "you completed a session" and "how long"
 * — never "how many consecutive days".
 *
 * @param {Object} params
 * @param {number} params.duration Seconds of session duration
 * @param {number} params.currentMomentum Current momentum score
 * @returns {number} Momentum change (positive), pre-clamp
 */
export function calculateMomentumChange({ duration, currentMomentum }) {
  let change = MOMENTUM_PER_SESSION;

  // Bonus for session duration (longer = more momentum)
  const minutes = Math.floor((duration || 0) / 60);
  if (minutes >= 15) change += 2;
  if (minutes >= 30) change += 2;

  // Don't let the gain push momentum past the ceiling.
  return Math.min(change, MOMENTUM_CEILING - (currentMomentum || 0));
}

/**
 * Pure lazy-decay calculation. No DB, no side effects.
 *
 * Subtracts MOMENTUM_DECAY for each full device-local calendar day between
 * `lastUpdatedAt` and `now`, clamped so momentum never falls below the floor.
 * Returns 0 decay when updated earlier today (idempotent within a day).
 *
 * @param {number} currentMomentum
 * @param {string|Date|null} lastUpdatedAt  profiles.momentum_updated_at
 * @param {Date} [now]
 * @returns {{ momentum: number, missedDays: number, decayed: number }}
 */
export function applyDecay(currentMomentum, lastUpdatedAt, now = new Date()) {
  const momentum = currentMomentum == null ? MOMENTUM_DEFAULT : currentMomentum;
  const clamped = Math.max(MOMENTUM_FLOOR, Math.min(MOMENTUM_CEILING, momentum));

  if (!lastUpdatedAt) return { momentum: clamped, missedDays: 0, decayed: 0 };
  const last = new Date(lastUpdatedAt);
  if (isNaN(last.getTime())) return { momentum: clamped, missedDays: 0, decayed: 0 };

  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const days = Math.floor((startOfDay(now) - startOfDay(last)) / MS_PER_DAY);
  if (days <= 0) return { momentum: clamped, missedDays: 0, decayed: 0 };

  // Only decay down to the floor.
  const decayed = Math.min(days * MOMENTUM_DECAY, Math.max(0, clamped - MOMENTUM_FLOOR));
  return { momentum: clamped - decayed, missedDays: days, decayed };
}

/**
 * Read the current momentum alongside a "start-of-today" baseline, WITHOUT
 * writing anything. The baseline is momentum decayed only up to the start of
 * today (via applyDecay), which equals yesterday's end-of-day value. The
 * delta is therefore a clean "change since yesterday" for the hero readout.
 *
 * @returns {Promise<{current:number, baseline:number, delta:number}|null>}
 */
export async function getMomentumSnapshot() {
  const { supabase } = await import('../src/supabase/client');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('momentum, momentum_updated_at')
    .eq('id', user.id)
    .single();
  if (!profile) return null;

  const current = profile.momentum == null ? MOMENTUM_DEFAULT : profile.momentum;
  const { momentum: baseline } = applyDecay(current, profile.momentum_updated_at);
  return { current, baseline, delta: current - baseline };
}

/**
 * Settle any pending decay for the current user and persist it.
 *
 * Safe to call on every profile load (e.g. Home/Progress focus): it only writes
 * when momentum actually decayed, and is idempotent within a calendar day.
 *
 * @returns {Promise<number|null>} the up-to-date momentum, or null if no user/profile
 */
export async function settleMomentum() {
  const { supabase } = await import('../src/supabase/client');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('momentum, momentum_updated_at')
    .eq('id', user.id)
    .single();
  if (!profile) return null;

  const { momentum, decayed } = applyDecay(profile.momentum, profile.momentum_updated_at);

  if (decayed > 0) {
    await supabase
      .from('profiles')
      .update({ momentum, momentum_updated_at: new Date().toISOString() })
      .eq('id', user.id);
  }

  return momentum;
}

/**
 * Update momentum after a completed session: settle pending decay first, then
 * apply the session gain, then persist with a fresh timestamp.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} params.durationSeconds
 * @returns {Promise<number>} the new momentum
 */
export async function updateMomentum({ userId, durationSeconds }) {
  const { supabase } = await import('../src/supabase/client');

  const { data: profile } = await supabase
    .from('profiles')
    .select('momentum, momentum_updated_at')
    .eq('id', userId)
    .single();

  const stored = profile?.momentum ?? MOMENTUM_DEFAULT;

  // Apply any pending decay so a comeback session starts from the honest value.
  const { momentum: decayedMomentum } = applyDecay(stored, profile?.momentum_updated_at);

  const change = calculateMomentumChange({
    duration: durationSeconds,
    currentMomentum: decayedMomentum,
  });

  const newMomentum = Math.max(
    MOMENTUM_FLOOR,
    Math.min(MOMENTUM_CEILING, decayedMomentum + change)
  );

  await supabase
    .from('profiles')
    .update({ momentum: newMomentum, momentum_updated_at: new Date().toISOString() })
    .eq('id', userId);

  return newMomentum;
}
