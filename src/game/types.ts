/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BlockColor = 'orange' | 'cyan' | 'rose' | 'green' | 'purple' | 'gold' | 'blue';

export type DifficultyModeId = 'easy' | 'classic' | 'hard' | 'extreme';

export interface DifficultyConfig {
  id: DifficultyModeId;
  label: string;
  boardSize: number;
  subtitle: string;
  maxPieceDim: number;
  maxPieceCells: number;
  helperChance: number;
}

export interface PieceShape {
  id: string;
  name: string;
  color: BlockColor;
  matrix: number[][]; // 2D grid of 0s and 1s
}

export type GridState = (BlockColor | null)[][];

export interface DraggingPieceState {
  piece: PieceShape;
  trayIndex: number;
  pointerX: number;
  pointerY: number;
  startX: number;
  startY: number;
  hasMoved: boolean;
  isTouch: boolean;
}

export interface PlacementCoordinate {
  r: number;
  c: number;
}
