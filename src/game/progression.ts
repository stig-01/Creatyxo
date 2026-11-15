/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DifficultyModeId } from './types';
import { ThemeId } from './themes';
import {
  BlockSkinDef,
  BlockSkinId,
  getUnlockedBlockSkinsForStreak,
} from './blockSkins';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  unlockThemeId?: ThemeId;
  badgeIcon: string;
  progressLabel: (stats: PlayerStats, bestScore: number) => string;
  checkUnlocked: (stats: PlayerStats, bestScore: number, level: number) => boolean;
}

export interface DailyChallengeDef {
  id: string;
  title: string;
  description: string;
  target: number;
  xpReward: number;
  metric:
    | 'bestScoreToday'
    | 'linesClearedToday'
    | 'bestComboToday'
    | 'featuredGamesToday'
    | 'blocksPlacedToday'
    | 'gamesToday';
  featuredMode?: DifficultyModeId;
}

export interface DailyProgressState {
  date: string;
  linesClearedToday: number;
  bestScoreToday: number;
  gamesToday: number;
  bestComboToday: number;
  featuredGamesToday: number;
  blocksPlacedToday: number;
  claimedIds: string[];
}

export interface DailyStreakHistoryEntry {
  active: boolean;
  streak: number;
  challengesCompleted: number;
  challengesClaimed: number;
  totalChallenges: number;
}

export interface StreakDayPoint {
  dateKey: string;
  dayShort: string;
  dayNumber: string;
  monthShort: string;
  isToday: boolean;
  active: boolean;
  streak: number;
  challengesCompleted: number;
  challengesClaimed: number;
  totalChallenges: number;
  intensity: number;
}

export interface PlayerStats {
  xp: number;
  totalPlaytimeSec: number;
  longestSessionSec: number;
  gamesPlayed: number;
  totalLinesCleared: number;
  totalBlocksPlaced: number;
  bestCombo: number;
  bestSingleMoveLines: number;
  extremeBestScore: number;
  hardBestScore: number;
  totalQuestsClaimed: number;
  dailyStreak: number;
  bestDailyStreak: number;
  lastActiveDate: string;
  unlockedAchievements: string[];
  achievementUnlockedAt: Record<string, number>;
  dailyProgress: DailyProgressState;
  dailyHistory?: Record<string, DailyStreakHistoryEntry>;
  unlockedBlockSkins?: BlockSkinId[];
}

export interface LevelInfo {
  level: number;
  rankTitle: string;
  currentLevelMinXp: number;
  nextLevelMinXp: number;
  xpIntoLevel: number;
  xpNeededForNext: number;
  progressPercent: number;
}

const STATS_STORAGE_KEY = 'creatyxo_player_stats';

export function formatDateKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayDateKey(): string {
  return formatDateKeyFromDate(new Date());
}

export function getDateKeyDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return formatDateKeyFromDate(d);
}

export function getYesterdayDateKey(): string {
  return getDateKeyDaysAgo(1);
}

export function xpThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * (level - 1) * level);
}

export function getRankTitleForLevel(level: number): string {
  if (level >= 15) return 'Mythic';
  if (level >= 12) return 'Overlord';
  if (level >= 9) return 'Vanguard';
  if (level >= 6) return 'Tactician';
  if (level >= 4) return 'Architect';
  if (level >= 2) return 'Spark';
  return 'Rookie';
}

export function getLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp || 0));
  let level = 1;
  while (xpThresholdForLevel(level + 1) <= safeXp && level < 500) {
    level++;
  }
  const currentLevelMinXp = xpThresholdForLevel(level);
  const nextLevelMinXp = xpThresholdForLevel(level + 1);
  const xpIntoLevel = safeXp - currentLevelMinXp;
  const xpNeededForNext = Math.max(1, nextLevelMinXp - currentLevelMinXp);
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpIntoLevel / xpNeededForNext) * 100)));

  return {
    level,
    rankTitle: getRankTitleForLevel(level),
    currentLevelMinXp,
    nextLevelMinXp,
    xpIntoLevel,
    xpNeededForNext,
    progressPercent,
  };
}

export function formatDuration(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  if (sec < 60) return `${sec}s`;
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remSec = sec % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m ${remSec}s`;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'brick_layer',
    name: 'Brick Layer',
    description: 'Place 25 blocks onto the board',
    xpReward: 75,
    badgeIcon: '🧱',
    progressLabel: (s) => `${Math.min(25, s.totalBlocksPlaced)}/25 blocks`,
    checkUnlocked: (s) => s.totalBlocksPlaced >= 25,
  },
  {
    id: 'line_sweeper',
    name: 'Line Sweeper',
    description: 'Clear 10 total rows or columns',
    xpReward: 100,
    badgeIcon: '⚡',
    progressLabel: (s) => `${Math.min(10, s.totalLinesCleared)}/10 lines`,
    checkUnlocked: (s) => s.totalLinesCleared >= 10,
  },
  {
    id: 'double_trouble',
    name: 'Double Trouble',
    description: 'Clear 2 or more lines in a single placement',
    xpReward: 125,
    badgeIcon: '💥',
    progressLabel: (s) => `${Math.min(2, s.bestSingleMoveLines)}/2 lines`,
    checkUnlocked: (s) => s.bestSingleMoveLines >= 2,
  },
  {
    id: 'combo_pyromaniac',
    name: 'Combo Pyromaniac',
    description: 'Reach a 4× consecutive combo streak',
    xpReward: 200,
    unlockThemeId: 'crimson-inferno',
    badgeIcon: '🔥',
    progressLabel: (s) => `${Math.min(4, s.bestCombo)}/4× combo`,
    checkUnlocked: (s) => s.bestCombo >= 4,
  },
  {
    id: 'triple_threat',
    name: 'Triple Threat',
    description: 'Blast 3 or more lines in one move',
    xpReward: 225,
    badgeIcon: '☄️',
    progressLabel: (s) => `${Math.min(3, s.bestSingleMoveLines)}/3 lines`,
    checkUnlocked: (s) => s.bestSingleMoveLines >= 3,
  },
  {
    id: 'quadra_blast',
    name: 'Quadra Blast',
    description: 'Obliterate 4 or more lines in one move',
    xpReward: 300,
    unlockThemeId: 'toxic-venom',
    badgeIcon: '☢️',
    progressLabel: (s) => `${Math.min(4, s.bestSingleMoveLines)}/4 lines`,
    checkUnlocked: (s) => s.bestSingleMoveLines >= 4,
  },
  {
    id: 'golden_architect',
    name: 'Golden Architect',
    description: 'Reach a single-run score of 5,000+',
    xpReward: 250,
    unlockThemeId: 'midas-gold',
    badgeIcon: '👑',
    progressLabel: (_, best) => `${Math.min(5000, best).toLocaleString()}/5,000`,
    checkUnlocked: (_, best) => best >= 5000,
  },
  {
    id: 'tiny_titan',
    name: 'Tiny Titan',
    description: 'Score 1,000+ on the 4×4 Extreme board',
    xpReward: 200,
    unlockThemeId: 'frost-titanium',
    badgeIcon: '🛡️',
    progressLabel: (s) => `${Math.min(1000, s.extremeBestScore).toLocaleString()}/1,000`,
    checkUnlocked: (s) => s.extremeBestScore >= 1000,
  },
  {
    id: 'hardcore_tactician',
    name: 'Hardcore Tactician',
    description: 'Score 2,500+ on the 6×6 Hard board',
    xpReward: 250,
    badgeIcon: '⚔️',
    progressLabel: (s) => `${Math.min(2500, s.hardBestScore).toLocaleString()}/2,500`,
    checkUnlocked: (s) => s.hardBestScore >= 2500,
  },
  {
    id: 'centurion_cleaver',
    name: 'Centurion Cleaver',
    description: 'Clear 100 cumulative rows or columns',
    xpReward: 250,
    badgeIcon: '🗡️',
    progressLabel: (s) => `${Math.min(100, s.totalLinesCleared)}/100 lines`,
    checkUnlocked: (s) => s.totalLinesCleared >= 100,
  },
  {
    id: 'marathon_mind',
    name: 'Marathon Mind',
    description: 'Last 5+ minutes in a single game session',
    xpReward: 200,
    badgeIcon: '🧠',
    progressLabel: (s) => `${Math.min(5, Math.floor(s.longestSessionSec / 60))}/5 min`,
    checkUnlocked: (s) => s.longestSessionSec >= 300,
  },
  {
    id: 'time_traveler',
    name: 'Time Traveler',
    description: 'Spend 10+ minutes in active gameplay',
    xpReward: 150,
    badgeIcon: '⏳',
    progressLabel: (s) => `${Math.min(10, Math.floor(s.totalPlaytimeSec / 60))}/10 min`,
    checkUnlocked: (s) => s.totalPlaytimeSec >= 600,
  },
  {
    id: 'quest_hunter',
    name: 'Quest Hunter',
    description: 'Complete and claim 5 daily quests',
    xpReward: 220,
    badgeIcon: '📜',
    progressLabel: (s) => `${Math.min(5, s.totalQuestsClaimed || 0)}/5 quests`,
    checkUnlocked: (s) => (s.totalQuestsClaimed || 0) >= 5,
  },
  {
    id: 'streak_seeker',
    name: 'Streak Seeker',
    description: 'Maintain a 3-day daily play streak',
    xpReward: 200,
    unlockThemeId: 'plasma-rose',
    badgeIcon: '🌟',
    progressLabel: (s) => `${Math.min(3, s.bestDailyStreak)}/3 days`,
    checkUnlocked: (s) => s.bestDailyStreak >= 3,
  },
  {
    id: 'grid_grandmaster',
    name: 'Grid Grandmaster',
    description: 'Reach Player Level 5',
    xpReward: 350,
    unlockThemeId: 'prism-aurora',
    badgeIcon: '💠',
    progressLabel: (s) => `Lv.${Math.min(5, getLevelInfo(s.xp).level)}/5`,
    checkUnlocked: (_s, _b, level) => level >= 5,
  },
  {
    id: 'eclipse_voyager',
    name: 'Eclipse Voyager',
    description: 'Reach Player Level 8',
    xpReward: 450,
    unlockThemeId: 'void-eclipse',
    badgeIcon: '🌑',
    progressLabel: (s) => `Lv.${Math.min(8, getLevelInfo(s.xp).level)}/8`,
    checkUnlocked: (_s, _b, level) => level >= 8,
  },
];

function hashDateSeed(dateKey: string): number {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) {
    h = (h * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getDailyChallenges(dateKey = getTodayDateKey()): DailyChallengeDef[] {
  const seed = hashDateSeed(dateKey);
  const scoreTargets = [1200, 1800, 2500];
  const lineTargets = [10, 15, 22];
  const blockTargets = [60, 85, 110];
  const featuredModes: DifficultyModeId[] = ['classic', 'hard', 'extreme', 'easy'];

  const scoreTarget = scoreTargets[seed % scoreTargets.length];
  const lineTarget = lineTargets[(seed >> 2) % lineTargets.length];
  const featuredMode = featuredModes[(seed >> 4) % featuredModes.length];
  const blockTarget = blockTargets[(seed >> 6) % blockTargets.length];
  const featuredLabel =
    featuredMode === 'easy'
      ? '10×10 EASY'
      : featuredMode === 'classic'
      ? '8×8 CLASSIC'
      : featuredMode === 'hard'
      ? '6×6 HARD'
      : '4×4 EXTREME';

  return [
    {
      id: `daily-score-${dateKey}`,
      title: 'Score Blitz',
      description: `Reach ${scoreTarget.toLocaleString()} points in a single run today`,
      target: scoreTarget,
      xpReward: 180,
      metric: 'bestScoreToday',
    },
    {
      id: `daily-lines-${dateKey}`,
      title: 'Line Sweeper',
      description: `Clear ${lineTarget} rows or columns today`,
      target: lineTarget,
      xpReward: 160,
      metric: 'linesClearedToday',
    },
    {
      id: `daily-combo-${dateKey}`,
      title: 'Combo Rush',
      description: 'Hit a 3× consecutive combo today',
      target: 3,
      xpReward: 220,
      metric: 'bestComboToday',
    },
    {
      id: `daily-mode-${dateKey}`,
      title: 'Board Specialist',
      description: `Finish 2 games on ${featuredLabel} today`,
      target: 2,
      xpReward: 200,
      metric: 'featuredGamesToday',
      featuredMode,
    },
    {
      id: `daily-blocks-${dateKey}`,
      title: 'Block Architect',
      description: `Place ${blockTarget} blocks across games today`,
      target: blockTarget,
      xpReward: 170,
      metric: 'blocksPlacedToday',
    },
  ];
}

export function createEmptyDailyProgress(date = getTodayDateKey()): DailyProgressState {
  return {
    date,
    linesClearedToday: 0,
    bestScoreToday: 0,
    gamesToday: 0,
    bestComboToday: 0,
    featuredGamesToday: 0,
    blocksPlacedToday: 0,
    claimedIds: [],
  };
}

export function createDefaultStats(): PlayerStats {
  const today = getTodayDateKey();
  return {
    xp: 0,
    totalPlaytimeSec: 0,
    longestSessionSec: 0,
    gamesPlayed: 0,
    totalLinesCleared: 0,
    totalBlocksPlaced: 0,
    bestCombo: 0,
    bestSingleMoveLines: 0,
    extremeBestScore: 0,
    hardBestScore: 0,
    totalQuestsClaimed: 0,
    dailyStreak: 1,
    bestDailyStreak: 1,
    lastActiveDate: today,
    unlockedAchievements: [],
    achievementUnlockedAt: {},
    dailyProgress: createEmptyDailyProgress(today),
    unlockedBlockSkins: ['classic-gloss'],
    dailyHistory: {
      [today]: {
        active: true,
        streak: 1,
        challengesCompleted: 0,
        challengesClaimed: 0,
        totalChallenges: getDailyChallenges(today).length,
      },
    },
  };
}

function summarizeDailyProgress(progress: DailyProgressState, streak: number): DailyStreakHistoryEntry {
  const challenges = getDailyChallenges(progress.date);
  let completed = 0;
  for (const ch of challenges) {
    if ((progress[ch.metric] || 0) >= ch.target) {
      completed++;
    }
  }
  return {
    active: true,
    streak: Math.max(1, streak || 1),
    challengesCompleted: completed,
    challengesClaimed: Array.isArray(progress.claimedIds) ? progress.claimedIds.length : 0,
    totalChallenges: challenges.length,
  };
}

function withSyncedDailyHistory(stats: PlayerStats): PlayerStats {
  const today = getTodayDateKey();
  const minKeepDate = getDateKeyDaysAgo(30);
  const nextHistory: Record<string, DailyStreakHistoryEntry> = {};

  if (stats.dailyHistory) {
    for (const [dateKey, entry] of Object.entries(stats.dailyHistory)) {
      if (dateKey >= minKeepDate && entry) {
        nextHistory[dateKey] = entry;
      }
    }
  }

  const todayProgress =
    stats.dailyProgress && stats.dailyProgress.date === today
      ? stats.dailyProgress
      : createEmptyDailyProgress(today);
  nextHistory[today] = summarizeDailyProgress(todayProgress, stats.dailyStreak);

  return {
    ...stats,
    dailyHistory: nextHistory,
  };
}

export function loadPlayerStats(): {
  stats: PlayerStats;
  streakRewardXp: number;
  newDayCheckIn: boolean;
  newlyUnlockedSkins: BlockSkinDef[];
} {
  const today = getTodayDateKey();
  const yesterday = getYesterdayDateKey();
  let stats = createDefaultStats();
  let streakRewardXp = 0;
  let newDayCheckIn = false;
  let previousDailyProgress: DailyProgressState | null = null;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PlayerStats>;
        if (parsed.dailyProgress && parsed.dailyProgress.date && parsed.dailyProgress.date !== today) {
          previousDailyProgress = {
            ...createEmptyDailyProgress(parsed.dailyProgress.date),
            ...parsed.dailyProgress,
            claimedIds: Array.isArray(parsed.dailyProgress.claimedIds)
              ? parsed.dailyProgress.claimedIds
              : [],
          };
        }
        stats = {
          ...stats,
          ...parsed,
          unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
            ? parsed.unlockedAchievements
            : [],
          achievementUnlockedAt: parsed.achievementUnlockedAt || {},
          unlockedBlockSkins: Array.isArray(parsed.unlockedBlockSkins)
            ? parsed.unlockedBlockSkins
            : ['classic-gloss'],
          dailyHistory: parsed.dailyHistory ? { ...parsed.dailyHistory } : {},
          dailyProgress:
            parsed.dailyProgress && parsed.dailyProgress.date === today
              ? {
                  ...createEmptyDailyProgress(today),
                  ...parsed.dailyProgress,
                  claimedIds: Array.isArray(parsed.dailyProgress.claimedIds)
                    ? parsed.dailyProgress.claimedIds
                    : [],
                }
              : createEmptyDailyProgress(today),
        };
      }
    } catch {
      // keep defaults
    }
  }

  if (!stats.dailyHistory) {
    stats.dailyHistory = {};
  }

  // Snapshot previous day's progress before advancing day
  if (previousDailyProgress && previousDailyProgress.date) {
    const prevDate = previousDailyProgress.date;
    stats.dailyHistory[prevDate] = summarizeDailyProgress(
      previousDailyProgress,
      stats.dailyHistory[prevDate]?.streak ?? stats.dailyStreak
    );
  }

  // Handle daily streak progression
  if (!stats.lastActiveDate) {
    stats.lastActiveDate = today;
    stats.dailyStreak = Math.max(1, stats.dailyStreak || 1);
    stats.bestDailyStreak = Math.max(stats.bestDailyStreak, stats.dailyStreak);
  } else if (stats.lastActiveDate !== today) {
    newDayCheckIn = true;
    if (stats.lastActiveDate === yesterday) {
      stats.dailyStreak = (stats.dailyStreak || 1) + 1;
    } else {
      stats.dailyStreak = 1;
    }
    stats.bestDailyStreak = Math.max(stats.bestDailyStreak || 1, stats.dailyStreak);
    stats.lastActiveDate = today;
    streakRewardXp = 50 + Math.min(150, stats.dailyStreak * 25);
    stats.xp += streakRewardXp;
    stats.dailyProgress = createEmptyDailyProgress(today);
  }

  // Sync cosmetic block skin unlocks from consecutive daily streak milestones (3, 7, 14 days)
  const peakStreak = Math.max(stats.dailyStreak || 1, stats.bestDailyStreak || 1);
  const { allUnlocked, newlyUnlocked: newlyUnlockedSkins } = getUnlockedBlockSkinsForStreak(
    peakStreak,
    stats.unlockedBlockSkins
  );
  stats.unlockedBlockSkins = allUnlocked;

  // Backfill recent consecutive days for returning users with an active streak
  if (stats.dailyStreak > 1) {
    const maxBackfill = Math.min(6, stats.dailyStreak - 1);
    for (let offset = 1; offset <= maxBackfill; offset++) {
      const dateKey = getDateKeyDaysAgo(offset);
      if (!stats.dailyHistory[dateKey]) {
        stats.dailyHistory[dateKey] = {
          active: true,
          streak: Math.max(1, stats.dailyStreak - offset),
          challengesCompleted: 0,
          challengesClaimed: 0,
          totalChallenges: getDailyChallenges(dateKey).length,
        };
      }
    }
  }

  stats = withSyncedDailyHistory(stats);
  savePlayerStats(stats);
  return { stats, streakRewardXp, newDayCheckIn, newlyUnlockedSkins };
}

export function getLast7DaysStreakData(stats: PlayerStats): StreakDayPoint[] {
  const todayKey = getTodayDateKey();
  const points: StreakDayPoint[] = [];
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const dateKey = formatDateKeyFromDate(d);
    const isToday = dateKey === todayKey;

    let entry: DailyStreakHistoryEntry | undefined;
    if (isToday) {
      const todayProgress =
        stats.dailyProgress && stats.dailyProgress.date === todayKey
          ? stats.dailyProgress
          : createEmptyDailyProgress(todayKey);
      entry = summarizeDailyProgress(todayProgress, stats.dailyStreak);
    } else {
      entry = stats.dailyHistory?.[dateKey];
      if (!entry && stats.lastActiveDate === todayKey && offset < stats.dailyStreak) {
        entry = {
          active: true,
          streak: Math.max(1, stats.dailyStreak - offset),
          challengesCompleted: 0,
          challengesClaimed: 0,
          totalChallenges: getDailyChallenges(dateKey).length,
        };
      }
    }

    const totalChallenges = entry?.totalChallenges || getDailyChallenges(dateKey).length || 5;
    const active = Boolean(entry?.active);
    const challengesCompleted = active ? Math.min(totalChallenges, entry?.challengesCompleted ?? 0) : 0;
    const challengesClaimed = active ? Math.min(totalChallenges, entry?.challengesClaimed ?? 0) : 0;
    const streak = active ? Math.max(1, entry?.streak ?? 1) : 0;
    const missionRatio = totalChallenges > 0 ? challengesCompleted / totalChallenges : 0;
    const intensity = active ? Math.min(1, 0.26 + missionRatio * 0.74) : 0;

    points.push({
      dateKey,
      dayShort: dayNames[d.getDay()],
      dayNumber: String(d.getDate()),
      monthShort: monthNames[d.getMonth()],
      isToday,
      active,
      streak,
      challengesCompleted,
      challengesClaimed,
      totalChallenges,
      intensity,
    });
  }

  return points;
}

export function savePlayerStats(stats: PlayerStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore storage errors
  }
}

export function evaluateAchievements(
  stats: PlayerStats,
  bestScore: number
): { nextStats: PlayerStats; newlyUnlocked: AchievementDef[] } {
  const newlyUnlocked: AchievementDef[] = [];
  let updatedStats: PlayerStats = withSyncedDailyHistory({
    ...stats,
    unlockedAchievements: [...stats.unlockedAchievements],
    achievementUnlockedAt: { ...stats.achievementUnlockedAt },
  });

  // Run multi-pass so XP from an achievement can also unlock level-based achievements
  let changed = true;
  while (changed) {
    changed = false;
    const currentLevel = getLevelInfo(updatedStats.xp).level;
    for (const ach of ACHIEVEMENTS) {
      if (updatedStats.unlockedAchievements.includes(ach.id)) continue;
      if (ach.checkUnlocked(updatedStats, bestScore, currentLevel)) {
        updatedStats.unlockedAchievements.push(ach.id);
        updatedStats.achievementUnlockedAt[ach.id] = Date.now();
        updatedStats.xp += ach.xpReward;
        newlyUnlocked.push(ach);
        changed = true;
      }
    }
  }

  const peakStreak = Math.max(updatedStats.dailyStreak || 1, updatedStats.bestDailyStreak || 1);
  updatedStats.unlockedBlockSkins = getUnlockedBlockSkinsForStreak(
    peakStreak,
    updatedStats.unlockedBlockSkins
  ).allUnlocked;
  updatedStats = withSyncedDailyHistory(updatedStats);
  return { nextStats: updatedStats, newlyUnlocked };
}
