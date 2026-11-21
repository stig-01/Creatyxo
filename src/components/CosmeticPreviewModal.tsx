/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BlockColor, DifficultyModeId, PieceShape } from '../game/types';
import { COLOR_THEMES, DIFFICULTY_MODES } from '../game/shapes';
import { GameTheme } from '../game/themes';
import { BLOCK_SKINS, BlockSkinId } from '../game/blockSkins';
import { BlockSkinOverlay } from './BlockSkinOverlay';

interface CosmeticPreviewModalProps {
  isOpen: boolean;
  previewTheme: GameTheme;
  previewSkinId: BlockSkinId;
  previewLabel: string;
  accentHex: string;
  boardSize: number;
  difficultyMode: DifficultyModeId;
  playerLevel: number;
  modeBestScore: number;
  userRank: number;
  onClose: () => void;
}

const PREVIEW_TRAY_PIECES: PieceShape[] = [
  {
    id: 'preview-l',
    name: 'L-Shape',
    color: 'purple',
    matrix: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
  },
  {
    id: 'preview-sq',
    name: 'Square 2x2',
    color: 'orange',
    matrix: [
      [1, 1],
      [1, 1],
    ],
  },
  {
    id: 'preview-line',
    name: '3-Line',
    color: 'cyan',
    matrix: [[1, 1, 1]],
  },
];

const SHOWCASE_COLORS: BlockColor[] = [
  'cyan',
  'orange',
  'purple',
  'green',
  'rose',
  'gold',
  'blue',
];

function getShowcaseBoardColor(r: number, c: number, boardSize: number): BlockColor | null {
  const mid = Math.floor(boardSize / 2);
  const showCell =
    (r === 1 && c >= 1 && c <= 2) ||
    (r === 2 && c === 1) ||
    (r === boardSize - 2 && c >= boardSize - 3 && c <= boardSize - 2) ||
    (r === mid && c >= mid - 1 && c <= Math.min(boardSize - 1, mid + 1)) ||
    (r === 0 && c === boardSize - 1) ||
    (boardSize >= 6 && r === boardSize - 1 && c === 0) ||
    (boardSize >= 8 && r === 2 && c === boardSize - 2) ||
    (boardSize >= 8 && r === 3 && c === boardSize - 2);

  if (!showCell) return null;
  return SHOWCASE_COLORS[(r * 3 + c) % SHOWCASE_COLORS.length];
}

export const CosmeticPreviewModal: React.FC<CosmeticPreviewModalProps> = ({
  isOpen,
  previewTheme,
  previewSkinId,
  previewLabel,
  accentHex,
  boardSize,
  difficultyMode,
  playerLevel,
  modeBestScore,
  userRank,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const difficultyLabel = DIFFICULTY_MODES[difficultyMode]?.label || 'CLASSIC';
  const skinMeta = BLOCK_SKINS[previewSkinId];
  const cellRadius =
    boardSize <= 4
      ? 'rounded-lg'
      : boardSize >= 10
      ? 'rounded-[4px]'
      : 'rounded-[5px] sm:rounded-md';

  const renderPreviewMiniPiece = (piece: PieceShape) => {
    const cTheme = COLOR_THEMES[piece.color];
    const rows = piece.matrix.length;
    const cols = piece.matrix[0].length;
    let cellPx = 16;
    if (rows >= 5 || cols >= 5) cellPx = 9;
    else if (rows > 3 || cols > 3) cellPx = 12;
    else if (rows === 1 && cols === 1) cellPx = 22;

    return (
      <div
        className="grid gap-1 pointer-events-none select-none"
        style={{
          gridTemplateRows: `repeat(${rows}, ${cellPx}px)`,
          gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
        }}
      >
        {piece.matrix.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`relative overflow-hidden rounded-[3px] ${
                cell === 1
                  ? `${cTheme.solid} ${cTheme.shadow} border ${cTheme.border}`
                  : 'bg-transparent'
              }`}
              style={{ width: `${cellPx}px`, height: `${cellPx}px` }}
            >
              {cell === 1 && <BlockSkinOverlay skinId={previewSkinId} compact />}
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-[10px] z-[60] flex items-center justify-center p-2.5 sm:p-4 bg-[#060910]/92 backdrop-blur-md animate-fadeIn select-none rounded-2xl overflow-hidden"
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: previewTheme.cardBg,
          borderColor: accentHex,
          boxShadow: `0 18px 50px rgba(0,0,0,0.85), 0 0 28px ${previewTheme.accentGlowRgba}`,
        }}
        className="w-full max-w-[440px] h-full sm:h-[840px] sm:max-h-full rounded-2xl sm:rounded-3xl border shadow-2xl flex flex-col mx-auto relative overflow-hidden px-3.5 py-3.5 sm:px-6 sm:py-5 justify-between gap-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Interactive Preview Top Bar */}
        <div
          style={{
            backgroundColor: previewTheme.surfaceBg,
            borderColor: accentHex,
          }}
          className="shrink-0 px-3 py-2 rounded-xl border flex items-center justify-between gap-2.5 z-20"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] shrink-0">{skinMeta.badgeIcon}</span>
            <span
              style={{ color: accentHex }}
              className="text-[9px] sm:text-[9.5px] font-black font-['Orbitron',sans-serif] tracking-wider truncate"
            >
              PREVIEW: {previewLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              margin: 0,
              backgroundColor: previewTheme.primaryBtnBg,
              color: previewTheme.primaryBtnText,
            }}
            className="px-3 py-1.5 rounded-lg text-[9px] font-black font-['Orbitron',sans-serif] tracking-wider cursor-pointer hover:brightness-110 active:scale-95 transition-all shrink-0"
          >
            CLOSE PREVIEW
          </button>
        </div>

        {/* Non-playable 1:1 Gameplay Screen Replica */}
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-2 pointer-events-none select-none">
          {/* Top Header Section */}
          <header className="flex flex-col gap-2.5 w-full shrink-0 px-1 sm:px-1.5">
            {/* Top Bar: Home, Title, Settings */}
            <div className="flex items-center justify-between gap-2 w-full">
              <div
                style={{
                  backgroundColor: previewTheme.surfaceBg,
                  borderColor: previewTheme.surfaceBorder,
                }}
                className="btn-creatyxo-icon rounded-xl border text-slate-300 shadow-sm shrink-0"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5">
                <span
                  style={{
                    color: previewTheme.titleTextColor,
                    filter: `drop-shadow(0 0 16px ${previewTheme.accentGlowRgba})`,
                  }}
                  className="text-xl sm:text-2xl tracking-wider uppercase font-['Black_Ops_One',sans-serif] text-center px-1 leading-none"
                >
                  CREATYXO
                </span>
                <span className="text-[8.5px] font-bold tracking-[0.16em] text-slate-400 font-['Orbitron',sans-serif] leading-none truncate max-w-full">
                  {boardSize}×{boardSize} • {difficultyLabel} •{' '}
                  <span style={{ color: previewTheme.accentHex }}>LV.{playerLevel}</span>
                </span>
              </div>

              <div
                style={{
                  padding: 8,
                  backgroundColor: previewTheme.surfaceBg,
                  borderColor: previewTheme.surfaceBorder,
                }}
                className="btn-creatyxo-icon rounded-xl border text-slate-400 shadow-sm shrink-0"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
              </div>
            </div>

            {/* Score Cards Row */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <div
                style={{
                  backgroundColor: previewTheme.surfaceBg,
                  borderColor: previewTheme.surfaceBorder,
                }}
                className="border rounded-2xl px-3.5 py-2.5 flex flex-col justify-center gap-1.5 shadow-sm min-h-[54px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9.5px] font-bold text-slate-400 tracking-wider font-['Orbitron',sans-serif] leading-none">
                    SCORE
                  </span>
                  <span className="text-[8px] font-bold text-[#f43f5e] bg-[#2d1523] border border-[#4d1f35] px-1.5 py-0.5 rounded-full font-['Orbitron',sans-serif] leading-none">
                    2×
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-black text-white tracking-wide font-['Orbitron',sans-serif] leading-none tabular-nums">
                  2,450
                </div>
              </div>

              <div
                style={{
                  backgroundColor: previewTheme.surfaceBg,
                  borderColor: previewTheme.surfaceBorder,
                }}
                className="border rounded-2xl px-3.5 py-2.5 flex flex-col justify-center gap-1.5 shadow-sm min-h-[54px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9.5px] font-bold text-slate-400 tracking-wider font-['Orbitron',sans-serif] leading-none">
                    BEST ({boardSize}×{boardSize})
                  </span>
                  <span className="text-[9.5px] text-slate-500 font-bold font-['Orbitron',sans-serif] leading-none">
                    #{userRank}
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-black text-[#f6c445] tracking-wide font-['Orbitron',sans-serif] leading-none tabular-nums">
                  {Math.max(modeBestScore, 2450).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Live Combo Meter */}
            <div
              style={{
                backgroundColor: previewTheme.surfaceBg,
                borderColor: '#fbbf24',
                boxShadow: `0 0 14px ${previewTheme.accentGlowRgba}`,
              }}
              className="border rounded-xl px-3 py-2 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-2 text-[8.5px] font-black font-['Orbitron',sans-serif] tracking-wider leading-none">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-slate-400 shrink-0">COMBO METER</span>
                  <span style={{ color: '#fbbf24' }} className="truncate">• HOT STREAK</span>
                </div>
                <span style={{ color: '#fbbf24' }} className="shrink-0">2× (1.5× PTS)</span>
              </div>

              <div className="w-full h-2 rounded-full bg-[#11192a] overflow-hidden grid grid-cols-5 gap-1.5 p-[2px]">
                {[1, 2, 3, 4, 5].map((segment) => {
                  const isLit = segment <= 2;
                  return (
                    <div
                      key={segment}
                      style={{
                        backgroundColor: isLit
                          ? segment >= 2
                            ? '#fbbf24'
                            : previewTheme.accentHex
                          : '#1a253c',
                        boxShadow: isLit ? `0 0 8px ${previewTheme.accentHex}` : undefined,
                      }}
                      className="h-full rounded-full"
                    />
                  );
                })}
              </div>
            </div>
          </header>

          {/* Center Playfield: Responsive Board + 3-Slot Piece Tray */}
          <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 my-auto min-h-0 px-1">
            {/* Full-Size Board */}
            <div className="w-full flex items-center justify-center">
              <div
                style={{
                  width: 'min(100%, 284px, 35dvh)',
                  aspectRatio: '1 / 1',
                  backgroundColor: previewTheme.boardBg,
                  padding: 10,
                  borderRadius: 18,
                  border: `1px solid ${previewTheme.boardBorder}`,
                  boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.7)',
                }}
                className="relative"
              >
                <div
                  className={`grid ${boardSize >= 10 ? 'gap-[5px]' : 'gap-1.5'} w-full h-full`}
                  style={{
                    gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: boardSize }).map((_, r) =>
                    Array.from({ length: boardSize }).map((__, c) => {
                      const clr = getShowcaseBoardColor(r, c, boardSize);
                      const cTheme = clr ? COLOR_THEMES[clr] : null;
                      return (
                        <div
                          key={`${r}-${c}`}
                          style={
                            !cTheme
                              ? {
                                  backgroundColor: previewTheme.emptyCellBg,
                                  borderColor: previewTheme.emptyCellBorder,
                                  borderWidth: 1,
                                  borderStyle: 'solid',
                                }
                              : undefined
                          }
                          className={`relative overflow-hidden w-full h-full ${cellRadius} flex items-center justify-center ${
                            cTheme ? `${cTheme.solid} ${cTheme.shadow} border ${cTheme.border}` : ''
                          }`}
                        >
                          {cTheme && (
                            <BlockSkinOverlay skinId={previewSkinId} compact={boardSize >= 10} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* 3-Slot Piece Tray */}
            <div
              style={{ width: 'min(100%, 284px, 35dvh)' }}
              className="grid grid-cols-3 gap-2.5 sm:gap-3"
            >
              {PREVIEW_TRAY_PIECES.map((piece, idx) => (
                <div
                  key={idx}
                  style={{
                    height: 68,
                    borderRadius: 16,
                    backgroundColor: previewTheme.surfaceBg,
                    border: `1px solid ${previewTheme.surfaceBorder}`,
                  }}
                  className="flex items-center justify-center relative"
                >
                  {renderPreviewMiniPiece(piece)}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Navigation Look */}
          <nav
            style={{ borderColor: previewTheme.surfaceBorder }}
            className="w-full flex items-center justify-around border-t pt-2.5 pb-1 px-2 sm:px-4 shrink-0 gap-3"
            aria-label="Preview Navigation"
          >
            <div
              style={{ color: previewTheme.accentHex }}
              className="flex-1 max-w-[88px] min-h-[42px] py-1.5 px-2 rounded-xl flex flex-col items-center justify-center text-center gap-1.5"
            >
              <div
                style={{ backgroundColor: previewTheme.surfaceBg }}
                className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </div>
              <span className="text-[9px] font-bold tracking-wider font-['Orbitron',sans-serif] leading-none">
                PLAY
              </span>
            </div>

            <div className="flex-1 max-w-[88px] min-h-[42px] py-1.5 px-2 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 text-slate-400">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M5 19h3v-6H5v6zm6 0h3V5h-3v14zm6 0h3v-9h-3v9z" />
                </svg>
              </div>
              <span className="text-[9px] font-bold tracking-wider font-['Orbitron',sans-serif] leading-none">
                RANK
              </span>
            </div>

            <div className="flex-1 max-w-[88px] min-h-[42px] py-1.5 px-2 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 text-slate-400">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
              </div>
              <span className="text-[9px] font-bold tracking-wider font-['Orbitron',sans-serif] leading-none">
                SETTINGS
              </span>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};
