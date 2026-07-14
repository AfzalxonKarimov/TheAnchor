// lib/leveling.js
// Pure logic for XP, levels, and ranks — no UI, no database calls.
// Keeping this separate makes it easy to tune numbers later without touching screens.

// Total XP required to REACH each level (index = level)
// Level 1 starts at 0 XP. Level 2 needs 100 total XP. Etc.
export const LEVEL_THRESHOLDS = [
  0,    // Level 1
  100,  // Level 2
  250,  // Level 3
  450,  // Level 4
  700,  // Level 5
  1000, // Level 6
  1400, // Level 7
  1900, // Level 8
  2500, // Level 9
  3200, // Level 10
];

// Rank names by level range
const RANKS = [
  { minLevel: 1, maxLevel: 3, name: 'Spark' },
  { minLevel: 4, maxLevel: 7, name: 'Ember' },
  { minLevel: 8, maxLevel: 12, name: 'Flame' },
  { minLevel: 13, maxLevel: 18, name: 'Anchor' },
  { minLevel: 19, maxLevel: 22, name: 'Forged' },
  { minLevel: 23, maxLevel: 9999, name: 'Diamond' },
];

// Calculate XP earned for a single check-in based on duration
export function calculateCheckInXP(durationSeconds) {
  const BASE_XP = 20;
  const minutes = Math.floor(durationSeconds / 60);
  const bonusXP = Math.min(minutes, 30); // cap bonus at +30 XP (30 min+)
  return BASE_XP + bonusXP;
}

// Given total XP, figure out current level
export function getLevelFromXP(totalXP) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

// How much XP is needed to reach the NEXT level from current XP
export function getXPForNextLevel(totalXP) {
  const currentLevel = getLevelFromXP(totalXP);
  // If beyond our hardcoded table, just keep adding 1000 per level as a fallback
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (currentLevel - LEVEL_THRESHOLDS.length + 1) * 1000;
  }
  return LEVEL_THRESHOLDS[currentLevel]; // threshold for next level
}

// Progress toward next level, as a 0–1 fraction (useful for progress bars)
export function getLevelProgress(totalXP) {
  const currentLevel = getLevelFromXP(totalXP);
  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] ?? 0;
  const nextLevelXP = getXPForNextLevel(totalXP);
  const xpIntoLevel = totalXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  return Math.min(xpIntoLevel / xpNeededForLevel, 1);
}

// Get the rank name for a given level
export function getRankFromLevel(level) {
  const rank = RANKS.find((r) => level >= r.minLevel && level <= r.maxLevel);
  return rank ? rank.name : 'Spark';
}

// Given a starting XP total and XP gained from a check-in, compute the resulting
// XP, level, rank, and whether the user leveled up / ranked up.
//
// Pure: no DB, no UI. This MIRRORS the server-side award_session_xp() RPC — the
// server is the source of truth for the write, but this is handy for shaping the
// level-up UI and for unit tests without a database.
export function applyXP(oldTotalXP, gainedXP) {
  const oldXP = Math.max(oldTotalXP || 0, 0);
  const gained = gainedXP || 0;
  const newXP = oldXP + gained;
  const oldLevel = getLevelFromXP(oldXP);
  const newLevel = getLevelFromXP(newXP);
  const oldRank = getRankFromLevel(oldLevel);
  const newRank = getRankFromLevel(newLevel);
  return {
    oldXP,
    newXP,
    gainedXP: gained,
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel,
    oldRank,
    newRank,
    rankChanged: newRank !== oldRank,
  };
}