/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlockColor, DifficultyConfig, DifficultyModeId, GridState, PieceShape } from './types';

// Visual themes for the glossy 3D blocks matching the screenshot
export const COLOR_THEMES: Record<
  BlockColor,
  {
    solid: string;
    border: string;
    preview: string;
    shadow: string;
  }
> = {
  orange: {
    solid: 'bg-gradient-to-b from-[#ffb03a] via-[#f97316] to-[#c2410c]',
    border: 'border-[#fdba74]/50',
    preview: 'bg-[#f97316]/75 border-[#ffedd5]/80 shadow-[0_0_12px_rgba(249,115,22,0.8)]',
    shadow: 'shadow-[inset_0_2px_1px_rgba(255,255,255,0.45),inset_0_-2px_2px_rgba(0,0,0,0.45)]',
  },
  cyan: {
    solid: 'bg-gradient-to-b from-[#38e8dd] via-[#0ea5e9] to-[#0369a1]',
    border: 'border-[#7dd3fc]/50',
    preview: 'bg-[#00d2ff]/75 border-[#e0f2fe]/80 shadow-[0_0_12px_rgba(56,232,221,0.8)]',
    shadow: 'shadow-[inset_0_2px_1px_rgba(255,255,255,0.45),inset_0_-2px_2px_rgba(0,0,0,0.45)]',
  },
  rose: {
    solid: 'bg-gradient-to-b from-[#fb7185] via-[#e11d48] to-[#9f1239]',
    border: 'border-[#fda4af]/50',
    preview: 'bg-[#f43f5e]/75 border-[#ffe4e6]/80 shadow-[0_0_12px_rgba(244,63,94,0.8)]',
    shadow: 'shadow-[inset_0_2px_1px_rgba(255,255,255,0.45),inset_0_-2px_2px_rgba(0,0,0,0.45)]',
  },
  green: {
    solid: 'bg-gradient-to-b from-[#4ade80] via-[#16a34a] to-[#14532d]',
    border: 'border-[#86efac]/50',
    preview: 'bg-[#22c55e]/75 border-[#dcfce7]/80 shadow-[0_0_12px_rgba(34,197,94,0.8)]',
    shadow: 'shadow-[inset_0_2px_1px_rgba(255,255,255,0.45),inset_0_-2px_2px_rgba(0,0,0,0.45)]',
  },
  purple: {
    solid: 'bg-gradient-to-b from-[#c084fc] via-[#9333ea] to-[#581c87]',
    border: 'border-[#d8b4fe]/50',
    preview: 'bg-[#a855f7]/75 border-[#f3e8ff]/80 shadow-[0_0_12px_rgba(168,85,247,0.8)]',
    shadow: 'shadow-[inset_0_2px_1px_rgba(255,255,255,0.45),inset_0_-2px_2px_rgba(0,0,0,0.45)]',
  },
  gold: {
    solid: 'bg-gradient-to-b from-[#fde047] via-[#eab308] to-[#854d0e]',
    border: 'border-[#fef08a]/50',
    preview: 'bg-[#eab308]/75 border-[#fef9c3]/80 shadow-[0_0_12px_rgba(234,179,8,0.8)]',
    shadow: 'shadow-[inset_0_2px_1px_rgba(255,255,255,0.45),inset_0_-2px_2px_rgba(0,0,0,0.45)]',
  },
  blue: {
    solid: 'bg-gradient-to-b from-[#60a5fa] via-[#2563eb] to-[#1e3a8a]',
    border: 'border-[#93c5fd]/50',
    preview: 'bg-[#3b82f6]/75 border-[#dbeafe]/80 shadow-[0_0_12px_rgba(59,130,246,0.8)]',
    shadow: 'shadow-[inset_0_2px_1px_rgba(255,255,255,0.45),inset_0_-2px_2px_rgba(0,0,0,0.45)]',
  },
};

// Matrix Transformation Utilities (Rotations & Flips)
export function rotateMatrix90(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const newRow: number[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      newRow.push(matrix[r][c]);
    }
    result.push(newRow);
  }
  return result;
}

export function rotateMatrix(matrix: number[][], rotations: number): number[][] {
  let m = matrix;
  const turns = ((rotations % 4) + 4) % 4;
  for (let i = 0; i < turns; i++) {
    m = rotateMatrix90(m);
  }
  return m;
}

export function flipMatrixHorizontal(matrix: number[][]): number[][] {
  return matrix.map((row) => [...row].reverse());
}

export function getRandomOrientation(matrix: number[][]): number[][] {
  const rotations = Math.floor(Math.random() * 4); // 0, 90, 180, 270 degrees
  let rotated = rotateMatrix(matrix, rotations);
  if (Math.random() < 0.5) {
    rotated = flipMatrixHorizontal(rotated);
  }
  return rotated;
}

// Base Classic Shapes (will be randomly rotated 0, 90, 180, 270 deg)
export const STANDARD_SHAPES: Omit<PieceShape, 'id'>[] = [
  // 1x1 Dot
  {
    name: 'Dot',
    color: 'gold',
    matrix: [[1]],
  },
  // 2-Line
  {
    name: '2-Line',
    color: 'cyan',
    matrix: [[1, 1]],
  },
  // 3-Line
  {
    name: '3-Line',
    color: 'rose',
    matrix: [[1, 1, 1]],
  },
  // 4-Line
  {
    name: '4-Line',
    color: 'blue',
    matrix: [[1, 1, 1, 1]],
  },
  // 5-Line
  {
    name: '5-Line',
    color: 'purple',
    matrix: [[1, 1, 1, 1, 1]],
  },
  // 2x2 Square
  {
    name: 'Square 2x2',
    color: 'orange',
    matrix: [
      [1, 1],
      [1, 1],
    ],
  },
  // 3x3 Square
  {
    name: 'Square 3x3',
    color: 'gold',
    matrix: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
  },
  // Corner 2x2 (3 blocks)
  {
    name: 'Corner',
    color: 'green',
    matrix: [
      [1, 1],
      [1, 0],
    ],
  },
  // Classic L-Shape (4 blocks)
  {
    name: 'L-Shape',
    color: 'purple',
    matrix: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
  },
  {
    name: 'L-Shape 2',
    color: 'orange',
    matrix: [
      [1, 1, 1],
      [1, 0, 0],
    ],
  },
  // T-Shape
  {
    name: 'T-Shape',
    color: 'blue',
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
    ],
  },
  // Z & S Shapes
  {
    name: 'Z-Shape',
    color: 'rose',
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  },
  {
    name: 'S-Shape',
    color: 'green',
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
    ],
  },
];

// WEIRD & HELPER SHAPES (All randomly oriented in every direction)
export const HELPER_SHAPES: Omit<PieceShape, 'id'>[] = [
  // 1. Diagonal Step Pair - Fits in staggered checkerboard holes
  {
    name: 'Diagonal Step',
    color: 'cyan',
    matrix: [
      [1, 0],
      [0, 1],
    ],
  },
  // 2. Plus / Cross (+)
  {
    name: 'Plus Cross',
    color: 'gold',
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
  },
  // 3. Bridge / Tunnel (3 blocks with empty center)
  {
    name: 'Bridge',
    color: 'rose',
    matrix: [[1, 0, 1]],
  },
  // 4. Horseshoe / U-Shape / Arch (wraps around an obstacle)
  {
    name: 'Horseshoe',
    color: 'green',
    matrix: [
      [1, 0, 1],
      [1, 1, 1],
    ],
  },
  // 5. C-Cup
  {
    name: 'C-Cup',
    color: 'purple',
    matrix: [
      [1, 1],
      [1, 0],
      [1, 1],
    ],
  },
  // 6. Long-Stem Key Pin
  {
    name: 'Key Pin',
    color: 'blue',
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
  },
  // 7. Big 3x3 Corner (5 blocks)
  {
    name: 'Big L Corner',
    color: 'cyan',
    matrix: [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1],
    ],
  },
  // 8. Mini Spoon / Dipper
  {
    name: 'Mini Dipper',
    color: 'purple',
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
    ],
  },
  // 9. Long Hook (4 blocks)
  {
    name: 'Long Hook',
    color: 'rose',
    matrix: [
      [1, 1],
      [0, 1],
      [0, 1],
    ],
  },
  // 10. Diagonal Trio (3-block diagonal stair)
  {
    name: 'Diagonal Trio',
    color: 'gold',
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  },
];

export const DIFFICULTY_MODES: Record<DifficultyModeId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'EASY',
    boardSize: 10,
    subtitle: 'Spacious 10×10 grid',
    maxPieceDim: 5,
    maxPieceCells: 9,
    helperChance: 0.25,
  },
  classic: {
    id: 'classic',
    label: 'CLASSIC',
    boardSize: 8,
    subtitle: 'Standard 8×8 grid',
    maxPieceDim: 5,
    maxPieceCells: 9,
    helperChance: 0.35,
  },
  hard: {
    id: 'hard',
    label: 'HARD',
    boardSize: 6,
    subtitle: 'Tactical 6×6 grid',
    maxPieceDim: 4,
    maxPieceCells: 5,
    helperChance: 0.32,
  },
  extreme: {
    id: 'extreme',
    label: 'EXTREME',
    boardSize: 4,
    subtitle: 'Compact 4×4 blitz',
    maxPieceDim: 3,
    maxPieceCells: 4,
    helperChance: 0.25,
  },
};

export const DIFFICULTY_ORDER: DifficultyModeId[] = ['easy', 'classic', 'hard', 'extreme'];

export function getDifficultyConfig(mode: DifficultyModeId): DifficultyConfig {
  return DIFFICULTY_MODES[mode] || DIFFICULTY_MODES.classic;
}

// Savior pieces ordered smallest-first when the board is cramped
export const SAVIOR_SHAPES: Omit<PieceShape, 'id'>[] = [
  { name: 'Dot Gold', color: 'gold', matrix: [[1]] },
  { name: 'Dot Cyan', color: 'cyan', matrix: [[1]] },
  { name: '2-Line', color: 'cyan', matrix: [[1, 1]] },
  { name: 'Diagonal Step', color: 'cyan', matrix: [[1, 0], [0, 1]] },
  { name: 'Corner', color: 'green', matrix: [[1, 1], [1, 0]] },
  { name: 'Bridge', color: 'rose', matrix: [[1, 0, 1]] },
  { name: '3-Line', color: 'rose', matrix: [[1, 1, 1]] },
  { name: 'Square 2x2', color: 'orange', matrix: [[1, 1], [1, 1]] },
];

export function createEmptyGrid(boardSize = 8): GridState {
  return Array.from({ length: boardSize }, () => Array.from({ length: boardSize }, () => null));
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

function isTemplateAllowed(
  matrix: number[][],
  boardSize: number,
  config: DifficultyConfig
): boolean {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const maxDim = Math.max(rows, cols);
  const cells = countMatrixCells(matrix);

  if (maxDim > Math.min(config.maxPieceDim, boardSize)) return false;
  if (cells > config.maxPieceCells) return false;
  return true;
}

function getAllowedPool(
  templates: Omit<PieceShape, 'id'>[],
  boardSize: number,
  config: DifficultyConfig,
  emptyRatio: number
): Omit<PieceShape, 'id'>[] {
  const allowed = templates.filter((t) => isTemplateAllowed(t.matrix, boardSize, config));
  if (allowed.length === 0) return [SAVIOR_SHAPES[0]];

  // When a small or tight board is getting crowded, favor more compact pieces
  if (boardSize <= 6 && emptyRatio < 0.55) {
    const compact = allowed.filter((t) => countMatrixCells(t.matrix) <= 3);
    if (compact.length > 0 && Math.random() < 0.72) {
      return compact;
    }
  }

  return allowed;
}

function getEmptyCellRatio(grid: GridState): number {
  const rows = grid.length;
  const cols = grid[0]?.length || rows;
  const total = rows * cols;
  if (total === 0) return 1;

  let empty = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === null) empty++;
    }
  }
  return empty / total;
}

let pieceCounter = 0;

function makePieceId(prefix = 'piece'): string {
  pieceCounter++;
  return `${prefix}-${Date.now()}-${pieceCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getRandomPiece(
  grid?: GridState,
  forceHelper = false,
  mustFit = false,
  mode: DifficultyModeId = 'classic'
): PieceShape {
  const config = getDifficultyConfig(mode);
  const boardSize = grid ? grid.length : config.boardSize;
  const emptyRatio = grid ? getEmptyCellRatio(grid) : 1;

  const useHelper = forceHelper || Math.random() < config.helperChance;
  const rawPool = useHelper ? HELPER_SHAPES : STANDARD_SHAPES;
  const pool = getAllowedPool(rawPool, boardSize, config, emptyRatio);
  const fullAllowedPool = getAllowedPool(
    [...STANDARD_SHAPES, ...HELPER_SHAPES],
    boardSize,
    config,
    emptyRatio
  );

  let candidate: { name: string; color: BlockColor; matrix: number[][] } | null = null;

  if (mustFit && grid) {
    // Try multiple random templates and random rotations from mode-appropriate pool
    for (let attempt = 0; attempt < 40; attempt++) {
      const searchPool = attempt < 24 ? pool : fullAllowedPool;
      const template = searchPool[Math.floor(Math.random() * searchPool.length)];
      const orientedMatrix = getRandomOrientation(template.matrix);
      const testPiece: PieceShape = {
        name: template.name,
        color: template.color,
        matrix: orientedMatrix,
        id: 'test',
      };

      if (canPieceFitAnywhere(grid, testPiece)) {
        candidate = {
          name: template.name,
          color: template.color,
          matrix: orientedMatrix,
        };
        break;
      }
    }

    // If still not found, check savior shapes (smallest first) with all rotations
    if (!candidate) {
      const allowedSaviors = SAVIOR_SHAPES.filter((s) =>
        isTemplateAllowed(s.matrix, boardSize, config)
      );
      for (const savior of allowedSaviors) {
        for (let rot = 0; rot < 4; rot++) {
          const oriented = rotateMatrix(savior.matrix, rot);
          const testPiece: PieceShape = {
            name: savior.name,
            color: savior.color,
            matrix: oriented,
            id: 'test',
          };
          if (canPieceFitAnywhere(grid, testPiece)) {
            candidate = {
              name: savior.name,
              color: savior.color,
              matrix: oriented,
            };
            break;
          }
        }
        if (candidate) break;
      }
    }
  }

  // Fallback to organic random selection from mode-allowed pool
  if (!candidate) {
    const template = pool[Math.floor(Math.random() * pool.length)];
    candidate = {
      name: template.name,
      color: template.color,
      matrix: getRandomOrientation(template.matrix),
    };
  }

  return {
    ...candidate,
    id: makePieceId('piece'),
  };
}

export function canPlacePiece(
  grid: GridState,
  piece: PieceShape,
  targetR: number,
  targetC: number
): boolean {
  const gridRows = grid.length;
  const gridCols = grid[0]?.length || gridRows;
  const rows = piece.matrix.length;
  const cols = piece.matrix[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (piece.matrix[r][c] === 1) {
        const boardR = targetR + r;
        const boardC = targetC + c;

        // Check bounds dynamically
        if (boardR < 0 || boardR >= gridRows || boardC < 0 || boardC >= gridCols) {
          return false;
        }

        // Check collision with existing locked block
        if (grid[boardR][boardC] !== null) {
          return false;
        }
      }
    }
  }

  return true;
}

export function canPieceFitAnywhere(grid: GridState, piece: PieceShape): boolean {
  const gridRows = grid.length;
  const gridCols = grid[0]?.length || gridRows;
  const rows = piece.matrix.length;
  const cols = piece.matrix[0].length;

  for (let r = 0; r <= gridRows - rows; r++) {
    for (let c = 0; c <= gridCols - cols; c++) {
      if (canPlacePiece(grid, piece, r, c)) {
        return true;
      }
    }
  }

  return false;
}

export function findFirstValidPlacement(
  grid: GridState,
  piece: PieceShape
): { r: number; c: number } | null {
  const gridRows = grid.length;
  const gridCols = grid[0]?.length || gridRows;
  const rows = piece.matrix.length;
  const cols = piece.matrix[0].length;

  for (let r = 0; r <= gridRows - rows; r++) {
    for (let c = 0; c <= gridCols - cols; c++) {
      if (canPlacePiece(grid, piece, r, c)) {
        return { r, c };
      }
    }
  }

  return null;
}

export function placePieceOnGrid(
  grid: GridState,
  piece: PieceShape,
  targetR: number,
  targetC: number,
  clearCompletedLines = false
): GridState {
  const newGrid = grid.map((row) => [...row]);
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[0].length; c++) {
      if (piece.matrix[r][c] === 1) {
        newGrid[targetR + r][targetC + c] = piece.color;
      }
    }
  }

  if (clearCompletedLines) {
    const size = newGrid.length;
    const fullRows: number[] = [];
    const fullCols: number[] = [];
    for (let r = 0; r < size; r++) {
      if (newGrid[r].every((cell) => cell !== null)) fullRows.push(r);
    }
    for (let c = 0; c < size; c++) {
      let full = true;
      for (let r = 0; r < size; r++) {
        if (newGrid[r][c] === null) {
          full = false;
          break;
        }
      }
      if (full) fullCols.push(c);
    }
    fullRows.forEach((r) => {
      for (let c = 0; c < size; c++) newGrid[r][c] = null;
    });
    fullCols.forEach((c) => {
      for (let r = 0; r < size; r++) newGrid[r][c] = null;
    });
  }

  return newGrid;
}

function gridHasEmptyCell(grid: GridState): boolean {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[r]?.length || 0); c++) {
      if (grid[r][c] === null) return true;
    }
  }
  return false;
}

function ensureAtLeastOneFittingPiece(pieces: PieceShape[], workingGrid: GridState): PieceShape[] {
  if (!gridHasEmptyCell(workingGrid)) return pieces;
  if (pieces.some((p) => canPieceFitAnywhere(workingGrid, p))) {
    return pieces;
  }

  const fixed = [...pieces];
  const dotSavior = SAVIOR_SHAPES[0];
  fixed[0] = {
    name: dotSavior.name,
    color: dotSavior.color,
    matrix: [[1]],
    id: makePieceId('savior'),
  };
  return fixed;
}

/**
 * Spawns 3 randomized pieces tailored to the active difficulty & board size.
 * CRITICAL GUARANTEE:
 * 1) No piece is ever larger than the board or mode limits.
 * 2) Tries to guarantee all 3 pieces can be placed simultaneously (or sequentially with line clears).
 * 3) Whenever the board has at least 1 empty cell, spawned pieces are guaranteed to have a valid move.
 */
export function getRandomPieces(
  count = 3,
  grid?: GridState,
  mode: DifficultyModeId = 'classic'
): PieceShape[] {
  const config = getDifficultyConfig(mode);
  const workingGrid = grid || createEmptyGrid(config.boardSize);
  const boardSize = workingGrid.length;

  // Pass 1: Find `count` pieces that all fit simultaneously onto disjoint cells without needing a clear
  for (let attempt = 0; attempt < 45; attempt++) {
    const pieces: PieceShape[] = [];
    let simGrid = workingGrid.map((row) => [...row]);
    let success = true;

    for (let i = 0; i < count; i++) {
      const isHelperSlot = i === 1 && Math.random() < config.helperChance + 0.25;
      const piece = getRandomPiece(simGrid, isHelperSlot, true, mode);
      const placement = findFirstValidPlacement(simGrid, piece);

      if (!placement) {
        success = false;
        break;
      }

      simGrid = placePieceOnGrid(simGrid, piece, placement.r, placement.c, false);
      pieces.push(piece);
    }

    if (success && pieces.length === count) {
      return ensureAtLeastOneFittingPiece(pieces, workingGrid);
    }
  }

  // Pass 2: On compact boards (4x4 / 6x6), simulate sequential placement WITH line clears
  for (let attempt = 0; attempt < 35; attempt++) {
    const pieces: PieceShape[] = [];
    let simGrid = workingGrid.map((row) => [...row]);
    let success = true;

    for (let i = 0; i < count; i++) {
      const piece = getRandomPiece(simGrid, false, true, mode);
      const placement = findFirstValidPlacement(simGrid, piece);

      if (!placement) {
        success = false;
        break;
      }

      simGrid = placePieceOnGrid(simGrid, piece, placement.r, placement.c, true);
      pieces.push(piece);
    }

    // Also verify every spawned piece can at least fit on the initial workingGrid
    if (success && pieces.length === count && pieces.every((p) => canPieceFitAnywhere(workingGrid, p))) {
      return ensureAtLeastOneFittingPiece(pieces, workingGrid);
    }
  }

  // Pass 3: Tight-board savior fallback — fill each slot with compact pieces that DEFINITELY fit on `workingGrid`
  const guaranteedPieces: PieceShape[] = [];
  let simGrid = workingGrid.map((row) => [...row]);
  const allowedSaviors = SAVIOR_SHAPES.filter((s) =>
    isTemplateAllowed(s.matrix, boardSize, config)
  );

  for (let i = 0; i < count; i++) {
    let placedPiece: PieceShape | null = null;

    // Try fitting onto simGrid first (with clears)
    for (const savior of allowedSaviors) {
      for (let rot = 0; rot < 4; rot++) {
        const oriented = rotateMatrix(savior.matrix, rot);
        const testPiece: PieceShape = {
          name: savior.name,
          color: savior.color,
          matrix: oriented,
          id: makePieceId('savior'),
        };
        const placement = findFirstValidPlacement(simGrid, testPiece);
        if (placement && canPieceFitAnywhere(workingGrid, testPiece)) {
          simGrid = placePieceOnGrid(simGrid, testPiece, placement.r, placement.c, true);
          placedPiece = testPiece;
          break;
        }
      }
      if (placedPiece) break;
    }

    // If simGrid couldn't fit another simultaneously, still guarantee it fits on the CURRENT workingGrid!
    if (!placedPiece) {
      for (const savior of allowedSaviors) {
        for (let rot = 0; rot < 4; rot++) {
          const oriented = rotateMatrix(savior.matrix, rot);
          const testPiece: PieceShape = {
            name: savior.name,
            color: savior.color,
            matrix: oriented,
            id: makePieceId('savior'),
          };
          if (canPieceFitAnywhere(workingGrid, testPiece)) {
            placedPiece = testPiece;
            break;
          }
        }
        if (placedPiece) break;
      }
    }

    guaranteedPieces.push(
      placedPiece || getRandomPiece(workingGrid, false, true, mode)
    );
  }

  return ensureAtLeastOneFittingPiece(guaranteedPieces, workingGrid);
}
