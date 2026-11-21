/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DifficultyModeId } from './types';
import {
  savePlayerRecordToFirestore,
  getLeaderboardRecordsFromFirestore,
  subscribeToLeaderboardUpdates,
  testFirestoreConnection,
  isFirestoreOnline,
  getCurrentAuthUser,
  FirestoreLeaderboardRecord,
} from './firebase';
import { validatePlayerName } from './wordFilter';
import { PlayerStats, getLevelInfo } from './progression';
import { isValidAvatarUrl } from './avatar';

export interface PlayerProfile {
  username: string;
  tag?: string; // only present if rolled
  avatarLetter: string; // single-letter monogram
  avatarUrl?: string; // optional compressed base64 profile picture
  hasChosenName: boolean;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  tag?: string;
  score: number;
  avatarLetter: string;
  avatarUrl?: string;
  tier: 'Grandmaster' | 'Master' | 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  isCurrentUser?: boolean;
  isBenchmark?: boolean;
  xp?: number;
  level?: number;
  totalPlaytimeSec?: number;
  longestSessionSec?: number;
  gamesPlayed?: number;
  totalLinesCleared?: number;
  bestCombo?: number;
  dailyStreak?: number;
  achievementsCount?: number;
  activeTheme?: string;
  modeBestScores?: Record<DifficultyModeId, number>;
}

const NAME_PREFIXES = [
  'Cyber', 'Neon', 'Pixel', 'Quantum', 'Vortex', 'Hyper', 'Aero', 'Glitch',
  'Shadow', 'Solar', 'Turbo', 'Sonic', 'Blaze', 'Phantom', 'Omega', 'Cosmic',
  'Nova', 'Vector', 'Apex', 'Laser', 'Pulse', 'Aura', 'Rogue', 'Titan', 'Echo'
];

const NAME_SUFFIXES = [
  'Striker', 'Rider', 'Blade', 'Knight', 'Fox', 'Ghost', 'Hunter', 'Sniper',
  'Wolf', 'Master', 'Pilot', 'Viper', 'Spark', 'Drifter', 'Claw', 'Reaper',
  'Fury', 'Samurai', 'Runner', 'Wanderer', 'Ace', 'Ninja', 'Raven'
];

export function generateRandomName(): { username: string; tag: string } {
  const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
  const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
  const tag = Math.floor(1000 + Math.random() * 9000).toString();
  return { username: `${prefix}${suffix}`, tag };
}

export function getTierFromScore(score: number): LeaderboardEntry['tier'] {
  if (score >= 15000) return 'Grandmaster';
  if (score >= 10000) return 'Master';
  if (score >= 6000) return 'Diamond';
  if (score >= 3500) return 'Platinum';
  if (score >= 2000) return 'Gold';
  if (score >= 800) return 'Silver';
  return 'Bronze';
}

export function getTierBadgeStyle(tier: LeaderboardEntry['tier']): {
  bg: string;
  text: string;
  border: string;
} {
  switch (tier) {
    case 'Grandmaster':
      return { bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-500/30' };
    case 'Master':
      return { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-500/30' };
    case 'Diamond':
      return { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-400/30' };
    case 'Platinum':
      return { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-500/30' };
    case 'Gold':
      return { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-400/30' };
    case 'Silver':
      return { bg: 'bg-slate-800/40', text: 'text-slate-300', border: 'border-slate-500/30' };
    case 'Bronze':
    default:
      return { bg: 'bg-slate-900', text: 'text-slate-400', border: 'border-slate-700' };
  }
}

const LEADERBOARD_CACHE_STORAGE_KEY = 'creatyxo_confirmed_leaderboard';
const GUEST_ID_STORAGE_KEY = 'creatyxo_player_id';
const LEADERBOARD_CACHE_TTL_MS = 60_000;

export function getGuestPlayerId(): string {
  if (typeof window === 'undefined') return 'guest-player';
  let id = localStorage.getItem(GUEST_ID_STORAGE_KEY);
  if (!id) {
    id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(GUEST_ID_STORAGE_KEY, id);
  }
  return id;
}

export function getAuthenticatedPlayerId(): string | null {
  return getCurrentAuthUser()?.uid ?? null;
}

export function getPlayerId(): string {
  return getAuthenticatedPlayerId() || getGuestPlayerId();
}

// Initial Firestore connectivity probe (non-blocking)
if (typeof window !== 'undefined') {
  testFirestoreConnection().catch(() => {});
}

export const DEFAULT_COMMUNITY_BENCHMARKS: Array<Omit<LeaderboardEntry, 'rank' | 'isCurrentUser'>> = [
  {
    id: 'bot_1',
    username: 'NovaBlade',
    tag: '9421',
    score: 14800,
    avatarLetter: 'N',
    tier: 'Master',
    isBenchmark: true,
    xp: 4850,
    level: 7,
    totalPlaytimeSec: 5420,
    longestSessionSec: 940,
    gamesPlayed: 42,
    totalLinesCleared: 390,
    bestCombo: 6,
    dailyStreak: 9,
    achievementsCount: 8,
    activeTheme: 'prism-aurora',
    modeBestScores: { easy: 14800, classic: 12450, hard: 5800, extreme: 2450 },
  },
  {
    id: 'bot_2',
    username: 'CyberGhost',
    tag: '8114',
    score: 10200,
    avatarLetter: 'C',
    tier: 'Diamond',
    isBenchmark: true,
    xp: 3120,
    level: 6,
    totalPlaytimeSec: 3890,
    longestSessionSec: 710,
    gamesPlayed: 31,
    totalLinesCleared: 275,
    bestCombo: 5,
    dailyStreak: 5,
    achievementsCount: 7,
    activeTheme: 'midas-gold',
    modeBestScores: { easy: 10200, classic: 8690, hard: 4150, extreme: 1780 },
  },
  {
    id: 'bot_3',
    username: 'VortexPilot',
    tag: '3720',
    score: 6500,
    avatarLetter: 'V',
    tier: 'Platinum',
    isBenchmark: true,
    xp: 1850,
    level: 4,
    totalPlaytimeSec: 2310,
    longestSessionSec: 530,
    gamesPlayed: 22,
    totalLinesCleared: 168,
    bestCombo: 4,
    dailyStreak: 4,
    achievementsCount: 5,
    activeTheme: 'crimson-inferno',
    modeBestScores: { easy: 6500, classic: 5420, hard: 2750, extreme: 1180 },
  },
  {
    id: 'bot_4',
    username: 'PulseHunter',
    tag: '6105',
    score: 3900,
    avatarLetter: 'P',
    tier: 'Platinum',
    isBenchmark: true,
    xp: 980,
    level: 3,
    totalPlaytimeSec: 1420,
    longestSessionSec: 380,
    gamesPlayed: 15,
    totalLinesCleared: 102,
    bestCombo: 3,
    dailyStreak: 2,
    achievementsCount: 4,
    activeTheme: 'solar-flare',
    modeBestScores: { easy: 3900, classic: 3180, hard: 1650, extreme: 740 },
  },
  {
    id: 'bot_5',
    username: 'EchoDrifter',
    tag: '2289',
    score: 2100,
    avatarLetter: 'E',
    tier: 'Silver',
    isBenchmark: true,
    xp: 440,
    level: 2,
    totalPlaytimeSec: 760,
    longestSessionSec: 245,
    gamesPlayed: 9,
    totalLinesCleared: 54,
    bestCombo: 2,
    dailyStreak: 1,
    achievementsCount: 2,
    activeTheme: 'emerald-matrix',
    modeBestScores: { easy: 2100, classic: 1850, hard: 920, extreme: 410 },
  },
];

let cachedRemoteRecords: FirestoreLeaderboardRecord[] | null = null;
const cachedAtByKey: Record<string, number> = {};

function readCachedStorageFallback(): FirestoreLeaderboardRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEADERBOARD_CACHE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedStorageFallback(records: FirestoreLeaderboardRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEADERBOARD_CACHE_STORAGE_KEY, JSON.stringify(records.slice(0, 80)));
  } catch {
    // ignore storage errors
  }
}

function mergeRecordBatches(
  existing: FirestoreLeaderboardRecord[] | null,
  incoming: FirestoreLeaderboardRecord[]
): FirestoreLeaderboardRecord[] {
  const byId = new Map<string, FirestoreLeaderboardRecord>();
  (existing || []).forEach((r) => byId.set(r.id, r));
  incoming.forEach((r) => {
    const prev = byId.get(r.id);
    if (!prev || r.updatedAt >= prev.updatedAt || Boolean(r.modeBestScores && !prev.modeBestScores)) {
      byId.set(r.id, r);
    }
  });
  return Array.from(byId.values()).sort((a, b) => b.score - a.score);
}

export function getCachedRemoteRecords(): FirestoreLeaderboardRecord[] {
  if (cachedRemoteRecords && cachedRemoteRecords.length > 0) {
    return cachedRemoteRecords;
  }
  return readCachedStorageFallback();
}

export async function fetchSharedLeaderboardRecords(
  force = false,
  limitCount = 50,
  mode?: DifficultyModeId
): Promise<FirestoreLeaderboardRecord[]> {
  const cacheKey = mode || 'overall';
  const now = Date.now();
  if (!force && cachedRemoteRecords && now - (cachedAtByKey[cacheKey] || 0) < LEADERBOARD_CACHE_TTL_MS) {
    return cachedRemoteRecords;
  }

  const records = await getLeaderboardRecordsFromFirestore(limitCount, mode);
  if (records.length > 0) {
    cachedRemoteRecords = mergeRecordBatches(cachedRemoteRecords || readCachedStorageFallback(), records);
    cachedAtByKey[cacheKey] = now;
    writeCachedStorageFallback(cachedRemoteRecords);
    return cachedRemoteRecords;
  }

  return getCachedRemoteRecords();
}

export function subscribeToLeaderboardRecords(
  onRecords: (records: FirestoreLeaderboardRecord[]) => void,
  limitCount = 50,
  mode?: DifficultyModeId
): () => void {
  const cacheKey = mode || 'overall';
  return subscribeToLeaderboardUpdates((records) => {
    cachedRemoteRecords = mergeRecordBatches(cachedRemoteRecords || readCachedStorageFallback(), records);
    cachedAtByKey[cacheKey] = Date.now();
    if (cachedRemoteRecords.length > 0) {
      writeCachedStorageFallback(cachedRemoteRecords);
    }
    onRecords(cachedRemoteRecords);
  }, limitCount, mode);
}

export function getScoreForGrid(
  entry: { score: number; modeBestScores?: Record<DifficultyModeId, number> },
  gridMode?: DifficultyModeId
): number {
  if (!gridMode) return Math.max(0, entry.score || 0);
  if (entry.modeBestScores) {
    return Math.max(0, entry.modeBestScores[gridMode] ?? 0);
  }
  // Legacy records before per-grid leaderboards only reflect Classic 8x8
  return gridMode === 'classic' ? Math.max(0, entry.score || 0) : 0;
}

/**
 * Pure synchronous leaderboard builder: merges remote Firestore records (or offline benchmarks)
 * with the current player's live profile & verified stats in memory — zero extra Firestore reads.
 * When `gridMode` is provided, ranks players strictly by that grid size's best score.
 */
export function mergeUserIntoLeaderboard(
  remoteRecords: FirestoreLeaderboardRecord[],
  userProfile: PlayerProfile,
  userBestScore: number,
  userStats?: PlayerStats,
  activeTheme?: string,
  playerIdOverride?: string,
  gridMode?: DifficultyModeId,
  userModeBestScores?: Record<DifficultyModeId, number>
): { list: LeaderboardEntry[]; userRank: number; userEntry: LeaderboardEntry } {
  const currentId = playerIdOverride || getPlayerId();
  const safeUsername = (userProfile?.username || 'Player').trim() || 'Player';
  const safeTag = userProfile?.tag ? userProfile.tag.trim() : undefined;
  const safeLetter = (userProfile?.avatarLetter || safeUsername.charAt(0) || 'P').toUpperCase();
  const safeAvatarUrl = isValidAvatarUrl(userProfile?.avatarUrl) ? userProfile.avatarUrl : undefined;
  const effectiveUserModes: Record<DifficultyModeId, number> = {
    easy: Math.max(0, userModeBestScores?.easy ?? 0),
    classic: Math.max(0, userModeBestScores?.classic ?? userBestScore ?? 0),
    hard: Math.max(0, userModeBestScores?.hard ?? userStats?.hardBestScore ?? 0),
    extreme: Math.max(0, userModeBestScores?.extreme ?? userStats?.extremeBestScore ?? 0),
  };
  const safeUserScore = gridMode
    ? Math.max(0, effectiveUserModes[gridMode] ?? 0)
    : Math.max(0, userBestScore || 0);
  const userLevel = userStats ? getLevelInfo(userStats.xp).level : 1;

  const mappedRemote: Array<Omit<LeaderboardEntry, 'rank' | 'isCurrentUser'>> = remoteRecords
    .map((e) => {
      const check = validatePlayerName(e.username || '');
      const safeName = check.isValid ? e.username : 'Player';
      const gridScore = getScoreForGrid(e, gridMode);
      return {
        id: e.id,
        username: safeName,
        tag: e.tag,
        score: gridScore,
        avatarLetter: (e.avatarLetter || safeName.charAt(0) || 'P').toUpperCase(),
        avatarUrl: isValidAvatarUrl(e.avatarUrl) ? e.avatarUrl : undefined,
        tier: getTierFromScore(gridScore),
        xp: e.xp,
        level: e.level,
        totalPlaytimeSec: e.totalPlaytimeSec,
        longestSessionSec: e.longestSessionSec,
        gamesPlayed: e.gamesPlayed,
        totalLinesCleared: e.totalLinesCleared,
        bestCombo: e.bestCombo,
        dailyStreak: e.dailyStreak,
        achievementsCount: e.achievementsCount,
        activeTheme: e.activeTheme,
        modeBestScores: e.modeBestScores,
      };
    })
    .filter((e) => e.id === currentId || e.score > 0);

  let rawEntries: Array<Omit<LeaderboardEntry, 'rank' | 'isCurrentUser'>> =
    mappedRemote.length > 0
      ? mappedRemote
      : DEFAULT_COMMUNITY_BENCHMARKS.map((b) => {
          const gridScore = getScoreForGrid(b, gridMode);
          return {
            ...b,
            score: gridScore,
            tier: getTierFromScore(gridScore),
          };
        });

  const existingUserIndex = rawEntries.findIndex((e) => e.id === currentId);
  if (existingUserIndex >= 0) {
    const existing = rawEntries[existingUserIndex];
    const bestOfScores = Math.max(safeUserScore, existing.score);
    const mergedModes: Record<DifficultyModeId, number> = {
      easy: Math.max(effectiveUserModes.easy, existing.modeBestScores?.easy ?? 0),
      classic: Math.max(effectiveUserModes.classic, existing.modeBestScores?.classic ?? 0),
      hard: Math.max(effectiveUserModes.hard, existing.modeBestScores?.hard ?? 0),
      extreme: Math.max(effectiveUserModes.extreme, existing.modeBestScores?.extreme ?? 0),
    };
    rawEntries[existingUserIndex] = {
      ...existing,
      score: bestOfScores,
      tier: getTierFromScore(bestOfScores),
      username: safeUsername,
      tag: safeTag,
      avatarLetter: safeLetter,
      avatarUrl: safeAvatarUrl,
      modeBestScores: mergedModes,
      ...(userStats
        ? {
            xp: Math.max(userStats.xp, existing.xp || 0),
            level: Math.max(userLevel, existing.level || 1),
            totalPlaytimeSec: Math.max(userStats.totalPlaytimeSec, existing.totalPlaytimeSec || 0),
            longestSessionSec: Math.max(userStats.longestSessionSec, existing.longestSessionSec || 0),
            gamesPlayed: Math.max(userStats.gamesPlayed, existing.gamesPlayed || 0),
            totalLinesCleared: Math.max(userStats.totalLinesCleared, existing.totalLinesCleared || 0),
            bestCombo: Math.max(userStats.bestCombo, existing.bestCombo || 0),
            dailyStreak: Math.max(userStats.dailyStreak, existing.dailyStreak || 1),
            achievementsCount: Math.max(
              userStats.unlockedAchievements.length,
              existing.achievementsCount || 0
            ),
          }
        : {}),
      ...(activeTheme ? { activeTheme } : {}),
    };
  } else {
    rawEntries.push({
      id: currentId,
      username: safeUsername,
      tag: safeTag,
      score: safeUserScore,
      avatarLetter: safeLetter,
      avatarUrl: safeAvatarUrl,
      tier: getTierFromScore(safeUserScore),
      xp: userStats?.xp ?? 0,
      level: userLevel,
      totalPlaytimeSec: userStats?.totalPlaytimeSec ?? 0,
      longestSessionSec: userStats?.longestSessionSec ?? 0,
      gamesPlayed: userStats?.gamesPlayed ?? 0,
      totalLinesCleared: userStats?.totalLinesCleared ?? 0,
      bestCombo: userStats?.bestCombo ?? 0,
      dailyStreak: userStats?.dailyStreak ?? 1,
      achievementsCount: userStats?.unlockedAchievements.length ?? 0,
      activeTheme,
      modeBestScores: effectiveUserModes,
    });
  }

  rawEntries.sort((a, b) => b.score - a.score);

  let userRank = 1;
  let userEntry: LeaderboardEntry = {
    id: currentId,
    rank: 1,
    username: safeUsername,
    tag: safeTag,
    score: safeUserScore,
    avatarLetter: safeLetter,
    avatarUrl: safeAvatarUrl,
    tier: getTierFromScore(safeUserScore),
    isCurrentUser: true,
    xp: userStats?.xp ?? 0,
    level: userLevel,
    totalPlaytimeSec: userStats?.totalPlaytimeSec ?? 0,
    longestSessionSec: userStats?.longestSessionSec ?? 0,
    gamesPlayed: userStats?.gamesPlayed ?? 0,
    totalLinesCleared: userStats?.totalLinesCleared ?? 0,
    bestCombo: userStats?.bestCombo ?? 0,
    dailyStreak: userStats?.dailyStreak ?? 1,
    achievementsCount: userStats?.unlockedAchievements.length ?? 0,
    activeTheme,
    modeBestScores: effectiveUserModes,
  };

  const list: LeaderboardEntry[] = rawEntries.map((e, idx) => {
    const isUser = e.id === currentId;
    const entryItem: LeaderboardEntry = {
      ...e,
      level: e.level ?? (e.xp !== undefined ? getLevelInfo(e.xp).level : 1),
      rank: idx + 1,
      isCurrentUser: isUser,
    };
    if (isUser) {
      userRank = idx + 1;
      userEntry = entryItem;
    }
    return entryItem;
  });

  if (list.length === 0) {
    list.push(userEntry);
  }

  return { list, userRank, userEntry };
}

export function buildLeaderboard(
  userProfile: PlayerProfile,
  userBestScore: number,
  userStats?: PlayerStats,
  activeTheme?: string,
  playerIdOverride?: string,
  gridMode?: DifficultyModeId,
  userModeBestScores?: Record<DifficultyModeId, number>
): { list: LeaderboardEntry[]; userRank: number; userEntry: LeaderboardEntry } {
  return mergeUserIntoLeaderboard(
    getCachedRemoteRecords(),
    userProfile,
    userBestScore,
    userStats,
    activeTheme,
    playerIdOverride,
    gridMode,
    userModeBestScores
  );
}

/**
 * Publishes an authenticated player's verified public record to Firebase Firestore.
 * Guest/offline players remain local until they sign in.
 */
export async function savePlayerToLeaderboard(
  profile: PlayerProfile,
  bestScore: number,
  stats?: PlayerStats,
  activeTheme?: string,
  modeBestScores?: Record<DifficultyModeId, number>
): Promise<boolean> {
  const authUid = getAuthenticatedPlayerId();
  if (!authUid) return false;

  let username = (profile?.username || 'Player').trim() || 'Player';
  const check = validatePlayerName(username);
  if (!check.isValid) {
    username = 'Player';
  }

  const letter = (profile?.avatarLetter || username.charAt(0) || 'P').toUpperCase();
  const avatarUrl = isValidAvatarUrl(profile?.avatarUrl) ? profile.avatarUrl : undefined;
  const tag = profile?.tag ? profile.tag.trim() : undefined;
  const score = Math.max(0, bestScore);
  const tier = getTierFromScore(score);
  const levelInfo = stats ? getLevelInfo(stats.xp) : undefined;

  const firestoreRecord: FirestoreLeaderboardRecord = {
    id: authUid,
    username,
    tag,
    score,
    avatarLetter: letter,
    avatarUrl,
    tier,
    updatedAt: Date.now(),
    ...(stats
      ? {
          xp: stats.xp,
          level: levelInfo?.level || 1,
          totalPlaytimeSec: stats.totalPlaytimeSec,
          longestSessionSec: stats.longestSessionSec,
          gamesPlayed: stats.gamesPlayed,
          totalLinesCleared: stats.totalLinesCleared,
          bestCombo: stats.bestCombo,
          dailyStreak: stats.dailyStreak,
          achievementsCount: stats.unlockedAchievements.length,
        }
      : {}),
    ...(activeTheme ? { activeTheme } : {}),
    ...(modeBestScores ? { modeBestScores } : {}),
  };

  return savePlayerRecordToFirestore(firestoreRecord);
}

export { subscribeToLeaderboardUpdates, isFirestoreOnline };
