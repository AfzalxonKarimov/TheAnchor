import { supabase } from './client';
import { getWeeklySessionCounts, getTotalSessionTime, getTotalSessionCount } from './sessions';
import { getStreak } from './streaks';
import { getMomentum } from './profiles';
import { getAnchors } from './anchors';

// ── Raw session access ──────────────────────────────────────────────────
export const getAllSessions = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('sessions')
    .select('created_at, duration_seconds, anchor_id, xp')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('getAllSessions error:', error);
    return [];
  }
  return data || [];
};

// ── Longest streak (max run of consecutive active days) ─────────────────
export const getLongestStreak = async () => {
  const sessions = await getAllSessions();
  if (!sessions.length) return 0;
  const days = [...new Set(sessions.map((s) => new Date(s.created_at).toDateString()))].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const cur = new Date(days[i]);
    const diff = Math.round((cur - prev) / 86400000);
    if (diff === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
  }
  return best;
};

// ── Consistency heatmap (GitHub-style) ──────────────────────────────────
export const getConsistencyHeatmap = async (weeks = 26) => {
  const sessions = await getAllSessions();
  return buildHeatmap(sessions, weeks);
};

function buildHeatmap(sessions, weeks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Align start to the Sunday on/before (today - (weeks*7 - 1) days).
  const end = new Date(today);
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - start.getDay()); // back to Sunday

  const countByDay = new Map();
  for (const s of sessions) {
    const d = new Date(s.created_at);
    d.setHours(0, 0, 0, 0);
    const key = d.toDateString();
    countByDay.set(key, (countByDay.get(key) || 0) + 1);
  }

  const cols = [];
  const dateCols = [];
  const monthLabels = [];
  let lastMonth = -1;
  let col = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const week = [];
    const weekDates = [];
    for (let row = 0; row < 7; row++) {
      const key = cursor.toDateString();
      week.push(countByDay.get(key) || 0);
      weekDates.push(cursor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      cursor.setDate(cursor.getDate() + 1);
    }
    cols.push(week);
    dateCols.push(weekDates);
    const month = weekDates[0] ? new Date(weekDates[0]).getMonth() : -1;
    if (month !== lastMonth) {
      monthLabels.push({ col, label: cursor.toLocaleDateString(undefined, { month: 'short' }) });
      lastMonth = month;
    }
    col += 1;
  }
  return { weeks: cols, dates: dateCols, monthLabels };
}

// ── Monthly stats (last N months) ───────────────────────────────────────
export const getMonthlyStats = async (months = 6) => {
  const sessions = await getAllSessions();
  const now = new Date();
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const inMonth = sessions.filter((s) => {
      const sd = new Date(s.created_at);
      return sd.getFullYear() === y && sd.getMonth() === m;
    });
    const perDay = new Map();
    let minutes = 0;
    for (const s of inMonth) {
      minutes += (s.duration_seconds || 0) / 60;
      const key = new Date(s.created_at).toDateString();
      perDay.set(key, (perDay.get(key) || 0) + 1);
    }
    const bestDay = Math.max(0, ...[...perDay.values()]);
    out.push({
      key: `${y}-${m}`,
      label: d.toLocaleDateString(undefined, { month: 'short' }),
      year: y,
      sessions: inMonth.length,
      minutes: Math.round(minutes),
      activeDays: perDay.size,
      bestDay,
    });
  }
  return out;
};

// ── Daily activity (last N days) for the Day/Week/Month toggle ──────────
export const getDailyActivity = async (days = 30) => {
  const sessions = await getAllSessions();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const count = sessions.filter((s) => new Date(s.created_at).toDateString() === key).length;
    out.push(count);
  }
  return out; // oldest -> newest
};

// ── Recovery score (how fast you bounce back after a gap) ───────────────
export const getRecoveryScore = async () => {
  const sessions = await getAllSessions();
  if (sessions.length < 2) {
    const momentum = await getMomentum();
    return { score: momentum || 0, hasData: false };
  }
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const days = [...new Set(sessions.map((s) => new Date(s.created_at).toDateString()))]
    .map((k) => new Date(k))
    .filter((d) => d >= cutoff)
    .sort((a, b) => a - b);

  if (days.length < 2) {
    const momentum = await getMomentum();
    return { score: momentum || 0, hasData: false };
  }

  let qualitySum = 0;
  let gaps = 0;
  for (let i = 1; i < days.length; i++) {
    const g = Math.round((days[i] - days[i - 1]) / 86400000);
    gaps += 1;
    // g=1 perfect, g=2 recovered within a day, decays after.
    qualitySum += Math.max(0, 1 - (g - 1) / 4);
  }
  const gapRecovery = gaps ? qualitySum / gaps : 1;
  const momentum = await getMomentum();
  const score = Math.round(0.6 * gapRecovery * 100 + 0.4 * (momentum || 0));
  return { score: Math.max(0, Math.min(100, score)), hasData: true };
};

// ── Personal records ────────────────────────────────────────────────────
export const getPersonalRecords = async () => {
  const sessions = await getAllSessions();
  const perDay = new Map();
  let longestSession = 0;
  for (const s of sessions) {
    const mins = (s.duration_seconds || 0) / 60;
    longestSession = Math.max(longestSession, mins);
    const key = new Date(s.created_at).toDateString();
    perDay.set(key, (perDay.get(key) || 0) + 1);
  }
  const mostInDay = Math.max(0, ...[...perDay.values()]);
  const totalSeconds = await getTotalSessionTime();
  const totalCheckins = await getTotalSessionCount();
  const longestStreak = await getLongestStreak();
  const currentStreak = await getStreak();

  return {
    longestSessionMin: Math.round(longestSession),
    mostInDay,
    totalHours: +(totalSeconds / 3600).toFixed(1),
    totalCheckins,
    longestStreak,
    currentStreak,
  };
};

// ── Achievements ─────────────────────────────────────────────────────────
// Each def exposes a `measure()` returning { current, target } so the UI
// can render progress (e.g. "5 / 7"). Unlocked = current >= target.
// `secret` defs hide their identity until earned.
export const getAchievements = (profile, records, ctx) => {
  const {
    momentum = 50,
    recovery = { score: 0, hasData: false },
    anchors = [],
    sessions = [],
  } = ctx || {};

  const xp = profile?.total_xp || 0;
  const level = profile?.level || 1;
  const longestStreak = records?.longestStreak || 0;
  const totalCheckins = records?.totalCheckins || 0;
  const totalHours = records?.totalHours || 0;

  // Per-anchor completion counts (routine milestones).
  const counts = new Map();
  for (const s of sessions) counts.set(s.anchor_id, (counts.get(s.anchor_id) || 0) + 1);
  const maxAnchor = Math.max(0, ...[...counts.values()]);
  const anchorsTouched = anchors.filter((a) => (counts.get(a.id) || 0) >= 1).length;

  // Time-of-day signals.
  const early = sessions.some((s) => new Date(s.created_at).getHours() < 9);
  const late = sessions.some((s) => new Date(s.created_at).getHours() >= 21);

  // Comeback: any >=2-day gap between active days, then a later session.
  const days = [...new Set(sessions.map((s) => new Date(s.created_at).toDateString()))]
    .map((k) => new Date(k))
    .sort((a, b) => a - b);
  let comeback = 0;
  for (let i = 1; i < days.length; i++) {
    if (Math.round((days[i] - days[i - 1]) / 86400000) >= 2) { comeback = 1; break; }
  }

  // Guard recovery thresholds against the <2-session momentum fallback.
  const recoveryScore = recovery?.hasData ? (recovery?.score || 0) : 0;

  const defs = [
    // ── Core (kept) ──
    { key: 'first', title: 'First Anchor', glyph: 'anchor', desc: 'Log your first check-in', measure: () => ({ current: totalCheckins, target: 1 }) },
    { key: 'streak7', title: 'Week Strong', glyph: 'flame', desc: 'A 7-day streak', measure: () => ({ current: longestStreak, target: 7 }) },
    { key: 'streak30', title: 'Monthly', glyph: 'mountain', desc: 'A 30-day streak', measure: () => ({ current: longestStreak, target: 30 }) },
    { key: 'xp100', title: 'Centurion', glyph: 'lightning', desc: 'Earn 100 XP', measure: () => ({ current: xp, target: 100 }) },
    { key: 'xp1000', title: 'Veteran', glyph: 'northstar', desc: 'Earn 1,000 XP', measure: () => ({ current: xp, target: 1000 }) },
    { key: 'hours10', title: '10 Hours', glyph: 'clock', desc: '10 hours of focus', measure: () => ({ current: Math.round(totalHours), target: 10 }) },
    { key: 'hours50', title: 'Devoted', glyph: 'hourglass', desc: '50 hours of focus', measure: () => ({ current: Math.round(totalHours), target: 50 }) },
    { key: 'level10', title: 'Level 10', glyph: 'trophy', desc: 'Reach level 10', measure: () => ({ current: level, target: 10 }) },
    { key: 'check50', title: '50 Check-ins', glyph: 'shield', desc: '50 total check-ins', measure: () => ({ current: totalCheckins, target: 50 }) },

    // ── Momentum & recovery ──
    { key: 'momentum70', title: 'High Tide', glyph: 'compass', desc: 'Reach 70 momentum', measure: () => ({ current: Math.round(momentum), target: 70 }) },
    { key: 'recovery80', title: 'Resilient', glyph: 'shield', desc: '80 recovery score', measure: () => ({ current: Math.round(recoveryScore), target: 80 }) },

    // ── Routine milestones ──
    { key: 'allAnchors', title: 'Full Fleet', glyph: 'anchor', desc: 'Complete every anchor once', measure: () => ({ current: anchorsTouched, target: anchors.length }) },
    { key: 'anchor10', title: 'Devoted Routine', glyph: 'flame', desc: 'One routine, 10 times', measure: () => ({ current: maxAnchor, target: 10 }) },

    // ── Time-of-day ──
    { key: 'earlyBird', title: 'Early Bird', glyph: 'torch', desc: 'Check in before 9am', measure: () => ({ current: early ? 1 : 0, target: 1 }) },
    { key: 'nightOwl', title: 'Night Owl', glyph: 'star', desc: 'Check in after 9pm', measure: () => ({ current: late ? 1 : 0, target: 1 }) },

    // ── Secret (hidden until earned) ──
    { key: 'secretMarathon', title: 'Marathon', glyph: 'hourglass', secret: true, desc: 'One 60-minute session', measure: () => ({ current: Math.round(records?.longestSessionMin || 0), target: 60 }) },
    { key: 'secretComeback', title: 'Comeback', glyph: 'flame', secret: true, desc: 'Return after a missed day', measure: () => ({ current: comeback, target: 1 }) },
  ];

  return defs.map((d) => {
    const { current = 0, target = 1 } = d.measure();
    const unlocked = target > 0 && current >= target;
    const progress = target > 0 ? Math.min(1, current / target) : 0;
    return { ...d, current, target, unlocked, progress };
  });
};

// ── Weekly trend (XP/activity) ───────────────────────────────────────────
export const getWeeklyTrend = async (weeks = 12) => {
  return getWeeklySessionCounts(weeks);
};

// ── Orchestrator: consolidated dashboard (real or demo) ─────────────────
export const loadDashboardAnalytics = async ({ weeks = 26, months = 6 } = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (__DEV__) return seedAnalyticsDemo(weeks, months);
    return null;
  }
  const [heatmap, monthly, recovery, records, weekly, daily] = await Promise.all([
    getConsistencyHeatmap(weeks),
    getMonthlyStats(months),
    getRecoveryScore(),
    getPersonalRecords(),
    getWeeklyTrend(12),
    getDailyActivity(30),
  ]);
  const [profile, momentum, anchors, sessions] = await Promise.all([
    import('./profiles').then((m) => m.getProfile()),
    getMomentum(),
    getAnchors(),
    getAllSessions(),
  ]);
  const achievements = getAchievements(profile, records, { momentum, recovery, anchors, sessions });
  return { heatmap, monthly, recovery, records, weekly, daily, achievements };
};

// ── Demo seed (dev, no login) ───────────────────────────────────────────
function seedAnalyticsDemo(weeks, months) {
  const sessions = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const wave = Math.round(2 + 2 * Math.sin(i / 6) + (i % 3));
    const count = (i % 9 === 0) ? 0 : Math.max(0, wave);
    for (let k = 0; k < count; k++) {
      sessions.push({
        created_at: d.toISOString(),
        duration_seconds: 1200 + (k % 3) * 300,
        anchor_id: `a${(k % 4) + 1}`,
      });
    }
  }
  const heatmap = buildHeatmap(sessions, weeks);
  const monthly = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthly.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString(undefined, { month: 'short' }),
      year: d.getFullYear(),
      sessions: 14 + ((i * 3) % 10),
      minutes: 180 + ((i * 7) % 120),
      activeDays: 12 + (i % 6),
      bestDay: 3 + (i % 3),
    });
  }
  const weekly = Array.from({ length: 12 }, (_, i) => 2 + ((i * 5 + 3) % 7));
  const daily = Array.from({ length: 30 }, (_, i) => (i % 9 === 0) ? 0 : 1 + ((i * 3) % 3));
  const records = {
    longestSessionMin: 32,
    mostInDay: 4,
    totalHours: 38.5,
    totalCheckins: 142,
    longestStreak: 21,
    currentStreak: 12,
  };
  const recovery = { score: 82, hasData: true };
  const profile = { total_xp: 1240, level: 9, momentum: 78 };
  const anchors = [
    { id: 'a1' }, { id: 'a2' }, { id: 'a3' }, { id: 'a4' },
  ];
  const achievements = getAchievements(profile, records, { momentum: profile.momentum, recovery, anchors, sessions });
  return { heatmap, monthly, recovery, records, weekly, daily, achievements };
}
