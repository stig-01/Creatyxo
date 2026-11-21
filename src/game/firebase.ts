/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
  Timestamp,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  where,
  getDocFromServer,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseConfig } from './firebaseConfig';
import { isValidAvatarUrl } from './avatar';
import { DifficultyModeId } from './types';
import { PlayerStats, createDefaultStats, createEmptyDailyProgress, getLevelInfo, getTodayDateKey } from './progression';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      displayName?: string | null;
      email?: string | null;
      photoUrl?: string | null;
    }[];
  };
}

const config = getFirebaseConfig();

let app: FirebaseApp | null = null;
export let db: Firestore | null = null;
export let auth: Auth | null = null;
let isDbOnline = true;

if (config && config.apiKey && config.projectId) {
  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }

    try {
      db = initializeFirestore(
        app,
        {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        },
        config.firestoreDatabaseId
      );
    } catch {
      db = config.firestoreDatabaseId
        ? getFirestore(app, config.firestoreDatabaseId)
        : getFirestore(app);
    }

    auth = getAuth(app);
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const user = auth?.currentUser ?? null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid ?? null,
      email: user?.email ?? null,
      emailVerified: user?.emailVerified ?? null,
      isAnonymous: user ? user.isAnonymous : true,
      tenantId: user?.tenantId ?? null,
      providerInfo:
        user?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) ?? [],
    },
    operationType,
    path,
  };
  console.warn('Firestore notice:', JSON.stringify(errInfo));
}

export function isFirestoreOnline(): boolean {
  return db !== null && isDbOnline;
}

export function getCurrentAuthUser(): User | null {
  return auth?.currentUser ?? null;
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): Unsubscribe {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutPlayer(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export interface FirestoreLeaderboardRecord {
  id: string;
  username: string;
  tag?: string;
  score: number;
  avatarLetter: string;
  avatarUrl?: string;
  tier: 'Grandmaster' | 'Master' | 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  updatedAt: number;
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

export interface UserAccountRecord {
  uid: string;
  profile: {
    username: string;
    tag?: string;
    avatarLetter: string;
    avatarUrl?: string;
    hasChosenName: boolean;
  };
  stats: PlayerStats;
  modeBestScores: Record<DifficultyModeId, number>;
  bestScore: number;
  activeThemeId: string;
  activeBlockSkinId: string;
  preferencesUpdatedAt: number;
  updatedAt: number;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export interface FriendshipRecord {
  id: string;
  users: [string, string];
  fromId: string;
  toId: string;
  fromUsername: string;
  toUsername: string;
  status: FriendshipStatus;
  createdAt: number;
  updatedAt: number;
}

export function getFriendshipDocId(idA: string, idB: string): string {
  const sorted = [idA, idB].sort();
  return `${sorted[0]}__${sorted[1]}`;
}

function toEpochMs(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as Timestamp).toMillis === 'function') {
    return (value as Timestamp).toMillis();
  }
  return 0;
}

function computeTierFromScore(score: number): FirestoreLeaderboardRecord['tier'] {
  if (score >= 15000) return 'Grandmaster';
  if (score >= 10000) return 'Master';
  if (score >= 6000) return 'Diamond';
  if (score >= 3500) return 'Platinum';
  if (score >= 2000) return 'Gold';
  if (score >= 800) return 'Silver';
  return 'Bronze';
}

function clampNonNeg(val: unknown, max: number, fallback = 0): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(0, Math.min(max, Math.floor(val)));
}

/**
 * Validates Firestore connectivity on initial load
 */
export async function testFirestoreConnection(): Promise<boolean> {
  if (!db) {
    isDbOnline = false;
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isDbOnline = true;
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration. Firestore client is offline.');
      isDbOnline = false;
    } else {
      // A permission or missing-doc response proves network reachability
      isDbOnline = true;
    }
    return isDbOnline;
  }
}

function sanitizeStatsForFirestore(rawStats: PlayerStats): PlayerStats {
  const today = getTodayDateKey();
  const defaults = createDefaultStats();
  const totalPlaytimeSec = clampNonNeg(rawStats.totalPlaytimeSec, 100000000);
  const longestSessionSec = Math.min(totalPlaytimeSec, clampNonNeg(rawStats.longestSessionSec, 100000000));
  const totalLinesCleared = clampNonNeg(rawStats.totalLinesCleared, 10000000);
  const bestCombo = Math.min(totalLinesCleared, clampNonNeg(rawStats.bestCombo, 500));
  const dailyStreak = Math.max(1, clampNonNeg(rawStats.dailyStreak, 3650, 1));
  const bestDailyStreak = Math.max(dailyStreak, clampNonNeg(rawStats.bestDailyStreak, 3650, 1));

  const achievementUnlockedAt: Record<string, number> = {};
  if (rawStats.achievementUnlockedAt && typeof rawStats.achievementUnlockedAt === 'object') {
    for (const [key, val] of Object.entries(rawStats.achievementUnlockedAt)) {
      if (typeof val === 'number' && Number.isFinite(val)) {
        achievementUnlockedAt[String(key).slice(0, 64)] = Math.floor(val);
      }
    }
  }

  const dp = rawStats.dailyProgress || createEmptyDailyProgress(today);
  const dailyHistory: NonNullable<PlayerStats['dailyHistory']> = {};
  if (rawStats.dailyHistory && typeof rawStats.dailyHistory === 'object') {
    const entries = Object.entries(rawStats.dailyHistory).slice(-31);
    for (const [dateKey, entry] of entries) {
      if (entry && typeof entry === 'object') {
        dailyHistory[String(dateKey).slice(0, 16)] = {
          active: Boolean(entry.active),
          streak: Math.max(1, clampNonNeg(entry.streak, 3650, 1)),
          challengesCompleted: clampNonNeg(entry.challengesCompleted, 10),
          challengesClaimed: clampNonNeg(entry.challengesClaimed, 10),
          totalChallenges: Math.max(1, clampNonNeg(entry.totalChallenges, 10, 5)),
        };
      }
    }
  }

  return {
    xp: clampNonNeg(rawStats.xp, 5000000),
    totalPlaytimeSec,
    longestSessionSec,
    gamesPlayed: clampNonNeg(rawStats.gamesPlayed, 1000000),
    totalLinesCleared,
    totalBlocksPlaced: clampNonNeg(rawStats.totalBlocksPlaced, 100000000),
    bestCombo,
    bestSingleMoveLines: clampNonNeg(rawStats.bestSingleMoveLines, 20),
    extremeBestScore: clampNonNeg(rawStats.extremeBestScore, 250000),
    hardBestScore: clampNonNeg(rawStats.hardBestScore, 250000),
    totalQuestsClaimed: clampNonNeg(rawStats.totalQuestsClaimed, 1000000),
    dailyStreak,
    bestDailyStreak,
    lastActiveDate: String(rawStats.lastActiveDate || defaults.lastActiveDate).slice(0, 16),
    unlockedAchievements: Array.isArray(rawStats.unlockedAchievements)
      ? rawStats.unlockedAchievements.map((id) => String(id).slice(0, 64)).slice(0, 16)
      : [],
    achievementUnlockedAt,
    dailyProgress: {
      date: String(dp.date || today).slice(0, 16),
      linesClearedToday: clampNonNeg(dp.linesClearedToday, 1000000),
      bestScoreToday: clampNonNeg(dp.bestScoreToday, 250000),
      gamesToday: clampNonNeg(dp.gamesToday, 10000),
      bestComboToday: clampNonNeg(dp.bestComboToday, 500),
      featuredGamesToday: clampNonNeg(dp.featuredGamesToday, 10000),
      blocksPlacedToday: clampNonNeg(dp.blocksPlacedToday, 10000000),
      claimedIds: Array.isArray(dp.claimedIds)
        ? dp.claimedIds.map((id) => String(id).slice(0, 64)).slice(0, 16)
        : [],
    },
    dailyHistory,
    unlockedBlockSkins: Array.isArray(rawStats.unlockedBlockSkins)
      ? (rawStats.unlockedBlockSkins.map((s) => String(s).slice(0, 32)).slice(0, 10) as PlayerStats['unlockedBlockSkins'])
      : ['classic-gloss'],
  };
}

/**
 * Fetches owner-only portable player save from /users/{uid}
 */
export async function fetchUserAccountFromFirestore(uid: string): Promise<UserAccountRecord | null> {
  if (!db || !uid || auth?.currentUser?.uid !== uid) return null;
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    isDbOnline = true;
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    const rawProfile = (data.profile || {}) as Record<string, unknown>;
    const rawModes = (data.modeBestScores || {}) as Record<string, unknown>;
    const defaults = createDefaultStats();
    const rawStats = (data.stats || defaults) as PlayerStats;

    return {
      uid: String(data.uid || uid),
      profile: {
        username: String(rawProfile.username || 'Player').slice(0, 30),
        tag: typeof rawProfile.tag === 'string' && rawProfile.tag ? rawProfile.tag : undefined,
        avatarLetter: String(rawProfile.avatarLetter || 'P').slice(0, 2).toUpperCase(),
        avatarUrl:
          typeof rawProfile.avatarUrl === 'string' && isValidAvatarUrl(rawProfile.avatarUrl)
            ? rawProfile.avatarUrl
            : undefined,
        hasChosenName: Boolean(rawProfile.hasChosenName),
      },
      stats: sanitizeStatsForFirestore(rawStats),
      modeBestScores: {
        easy: clampNonNeg(rawModes.easy, 250000),
        classic: clampNonNeg(rawModes.classic, 250000),
        hard: clampNonNeg(rawModes.hard, 250000),
        extreme: clampNonNeg(rawModes.extreme, 250000),
      },
      bestScore: clampNonNeg(data.bestScore, 250000),
      activeThemeId: String(data.activeThemeId || 'cyber-neon').slice(0, 32),
      activeBlockSkinId: String(data.activeBlockSkinId || 'classic-gloss').slice(0, 32),
      preferencesUpdatedAt: clampNonNeg(data.preferencesUpdatedAt, Number.MAX_SAFE_INTEGER),
      updatedAt: toEpochMs(data.updatedAt),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

/**
 * Persists owner-only portable player save to /users/{uid} using serverTimestamp()
 */
export async function saveUserAccountToFirestore(
  uid: string,
  account: Omit<UserAccountRecord, 'uid' | 'updatedAt'>
): Promise<boolean> {
  if (!db || !uid || auth?.currentUser?.uid !== uid) return false;
  const path = `users/${uid}`;
  try {
    const safeStats = sanitizeStatsForFirestore(account.stats);
    const hasActivity =
      safeStats.gamesPlayed >= 1 ||
      safeStats.totalLinesCleared >= 1 ||
      safeStats.totalPlaytimeSec >= 5;
    const scoreCeiling = 2500 + safeStats.totalLinesCleared * 10000;
    const safeBestScore = hasActivity
      ? Math.min(clampNonNeg(account.bestScore, 250000), scoreCeiling)
      : 0;

    const payload = {
      uid,
      profile: {
        username: (account.profile.username.trim() || 'Player').slice(0, 30),
        tag: account.profile.tag ? account.profile.tag.slice(0, 10) : null,
        avatarLetter: (account.profile.avatarLetter || account.profile.username.charAt(0) || 'P')
          .toUpperCase()
          .slice(0, 2),
        avatarUrl: isValidAvatarUrl(account.profile.avatarUrl) ? account.profile.avatarUrl : null,
        hasChosenName: Boolean(account.profile.hasChosenName),
      },
      stats: safeStats,
      modeBestScores: {
        easy: Math.min(clampNonNeg(account.modeBestScores.easy, 250000), safeBestScore),
        classic: Math.min(clampNonNeg(account.modeBestScores.classic, 250000), safeBestScore),
        hard: Math.min(clampNonNeg(account.modeBestScores.hard, 250000), safeBestScore),
        extreme: Math.min(clampNonNeg(account.modeBestScores.extreme, 250000), safeBestScore),
      },
      bestScore: safeBestScore,
      activeThemeId: (account.activeThemeId || 'cyber-neon').slice(0, 32),
      activeBlockSkinId: (account.activeBlockSkinId || 'classic-gloss').slice(0, 32),
      preferencesUpdatedAt: clampNonNeg(account.preferencesUpdatedAt || Date.now(), Number.MAX_SAFE_INTEGER),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', uid), payload, { merge: true });
    isDbOnline = true;
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Saves an authenticated player's public leaderboard record to Firestore
 */
export async function savePlayerRecordToFirestore(
  record: FirestoreLeaderboardRecord
): Promise<boolean> {
  if (!db) return false;
  const currentUid = auth?.currentUser?.uid;
  if (!currentUid || currentUid !== record.id) {
    return false;
  }

  try {
    const docRef = doc(db, 'leaderboard', record.id);
    const totalPlaytimeSec = clampNonNeg(record.totalPlaytimeSec ?? 0, 100000000);
    const longestSessionSec = Math.min(
      totalPlaytimeSec,
      clampNonNeg(record.longestSessionSec ?? 0, 100000000)
    );
    const totalLinesCleared = clampNonNeg(record.totalLinesCleared ?? 0, 10000000);
    const bestCombo = Math.min(totalLinesCleared, clampNonNeg(record.bestCombo ?? 0, 500));
    const gamesPlayed = clampNonNeg(record.gamesPlayed ?? 0, 1000000);
    const xp = clampNonNeg(record.xp ?? 0, 5000000);
    const level = Math.max(1, Math.min(250, getLevelInfo(xp).level));
    const hasActivity = gamesPlayed >= 1 || totalLinesCleared >= 1 || totalPlaytimeSec >= 5;
    const scoreCeiling = 2500 + totalLinesCleared * 10000;
    const safeScore = hasActivity ? Math.min(clampNonNeg(record.score, 250000), scoreCeiling) : 0;

    const payload: Record<string, unknown> = {
      id: record.id,
      username: (record.username.trim() || 'Player').slice(0, 30),
      tag: record.tag ? record.tag.slice(0, 10) : null,
      score: safeScore,
      avatarLetter: (record.avatarLetter || record.username.charAt(0) || 'P').toUpperCase().slice(0, 2),
      avatarUrl: isValidAvatarUrl(record.avatarUrl) ? record.avatarUrl : null,
      tier: computeTierFromScore(safeScore),
      updatedAt: serverTimestamp(),
      xp,
      level,
      totalPlaytimeSec,
      longestSessionSec,
      gamesPlayed,
      totalLinesCleared,
      bestCombo,
      dailyStreak: Math.max(1, clampNonNeg(record.dailyStreak ?? 1, 3650, 1)),
      achievementsCount: clampNonNeg(record.achievementsCount ?? 0, 16),
      activeTheme: record.activeTheme ? record.activeTheme.slice(0, 32) : null,
    };

    await setDoc(docRef, payload, { merge: true });
    isDbOnline = true;
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `leaderboard/${record.id}`);
    return false;
  }
}

function mapDocToRecord(docId: string, data: Record<string, unknown>): FirestoreLeaderboardRecord | null {
  if (!data || typeof data.score !== 'number' || typeof data.username !== 'string') {
    return null;
  }
  return {
    id: (typeof data.id === 'string' && data.id) || docId,
    username: data.username,
    tag: typeof data.tag === 'string' && data.tag ? data.tag : undefined,
    score: data.score,
    avatarLetter:
      (typeof data.avatarLetter === 'string' && data.avatarLetter) ||
      data.username.charAt(0).toUpperCase() ||
      'P',
    avatarUrl:
      typeof data.avatarUrl === 'string' && isValidAvatarUrl(data.avatarUrl)
        ? data.avatarUrl
        : undefined,
    tier: (data.tier as FirestoreLeaderboardRecord['tier']) || computeTierFromScore(data.score),
    updatedAt: toEpochMs(data.updatedAt),
    xp: typeof data.xp === 'number' ? data.xp : undefined,
    level: typeof data.level === 'number' ? data.level : undefined,
    totalPlaytimeSec: typeof data.totalPlaytimeSec === 'number' ? data.totalPlaytimeSec : undefined,
    longestSessionSec:
      typeof data.longestSessionSec === 'number' ? data.longestSessionSec : undefined,
    gamesPlayed: typeof data.gamesPlayed === 'number' ? data.gamesPlayed : undefined,
    totalLinesCleared:
      typeof data.totalLinesCleared === 'number' ? data.totalLinesCleared : undefined,
    bestCombo: typeof data.bestCombo === 'number' ? data.bestCombo : undefined,
    dailyStreak: typeof data.dailyStreak === 'number' ? data.dailyStreak : undefined,
    achievementsCount:
      typeof data.achievementsCount === 'number' ? data.achievementsCount : undefined,
    activeTheme: typeof data.activeTheme === 'string' ? data.activeTheme : undefined,
  };
}

/**
 * Fetches the top shared records from Firestore (bounded query <= 100)
 */
export async function getLeaderboardRecordsFromFirestore(
  limitCount = 50
): Promise<FirestoreLeaderboardRecord[]> {
  if (!db) return [];
  const boundedLimit = Math.min(100, Math.max(1, Math.floor(limitCount)));
  try {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('score', 'desc'),
      limit(boundedLimit)
    );
    const snap = await getDocs(q);
    isDbOnline = true;
    const records: FirestoreLeaderboardRecord[] = [];
    snap.forEach((docItem) => {
      const mapped = mapDocToRecord(docItem.id, docItem.data() as Record<string, unknown>);
      if (mapped) records.push(mapped);
    });
    return records;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'leaderboard');
    return [];
  }
}

/**
 * Subscribes to live leaderboard updates without triggering redundant follow-up getDocs
 */
export function subscribeToLeaderboardUpdates(
  onUpdate: (records: FirestoreLeaderboardRecord[]) => void,
  limitCount = 50
): Unsubscribe {
  if (!db) return () => {};
  const boundedLimit = Math.min(100, Math.max(1, Math.floor(limitCount)));
  try {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('score', 'desc'),
      limit(boundedLimit)
    );
    return onSnapshot(
      q,
      (snap) => {
        isDbOnline = true;
        const records: FirestoreLeaderboardRecord[] = [];
        snap.forEach((docItem) => {
          const mapped = mapDocToRecord(docItem.id, docItem.data() as Record<string, unknown>);
          if (mapped) records.push(mapped);
        });
        onUpdate(records);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'leaderboard');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'leaderboard');
    return () => {};
  }
}

function mapDocToFriendship(docId: string, data: Record<string, unknown>): FriendshipRecord | null {
  if (
    !data ||
    !Array.isArray(data.users) ||
    data.users.length !== 2 ||
    typeof data.fromId !== 'string' ||
    typeof data.toId !== 'string' ||
    typeof data.status !== 'string'
  ) {
    return null;
  }
  return {
    id: (typeof data.id === 'string' && data.id) || docId,
    users: [String(data.users[0]), String(data.users[1])],
    fromId: data.fromId,
    toId: data.toId,
    fromUsername: typeof data.fromUsername === 'string' ? data.fromUsername : 'Player',
    toUsername: typeof data.toUsername === 'string' ? data.toUsername : 'Player',
    status: data.status as FriendshipStatus,
    createdAt: toEpochMs(data.createdAt),
    updatedAt: toEpochMs(data.updatedAt),
  };
}

export async function fetchFriendshipsFromFirestore(playerId: string): Promise<FriendshipRecord[]> {
  if (!db || !playerId || auth?.currentUser?.uid !== playerId) return [];
  try {
    const q = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', playerId),
      limit(100)
    );
    const snap = await getDocs(q);
    const list: FriendshipRecord[] = [];
    snap.forEach((d) => {
      const mapped = mapDocToFriendship(d.id, d.data() as Record<string, unknown>);
      if (mapped) list.push(mapped);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'friendships');
    return [];
  }
}

export function subscribeToFriendships(
  playerId: string,
  onUpdate: (friendships: FriendshipRecord[]) => void
): Unsubscribe {
  if (!db || !playerId || auth?.currentUser?.uid !== playerId) return () => {};
  try {
    const q = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', playerId),
      limit(100)
    );
    return onSnapshot(
      q,
      (snap) => {
        const list: FriendshipRecord[] = [];
        snap.forEach((d) => {
          const mapped = mapDocToFriendship(d.id, d.data() as Record<string, unknown>);
          if (mapped) list.push(mapped);
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'friendships');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'friendships');
    return () => {};
  }
}

export async function sendFriendRequestFirestore(
  fromId: string,
  fromUsername: string,
  toId: string,
  toUsername: string
): Promise<boolean> {
  if (!db || !fromId || !toId || fromId === toId) return false;
  if (auth?.currentUser?.uid !== fromId) return false;

  const friendshipId = getFriendshipDocId(fromId, toId);
  const docRef = doc(db, 'friendships', friendshipId);
  const safeFrom = (fromUsername.trim() || 'Player').slice(0, 30);
  const safeTo = (toUsername.trim() || 'Player').slice(0, 30);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const existing = snap.data() as Record<string, unknown>;
      if (existing.status === 'accepted') return true;

      if (existing.fromId === fromId && existing.status === 'declined') {
        await updateDoc(docRef, {
          status: 'pending',
          fromUsername: safeFrom,
          toUsername: safeTo,
          updatedAt: serverTimestamp(),
        });
        return true;
      }

      if (existing.status === 'pending' && existing.toId === fromId) {
        await updateDoc(docRef, {
          status: 'accepted',
          updatedAt: serverTimestamp(),
        });
        return true;
      }

      if (existing.status === 'pending' && existing.fromId === fromId) {
        return true;
      }

      await deleteDoc(docRef);
    }

    const sortedUsers = [fromId, toId].sort() as [string, string];
    await setDoc(docRef, {
      id: friendshipId,
      users: sortedUsers,
      fromId,
      toId,
      fromUsername: safeFrom,
      toUsername: safeTo,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `friendships/${friendshipId}`);
    return false;
  }
}

export async function respondToFriendRequestFirestore(
  friendshipId: string,
  status: 'accepted' | 'declined'
): Promise<boolean> {
  if (!db || !friendshipId || !auth?.currentUser) return false;
  const docRef = doc(db, 'friendships', friendshipId);
  try {
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `friendships/${friendshipId}`);
    return false;
  }
}

export async function removeFriendshipFirestore(friendshipId: string): Promise<boolean> {
  if (!db || !friendshipId || !auth?.currentUser) return false;
  const docRef = doc(db, 'friendships', friendshipId);
  try {
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `friendships/${friendshipId}`);
    return false;
  }
}
