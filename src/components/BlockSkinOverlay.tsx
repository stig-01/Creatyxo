/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BlockSkinId } from '../game/blockSkins';

interface BlockSkinOverlayProps {
  skinId: BlockSkinId;
  compact?: boolean;
}

export const BlockSkinOverlay: React.FC<BlockSkinOverlayProps> = ({
  skinId,
  compact = false,
}) => {
  if (skinId === 'classic-gloss') {
    return null;
  }

  if (skinId === 'cyber-circuit') {
    return (
      <span className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden rounded-[inherit]">
        {/* Etched circuit inner frame */}
        <span
          className={`absolute ${
            compact ? 'inset-[2px]' : 'inset-[3px]'
          } rounded-[2px] border border-white/45`}
        />
        {/* Horizontal trace lines */}
        <span className="absolute left-0 right-0 h-[1px] bg-white/30" />
        {/* Luminous core node */}
        <span
          className={`${
            compact ? 'w-[3px] h-[3px]' : 'w-[5px] h-[5px]'
          } rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.95)] relative z-10`}
        />
      </span>
    );
  }

  if (skinId === 'prism-crystal') {
    return (
      <span className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden rounded-[inherit]">
        {/* Diagonal crystalline glass refraction */}
        <span
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.06) 49%, rgba(0,0,0,0.2) 51%, rgba(255,255,255,0.22) 100%)',
          }}
        />
        {/* Inner faceted diamond */}
        <span
          className={`${
            compact ? 'w-[48%] h-[48%]' : 'w-[46%] h-[46%]'
          } rotate-45 border border-white/65 bg-white/15 shadow-[inset_0_0_4px_rgba(255,255,255,0.5)]`}
        />
      </span>
    );
  }

  // 'astral-nova'
  return (
    <span className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden rounded-[inherit]">
      {/* Cosmic inner radial aura */}
      <span
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.04) 55%, rgba(0,0,0,0.28) 100%)',
        }}
      />
      {/* Gilded outer orbital frame */}
      <span
        className={`absolute ${
          compact ? 'inset-[1.5px]' : 'inset-[2.5px]'
        } rounded-full border border-amber-200/45`}
      />
      {/* 4-point starburst SVG */}
      <svg
        viewBox="0 0 24 24"
        className={`${
          compact ? 'w-[62%] h-[62%]' : 'w-[58%] h-[58%]'
        } text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.9)] relative z-10`}
        fill="currentColor"
      >
        <path d="M12 2L14.3 9.7L22 12L14.3 14.3L12 22L9.7 14.3L2 12L9.7 9.7L12 2Z" />
      </svg>
    </span>
  );
};
