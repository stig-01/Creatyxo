/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  GAME_THEMES,
  THEME_ORDER,
  ThemeId,
  GameTheme,
  isThemeUnlocked,
} from '../game/themes';
import {
  BLOCK_SKINS,
  BLOCK_SKIN_ORDER,
  BlockSkinId,
  isBlockSkinUnlocked,
} from '../game/blockSkins';
import { COLOR_THEMES } from '../game/shapes';
import { BlockSkinOverlay } from './BlockSkinOverlay';

export type ThemesModalTab = 'themes' | 'skins';

interface ThemesModalProps {
  isOpen: boolean;
  initialTab?: ThemesModalTab;
  activeThemeId: ThemeId;
  previewThemeId: ThemeId | null;
  activeTheme: GameTheme;
  unlockedAchievements: string[];
  activeBlockSkinId: BlockSkinId;
  previewBlockSkinId: BlockSkinId | null;
  bestDailyStreak: number;
  unlockedBlockSkins: BlockSkinId[];
  onSelectTheme: (themeId: ThemeId) => void;
  onPreviewTheme: (themeId: ThemeId) => void;
  onSelectBlockSkin: (skinId: BlockSkinId) => void;
  onPreviewBlockSkin: (skinId: BlockSkinId) => void;
  onClose: () => void;
}

export const ThemesModal: React.FC<ThemesModalProps> = ({
  isOpen,
  initialTab = 'themes',
  activeThemeId,
  previewThemeId,
  activeTheme,
  unlockedAchievements,
  activeBlockSkinId,
  previewBlockSkinId,
  bestDailyStreak,
  unlockedBlockSkins,
  onSelectTheme,
  onPreviewTheme,
  onSelectBlockSkin,
  onPreviewBlockSkin,
  onClose,
}) => {
  const [tab, setTab] = useState<ThemesModalTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const unlockedCount = THEME_ORDER.filter((id) =>
    isThemeUnlocked(id, unlockedAchievements)
  ).length;

  const unlockedSkinsCount = BLOCK_SKIN_ORDER.filter((id) =>
    isBlockSkinUnlocked(id, bestDailyStreak, unlockedBlockSkins)
  ).length;

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
        className="w-full max-w-sm max-h-full border rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{ borderColor: activeTheme.surfaceBorder }}
          className="flex items-center justify-between gap-2.5 border-b pb-3 shrink-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              style={{
                backgroundColor: activeTheme.surfaceBg,
                borderColor: activeTheme.surfaceBorder,
                color: activeTheme.accentHex,
              }}
              className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <h2 className="text-sm font-black text-white font-['Orbitron',sans-serif] tracking-wider truncate leading-none">
                {tab === 'themes' ? 'BOARD THEMES' : 'BLOCK SKINS'}
              </h2>
              <p className="text-[9.5px] text-slate-400 font-['Orbitron',sans-serif] tracking-wide leading-snug">
                {tab === 'themes'
                  ? `${unlockedCount}/${THEME_ORDER.length} UNLOCKED • PREVIEW ANY THEME`
                  : `${unlockedSkinsCount}/${BLOCK_SKIN_ORDER.length} UNLOCKED • STREAK REWARDS`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close themes modal"
            style={{ margin: 0 }}
            className="btn-creatyxo-icon rounded-xl bg-[#141d2f] hover:bg-[#1a263d] border border-[#22304d] text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setTab('themes')}
            style={{
              margin: 0,
              backgroundColor: tab === 'themes' ? activeTheme.surfaceBg : '#0e1524',
              borderColor: tab === 'themes' ? activeTheme.accentHex : activeTheme.surfaceBorder,
              color: tab === 'themes' ? activeTheme.accentHex : '#94a3b8',
            }}
            className="py-2 px-3 rounded-xl border text-[9.5px] font-black font-['Orbitron',sans-serif] tracking-wider cursor-pointer transition-all"
          >
            THEMES ({unlockedCount}/{THEME_ORDER.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('skins')}
            style={{
              margin: 0,
              backgroundColor: tab === 'skins' ? activeTheme.surfaceBg : '#0e1524',
              borderColor: tab === 'skins' ? activeTheme.accentHex : activeTheme.surfaceBorder,
              color: tab === 'skins' ? activeTheme.accentHex : '#94a3b8',
            }}
            className="py-2 px-3 rounded-xl border text-[9.5px] font-black font-['Orbitron',sans-serif] tracking-wider cursor-pointer transition-all"
          >
            BLOCK SKINS ({unlockedSkinsCount}/{BLOCK_SKIN_ORDER.length})
          </button>
        </div>

        {/* List Body */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {tab === 'themes' ? (
            THEME_ORDER.map((id) => {
              const theme = GAME_THEMES[id];
              const unlocked = isThemeUnlocked(id, unlockedAchievements);
              const isEquipped = activeThemeId === id && !previewThemeId;
              const isPreviewing = previewThemeId === id;

              return (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  onClick={() => (unlocked ? onSelectTheme(id) : onPreviewTheme(id))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (unlocked) onSelectTheme(id);
                      else onPreviewTheme(id);
                    }
                  }}
                  style={{
                    backgroundColor: isEquipped || isPreviewing ? theme.surfaceBg : '#0e1524',
                    borderColor:
                      isEquipped || isPreviewing
                        ? theme.accentHex
                        : unlocked
                        ? theme.surfaceBorder
                        : '#1a2338',
                    boxShadow:
                      isEquipped || isPreviewing
                        ? `0 0 16px ${theme.accentGlowRgba}`
                        : undefined,
                  }}
                  className="w-full rounded-xl border p-3 flex items-center justify-between gap-3 text-left transition-all box-border cursor-pointer hover:brightness-110 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      style={{
                        backgroundColor: theme.boardBg,
                        borderColor: theme.accentHex,
                      }}
                      className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 relative overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-1 p-1.5 w-full h-full">
                        <span
                          style={{ backgroundColor: theme.swatchPrimary }}
                          className="rounded-[2px] w-full h-full"
                        />
                        <span
                          style={{ backgroundColor: theme.emptyCellBg }}
                          className="rounded-[2px] w-full h-full"
                        />
                        <span
                          style={{ backgroundColor: theme.emptyCellBg }}
                          className="rounded-[2px] w-full h-full"
                        />
                        <span
                          style={{ backgroundColor: theme.swatchSecondary }}
                          className="rounded-[2px] w-full h-full"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0 text-left items-start gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          style={{ color: theme.accentHex }}
                          className="text-xs font-black font-['Orbitron',sans-serif] tracking-wide leading-tight"
                        >
                          {theme.name}
                        </span>
                        {!theme.isStarter && (
                          <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30 font-['Orbitron',sans-serif]">
                            {unlocked ? 'EARNED' : 'LOCKED'}
                          </span>
                        )}
                      </div>

                      <span className="text-[9.5px] text-slate-400 font-['Orbitron',sans-serif] leading-snug text-left">
                        {unlocked ? theme.tagline : theme.unlockRequirementLabel}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isEquipped ? (
                      <span
                        style={{
                          backgroundColor: theme.primaryBtnBg,
                          color: theme.primaryBtnText,
                        }}
                        className="text-[9px] font-black px-2.5 py-1 rounded-lg font-['Orbitron',sans-serif] tracking-wider"
                      >
                        EQUIPPED
                      </span>
                    ) : unlocked ? (
                      <span className="text-[9px] font-bold px-2.5 py-1 rounded-lg bg-[#162136] border border-[#263859] text-slate-200 font-['Orbitron',sans-serif] tracking-wider">
                        EQUIP
                      </span>
                    ) : isPreviewing ? (
                      <span
                        style={{
                          borderColor: theme.accentHex,
                          color: theme.accentHex,
                        }}
                        className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-[#121827] border font-['Orbitron',sans-serif] tracking-wider"
                      >
                        PREVIEWING
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewTheme(id);
                        }}
                        style={{
                          margin: 0,
                          borderColor: theme.accentHex,
                          color: theme.accentHex,
                        }}
                        className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-[#121827] border hover:brightness-125 font-['Orbitron',sans-serif] tracking-wider cursor-pointer"
                      >
                        PREVIEW
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            BLOCK_SKIN_ORDER.map((skinId) => {
              const skin = BLOCK_SKINS[skinId];
              const unlocked = isBlockSkinUnlocked(
                skinId,
                bestDailyStreak,
                unlockedBlockSkins
              );
              const isEquipped = activeBlockSkinId === skinId && !previewBlockSkinId;
              const isPreviewing = previewBlockSkinId === skinId;
              const progressDays = Math.min(skin.requiredStreakDays, bestDailyStreak);
              const progressPct =
                skin.requiredStreakDays > 0
                  ? Math.min(100, Math.round((progressDays / skin.requiredStreakDays) * 100))
                  : 100;

              return (
                <div
                  key={skinId}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    unlocked ? onSelectBlockSkin(skinId) : onPreviewBlockSkin(skinId)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (unlocked) onSelectBlockSkin(skinId);
                      else onPreviewBlockSkin(skinId);
                    }
                  }}
                  style={{
                    backgroundColor:
                      isEquipped || isPreviewing ? activeTheme.surfaceBg : '#0e1524',
                    borderColor:
                      isEquipped || isPreviewing
                        ? skin.accentHex
                        : unlocked
                        ? activeTheme.surfaceBorder
                        : '#1a2338',
                    boxShadow:
                      isEquipped || isPreviewing
                        ? `0 0 16px ${skin.accentHex}44`
                        : undefined,
                  }}
                  className="w-full rounded-xl border p-3 flex items-center justify-between gap-3 text-left transition-all box-border cursor-pointer hover:brightness-110 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Live 2x2 Block Swatch using the real cosmetic skin overlay */}
                    <div
                      style={{
                        backgroundColor: activeTheme.boardBg,
                        borderColor: skin.accentHex,
                      }}
                      className="w-12 h-12 rounded-xl border p-1 grid grid-cols-2 gap-1 shrink-0"
                    >
                      {(['cyan', 'orange', 'purple', 'green'] as const).map((clr) => {
                        const cTheme = COLOR_THEMES[clr];
                        return (
                          <div
                            key={clr}
                            className={`relative rounded-[3px] border ${cTheme.solid} ${cTheme.shadow} ${cTheme.border} overflow-hidden`}
                          >
                            <BlockSkinOverlay skinId={skinId} compact />
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1 text-left items-start gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          style={{ color: skin.accentHex }}
                          className="text-xs font-black font-['Orbitron',sans-serif] tracking-wide leading-tight"
                        >
                          {skin.badgeIcon} {skin.name}
                        </span>
                        {!skin.isStarter && (
                          <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30 font-['Orbitron',sans-serif]">
                            {unlocked ? 'UNLOCKED' : `${skin.requiredStreakDays}D STREAK`}
                          </span>
                        )}
                      </div>

                      <span className="text-[9px] text-slate-400 font-['Orbitron',sans-serif] leading-snug text-left">
                        {unlocked ? skin.tagline : skin.unlockRequirementLabel}
                      </span>

                      {!unlocked && (
                        <div className="w-full flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-[#131c2e] overflow-hidden">
                            <div
                              style={{
                                width: `${progressPct}%`,
                                backgroundColor: skin.accentHex,
                              }}
                              className="h-full rounded-full transition-all"
                            />
                          </div>
                          <span className="text-[8px] font-bold text-slate-300 font-['Orbitron',sans-serif] tabular-nums shrink-0">
                            {progressDays}/{skin.requiredStreakDays}d
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isEquipped ? (
                      <span
                        style={{
                          backgroundColor: activeTheme.primaryBtnBg,
                          color: activeTheme.primaryBtnText,
                        }}
                        className="text-[9px] font-black px-2.5 py-1 rounded-lg font-['Orbitron',sans-serif] tracking-wider"
                      >
                        EQUIPPED
                      </span>
                    ) : unlocked ? (
                      <span className="text-[9px] font-bold px-2.5 py-1 rounded-lg bg-[#162136] border border-[#263859] text-slate-200 font-['Orbitron',sans-serif] tracking-wider">
                        EQUIP
                      </span>
                    ) : isPreviewing ? (
                      <span
                        style={{
                          borderColor: skin.accentHex,
                          color: skin.accentHex,
                        }}
                        className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-[#121827] border font-['Orbitron',sans-serif] tracking-wider"
                      >
                        PREVIEWING
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewBlockSkin(skinId);
                        }}
                        style={{
                          margin: 0,
                          borderColor: skin.accentHex,
                          color: skin.accentHex,
                        }}
                        className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-[#121827] border hover:brightness-125 font-['Orbitron',sans-serif] tracking-wider cursor-pointer"
                      >
                        PREVIEW
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Close Button */}
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
          DONE
        </button>
      </div>
    </div>
  );
};
