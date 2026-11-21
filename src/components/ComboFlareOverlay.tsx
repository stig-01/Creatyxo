/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';

export interface ComboFlareBurst {
  id: string;
  combo: number;
  isInitialTierUnlock: boolean;
  accentHex: string;
}

interface ComboFlareOverlayProps {
  burst: ComboFlareBurst | null;
}

interface FlareParticleSpec {
  id: number;
  tx: number;
  ty: number;
  size: number;
  color: string;
  isDiamond: boolean;
  delay: number;
  dur: number;
  rot: number;
}

export const ComboFlareOverlay: React.FC<ComboFlareOverlayProps> = ({ burst }) => {
  const particles = useMemo<FlareParticleSpec[]>(() => {
    if (!burst) return [];
    const palette = ['#f43f5e', '#fbbf24', '#ffffff', burst.accentHex, '#fb7185'];
    const total = 20;

    return Array.from({ length: total }, (_, idx) => {
      const baseAngle = (idx / total) * Math.PI * 2;
      const jitter = ((idx % 3) - 1) * 0.11;
      const angle = baseAngle + jitter;
      const radius = idx % 2 === 0 ? 118 + (idx % 4) * 14 : 84 + (idx % 5) * 12;

      return {
        id: idx,
        tx: Math.round(Math.cos(angle) * radius),
        ty: Math.round(Math.sin(angle) * radius),
        size: idx % 3 === 0 ? 9 : idx % 2 === 0 ? 7 : 5,
        color: palette[idx % palette.length],
        isDiamond: idx % 2 === 0,
        delay: (idx % 4) * 0.03,
        dur: 0.68 + (idx % 5) * 0.07,
        rot: (idx % 2 === 0 ? 1 : -1) * (120 + idx * 15),
      };
    });
  }, [burst]);

  if (!burst) return null;

  return (
    <div
      key={burst.id}
      className="absolute inset-0 pointer-events-none z-40 overflow-visible select-none"
      aria-hidden="true"
    >
      {/* Primary Plasma Shockwave Ring */}
      <div
        className="absolute left-1/2 top-1/2 w-[210px] h-[210px] rounded-full border-2 animate-flare-ring"
        style={{
          borderColor: '#fbbf24',
          boxShadow: `0 0 26px #f43f5e, inset 0 0 18px ${burst.accentHex}`,
        }}
      />

      {/* Secondary Outer Shimmer Ring */}
      <div
        className="absolute left-1/2 top-1/2 w-[170px] h-[170px] rounded-full border animate-flare-ring"
        style={{
          borderColor: burst.accentHex,
          animationDelay: '0.08s',
          boxShadow: '0 0 20px rgba(255,255,255,0.65)',
        }}
      />

      {/* Radial Energy Shards & Spark Flares */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute left-1/2 top-1/2 animate-flare-particle"
          style={
            {
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: p.isDiamond ? '2px' : '9999px',
              boxShadow: `0 0 10px ${p.color}, 0 0 18px ${p.color}`,
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              '--delay': `${p.delay}s`,
              '--dur': `${p.dur}s`,
              '--rot': `${p.rot}deg`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Crisp Level-Up / Hypernova Surge Crest inside top edge of board to avoid colliding with Combo Meter */}
      <div
        className="absolute left-1/2 top-2 animate-combo-levelup flex items-center gap-1.5 px-3.5 py-1 rounded-full border backdrop-blur-sm whitespace-nowrap"
        style={{
          backgroundColor: 'rgba(13, 18, 32, 0.92)',
          borderColor: '#f43f5e',
          boxShadow: `0 0 22px rgba(244, 63, 94, 0.85), 0 0 10px ${burst.accentHex}`,
        }}
      >
        <span className="text-[10px] leading-none">⚡</span>
        <span
          className="text-[9.5px] sm:text-[10.5px] font-black font-['Orbitron',sans-serif] tracking-widest uppercase"
          style={{
            color: '#fde047',
            textShadow: '0 0 10px rgba(244, 63, 94, 0.95)',
          }}
        >
          {burst.isInitialTierUnlock
            ? `LEVEL UP • HYPERNOVA ${burst.combo}×`
            : `HYPERNOVA SURGE • ${burst.combo}×`}
        </span>
        <span className="text-[10px] leading-none">🔥</span>
      </div>
    </div>
  );
};
