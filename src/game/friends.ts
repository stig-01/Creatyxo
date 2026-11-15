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
} from './firebase';

export type { FriendshipRecord };
export { getFriendshipDocId };

function isStaticHost(): boolean {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname.toLowerCase();
  return (
    host.includes('github.io') ||
    host.includes('gitlab.io') ||
    host.includes('pages.dev') ||
    host.includes('surge.sh') ||
    window.location.protocol === 'file:'
  );
}

export async function loadFriendships(playerId: string): Promise<FriendshipRecord[]> {
  if (!playerId) return [];
  if (isFirestoreOnline()) {
    const docs = await fetchFriendshipsFromFirestore(playerId);
    if (docs.length > 0 || isStaticHost()) {
      return docs;
    }
  }
  if (!isStaticHost()) {
    try {
      const res = await fetch(`/api/friends/${encodeURIComponent(playerId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.friendships)) return data.friendships;
      }
    } catch {
      // fallback empty
    }
  }
  return [];
}

export function listenToFriendships(
  playerId: string,
  onUpdate: (friendships: FriendshipRecord[]) => void
): () => void {
  if (!playerId) return () => {};
  return subscribeToFriendships(playerId, onUpdate);
}

export async function sendFriendRequest(
  fromId: string,
  fromUsername: string,
  toId: string,
  toUsername: string
): Promise<boolean> {
  if (!fromId || !toId || fromId === toId) return false;
  let ok = await sendFriendRequestFirestore(fromId, fromUsername, toId, toUsername);
  if (!isStaticHost()) {
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId, fromUsername, toId, toUsername }),
      });
      if (res.ok) ok = true;
    } catch {
      // ignore
    }
  }
  return ok;
}

export async function respondToFriendRequest(
  friendshipId: string,
  status: 'accepted' | 'declined'
): Promise<boolean> {
  if (!friendshipId) return false;
  let ok = await respondToFriendRequestFirestore(friendshipId, status);
  if (!isStaticHost()) {
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, status }),
      });
      if (res.ok) ok = true;
    } catch {
      // ignore
    }
  }
  return ok;
}

export async function removeFriendship(friendshipId: string): Promise<boolean> {
  if (!friendshipId) return false;
  let ok = await removeFriendshipFirestore(friendshipId);
  if (!isStaticHost()) {
    try {
      const res = await fetch(`/api/friends/${encodeURIComponent(friendshipId)}`, {
        method: 'DELETE',
      });
      if (res.ok) ok = true;
    } catch {
      // ignore
    }
  }
  return ok;
}
