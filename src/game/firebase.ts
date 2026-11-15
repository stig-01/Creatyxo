/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
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
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: true,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.warn('Firestore notice:', JSON.stringify(errInfo));
}

const config = getFirebaseConfig();

let app: FirebaseApp | null = null;
export let db: Firestore | null = null;
let isDbOnline = true;

if (config && config.apiKey && config.projectId) {
  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    db = config.firestoreDatabaseId
      ? getFirestore(app, config.firestoreDatabaseId)
      : getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
  }
}

export function isFirestoreOnline(): boolean {
  return db !== null && isDbOnline;
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

/**
 * Validates Firestore connectivity on initial load
 */
export async function testFirestoreConnection(): Promise<boolean> {
  if (!db) {
    isDbOnline = false;
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'leaderboard', 'ping'));
    isDbOnline = true;
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently running offline.');
      isDbOnline = false;
    } else {
      isDbOnline = true;
    }
    return isDbOnline;
  }
}

function clampNonNeg(val: unknown, max: number, fallback = 0): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(0, Math.min(max, Math.floor(val)));
}

/**
 * Saves a player record and public stats to Firestore
 */
export async function savePlayerRecordToFirestore(
  record: FirestoreLeaderboardRecord
): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, 'leaderboard', record.id);
    const payload: Record<string, unknown> = {
      id: record.id,
      username: record.username.slice(0, 30),
      tag: record.tag ? record.tag.slice(0, 10) : null,
      score: clampNonNeg(record.score, 10000000),
      avatarLetter: record.avatarLetter.slice(0, 2) || 'P',
      avatarUrl: isValidAvatarUrl(record.avatarUrl) ? record.avatarUrl : null,
      tier: record.tier,
      updatedAt: clampNonNeg(record.updatedAt || Date.now(), Number.MAX_SAFE_INTEGER),
    };

    if (record.xp !== undefined) payload.xp = clampNonNeg(record.xp, 100000000);
    if (record.level !== undefined) payload.level = Math.max(1, clampNonNeg(record.level, 1000, 1));
    if (record.totalPlaytimeSec !== undefined)
      payload.totalPlaytimeSec = clampNonNeg(record.totalPlaytimeSec, 100000000);
    if (record.longestSessionSec !== undefined)
      payload.longestSessionSec = clampNonNeg(record.longestSessionSec, 10000000);
    if (record.gamesPlayed !== undefined)
      payload.gamesPlayed = clampNonNeg(record.gamesPlayed, 1000000);
    if (record.totalLinesCleared !== undefined)
      payload.totalLinesCleared = clampNonNeg(record.totalLinesCleared, 10000000);
    if (record.bestCombo !== undefined) payload.bestCombo = clampNonNeg(record.bestCombo, 1000);
    if (record.dailyStreak !== undefined)
      payload.dailyStreak = clampNonNeg(record.dailyStreak, 10000);
    if (record.achievementsCount !== undefined)
      payload.achievementsCount = clampNonNeg(record.achievementsCount, 100);
    if (record.activeTheme !== undefined)
      payload.activeTheme = record.activeTheme ? record.activeTheme.slice(0, 32) : null;

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
    tier: (data.tier as FirestoreLeaderboardRecord['tier']) || 'Bronze',
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
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
 * Fetches the top shared records from Firestore
 */
export async function getLeaderboardRecordsFromFirestore(
  limitCount = 100
): Promise<FirestoreLeaderboardRecord[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('score', 'desc'),
      limit(limitCount)
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
 * Subscribes to live leaderboard updates
 */
export function subscribeToLeaderboardUpdates(
  onUpdate: (records: FirestoreLeaderboardRecord[]) => void,
  limitCount = 100
): Unsubscribe {
  if (!db) return () => {};
  try {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('score', 'desc'),
      limit(limitCount)
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
        handleFirestoreError(error, OperationType.GET, 'leaderboard');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'leaderboard');
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
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
  };
}

export async function fetchFriendshipsFromFirestore(playerId: string): Promise<FriendshipRecord[]> {
  if (!db || !playerId) return [];
  try {
    const q = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', playerId)
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
  if (!db || !playerId) return () => {};
  try {
    const q = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', playerId)
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
        handleFirestoreError(error, OperationType.GET, 'friendships');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'friendships');
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
  const friendshipId = getFriendshipDocId(fromId, toId);
  const docRef = doc(db, 'friendships', friendshipId);
  const now = Date.now();
  const safeFrom = (fromUsername.trim() || 'Player').slice(0, 30);
  const safeTo = (toUsername.trim() || 'Player').slice(0, 30);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const existing = snap.data() as FriendshipRecord;
      if (existing.status === 'accepted') return true;
      // If previously declined or pending from the other side, update cleanly
      if (existing.fromId === fromId) {
        await updateDoc(docRef, {
          status: 'pending',
          fromUsername: safeFrom,
          toUsername: safeTo,
          updatedAt: now,
        });
        return true;
      }
      // Other user had sent a request to us -> accept mutually!
      if (existing.status === 'pending' && existing.toId === fromId) {
        await updateDoc(docRef, {
          status: 'accepted',
          updatedAt: now,
        });
        return true;
      }
      // Replace declined old record
      await deleteDoc(docRef);
    }

    const sortedUsers = [fromId, toId].sort() as [string, string];
    const payload: FriendshipRecord = {
      id: friendshipId,
      users: sortedUsers,
      fromId,
      toId,
      fromUsername: safeFrom,
      toUsername: safeTo,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, payload);
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
  if (!db || !friendshipId) return false;
  const docRef = doc(db, 'friendships', friendshipId);
  try {
    await updateDoc(docRef, {
      status,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `friendships/${friendshipId}`);
    return false;
  }
}

export async function removeFriendshipFirestore(friendshipId: string): Promise<boolean> {
  if (!db || !friendshipId) return false;
  const docRef = doc(db, 'friendships', friendshipId);
  try {
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `friendships/${friendshipId}`);
    return false;
  }
}
