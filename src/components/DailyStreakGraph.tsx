/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { PlayerStats, StreakDayPoint, getLast7DaysStreakData } from '../game/progression';
import { GameTheme } from '../game/themes';

interface DailyStreakGraphProps {
  playerStats: PlayerStats;
  activeTheme: GameTheme;
}

export const DailyStreakGraph: React.FC<DailyStreakGraphProps> = ({
  playerStats,
  activeTheme,
}) => {
  const days = useMemo(() => getLast7DaysStreakData(playerStats), [playerStats]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const activeDay: StreakDayPoint =
    selectedIndex !== null ? days[selectedIndex] : days[days.length - 1];

  const svgWidth = 280;
  const svgHeight = 60;
  const baselineY = 52;
  const topY = 10;
  const plotHeight = baselineY - topY;
  const colWidth = svgWidth / 7;
  const barWidth = 16;

  const getNodeY = (pt: StreakDayPoint): number => {
    if (!pt.active) return baselineY - 2;
    return baselineY - Math.max(10, Math.round(pt.intensity * plotHeight));
  };

  const chainSegments = useMemo(() => {
    const segments: string[] = [];
    let currentPoints: string[] = [];

    days.forEach((pt, idx) => {
      const cx = idx * colWidth + colWidth / 2;
      const cy = getNodeY(pt);
      if (pt.active) {
        currentPoints.push(`${cx},${cy}`);
      } else {
        if (currentPoints.length >= 2) {
          segments.push(currentPoints.join(' '));
        }
        currentPoints = [];
      }
    });

    if (currentPoints.length >= 2) {
      segments.push(currentPoints.join(' '));
    }
    return segments;
  }, [days]);

  return (
    <div
      style={{
        backgroundColor: activeTheme.surfaceBg,
        borderColor: activeTheme.surfaceBorder,
      }}
      className="rounded-xl border p-3 flex flex-col gap-2"
    >
      {/* Simple Unified Streak Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none shrink-0">🔥</span>
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-sm font-black text-amber-300 font-['Orbitron',sans-serif] tabular-nums">
              {playerStats.dailyStreak} {playerStats.dailyStreak === 1 ? 'DAY' : 'DAYS'}
            </span>
            <span className="text-[8.5px] font-bold text-slate-400 font-['Orbitron',sans-serif] truncate">
              STREAK
            </span>
          </div>
        </div>

        <span className="text-[8.5px] font-bold text-slate-300 font-['Orbitron',sans-serif] tabular-nums shrink-0">
          BEST {playerStats.bestDailyStreak}d
        </span>
      </div>

      {/* Minimal 7-Day Visual Graph */}
      <div className="w-full" onMouseLeave={() => setSelectedIndex(null)}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-16 overflow-visible select-none"
          role="img"
          aria-label="Last 7 days daily challenge streak graph"
        >
          <line
            x1={8}
            x2={svgWidth - 8}
            y1={baselineY}
            y2={baselineY}
            stroke="#1e2b45"
            strokeWidth={1}
          />

          {days.map((pt, idx) => {
            const cx = idx * colWidth + colWidth / 2;
            const barX = cx - barWidth / 2;
            const nodeY = getNodeY(pt);
            const barHeight = pt.active ? Math.max(8, baselineY - nodeY) : 4;
            const barY = baselineY - barHeight;
            const isFullClear = pt.active && pt.challengesCompleted >= pt.totalChallenges;
            const isSelected = selectedIndex === idx;

            return (
              <g
                key={pt.dateKey}
                className="cursor-pointer"
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() =>
                  setSelectedIndex((prev) => (prev === idx ? null : idx))
                }
              >
                <rect
                  x={idx * colWidth}
                  y={0}
                  width={colWidth}
                  height={svgHeight}
                  fill="transparent"
                />
                <rect
                  x={barX}
                  y={topY}
                  width={barWidth}
                  height={plotHeight}
                  rx={4}
                  fill="#0b111e"
                  fillOpacity={0.65}
                />
                <rect
                  x={barX}
                  y={pt.active ? barY : baselineY - 4}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill={
                    !pt.active
                      ? '#1a253d'
                      : isFullClear
                      ? '#34d399'
                      : activeTheme.accentHex
                  }
                  fillOpacity={pt.active ? (isSelected ? 1 : 0.8) : 0.6}
                />
              </g>
            );
          })}

          {chainSegments.map((pts, i) => (
            <polyline
              key={i}
              points={pts}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            />
          ))}

          {days.map((pt, idx) => {
            const cx = idx * colWidth + colWidth / 2;
            const cy = getNodeY(pt);
            return (
              <circle
                key={`dot-${pt.dateKey}`}
                cx={cx}
                cy={cy}
                r={pt.isToday ? 3.2 : pt.active ? 2.6 : 1.8}
                fill={pt.active ? '#fbbf24' : '#334155'}
                stroke="#0b111e"
                strokeWidth={1.2}
                className="pointer-events-none"
              />
            );
          })}
        </svg>

        {/* Clean Day Labels */}
        <div className="grid grid-cols-7 gap-0.5 mt-1">
          {days.map((pt, idx) => (
            <button
              key={`lbl-${pt.dateKey}`}
              type="button"
              onClick={() =>
                setSelectedIndex((prev) => (prev === idx ? null : idx))
              }
              style={{
                margin: 0,
                color: pt.isToday
                  ? activeTheme.accentHex
                  : pt.active
                  ? '#cbd5e1'
                  : '#64748b',
              }}
              className="text-[7.5px] font-black font-['Orbitron',sans-serif] py-0.5 rounded hover:bg-white/5 cursor-pointer"
            >
              {pt.isToday ? 'NOW' : pt.dayShort.slice(0, 1)}
            </button>
          ))}
        </div>
      </div>

      {/* Single Quiet Footer Line */}
      <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 font-['Orbitron',sans-serif] pt-1 border-t border-white/5">
        <span>
          {activeDay.isToday
            ? 'TODAY'
            : `${activeDay.monthShort} ${activeDay.dayNumber}`}
        </span>
        <span className="tabular-nums text-slate-300">
          {activeDay.active
            ? `${activeDay.challengesCompleted}/${activeDay.totalChallenges} MISSIONS`
            : 'MISSED'}
        </span>
      </div>
    </div>
  );
};
