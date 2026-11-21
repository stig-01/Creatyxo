/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DifficultyModeId } from './types';
import { DIFFICULTY_ORDER } from './shapes';
import { PlayerProfile, getTierFromScore } from './leaderboard';
import {
  PlayerStats,
  DailyProgressState,
  DailyStreakHistoryEntry,
  createDefaultStats,
  createEmptyDailyProgress,
  evaluateAchievements,
  getDateKeyDaysAgo,
  getLevelInfo,
  getTodayDateKey,
  savePlayerStats,
} from './progression';
import { ThemeId, GAME_THEMES, isThemeUnlocked } from './themes';
import {
  BlockSkinId,
  BLOCK_SKINS,
  getUnlockedBlockSkinsForStreak,
  isBlockSkinUnlocked,
} from './blockSkins';
import {
  UserAccountRecord,
  fetchUserAccountFromFirestore,
  saveUserAccountToFirestore,
  savePlayerRecordToFirestore,
} from './firebase';

export interface CloudAccountSnapshot {
  accountKey: string;
  profile: PlayerProfile;
  stats: PlayerStats;
  modeBestScores: Record<DifficultyModeId, number>;
  bestScore: number;
  activeThemeId: ThemeId;
  activeBlockSkinId: BlockSkinId;
  preferencesUpdatedAt: number;
  pendingSync: boolean;
}

const ACCOUNT_STORAGE_PREFIX = 'creatyxo_account_v2_';

function storageKeyFor(accountKey: string): string {
  return `${ACCOUNT_STORAGE_PREFIX}${accountKey || 'guest'}`;
}

export function loadLegacyLocalSnapshot(): Omit<CloudAccountSnapshot, 'accountKey' | 'pendingSync'> | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawProfile = localStorage.getItem('creatyxo_player_profile');
    const rawStats = localStorage.getItem('creatyxo_player_stats');
    const rawBest = localStorage.getItem('creatyxo_best_score');
    if (!rawProfile && !rawStats && !rawBest) return null;

    const profile: PlayerProfile = rawProfile
      ? JSON.parse(rawProfile)
      : {
          username: 'Player',
          avatarLetter: 'P',
          hasChosenName: false,
        };

    const stats: PlayerStats = rawStats
      ? { ...createDefaultStats(), ...JSON.parse(rawStats) }
      : createDefaultStats();

    const modeBestScores: Record<DifficultyModeId, number> = {
      easy: 0,
      classic: parseInt(rawBest || '0', 10) || 0,
      hard: 0,
      extreme: 0,
    };
    const legacyChill = parseInt(localStorage.getItem('creatyxo_best_score_chill') || '0', 10) || 0;
    modeBestScores.easy = legacyChill;
    DIFFICULTY_ORDER.forEach((m) => {
      const val = parseInt(localStorage.getItem(`creatyxo_best_score_${m}`) || '0', 10) || 0;
      modeBestScores[m] = Math.max(modeBestScores[m], val);
    });

    const bestScore = Math.max(
      parseInt(rawBest || '0', 10) || 0,
      ...Object.values(modeBestScores)
    );

    const savedTheme = localStorage.getItem('creatyxo_active_theme') as ThemeId | null;
    const activeThemeId: ThemeId =
      savedTheme && savedTheme in GAME_THEMES && isThemeUnlocked(savedTheme, stats.unlockedAchievements)
        ? savedTheme
        : 'cyber-neon';

    const savedSkin = localStorage.getItem('creatyxo_active_block_skin') as BlockSkinId | null;
    const peakStreak = Math.max(stats.dailyStreak || 1, stats.bestDailyStreak || 1);
    const activeBlockSkinId: BlockSkinId =
      savedSkin && savedSkin in BLOCK_SKINS && isBlockSkinUnlocked(savedSkin, peakStreak, stats.unlockedBlockSkins)
        ? savedSkin
        : 'classic-gloss';

    return {
      profile,
      stats,
      modeBestScores,
      bestScore,
      activeThemeId,
      activeBlockSkinId,
      preferencesUpdatedAt: 1,
    };
  } catch {
    return null;
  }
}

export function loadLocalAccountSnapshot(accountKey: string): CloudAccountSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKeyFor(accountKey));
    if (raw) {
      const parsed = JSON.parse(raw) as CloudAccountSnapshot;
      if (parsed && parsed.profile && parsed.stats) {
        return {
          ...parsed,
          accountKey,
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveLocalAccountSnapshot(snapshot: CloudAccountSnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKeyFor(snapshot.accountKey), JSON.stringify(snapshot));
    // Also mirror active session values to legacy keys so existing progression readers stay aligned
    localStorage.setItem('creatyxo_player_profile', JSON.stringify(snapshot.profile));
    localStorage.setItem('creatyxo_best_score', String(snapshot.bestScore));
    DIFFICULTY_ORDER.forEach((m) => {
      localStorage.setItem(`creatyxo_best_score_${m}`, String(snapshot.modeBestScores[m] || 0));
    });
    localStorage.setItem('creatyxo_active_theme', snapshot.activeThemeId);
    localStorage.setItem('creatyxo_active_block_skin', snapshot.activeBlockSkinId);
    savePlayerStats(snapshot.stats);
  } catch {
    // ignore storage quota issues
  }
}

function mergeDailyProgress(
  a: DailyProgressState | undefined,
  b: DailyProgressState | undefined
): DailyProgressState {
  const today = getTodayDateKey();
  const aIsToday = a?.date === today;
  const bIsToday = b?.date === today;

  if (!aIsToday && !bIsToday) {
    return createEmptyDailyProgress(today);
  }
  if (aIsToday && !bIsToday) return { ...createEmptyDailyProgress(today), ...a };
  if (!aIsToday && bIsToday) return { ...createEmptyDailyProgress(today), ...b };

  const claimed = Array.from(new Set([...(a?.claimedIds || []), ...(b?.claimedIds || [])]));
  return {
    date: today,
    linesClearedToday: Math.max(a?.linesClearedToday || 0, b?.linesClearedToday || 0),
    bestScoreToday: Math.max(a?.bestScoreToday || 0, b?.bestScoreToday || 0),
    gamesToday: Math.max(a?.gamesToday || 0, b?.gamesToday || 0),
    bestComboToday: Math.max(a?.bestComboToday || 0, b?.bestComboToday || 0),
    featuredGamesToday: Math.max(a?.featuredGamesToday || 0, b?.featuredGamesToday || 0),
    blocksPlacedToday: Math.max(a?.blocksPlacedToday || 0, b?.blocksPlacedToday || 0),
    claimedIds: claimed,
  };
}

function mergeDailyHistory(
  a: Record<string, DailyStreakHistoryEntry> | undefined,
  b: Record<string, DailyStreakHistoryEntry> | undefined
): Record<string, DailyStreakHistoryEntry> {
  const minKeepDate = getDateKeyDaysAgo(30);
  const merged: Record<string, DailyStreakHistoryEntry> = {};
  const allKeys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);

  allKeys.forEach((dateKey) => {
    if (dateKey < minKeepDate) return;
    const entryA = a?.[dateKey];
    const entryB = b?.[dateKey];
    if (entryA && entryB) {
      merged[dateKey] = {
        active: Boolean(entryA.active || entryB.active),
        streak: Math.max(entryA.streak || 1, entryB.streak || 1),
        challengesCompleted: Math.max(entryA.challengesCompleted || 0, entryB.challengesCompleted || 0),
        challengesClaimed: Math.max(entryA.challengesClaimed || 0, entryB.challengesClaimed || 0),
        totalChallenges: Math.max(entryA.totalChallenges || 5, entryB.totalChallenges || 5),
      };
    } else if (entryA) {
      merged[dateKey] = entryA;
    } else if (entryB) {
      merged[dateKey] = entryB;
    }
  });

  return merged;
}

/**
 * Conflict-free deterministic merge between local device progress and cloud progress.
 * Guarantees neither an empty fresh device nor offline play destroys earned progression.
 */
export function mergeAccountSnapshots(
  local: CloudAccountSnapshot,
  cloud: UserAccountRecord
): CloudAccountSnapshot {
  const cloudStats = cloud.stats;
  const localStats = local.stats;

  // Achievement set union preserving earliest unlock timestamp
  const mergedAchSet = Array.from(
    new Set([...(localStats.unlockedAchievements || []), ...(cloudStats.unlockedAchievements || [])])
  );
  const mergedAchTimestamps: Record<string, number> = { ...(cloudStats.achievementUnlockedAt || {}) };
  for (const [id, ts] of Object.entries(localStats.achievementUnlockedAt || {})) {
    if (!mergedAchTimestamps[id] || (ts > 0 && ts < mergedAchTimestamps[id])) {
      mergedAchTimestamps[id] = ts;
    }
  }

  // Pick streak from whichever device was active more recently (or max if same date)
  const localDate = localStats.lastActiveDate || '';
  const cloudDate = cloudStats.lastActiveDate || '';
  let mergedStreak = Math.max(localStats.dailyStreak || 1, cloudStats.dailyStreak || 1);
  let mergedLastActive = localDate >= cloudDate ? localDate : cloudDate;
  if (localDate && cloudDate && localDate !== cloudDate) {
    mergedStreak = localDate > cloudDate ? localStats.dailyStreak : cloudStats.dailyStreak;
  }
  const mergedBestDailyStreak = Math.max(
    localStats.bestDailyStreak || 1,
    cloudStats.bestDailyStreak || 1,
    mergedStreak
  );

  const totalPlaytimeSec = Math.max(localStats.totalPlaytimeSec || 0, cloudStats.totalPlaytimeSec || 0);
  const longestSessionSec = Math.min(
    totalPlaytimeSec,
    Math.max(localStats.longestSessionSec || 0, cloudStats.longestSessionSec || 0)
  );
  const totalLinesCleared = Math.max(localStats.totalLinesCleared || 0, cloudStats.totalLinesCleared || 0);
  const bestCombo = Math.min(
    totalLinesCleared,
    Math.max(localStats.bestCombo || 0, cloudStats.bestCombo || 0)
  );

  const combinedSkins = Array.from(
    new Set([
      ...(localStats.unlockedBlockSkins || ['classic-gloss']),
      ...(cloudStats.unlockedBlockSkins || ['classic-gloss']),
    ])
  ) as BlockSkinId[];
  const { allUnlocked: syncedSkins } = getUnlockedBlockSkinsForStreak(
    Math.max(mergedStreak, mergedBestDailyStreak),
    combinedSkins
  );

  const rawMergedStats: PlayerStats = {
    xp: Math.max(localStats.xp || 0, cloudStats.xp || 0),
    totalPlaytimeSec,
    longestSessionSec,
    gamesPlayed: Math.max(localStats.gamesPlayed || 0, cloudStats.gamesPlayed || 0),
    totalLinesCleared,
    totalBlocksPlaced: Math.max(localStats.totalBlocksPlaced || 0, cloudStats.totalBlocksPlaced || 0),
    bestCombo,
    bestSingleMoveLines: Math.max(localStats.bestSingleMoveLines || 0, cloudStats.bestSingleMoveLines || 0),
    extremeBestScore: Math.max(localStats.extremeBestScore || 0, cloudStats.extremeBestScore || 0),
    hardBestScore: Math.max(localStats.hardBestScore || 0, cloudStats.hardBestScore || 0),
    totalQuestsClaimed: Math.max(localStats.totalQuestsClaimed || 0, cloudStats.totalQuestsClaimed || 0),
    dailyStreak: Math.max(1, mergedStreak),
    bestDailyStreak: Math.max(1, mergedBestDailyStreak),
    lastActiveDate: mergedLastActive || getTodayDateKey(),
    unlockedAchievements: mergedAchSet,
    achievementUnlockedAt: mergedAchTimestamps,
    dailyProgress: mergeDailyProgress(localStats.dailyProgress, cloudStats.dailyProgress),
    dailyHistory: mergeDailyHistory(localStats.dailyHistory, cloudStats.dailyHistory),
    unlockedBlockSkins: syncedSkins,
  };

  const mergedModeBestScores: Record<DifficultyModeId, number> = {
    easy: Math.max(local.modeBestScores.easy || 0, cloud.modeBestScores.easy || 0),
    classic: Math.max(local.modeBestScores.classic || 0, cloud.modeBestScores.classic || 0),
    hard: Math.max(local.modeBestScores.hard || 0, cloud.modeBestScores.hard || 0),
    extreme: Math.max(local.modeBestScores.extreme || 0, cloud.modeBestScores.extreme || 0),
  };

  const mergedBestScore = Math.max(
    local.bestScore || 0,
    cloud.bestScore || 0,
    ...Object.values(mergedModeBestScores)
  );

  const { nextStats: evaluatedStats } = evaluateAchievements(rawMergedStats, mergedBestScore);

  // Preferences & profile: LWW using preferencesUpdatedAt, preferring chosen names over auto-rolled guest names
  const localHasMeaningfulPrefs = local.profile.hasChosenName && local.preferencesUpdatedAt > 0;
  const cloudHasMeaningfulPrefs = cloud.profile.hasChosenName;

  let chosenProfile = cloud.profile;
  let chosenTheme = cloud.activeThemeId as ThemeId;
  let chosenSkin = cloud.activeBlockSkinId as BlockSkinId;
  let chosenPrefsTs = cloud.preferencesUpdatedAt || Date.now();

  if (
    (!cloudHasMeaningfulPrefs && localHasMeaningfulPrefs) ||
    (local.preferencesUpdatedAt >= (cloud.preferencesUpdatedAt || 0) &&
      (localHasMeaningfulPrefs || !cloudHasMeaningfulPrefs))
  ) {
    chosenProfile = local.profile;
    chosenTheme = local.activeThemeId;
    chosenSkin = local.activeBlockSkinId;
    chosenPrefsTs = local.preferencesUpdatedAt || Date.now();
  }

  const safeTheme: ThemeId =
    chosenTheme in GAME_THEMES && isThemeUnlocked(chosenTheme, evaluatedStats.unlockedAchievements)
      ? chosenTheme
      : 'cyber-neon';

  const safeSkin: BlockSkinId =
    chosenSkin in BLOCK_SKINS &&
    isBlockSkinUnlocked(
      chosenSkin,
      Math.max(evaluatedStats.dailyStreak, evaluatedStats.bestDailyStreak),
      evaluatedStats.unlockedBlockSkins
    )
      ? chosenSkin
      : 'classic-gloss';

  return {
    accountKey: cloud.uid,
    profile: chosenProfile,
    stats: evaluatedStats,
    modeBestScores: mergedModeBestScores,
    bestScore: mergedBestScore,
    activeThemeId: safeTheme,
    activeBlockSkinId: safeSkin,
    preferencesUpdatedAt: chosenPrefsTs,
    pendingSync: false,
  };
}

/**
 * Pulls cloud save first (if present), merges non-destructively with local state,
 * saves locally, and pushes merged state to /users/{uid} and /leaderboard/{uid}.
 */
export async function syncAccountWithCloud(
  uid: string,
  localSnapshot: CloudAccountSnapshot
): Promise<{ merged: CloudAccountSnapshot; synced: boolean }> {
  if (!uid) {
    return { merged: localSnapshot, synced: false };
  }

  const cloud = await fetchUserAccountFromFirestore(uid);
  const merged = cloud
    ? mergeAccountSnapshots(localSnapshot, cloud)
    : { ...localSnapshot, accountKey: uid };

  saveLocalAccountSnapshot(merged);

  const level = getLevelInfo(merged.stats.xp).level;
  const userSaved = await saveUserAccountToFirestore(uid, {
    profile: merged.profile,
    stats: merged.stats,
    modeBestScores: merged.modeBestScores,
    bestScore: merged.bestScore,
    activeThemeId: merged.activeThemeId,
    activeBlockSkinId: merged.activeBlockSkinId,
    preferencesUpdatedAt: merged.preferencesUpdatedAt,
  });

  const lbSaved = await savePlayerRecordToFirestore({
    id: uid,
    username: merged.profile.username,
    tag: merged.profile.tag,
    score: merged.bestScore,
    avatarLetter: merged.profile.avatarLetter,
    avatarUrl: merged.profile.avatarUrl,
    tier: getTierFromScore(merged.bestScore),
    updatedAt: Date.now(),
    xp: merged.stats.xp,
    level,
    totalPlaytimeSec: merged.stats.totalPlaytimeSec,
    longestSessionSec: merged.stats.longestSessionSec,
    gamesPlayed: merged.stats.gamesPlayed,
    totalLinesCleared: merged.stats.totalLinesCleared,
    bestCombo: merged.stats.bestCombo,
    dailyStreak: merged.stats.dailyStreak,
    achievementsCount: merged.stats.unlockedAchievements.length,
    activeTheme: merged.activeThemeId,
    modeBestScores: merged.modeBestScores,
  });

  const synced = userSaved && lbSaved;
  const finalSnapshot: CloudAccountSnapshot = {
    ...merged,
    pendingSync: !synced,
  };
  saveLocalAccountSnapshot(finalSnapshot);

  return { merged: finalSnapshot, synced };
}
