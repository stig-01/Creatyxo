/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Persistent Leaderboard Storage File
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'leaderboard.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface StoredRecord {
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

export interface StoredFriendship {
  id: string;
  users: [string, string];
  fromId: string;
  toId: string;
  fromUsername: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
  updatedAt: number;
}

const FRIENDS_FILE = path.join(DATA_DIR, 'friends.json');

function getTierFromScore(score: number): StoredRecord['tier'] {
  if (score >= 15000) return 'Grandmaster';
  if (score >= 10000) return 'Master';
  if (score >= 6000) return 'Diamond';
  if (score >= 3500) return 'Platinum';
  if (score >= 2000) return 'Gold';
  if (score >= 800) return 'Silver';
  return 'Bronze';
}

function loadRecords(): StoredRecord[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading leaderboard file:', err);
  }
  return [];
}

function saveRecords(records: StoredRecord[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving leaderboard file:', err);
  }
}

// 1. GET Global Shared Leaderboard
app.get('/api/leaderboard', (_req, res) => {
  const records = loadRecords();
  records.sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt);

  const ranked = records.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  res.json({
    success: true,
    entries: ranked,
    totalPlayers: ranked.length,
    timestamp: Date.now(),
  });
});

// 2. POST Submit / Update Player Record
app.post('/api/leaderboard/submit', (req, res) => {
  const {
    id,
    username,
    tag,
    score,
    avatarLetter,
    avatarUrl,
    xp,
    level,
    totalPlaytimeSec,
    longestSessionSec,
    gamesPlayed,
    totalLinesCleared,
    bestCombo,
    dailyStreak,
    achievementsCount,
    activeTheme,
  } = req.body;
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  const safeUsername = username.trim().slice(0, 24) || 'Player';
  const safeScore = Math.max(0, parseInt(String(score), 10) || 0);
  const safeTag = tag ? String(tag).trim().slice(0, 8) : undefined;
  const safeLetter = (avatarLetter || safeUsername.charAt(0) || 'P').toUpperCase().slice(0, 1);
  const safeAvatarUrl =
    typeof avatarUrl === 'string' && avatarUrl.length <= 24000 && avatarUrl.startsWith('data:image/')
      ? avatarUrl
      : undefined;
  const playerId = id ? String(id).trim() : `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const toNum = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : undefined;

  const records = loadRecords();
  const existingIdx = records.findIndex((r) => r.id === playerId);
  const now = Date.now();

  if (existingIdx >= 0) {
    const existing = records[existingIdx];
    const bestScore = Math.max(existing.score, safeScore);
    records[existingIdx] = {
      ...existing,
      username: safeUsername,
      tag: safeTag || existing.tag,
      avatarLetter: safeLetter,
      avatarUrl: safeAvatarUrl !== undefined ? safeAvatarUrl : existing.avatarUrl,
      score: bestScore,
      tier: getTierFromScore(bestScore),
      updatedAt: now,
      xp: toNum(xp) ?? existing.xp,
      level: toNum(level) ?? existing.level,
      totalPlaytimeSec: toNum(totalPlaytimeSec) ?? existing.totalPlaytimeSec,
      longestSessionSec: toNum(longestSessionSec) ?? existing.longestSessionSec,
      gamesPlayed: toNum(gamesPlayed) ?? existing.gamesPlayed,
      totalLinesCleared: toNum(totalLinesCleared) ?? existing.totalLinesCleared,
      bestCombo: toNum(bestCombo) ?? existing.bestCombo,
      dailyStreak: toNum(dailyStreak) ?? existing.dailyStreak,
      achievementsCount: toNum(achievementsCount) ?? existing.achievementsCount,
      activeTheme: typeof activeTheme === 'string' ? activeTheme.slice(0, 32) : existing.activeTheme,
    };
  } else {
    records.push({
      id: playerId,
      username: safeUsername,
      tag: safeTag,
      score: safeScore,
      avatarLetter: safeLetter,
      avatarUrl: safeAvatarUrl,
      tier: getTierFromScore(safeScore),
      updatedAt: now,
      xp: toNum(xp),
      level: toNum(level),
      totalPlaytimeSec: toNum(totalPlaytimeSec),
      longestSessionSec: toNum(longestSessionSec),
      gamesPlayed: toNum(gamesPlayed),
      totalLinesCleared: toNum(totalLinesCleared),
      bestCombo: toNum(bestCombo),
      dailyStreak: toNum(dailyStreak),
      achievementsCount: toNum(achievementsCount),
      activeTheme: typeof activeTheme === 'string' ? activeTheme.slice(0, 32) : undefined,
    });
  }

  saveRecords(records);

  // Recalculate rank
  records.sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt);
  const rank = records.findIndex((r) => r.id === playerId) + 1;

  res.json({
    success: true,
    playerId,
    rank,
    totalPlayers: records.length,
    entry: records[rank - 1],
  });
});

// 3. POST Rename Player Account
app.post('/api/player/rename', (req, res) => {
  const { id, username, tag, avatarLetter } = req.body;
  if (!id || !username) {
    return res.status(400).json({ error: 'id and username are required' });
  }

  const safeUsername = String(username).trim().slice(0, 24);
  const safeLetter = (avatarLetter || safeUsername.charAt(0) || 'P').toUpperCase().slice(0, 1);
  const safeTag = tag ? String(tag).trim().slice(0, 8) : undefined;

  const records = loadRecords();
  const existing = records.find((r) => r.id === id);

  if (existing) {
    existing.username = safeUsername;
    existing.avatarLetter = safeLetter;
    if (safeTag !== undefined) {
      existing.tag = safeTag;
    }
    existing.updatedAt = Date.now();
    saveRecords(records);
  }

  res.json({
    success: true,
    entry: existing || null,
  });
});

function loadFriends(): StoredFriendship[] {
  try {
    if (fs.existsSync(FRIENDS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveFriends(list: StoredFriendship[]) {
  try {
    fs.writeFileSync(FRIENDS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

app.get('/api/friends/:playerId', (req, res) => {
  const playerId = String(req.params.playerId || '').trim();
  const list = loadFriends().filter((f) => f.users.includes(playerId));
  res.json({ success: true, friendships: list });
});

app.post('/api/friends/request', (req, res) => {
  const { fromId, fromUsername, toId, toUsername } = req.body || {};
  if (!fromId || !toId || fromId === toId) {
    return res.status(400).json({ error: 'Valid fromId and toId are required' });
  }
  const sorted = [String(fromId), String(toId)].sort() as [string, string];
  const friendshipId = `${sorted[0]}__${sorted[1]}`;
  const list = loadFriends();
  const now = Date.now();
  const idx = list.findIndex((f) => f.id === friendshipId);
  if (idx >= 0) {
    const existing = list[idx];
    if (existing.status === 'pending' && existing.toId === fromId) {
      existing.status = 'accepted';
      existing.updatedAt = now;
    } else if (existing.status !== 'accepted') {
      existing.fromId = String(fromId);
      existing.toId = String(toId);
      existing.fromUsername = String(fromUsername || 'Player').slice(0, 30);
      existing.toUsername = String(toUsername || 'Player').slice(0, 30);
      existing.status = 'pending';
      existing.updatedAt = now;
    }
  } else {
    list.push({
      id: friendshipId,
      users: sorted,
      fromId: String(fromId),
      toId: String(toId),
      fromUsername: String(fromUsername || 'Player').slice(0, 30),
      toUsername: String(toUsername || 'Player').slice(0, 30),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }
  saveFriends(list);
  res.json({ success: true });
});

app.post('/api/friends/respond', (req, res) => {
  const { friendshipId, status } = req.body || {};
  if (!friendshipId || (status !== 'accepted' && status !== 'declined')) {
    return res.status(400).json({ error: 'Valid friendshipId and status required' });
  }
  const list = loadFriends();
  const existing = list.find((f) => f.id === friendshipId);
  if (existing) {
    existing.status = status;
    existing.updatedAt = Date.now();
    saveFriends(list);
  }
  res.json({ success: true });
});

app.delete('/api/friends/:friendshipId', (req, res) => {
  const id = String(req.params.friendshipId || '');
  const list = loadFriends().filter((f) => f.id !== id);
  saveFriends(list);
  res.json({ success: true });
});

// 4. Vite Middlewares (Dev) or Static Serv (Prod)
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Creatyxo shared server running on port ${PORT}`);
  });
}

startServer();
