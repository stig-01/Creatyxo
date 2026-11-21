/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { LeaderboardEntry, getTierBadgeStyle } from '../game/leaderboard';
import { FriendshipRecord } from '../game/friends';
import {
  ACHIEVEMENTS,
  PlayerStats,
  formatDuration,
  getLevelInfo,
  getRankTitleForLevel,
} from '../game/progression';
import { GameTheme, getGameTheme } from '../game/themes';
import { PlayerAvatar } from './PlayerAvatar';

interface PlayerProfileModalProps {
  entry: LeaderboardEntry | null;
  playerStats?: PlayerStats;
  activeTheme: GameTheme;
  currentPlayerId?: string;
  friendships?: FriendshipRecord[];
  isSignedIn?: boolean;
  authEmail?: string | null;
  hasPendingSync?: boolean;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
  onEditName?: () => void;
  onSendFriendRequest?: (entry: LeaderboardEntry) => void;
  onAcceptFriendRequest?: (friendshipId: string) => void;
  onDeclineFriendRequest?: (friendshipId: string) => void;
  onRemoveFriendship?: (friendshipId: string) => void;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  entry,
  playerStats,
  activeTheme,
  currentPlayerId,
  friendships = [],
  isSignedIn = false,
  authEmail,
  hasPendingSync = false,
  onSignInGoogle,
  onSignOut,
  onEditName,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onRemoveFriendship,
  onClose,
}) => {
  const relationship = useMemo(() => {
    if (!entry || !currentPlayerId || entry.id === currentPlayerId || entry.isCurrentUser) {
      return null;
    }
    return (
      friendships.find(
        (f) =>
          (f.fromId === currentPlayerId && f.toId === entry.id) ||
          (f.toId === currentPlayerId && f.fromId === entry.id)
      ) || null
    );
  }, [entry, currentPlayerId, friendships]);

  if (!entry) return null;

  const isSelf = Boolean(entry.isCurrentUser && playerStats);
  const effectiveXp = isSelf ? playerStats!.xp : entry.xp ?? 0;
  const levelInfo =
    effectiveXp > 0 || isSelf
      ? getLevelInfo(effectiveXp)
      : {
          level: entry.level ?? 1,
          rankTitle: getRankTitleForLevel(entry.level ?? 1),
          xpIntoLevel: 0,
          xpNeededForNext: 200,
          progressPercent: 0,
        };

  const totalPlaytimeSec = isSelf
    ? playerStats!.totalPlaytimeSec
    : entry.totalPlaytimeSec ?? 0;
  const longestSessionSec = isSelf
    ? playerStats!.longestSessionSec
    : entry.longestSessionSec ?? 0;
  const gamesPlayed = isSelf
    ? playerStats!.gamesPlayed
    : entry.gamesPlayed ?? 0;
  const totalLinesCleared = isSelf
    ? playerStats!.totalLinesCleared
    : entry.totalLinesCleared ?? 0;
  const bestCombo = isSelf ? playerStats!.bestCombo : entry.bestCombo ?? 0;
  const dailyStreak = isSelf
    ? playerStats!.dailyStreak
    : entry.dailyStreak ?? 1;
  const achievementsCount = isSelf
    ? playerStats!.unlockedAchievements.length
    : entry.achievementsCount ?? 0;

  const equippedTheme = getGameTheme(
    isSelf ? entry.activeTheme || activeTheme.id : entry.activeTheme
  );
  const tierStyle = getTierBadgeStyle(entry.tier);

  const statItems = [
    {
      label: 'ALL-TIME RECORD',
      value: entry.score.toLocaleString(),
      color: '#f6c445',
    },
    {
      label: 'TOTAL PLAYTIME',
      value: formatDuration(totalPlaytimeSec),
      color: activeTheme.accentHex,
    },
    {
      label: 'LONGEST SESSION',
      value: formatDuration(longestSessionSec),
      color: '#e2e8f0',
    },
    {
      label: 'GAMES PLAYED',
      value: gamesPlayed.toLocaleString(),
      color: '#e2e8f0',
    },
    {
      label: 'LINES CLEARED',
      value: totalLinesCleared.toLocaleString(),
      color: '#34d399',
    },
    {
      label: 'BEST COMBO',
      value: bestCombo > 0 ? `${bestCombo}×` : '—',
      color: '#fb7185',
    },
    {
      label: 'DAILY STREAK',
      value: `${dailyStreak}d`,
      color: '#fbbf24',
    },
    {
      label: 'ACHIEVEMENTS',
      value: `${achievementsCount}/${ACHIEVEMENTS.length}`,
      color: '#c084fc',
    },
  ];

  const isBenchmarkPlayer = Boolean(entry.isBenchmark || entry.id.startsWith('bot_'));
  const canManageFriend = Boolean(
    !isSelf && !isBenchmarkPlayer && currentPlayerId && entry.id !== currentPlayerId
  );
  const isFriend = relationship?.status === 'accepted';
  const isPendingIncoming =
    relationship?.status === 'pending' && relationship.toId === currentPlayerId;
  const isPendingOutgoing =
    relationship?.status === 'pending' && relationship.fromId === currentPlayerId;

  return (
    <div
      className="fixed inset-[10px] z-50 flex items-center justify-center p-3 sm:p-4 bg-[#070a11]/90 backdrop-blur-md animate-fadeIn select-none rounded-2xl overflow-hidden"
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
        {/* Top Row */}
        <div
          style={{ borderColor: activeTheme.surfaceBorder }}
          className="flex items-start justify-between border-b pb-3 shrink-0 gap-2"
        >
          <div className="flex items-center gap-3 min-w-0">
            <PlayerAvatar
              letter={entry.avatarLetter}
              avatarUrl={entry.avatarUrl}
              sizeClass="w-12 h-12"
              textClass="text-lg"
              roundedClass="rounded-2xl"
              accentColor={activeTheme.accentHex}
              bgColor={activeTheme.surfaceBg}
              borderColor={activeTheme.accentHex}
            />

            <div className="flex flex-col min-w-0 gap-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-black text-white font-['Orbitron',sans-serif] truncate">
                  {entry.username}
                </span>
                {entry.tag && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    #{entry.tag}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  style={{
                    color: activeTheme.accentHex,
                    borderColor: activeTheme.accentHex,
                  }}
                  className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-[#11192b] font-['Orbitron',sans-serif]"
                >
                  LV.{levelInfo.level} {levelInfo.rankTitle.toUpperCase()}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border} font-['Orbitron',sans-serif]`}
                >
                  {entry.tier} • #{entry.rank}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close player profile"
            style={{ margin: 0 }}
            className="btn-creatyxo-icon rounded-xl bg-[#141d2f] hover:bg-[#1a263d] border border-[#22304d] text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold shrink-0"
          >
            ✕
          </button>
        </div>

        {/* XP & Equipped Theme Bar */}
        <div
          style={{
            backgroundColor: activeTheme.surfaceBg,
            borderColor: activeTheme.surfaceBorder,
          }}
          className="rounded-xl border p-3 flex flex-col gap-2 shrink-0"
        >
          <div className="flex items-center justify-between text-[9.5px] font-bold font-['Orbitron',sans-serif]">
            <span className="text-slate-300">
              TOTAL XP:{' '}
              <strong style={{ color: activeTheme.accentHex }}>
                {effectiveXp.toLocaleString()}
              </strong>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span
                style={{ backgroundColor: equippedTheme.swatchPrimary }}
                className="w-2.5 h-2.5 rounded-full inline-block"
              />
              {equippedTheme.name}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-[#141e33] overflow-hidden">
            <div
              style={{
                width: `${levelInfo.progressPercent}%`,
                backgroundColor: activeTheme.accentHex,
              }}
              className="h-full rounded-full transition-all"
            />
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-2">
            {statItems.map((item) => (
              <div
                key={item.label}
                style={{
                  backgroundColor: '#0d1322',
                  borderColor: activeTheme.surfaceBorder,
                }}
                className="rounded-xl border p-2.5 flex flex-col justify-center gap-1"
              >
                <span className="text-[8.5px] font-bold text-slate-400 font-['Orbitron',sans-serif] tracking-wider">
                  {item.label}
                </span>
                <span
                  style={{ color: item.color }}
                  className="text-sm font-black font-['Orbitron',sans-serif] tabular-nums"
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          {isSelf && (
            <div
              style={{
                backgroundColor: activeTheme.surfaceBg,
                borderColor: activeTheme.surfaceBorder,
              }}
              className="rounded-xl border px-3 py-2 flex items-center justify-between gap-2"
            >
              <div className="flex flex-col text-left min-w-0">
                <span className="text-[8.5px] font-black font-['Orbitron',sans-serif] text-white tracking-wider">
                  {isSignedIn
                    ? hasPendingSync
                      ? 'CLOUD ACCOUNT • SYNC PENDING'
                      : 'CLOUD ACCOUNT • SYNCED'
                    : 'LOCAL GUEST PROGRESS'}
                </span>
                <span className="text-[8px] text-slate-400 font-['Orbitron',sans-serif] truncate">
                  {isSignedIn
                    ? authEmail || 'Synced across devices'
                    : 'Sign in with Google to carry progress'}
                </span>
              </div>

              {isSignedIn ? (
                onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    style={{ margin: 0 }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#191522] border border-rose-500/30 text-[8.5px] font-bold text-rose-300 hover:bg-rose-500/20 font-['Orbitron',sans-serif] cursor-pointer shrink-0"
                  >
                    SIGN OUT
                  </button>
                )
              ) : (
                onSignInGoogle && (
                  <button
                    type="button"
                    onClick={onSignInGoogle}
                    style={{
                      margin: 0,
                      borderColor: activeTheme.accentHex,
                      color: activeTheme.accentHex,
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#121e33] border text-[8.5px] font-black font-['Orbitron',sans-serif] cursor-pointer hover:brightness-125 shrink-0"
                  >
                    GOOGLE SYNC
                  </button>
                )
              )}
            </div>
          )}

          {isSelf && onEditName && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditName();
              }}
              style={{ margin: 0, borderColor: activeTheme.surfaceBorder }}
              className="btn-creatyxo w-full rounded-xl bg-[#12192a] hover:bg-[#182238] border text-slate-200 hover:text-white font-bold tracking-wider text-xs font-['Orbitron',sans-serif] cursor-pointer active:scale-95 transition-all"
            >
              EDIT NAME & PFP
            </button>
          )}

          {canManageFriend && !isSignedIn && onSignInGoogle && (
            <button
              type="button"
              onClick={onSignInGoogle}
              style={{
                margin: 0,
                borderColor: activeTheme.accentHex,
                color: activeTheme.accentHex,
                backgroundColor: activeTheme.surfaceBg,
              }}
              className="btn-creatyxo w-full rounded-xl border font-black tracking-wider text-xs font-['Orbitron',sans-serif] cursor-pointer hover:brightness-110 active:scale-95 transition-all"
            >
              SIGN IN TO ADD FRIEND
            </button>
          )}

          {canManageFriend && isSignedIn && (
            <>
              {isFriend && relationship ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[10px] font-black font-['Orbitron',sans-serif] text-center tracking-wider">
                    FRIENDS ✓
                  </div>
                  {onRemoveFriendship && (
                    <button
                      type="button"
                      onClick={() => onRemoveFriendship(relationship.id)}
                      style={{ margin: 0 }}
                      className="btn-creatyxo rounded-xl bg-[#1a1420] hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold font-['Orbitron',sans-serif] cursor-pointer"
                    >
                      REMOVE
                    </button>
                  )}
                </div>
              ) : isPendingIncoming && relationship ? (
                <div className="grid grid-cols-2 gap-2">
                  {onAcceptFriendRequest && (
                    <button
                      type="button"
                      onClick={() => onAcceptFriendRequest(relationship.id)}
                      style={{
                        margin: 0,
                        backgroundColor: activeTheme.primaryBtnBg,
                        color: activeTheme.primaryBtnText,
                      }}
                      className="btn-creatyxo rounded-xl text-[10px] font-black font-['Orbitron',sans-serif] tracking-wider cursor-pointer"
                    >
                      ACCEPT FRIEND
                    </button>
                  )}
                  {onDeclineFriendRequest && (
                    <button
                      type="button"
                      onClick={() => onDeclineFriendRequest(relationship.id)}
                      style={{ margin: 0 }}
                      className="btn-creatyxo rounded-xl bg-[#1b1523] border border-rose-500/30 text-rose-300 text-[10px] font-bold font-['Orbitron',sans-serif] cursor-pointer"
                    >
                      DECLINE
                    </button>
                  )}
                </div>
              ) : isPendingOutgoing && relationship ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-bold font-['Orbitron',sans-serif] text-center tracking-wider">
                    REQUEST SENT
                  </div>
                  {onRemoveFriendship && (
                    <button
                      type="button"
                      onClick={() => onRemoveFriendship(relationship.id)}
                      style={{ margin: 0, borderColor: activeTheme.surfaceBorder }}
                      className="btn-creatyxo rounded-xl bg-[#141c2e] border text-slate-300 hover:text-white text-[10px] font-bold font-['Orbitron',sans-serif] cursor-pointer"
                    >
                      CANCEL
                    </button>
                  )}
                </div>
              ) : (
                onSendFriendRequest && (
                  <button
                    type="button"
                    onClick={() => onSendFriendRequest(entry)}
                    style={{
                      margin: 0,
                      borderColor: activeTheme.accentHex,
                      color: activeTheme.accentHex,
                      backgroundColor: activeTheme.surfaceBg,
                    }}
                    className="btn-creatyxo w-full rounded-xl border font-black tracking-wider text-xs font-['Orbitron',sans-serif] cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                  >
                    + SEND FRIEND REQUEST
                  </button>
                )
              )}
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              margin: 0,
              backgroundColor: activeTheme.primaryBtnBg,
              color: activeTheme.primaryBtnText,
              boxShadow: `0 0 18px ${activeTheme.accentGlowRgba}`,
            }}
            className="btn-creatyxo w-full rounded-2xl font-black tracking-widest text-xs sm:text-sm font-['Orbitron',sans-serif] cursor-pointer active:scale-95 transition-all"
          >
            CLOSE PROFILE
          </button>
        </div>
      </div>
    </div>
  );
};

