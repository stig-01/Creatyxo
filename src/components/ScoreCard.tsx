/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameTheme } from '../game/themes';

interface ScoreCardProps {
  score: number;
  combo: number;
  activeTheme: GameTheme;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, combo, activeTheme }) => {
  const [displayedScore, setDisplayedScore] = useState<number>(score);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const displayedScoreRef = useRef<number>(score);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    const startValue = displayedScoreRef.current;

    if (score <= startValue) {
      displayedScoreRef.current = score;
      setDisplayedScore(score);
      setIsAnimating(false);
      return;
    }

    const delta = score - startValue;
    const durationMs = Math.min(620, Math.max(240, 220 + Math.log10(Math.max(10, delta)) * 120));
    const startTime = performance.now();
    setIsAnimating(true);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Ease-out cubic for snappy, smooth numeric roll
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(startValue + delta * eased);

      if (nextValue !== displayedScoreRef.current) {
        displayedScoreRef.current = nextValue;
        setDisplayedScore(nextValue);
      }

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        displayedScoreRef.current = score;
        setDisplayedScore(score);
        setIsAnimating(false);
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [score]);

  return (
    <div
      style={{
        backgroundColor: activeTheme.surfaceBg,
        borderColor: isAnimating ? activeTheme.accentHex : activeTheme.surfaceBorder,
        boxShadow: isAnimating ? `0 0 14px ${activeTheme.accentGlowRgba}` : undefined,
      }}
      className="border rounded-2xl px-3 py-2 flex flex-col justify-center gap-[5px] shadow-sm min-h-[46px] transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold text-slate-400 tracking-wider font-['Orbitron',sans-serif] leading-none">
          SCORE
        </span>
        {combo > 1 ? (
          <span className="text-[8px] font-bold text-[#f43f5e] bg-[#2d1523] border border-[#4d1f35] px-1.5 py-0.5 rounded-full font-['Orbitron',sans-serif] leading-none">
            {combo}×
          </span>
        ) : (
          <span className="text-[8px] font-bold text-slate-500 bg-[#141b2e] px-1.5 py-0.5 rounded-full font-['Orbitron',sans-serif] leading-none">
            1×
          </span>
        )}
      </div>
      <div
        style={{
          color: isAnimating ? activeTheme.accentHex : '#ffffff',
          textShadow: isAnimating ? `0 0 12px ${activeTheme.accentGlowRgba}` : undefined,
        }}
        className={`text-base sm:text-lg font-black tracking-wide font-['Orbitron',sans-serif] leading-none tabular-nums origin-left transition-transform duration-150 ${
          isAnimating ? 'scale-[1.06]' : 'scale-100'
        }`}
      >
        {displayedScore.toLocaleString()}
      </div>
    </div>
  );
};
