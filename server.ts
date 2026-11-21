/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyGameRun, type RecordedGameRun } from './src/game/runVerifier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '512kb' }));

// Health check: confirms Firebase Auth + Cloud Firestore is the single authoritative database
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    authoritativeBackend: 'firebase',
    timestamp: Date.now(),
  });
});

// Stateless deterministic move-log verification endpoint
app.post('/api/runs/verify', (req, res) => {
  const payload = req.body as RecordedGameRun | undefined;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({
      valid: false,
      reason: 'Missing run replay payload.',
    });
  }

  const result = verifyGameRun(payload);
  if (!result.valid) {
    return res.status(422).json(result);
  }

  return res.json(result);
});

// Reject legacy split-brain JSON routes cleanly
app.all('/api/leaderboard*', (_req, res) => {
  res.status(410).json({
    error: 'Legacy Express leaderboard storage is retired. Firebase Firestore is authoritative.',
  });
});

app.all('/api/friends*', (_req, res) => {
  res.status(410).json({
    error: 'Legacy Express friendship storage is retired. Firebase Firestore is authoritative.',
  });
});

app.all('/api/player/*', (_req, res) => {
  res.status(410).json({
    error: 'Legacy Express player storage is retired. Firebase Firestore is authoritative.',
  });
});

// Vite Middlewares (Dev) or Static Serv (Prod)
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
    console.log(`Creatyxo server running on port ${PORT} (authoritative backend: Firebase)`);
  });
}

startServer();
