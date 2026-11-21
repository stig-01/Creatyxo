/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FriendshipRecord,
  isFirestoreOnline,
  fetchFriendshipsFromFirestore,
  subscribeToFriendships,
  sendFriendRequestFirestore,
  respondToFriendRequestFirestore,
  removeFriendshipFirestore,
  getFriendshipDocId,
  getCurrentAuthUser,
} from './firebase';

export type { FriendshipRecord };
export { getFriendshipDocId };

export async function loadFriendships(playerId: string): Promise<FriendshipRecord[]> {
  if (!playerId || getCurrentAuthUser()?.uid !== playerId) return [];
  if (!isFirestoreOnline()) return [];
  return fetchFriendshipsFromFirestore(playerId);
}

export function listenToFriendships(
  playerId: string,
  onUpdate: (friendships: FriendshipRecord[]) => void
): () => void {
  if (!playerId || getCurrentAuthUser()?.uid !== playerId) {
    onUpdate([]);
    return () => {};
  }
  return subscribeToFriendships(playerId, onUpdate);
}

export async function sendFriendRequest(
  fromId: string,
  fromUsername: string,
  toId: string,
  toUsername: string
): Promise<boolean> {
  if (!fromId || !toId || fromId === toId) return false;
  if (getCurrentAuthUser()?.uid !== fromId) return false;
  return sendFriendRequestFirestore(fromId, fromUsername, toId, toUsername);
}

export async function respondToFriendRequest(
  friendshipId: string,
  status: 'accepted' | 'declined'
): Promise<boolean> {
  if (!friendshipId || !getCurrentAuthUser()) return false;
  return respondToFriendRequestFirestore(friendshipId, status);
}

export async function removeFriendship(friendshipId: string): Promise<boolean> {
  if (!friendshipId || !getCurrentAuthUser()) return false;
  return removeFriendshipFirestore(friendshipId);
}
