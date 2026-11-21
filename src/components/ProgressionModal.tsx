/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ACHIEVEMENTS,
  DailyChallengeDef,
  PlayerStats,
  getDailyChallenges,
  getLevelInfo,
  getTodayDateKey,
} from '../game/progression';
import { GAME_THEMES, GameTheme } from '../game/themes';
import {
  STREAK_SKIN_MILESTONES,
  isBlockSkinUnlocked,
} from '../game/blockSkins';
import { DailyStreakGraph } from './DailyStreakGraph';

export type ProgressionTab = 'daily' | 'achievements';

interface ProgressionModalProps {
  isOpen: boolean;
  initialTab: ProgressionTab;
  playerStats: PlayerStats;
  bestScore: number;
  activeTheme: GameTheme;
  onClaimChallenge: (challenge: DailyChallengeDef) => void;
  onOpenThemes: () => void;
  onOpenBlockSkins: () => void;
  onClose: () => void;
}

export const ProgressionModal: React.FC<ProgressionModalProps> = ({
  isOpen,
  initialTab,
  playerStats,
  bestScore,
  activeTheme,
  onClaimChallenge,
  onOpenThemes,
  onOpenBlockSkins,
  onClose,
}) => {
  const [tab, setTab] = useState<ProgressionTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const todayKey = getTodayDateKey();
  const challenges = getDailyChallenges(todayKey);
  const levelInfo = getLevelInfo(playerStats.xp);
  const unlockedCount = playerStats.unlockedAchievements.length;
  const bestStreak = Math.max(playerStats.dailyStreak, playerStats.bestDailyStreak);

  const getChallengeProgressValue = (ch: DailyChallengeDef): number => {
    if (playerStats.dailyProgress.date !== todayKey) return 0;
    return playerStats.dailyProgress[ch.metric] || 0;
  };

  return (
    <div
      className="fixed inset-[10px] z-50 flex items-center justify-center p-3.5 sm:p-5 bg-[#070a11]/90 backdrop-blur-md animate-fadeIn select-none rounded-2xl overflow-hidden"
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: activeTheme.cardBg,
          borderColor: activeTheme.cardBorder,
        }}
        className="w-full max-w-sm max-h-full border rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + Slim XP Bar */}
        <div
          style={{ borderColor: activeTheme.surfaceBorder }}
          className="flex flex-col gap-2 border-b pb-3 shrink-0"
        >
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex flex-col gap-1.5 min-w-0">
              <h2 className="text-sm font-black text-white font-['Orbitron',sans-serif] tracking-wider leading-none">
                {tab === 'daily' ? 'DAILY & STREAK' : 'ACHIEVEMENTS'}
              </h2>
              <p className="text-[9px] text-slate-400 font-['Orbitron',sans-serif] tabular-nums leading-snug">
                LV.{levelInfo.level} {levelInfo.rankTitle.toUpperCase()} • {levelInfo.xpIntoLevel}/{levelInfo.xpNeededForNext} XP
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close progression modal"
              style={{ margin: 0 }}
              className="btn-creatyxo-icon rounded-xl bg-[#141d2f] hover:bg-[#1a263d] border border-[#22304d] text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold shrink-0"
            >
              ✕
            </button>
          </div>

          <div className="w-full h-1.5 rounded-full bg-[#131c2e] overflow-hidden">
            <div
              style={{
                width: `${levelInfo.progressPercent}%`,
                backgroundColor: activeTheme.accentHex,
              }}
              className="h-full rounded-full transition-all duration-300"
            />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setTab('daily')}
            style={{
              margin: 0,
              backgroundColor: tab === 'daily' ? activeTheme.surfaceBg : '#0e1524',
              borderColor: tab === 'daily' ? activeTheme.accentHex : activeTheme.surfaceBorder,
              color: tab === 'daily' ? activeTheme.accentHex : '#94a3b8',
            }}
            className="py-2 px-3 rounded-xl border text-[10px] font-black font-['Orbitron',sans-serif] tracking-wider cursor-pointer transition-all"
          >
            DAILY & STREAK
          </button>
          <button
            type="button"
            onClick={() => setTab('achievements')}
            style={{
              margin: 0,
              backgroundColor: tab === 'achievements' ? activeTheme.surfaceBg : '#0e1524',
              borderColor:
                tab === 'achievements' ? activeTheme.accentHex : activeTheme.surfaceBorder,
              color: tab === 'achievements' ? activeTheme.accentHex : '#94a3b8',
            }}
            className="py-2 px-3 rounded-xl border text-[10px] font-black font-['Orbitron',sans-serif] tracking-wider cursor-pointer transition-all"
          >
            AWARDS ({unlockedCount}/{ACHIEVEMENTS.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {tab === 'daily' ? (
            <>
              {/* Unified Streak & 7-Day Visual Graph */}
              <DailyStreakGraph playerStats={playerStats} activeTheme={activeTheme} />

              {/* Compact Streak Skin Milestones */}
              <div
                style={{
                  backgroundColor: '#0e1524',
                  borderColor: activeTheme.surfaceBorder,
                }}
                className="rounded-xl border px-3 py-2.5 flex items-center justify-between gap-2.5 flex-wrap"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                  <span className="text-[8.5px] font-black text-slate-300 font-['Orbitron',sans-serif] shrink-0">
                    SKINS:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {STREAK_SKIN_MILESTONES.map((skin) => {
                      const unlocked = isBlockSkinUnlocked(
                        skin.id,
                        bestStreak,
                        playerStats.unlockedBlockSkins
                      );
                      return (
                        <button
                          key={skin.id}
                          type="button"
                          onClick={onOpenBlockSkins}
                          style={{
                            margin: 0,
                            borderColor: unlocked ? skin.accentHex : '#1f2b45',
                            backgroundColor: unlocked ? activeTheme.surfaceBg : '#0a101d',
                            color: unlocked ? skin.accentHex : '#94a3b8',
                          }}
                          className="px-2 py-1 rounded-md border text-[8px] font-black font-['Orbitron',sans-serif] cursor-pointer hover:brightness-110 transition-all"
                          title={skin.unlockRequirementLabel}
                        >
                          {skin.badgeIcon} {skin.requiredStreakDays}d{unlocked ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenBlockSkins}
                  style={{ margin: 0, color: activeTheme.accentHex }}
                  className="text-[8.5px] font-black font-['Orbitron',sans-serif] hover:underline cursor-pointer shrink-0"
                >
                  VIEW
                </button>
              </div>

              {/* Clean Daily Missions List */}
              <div className="space-y-2">
                {challenges.map((ch) => {
                  const progress = getChallengeProgressValue(ch);
                  const pct = Math.min(100, Math.round((progress / ch.target) * 100));
                  const isCompleted = progress >= ch.target;
                  const isClaimed =
                    playerStats.dailyProgress.date === todayKey &&
                    playerStats.dailyProgress.claimedIds.includes(ch.id);
                  const isClaimable = isCompleted && !isClaimed;

                  return (
                    <div
                      key={ch.id}
                      role={isClaimable ? 'button' : undefined}
                      tabIndex={isClaimable ? 0 : undefined}
                      onClick={() => {
                        if (isClaimable) onClaimChallenge(ch);
                      }}
                      onKeyDown={(e) => {
                        if (isClaimable && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          onClaimChallenge(ch);
                        }
                      }}
                      style={{
                        backgroundColor: isClaimed ? '#0b111e' : activeTheme.surfaceBg,
                        borderColor: isClaimable
                          ? activeTheme.accentHex
                          : activeTheme.surfaceBorder,
                        boxShadow: isClaimable
                          ? `0 0 16px ${activeTheme.accentGlowRgba}`
                          : undefined,
                      }}
                      className={`rounded-xl border px-3.5 py-3 flex items-center justify-between gap-3 transition-all ${
                        isClaimable
                          ? 'cursor-pointer hover:brightness-110 active:scale-[0.99]'
                          : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-white font-['Orbitron',sans-serif] truncate leading-none">
                            {ch.title}
                          </span>
                          <span
                            style={{ color: activeTheme.accentHex }}
                            className="text-[8.5px] font-black font-['Orbitron',sans-serif] shrink-0 leading-none"
                          >
                            +{ch.xpReward} XP
                          </span>
                        </div>

                        <span className="text-[8.5px] text-slate-400 font-['Orbitron',sans-serif] truncate leading-snug">
                          {ch.description}
                        </span>

                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-[#141e33] overflow-hidden">
                            <div
                              style={{
                                width: `${pct}%`,
                                backgroundColor: isCompleted ? '#34d399' : activeTheme.accentHex,
                              }}
                              className="h-full rounded-full transition-all duration-300"
                            />
                          </div>
                          <span className="text-[8px] font-bold text-slate-400 font-['Orbitron',sans-serif] tabular-nums shrink-0">
                            {Math.min(progress, ch.target).toLocaleString()}/{ch.target.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isClaimed ? (
                          <span className="text-[8.5px] font-black px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-['Orbitron',sans-serif]">
                            DONE ✓
                          </span>
                        ) : isCompleted ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClaimChallenge(ch);
                            }}
                            style={{
                              margin: 0,
                              backgroundColor: activeTheme.primaryBtnBg,
                              color: activeTheme.primaryBtnText,
                              boxShadow: `0 0 12px ${activeTheme.accentGlowRgba}`,
                            }}
                            className="min-h-[40px] min-w-[76px] text-[10px] font-black px-4 py-2 rounded-xl font-['Orbitron',sans-serif] tracking-wider cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                          >
                            CLAIM
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 font-['Orbitron',sans-serif] tabular-nums">
                            {pct}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {ACHIEVEMENTS.map((ach) => {
                const isUnlocked = playerStats.unlockedAchievements.includes(ach.id);
                const rewardTheme = ach.unlockThemeId
                  ? GAME_THEMES[ach.unlockThemeId]
                  : null;

                return (
                  <div
                    key={ach.id}
                    style={{
                      backgroundColor: isUnlocked ? activeTheme.surfaceBg : '#0d1322',
                      borderColor: isUnlocked ? activeTheme.accentHex : '#1a2338',
                    }}
                    className={`rounded-xl border p-3 flex items-center justify-between gap-2.5 ${
                      isUnlocked ? '' : 'opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 ${
                          isUnlocked
                            ? 'bg-[#15243c] border-[#2d4a75]'
                            : 'bg-[#121827] border-[#1f2940] grayscale'
                        }`}
                      >
                        {ach.badgeIcon}
                      </div>

                      <div className="flex flex-col text-left min-w-0 gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-white font-['Orbitron',sans-serif] leading-tight">
                            {ach.name}
                          </span>
                          <span
                            style={{ color: activeTheme.accentHex }}
                            className="text-[8.5px] font-bold font-['Orbitron',sans-serif] leading-tight"
                          >
                            +{ach.xpReward} XP
                          </span>
                        </div>

                        <span className="text-[9.5px] text-slate-400 font-['Orbitron',sans-serif] leading-snug">
                          {ach.description}
                        </span>

                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span className="text-[8.5px] font-bold text-slate-300 font-['Orbitron',sans-serif] tabular-nums">
                            {ach.progressLabel(playerStats, bestScore)}
                          </span>
                          {rewardTheme && (
                            <button
                              type="button"
                              onClick={onOpenThemes}
                              style={{
                                margin: 0,
                                borderColor: rewardTheme.swatchPrimary,
                                color: rewardTheme.swatchPrimary,
                              }}
                              className="text-[8px] font-black px-2 py-0.5 rounded border bg-[#111827] font-['Orbitron',sans-serif] cursor-pointer"
                            >
                              UNLOCKS {rewardTheme.name}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isUnlocked ? (
                        <span className="text-[8.5px] font-black px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-['Orbitron',sans-serif]">
                          DONE
                        </span>
                      ) : (
                        <span className="text-[8.5px] font-bold px-2 py-1 rounded-lg bg-[#141b2c] text-slate-500 border border-[#212d47] font-['Orbitron',sans-serif]">
                          LOCKED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            margin: 0,
            backgroundColor: activeTheme.primaryBtnBg,
            color: activeTheme.primaryBtnText,
            boxShadow: `0 0 18px ${activeTheme.accentGlowRgba}`,
          }}
          className="btn-creatyxo w-full rounded-2xl font-black tracking-widest text-xs sm:text-sm font-['Orbitron',sans-serif] cursor-pointer active:scale-95 transition-all shrink-0"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
