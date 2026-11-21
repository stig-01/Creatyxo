/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlockColor, DifficultyModeId, GridState, PieceShape } from './types';
import {
  STANDARD_SHAPES,
  HELPER_SHAPES,
  SAVIOR_SHAPES,
  createEmptyGrid,
  getDifficultyConfig,
  rotateMatrix,
  flipMatrixHorizontal,
  canPlacePiece,
} from './shapes';

export interface RecordedShape {
  name: string;
  color: BlockColor;
  matrix: number[][];
}

export interface RecordedMove {
  trayIndex: number;
  row: number;
  col: number;
  dtMs: number;
  spawnedTray?: RecordedShape[];
}

export interface RecordedGameRun {
  runId: string;
  mode: DifficultyModeId;
  startedAt: number;
  endedAt?: number;
  claimedScore?: number;
  initialTray: RecordedShape[];
  moves: RecordedMove[];
}

export interface VerifiedRunSummary {
  runId: string;
  mode: DifficultyModeId;
  verifiedScore: number;
  totalLinesCleared: number;
  totalBlocksPlaced: number;
  maxCombo: number;
  bestSingleMoveLines: number;
  totalMoves: number;
  totalXpEarned: number;
  durationMs: number;
}

export interface RunVerificationResult {
  valid: boolean;
  reason?: string;
  summary: VerifiedRunSummary;
}

const VALID_COLORS = new Set<BlockColor>([
  'orange',
  'cyan',
  'rose',
  'green',
  'purple',
  'gold',
  'blue',
]);

const MIN_HUMAN_MOVE_MS = 45;
const MAX_VERIFIED_SCORE = 250000;
const MAX_MOVES_PER_RUN = 6000;

export function serializeShape(piece: Pick<PieceShape, 'name' | 'color' | 'matrix'>): RecordedShape {
  return {
    name: String(piece.name || 'Piece').slice(0, 32),
    color: piece.color,
    matrix: piece.matrix.map((row) => row.map((cell) => (cell === 1 ? 1 : 0))),
  };
}

function matrixSignature(matrix: number[][]): string {
  return matrix.map((row) => row.map((v) => (v === 1 ? '1' : '0')).join('')).join('/');
}

function countMatrixCells(matrix: number[][]): number {
  let count = 0;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === 1) count++;
    }
  }
  return count;
}

function buildAllowedSignatureSet(mode: DifficultyModeId): Set<string> {
  const config = getDifficultyConfig(mode);
  const templates = [...STANDARD_SHAPES, ...HELPER_SHAPES, ...SAVIOR_SHAPES];
  const signatures = new Set<string>();

  for (const template of templates) {
    const rows = template.matrix.length;
    const cols = template.matrix[0]?.length || 0;
    const maxDim = Math.max(rows, cols);
    const cells = countMatrixCells(template.matrix);

    if (maxDim > Math.min(config.maxPieceDim, config.boardSize)) continue;
    if (cells > config.maxPieceCells) continue;

    for (let rot = 0; rot < 4; rot++) {
      const rotated = rotateMatrix(template.matrix, rot);
      signatures.add(matrixSignature(rotated));
      signatures.add(matrixSignature(flipMatrixHorizontal(rotated)));
    }
  }

  return signatures;
}

const MODE_SIGNATURE_CACHE: Partial<Record<DifficultyModeId, Set<string>>> = {};

function getAllowedSignatures(mode: DifficultyModeId): Set<string> {
  if (!MODE_SIGNATURE_CACHE[mode]) {
    MODE_SIGNATURE_CACHE[mode] = buildAllowedSignatureSet(mode);
  }
  return MODE_SIGNATURE_CACHE[mode]!;
}

function isAuthenticShape(shape: unknown, allowedSignatures: Set<string>): shape is RecordedShape {
  if (!shape || typeof shape !== 'object') return false;
  const candidate = shape as RecordedShape;
  if (!VALID_COLORS.has(candidate.color)) return false;
  if (!Array.isArray(candidate.matrix) || candidate.matrix.length === 0 || candidate.matrix.length > 5) {
    return false;
  }
  const width = candidate.matrix[0]?.length || 0;
  if (width === 0 || width > 5) return false;

  for (const row of candidate.matrix) {
    if (!Array.isArray(row) || row.length !== width) return false;
    for (const cell of row) {
      if (cell !== 0 && cell !== 1) return false;
    }
  }

  return allowedSignatures.has(matrixSignature(candidate.matrix));
}

/**
 * Replays a recorded run deterministically from an empty board, checking:
 * - Piece geometry belongs to the official game catalog for the difficulty mode
 * - Every move is legal and non-overlapping
 * - Tray refills happen strictly when all 3 slots are emptied
 * - Inter-move timing is plausible for human input
 * - Final score matches official scoring and combo multiplier math
 */
export function verifyGameRun(run: RecordedGameRun): RunVerificationResult {
  const emptySummary: VerifiedRunSummary = {
    runId: String(run?.runId || ''),
    mode: run?.mode || 'classic',
    verifiedScore: 0,
    totalLinesCleared: 0,
    totalBlocksPlaced: 0,
    maxCombo: 0,
    bestSingleMoveLines: 0,
    totalMoves: 0,
    totalXpEarned: 0,
    durationMs: 0,
  };

  if (!run || typeof run !== 'object') {
    return { valid: false, reason: 'Invalid run payload.', summary: emptySummary };
  }

  const mode = run.mode;
  if (!mode || !['easy', 'classic', 'hard', 'extreme'].includes(mode)) {
    return { valid: false, reason: 'Unsupported difficulty mode.', summary: emptySummary };
  }

  const config = getDifficultyConfig(mode);
  const allowedSignatures = getAllowedSignatures(mode);

  if (!Array.isArray(run.initialTray) || run.initialTray.length !== 3) {
    return { valid: false, reason: 'Initial tray must contain 3 pieces.', summary: emptySummary };
  }
  for (const piece of run.initialTray) {
    if (!isAuthenticShape(piece, allowedSignatures)) {
      return { valid: false, reason: 'Initial tray contains an unrecognized piece.', summary: emptySummary };
    }
  }

  if (!Array.isArray(run.moves) || run.moves.length > MAX_MOVES_PER_RUN) {
    return { valid: false, reason: 'Move log is missing or exceeds maximum length.', summary: emptySummary };
  }

  if (run.moves.length === 0) {
    return {
      valid: true,
      summary: { ...emptySummary, runId: run.runId, mode },
    };
  }

  const grid: GridState = createEmptyGrid(config.boardSize);
  let tray: (PieceShape | null)[] = run.initialTray.map((s, idx) => ({
    id: `init-${idx}`,
    name: s.name,
    color: s.color,
    matrix: s.matrix,
  }));

  let verifiedScore = 0;
  let totalLinesCleared = 0;
  let totalBlocksPlaced = 0;
  let combo = 0;
  let maxCombo = 0;
  let bestSingleMoveLines = 0;
  let totalXpEarned = 0;
  let durationMs = 0;

  for (let i = 0; i < run.moves.length; i++) {
    const move = run.moves[i];
    if (!move || typeof move !== 'object') {
      return { valid: false, reason: `Malformed move at index ${i}.`, summary: emptySummary };
    }

    if (typeof move.trayIndex !== 'number' || !Number.isInteger(move.trayIndex) || move.trayIndex < 0 || move.trayIndex > 2) {
      return { valid: false, reason: `Invalid tray index at move ${i}.`, summary: emptySummary };
    }

    if (typeof move.row !== 'number' || !Number.isInteger(move.row) || typeof move.col !== 'number' || !Number.isInteger(move.col)) {
      return { valid: false, reason: `Invalid grid coordinates at move ${i}.`, summary: emptySummary };
    }

    if (typeof move.dtMs !== 'number' || !Number.isFinite(move.dtMs) || move.dtMs < MIN_HUMAN_MOVE_MS) {
      return { valid: false, reason: `Implausible input cadence detected at move ${i}.`, summary: emptySummary };
    }
    durationMs += Math.min(move.dtMs, 3600000);

    const piece = tray[move.trayIndex];
    if (!piece) {
      return { valid: false, reason: `Tray slot ${move.trayIndex} is empty at move ${i}.`, summary: emptySummary };
    }

    if (!canPlacePiece(grid, piece, move.row, move.col)) {
      return { valid: false, reason: `Illegal block placement at move ${i}.`, summary: emptySummary };
    }

    let placedBlockCount = 0;
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[0].length; c++) {
        if (piece.matrix[r][c] === 1) {
          grid[move.row + r][move.col + c] = piece.color;
          placedBlockCount++;
        }
      }
    }
    totalBlocksPlaced += placedBlockCount;
    tray[move.trayIndex] = null;

    const rowsToClear: number[] = [];
    for (let r = 0; r < config.boardSize; r++) {
      if (grid[r].every((cell) => cell !== null)) {
        rowsToClear.push(r);
      }
    }

    const colsToClear: number[] = [];
    for (let c = 0; c < config.boardSize; c++) {
      let full = true;
      for (let r = 0; r < config.boardSize; r++) {
        if (grid[r][c] === null) {
          full = false;
          break;
        }
      }
      if (full) colsToClear.push(c);
    }

    const linesCleared = rowsToClear.length + colsToClear.length;
    const basePoints = placedBlockCount * 10;

    if (linesCleared > 0) {
      for (const r of rowsToClear) {
        for (let c = 0; c < config.boardSize; c++) grid[r][c] = null;
      }
      for (const c of colsToClear) {
        for (let r = 0; r < config.boardSize; r++) grid[r][c] = null;
      }

      combo += 1;
      maxCombo = Math.max(maxCombo, combo);
      bestSingleMoveLines = Math.max(bestSingleMoveLines, linesCleared);
      totalLinesCleared += linesCleared;

      const comboMultiplier = 1 + Math.max(0, combo - 1) * 0.5;
      let baseLinePoints = 150;
      if (linesCleared === 2) baseLinePoints = 450;
      else if (linesCleared === 3) baseLinePoints = 900;
      else if (linesCleared >= 4) baseLinePoints = 1600;

      const clearScore = Math.round(baseLinePoints * comboMultiplier);
      verifiedScore += basePoints + clearScore;
      totalXpEarned += placedBlockCount * 2 + linesCleared * 20 + (combo > 1 ? combo * 12 : 0);
    } else {
      combo = 0;
      verifiedScore += basePoints;
      totalXpEarned += placedBlockCount * 2;
    }

    if (verifiedScore > MAX_VERIFIED_SCORE) {
      return { valid: false, reason: 'Score exceeds maximum supported cap.', summary: emptySummary };
    }

    const remainingCount = tray.filter((p) => p !== null).length;
    if (remainingCount === 0) {
      if (move.spawnedTray) {
        if (!Array.isArray(move.spawnedTray) || move.spawnedTray.length !== 3) {
          return { valid: false, reason: `Invalid tray refill at move ${i}.`, summary: emptySummary };
        }
        for (const nextPiece of move.spawnedTray) {
          if (!isAuthenticShape(nextPiece, allowedSignatures)) {
            return { valid: false, reason: `Unrecognized refill piece at move ${i}.`, summary: emptySummary };
          }
        }
        tray = move.spawnedTray.map((s, idx) => ({
          id: `refill-${i}-${idx}`,
          name: s.name,
          color: s.color,
          matrix: s.matrix,
        }));
      } else if (i < run.moves.length - 1) {
        return { valid: false, reason: `Missing tray refill after move ${i}.`, summary: emptySummary };
      }
    } else if (move.spawnedTray) {
      return { valid: false, reason: `Unexpected mid-tray refill at move ${i}.`, summary: emptySummary };
    }
  }

  const summary: VerifiedRunSummary = {
    runId: String(run.runId || ''),
    mode,
    verifiedScore,
    totalLinesCleared,
    totalBlocksPlaced,
    maxCombo,
    bestSingleMoveLines,
    totalMoves: run.moves.length,
    totalXpEarned,
    durationMs,
  };

  if (
    typeof run.claimedScore === 'number' &&
    Math.floor(run.claimedScore) !== verifiedScore
  ) {
    return {
      valid: false,
      reason: `Claimed score (${run.claimedScore}) does not match verified replay (${verifiedScore}).`,
      summary,
    };
  }

  return { valid: true, summary };
}
