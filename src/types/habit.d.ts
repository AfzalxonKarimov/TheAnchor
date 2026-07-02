// Types for Habit Tracker Application

export interface Habit {
  id: string;
  name: string;
  consistency: number; // 0-100, representing % of target consistency
  totalXP?: number; // Cache of total XP earned from this habit
  createdAt?: number; // Timestamp for reference
  lastCheckIn?: number; // Last check-in timestamp
}

export interface CheckInSession {
  habitId: string;
  durationSeconds: number;
  xpEarned: number;
  completedAt: number;
}

export interface UserStats {
  totalXP: number;
  level: number;
  rank: string;
  totalCheckIns: number;
  rankProgress: number; // 0-1 fraction progress toward next rank
}

export interface Feature {
  title: string;
  description: string;
  icon: any; // FontAwesome icon component
}

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  AddHabit: undefined;
  CheckIn: { habit: Habit };
};

export interface LevelThreshold {
  level: number;
  xpThreshold: number;
}

export interface RankInfo {
  minLevel: number;
  maxLevel: number;
  name: string;
}