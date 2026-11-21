/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
    score: 12450,
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
  },
  {
    id: 'bot_2',
    username: 'CyberGhost',
    tag: '8114',
    score: 8690,
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
  },
  {
    id: 'bot_3',
    username: 'VortexPilot',
    tag: '3720',
    score: 5420,
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
  },
  {
    id: 'bot_4',
    username: 'PulseHunter',
    tag: '6105',
    score: 3180,
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
  },
  {
    id: 'bot_5',
    username: 'EchoDrifter',
    tag: '2289',
    score: 1850,
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
  },
];

let cachedRemoteRecords: FirestoreLeaderboardRecord[] | null = null;
let cachedAtMs = 0;

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
    localStorage.setItem(LEADERBOARD_CACHE_STORAGE_KEY, JSON.stringify(records.slice(0, 50)));
  } catch {
    // ignore storage errors
  }
}

export function getCachedRemoteRecords(): FirestoreLeaderboardRecord[] {
  if (cachedRemoteRecords && cachedRemoteRecords.length > 0) {
    return cachedRemoteRecords;
  }
  return readCachedStorageFallback();
}

export async function fetchSharedLeaderboardRecords(
  force = false,
  limitCount = 50
): Promise<FirestoreLeaderboardRecord[]> {
  const now = Date.now();
  if (!force && cachedRemoteRecords && now - cachedAtMs < LEADERBOARD_CACHE_TTL_MS) {
    return cachedRemoteRecords;
  }

  const records = await getLeaderboardRecordsFromFirestore(limitCount);
  if (records.length > 0) {
    cachedRemoteRecords = records;
    cachedAtMs = now;
    writeCachedStorageFallback(records);
    return records;
  }

  return getCachedRemoteRecords();
}

export function subscribeToLeaderboardRecords(
  onRecords: (records: FirestoreLeaderboardRecord[]) => void,
  limitCount = 50
): () => void {
  return subscribeToLeaderboardUpdates((records) => {
    cachedRemoteRecords = records;
    cachedAtMs = Date.now();
    if (records.length > 0) {
      writeCachedStorageFallback(records);
    }
    onRecords(records);
  }, limitCount);
}

/**
 * Pure synchronous leaderboard builder: merges remote Firestore records (or offline benchmarks)
 * with the current player's live profile & verified stats in memory — zero extra Firestore reads.
 */
export function mergeUserIntoLeaderboard(
  remoteRecords: FirestoreLeaderboardRecord[],
  userProfile: PlayerProfile,
  userBestScore: number,
  userStats?: PlayerStats,
  activeTheme?: string,
  playerIdOverride?: string
): { list: LeaderboardEntry[]; userRank: number; userEntry: LeaderboardEntry } {
  const currentId = playerIdOverride || getPlayerId();
  const safeUsername = (userProfile?.username || 'Player').trim() || 'Player';
  const safeTag = userProfile?.tag ? userProfile.tag.trim() : undefined;
  const safeLetter = (userProfile?.avatarLetter || safeUsername.charAt(0) || 'P').toUpperCase();
  const safeAvatarUrl = isValidAvatarUrl(userProfile?.avatarUrl) ? userProfile.avatarUrl : undefined;
  const safeScore = Math.max(0, userBestScore || 0);
  const userLevel = userStats ? getLevelInfo(userStats.xp).level : 1;

  let rawEntries: Array<Omit<LeaderboardEntry, 'rank' | 'isCurrentUser'>> =
    remoteRecords.length > 0
      ? remoteRecords.map((e) => {
          const check = validatePlayerName(e.username || '');
          const safeName = check.isValid ? e.username : 'Player';
          return {
            id: e.id,
            username: safeName,
            tag: e.tag,
            score: e.score,
            avatarLetter: (e.avatarLetter || safeName.charAt(0) || 'P').toUpperCase(),
            avatarUrl: isValidAvatarUrl(e.avatarUrl) ? e.avatarUrl : undefined,
            tier: e.tier,
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
          };
        })
      : [...DEFAULT_COMMUNITY_BENCHMARKS];

  const existingUserIndex = rawEntries.findIndex((e) => e.id === currentId);
  if (existingUserIndex >= 0) {
    const existing = rawEntries[existingUserIndex];
    const bestOfScores = Math.max(safeScore, existing.score);
    rawEntries[existingUserIndex] = {
      ...existing,
      score: bestOfScores,
      tier: getTierFromScore(bestOfScores),
      username: safeUsername,
      tag: safeTag,
      avatarLetter: safeLetter,
      avatarUrl: safeAvatarUrl,
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
      score: safeScore,
      avatarLetter: safeLetter,
      avatarUrl: safeAvatarUrl,
      tier: getTierFromScore(safeScore),
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
    });
  }

  rawEntries.sort((a, b) => b.score - a.score);

  let userRank = 1;
  let userEntry: LeaderboardEntry = {
    id: currentId,
    rank: 1,
    username: safeUsername,
    tag: safeTag,
    score: safeScore,
    avatarLetter: safeLetter,
    avatarUrl: safeAvatarUrl,
    tier: getTierFromScore(safeScore),
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
  playerIdOverride?: string
): { list: LeaderboardEntry[]; userRank: number; userEntry: LeaderboardEntry } {
  return mergeUserIntoLeaderboard(
    getCachedRemoteRecords(),
    userProfile,
    userBestScore,
    userStats,
    activeTheme,
    playerIdOverride
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
  activeTheme?: string
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
  };

  return savePlayerRecordToFirestore(firestoreRecord);
}

export { subscribeToLeaderboardUpdates, isFirestoreOnline };
