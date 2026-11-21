/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { DifficultyModeId } from '../game/types';
import { DIFFICULTY_MODES, DIFFICULTY_ORDER } from '../game/shapes';
import {
  LeaderboardEntry,
  isFirestoreOnline,
  getTierBadgeStyle,
} from '../game/leaderboard';
import { FriendshipRecord } from '../game/friends';
import { PlayerStats, getLevelInfo } from '../game/progression';
import { GameTheme } from '../game/themes';
import { PlayerProfileModal } from './PlayerProfileModal';
import { PlayerAvatar } from './PlayerAvatar';

interface LeaderboardScreenProps {
  entries: LeaderboardEntry[];
  userRank: number;
  userEntry: LeaderboardEntry;
  selectedMode: DifficultyModeId;
  onSelectMode: (mode: DifficultyModeId) => void;
  currentPlayerId: string;
  playerStats: PlayerStats;
  activeTheme: GameTheme;
  friendships: FriendshipRecord[];
  incomingFriendRequests: number;
  isSignedIn: boolean;
  hasPendingSync?: boolean;
  isSyncingCloud?: boolean;
  onSignInGoogle: () => void;
  onRefreshLeaderboard: () => Promise<void> | void;
  onBack: () => void;
  onPlayGame: () => void;
  onOpenNameModal?: () => void;
  onOpenFriends?: () => void;
  onSendFriendRequest: (entry: LeaderboardEntry) => void;
  onAcceptFriendRequest: (friendshipId: string) => void;
  onDeclineFriendRequest: (friendshipId: string) => void;
  onRemoveFriendship: (friendshipId: string) => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  entries,
  userRank,
  userEntry,
  selectedMode,
  onSelectMode,
  currentPlayerId,
  playerStats,
  activeTheme,
  friendships,
  incomingFriendRequests,
  isSignedIn,
  hasPendingSync = false,
  isSyncingCloud = false,
  onSignInGoogle,
  onRefreshLeaderboard,
  onBack,
  onPlayGame,
  onOpenNameModal,
  onOpenFriends,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onRemoveFriendship,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const isOnline = isFirestoreOnline();
  const activeGridCfg = DIFFICULTY_MODES[selectedMode];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshLeaderboard();
    } finally {
      setIsRefreshing(false);
    }
  };

  const list = entries;

  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerId) return null;
    return list.find((p) => p.id === selectedPlayerId) || null;
  }, [list, selectedPlayerId]);

  const relationshipByPlayerId = useMemo(() => {
    const map = new Map<string, FriendshipRecord>();
    friendships.forEach((f) => {
      const otherId = f.fromId === currentPlayerId ? f.toId : f.fromId;
      map.set(otherId, f);
    });
    return map;
  }, [friendships, currentPlayerId]);

  // Filter list by username or tag
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((player) => {
      const matchName = (player.username || '').toLowerCase().includes(q);
      const matchTag = player.tag ? player.tag.toLowerCase().includes(q) : false;
      const full = `${player.username || ''}${player.tag ? `#${player.tag}` : ''}`.toLowerCase();
      return matchName || matchTag || full.includes(q);
    });
  }, [list, searchQuery]);

  const userLevel = userEntry.level ?? getLevelInfo(playerStats.xp).level;

  return (
    <div className="w-full h-full flex flex-col gap-2 overflow-hidden select-none animate-fadeIn">
      {/* Searchable Player Profile Modal */}
      <PlayerProfileModal
        entry={selectedPlayer}
        playerStats={playerStats}
        activeTheme={activeTheme}
        currentPlayerId={currentPlayerId}
        friendships={friendships}
        isSignedIn={isSignedIn}
        onSignInGoogle={onSignInGoogle}
        onEditName={onOpenNameModal}
        onSendFriendRequest={onSendFriendRequest}
        onAcceptFriendRequest={onAcceptFriendRequest}
        onDeclineFriendRequest={onDeclineFriendRequest}
        onRemoveFriendship={onRemoveFriendship}
        onClose={() => setSelectedPlayerId(null)}
      />

      {/* 1. Header: Compact 3-zone row with >= 8px spacing */}
      <header
        style={{ borderColor: activeTheme.surfaceBorder }}
        className="shrink-0 flex items-center justify-between gap-2 pb-2 border-b"
      >
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 min-h-[34px] rounded-xl bg-[#121828] border border-[#1d273f] text-slate-200 hover:text-white text-[10px] sm:text-[11px] font-bold tracking-wider font-['Orbitron',sans-serif] active:scale-95 transition-all cursor-pointer shrink-0 whitespace-nowrap"
        >
          BACK
        </button>

        <div className="flex-1 min-w-0 flex flex-col items-center gap-[5px]">
          <div className="flex items-center justify-center gap-1.5 max-w-full">
            <h2 className="text-xs sm:text-sm font-bold text-white font-['Orbitron',sans-serif] tracking-wider text-center leading-none truncate">
              LEADERBOARD
            </h2>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{ color: activeTheme.accentHex }}
              title="Refresh shared records from global database"
              className="w-7 h-7 rounded-lg bg-[#121828] border border-[#1b263d] flex items-center justify-center hover:text-white transition-all cursor-pointer disabled:opacity-50 box-border shrink-0"
            >
              <svg className={`w-3.5 h-3.5 fill-current ${isRefreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
              </svg>
            </button>
          </div>
          <span
            className={`text-[8px] font-bold tracking-wider font-['Orbitron',sans-serif] flex items-center justify-center gap-1.5 leading-none max-w-full truncate ${
              !isOnline || (isSignedIn && hasPendingSync)
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                !isOnline || (isSignedIn && hasPendingSync)
                  ? 'bg-amber-400'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="truncate">
              {activeGridCfg.boardSize}×{activeGridCfg.boardSize} {activeGridCfg.label} •{' '}
              {isSyncingCloud || isRefreshing
                ? 'SYNCING...'
                : !isOnline
                ? 'OFFLINE CACHE'
                : isSignedIn && hasPendingSync
                ? 'SYNC PENDING'
                : 'LIVE'}{' '}
              • {list.length} {list.length === 1 ? 'PLAYER' : 'PLAYERS'}
            </span>
          </span>
        </div>

        {onOpenNameModal ? (
          <button
            type="button"
            onClick={onOpenNameModal}
            style={{ color: activeTheme.accentHex }}
            className="px-2.5 sm:px-3 py-1.5 min-h-[34px] rounded-xl bg-[#121828] border border-[#1d273f] hover:text-white text-[9.5px] sm:text-[11px] font-bold tracking-wider font-['Orbitron',sans-serif] transition-all cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
            title="Change your player name & photo"
          >
            EDIT NAME
          </button>
        ) : (
          <div className="w-16 shrink-0" />
        )}
      </header>

      {!isSignedIn && (
        <div
          style={{
            backgroundColor: activeTheme.surfaceBg,
            borderColor: activeTheme.surfaceBorder,
          }}
          className="shrink-0 px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2"
        >
          <span className="ml-[6px] text-[8px] font-bold text-slate-300 font-['Orbitron',sans-serif] leading-snug text-left min-w-0 truncate">
            SIGN IN WITH GOOGLE TO PUBLISH GLOBAL SCORES
          </span>
          <button
            type="button"
            onClick={onSignInGoogle}
            style={{
              backgroundColor: activeTheme.primaryBtnBg,
              color: activeTheme.primaryBtnText,
            }}
            className="px-2.5 py-1 rounded-lg text-[8px] font-black font-['Orbitron',sans-serif] tracking-wider cursor-pointer shrink-0 whitespace-nowrap"
          >
            SIGN IN
          </button>
        </div>
      )}

      {/* Per-Grid Leaderboard Switcher (Compact tab pills) */}
      <div
        className="shrink-0 grid grid-cols-4 gap-1.5"
        role="tablist"
        aria-label="Grid leaderboard tabs"
      >
        {DIFFICULTY_ORDER.map((modeId) => {
          const cfg = DIFFICULTY_MODES[modeId];
          const isSelected = selectedMode === modeId;
          return (
            <button
              key={modeId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectMode(modeId)}
              style={{
                backgroundColor: isSelected ? activeTheme.surfaceBg : '#0d1322',
                borderColor: isSelected ? activeTheme.accentHex : activeTheme.surfaceBorder,
                color: isSelected ? activeTheme.accentHex : '#94a3b8',
                boxShadow: isSelected ? `0 0 10px ${activeTheme.accentGlowRgba}` : undefined,
              }}
              className="py-1.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-[5px] transition-all cursor-pointer active:scale-95"
            >
              <span className="text-[10px] font-black font-['Orbitron',sans-serif] leading-none">
                {cfg.boardSize}×{cfg.boardSize}
              </span>
              <span className="text-[7px] font-bold tracking-wider font-['Orbitron',sans-serif] leading-none opacity-90">
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Your Rank & Score Summary Card (Compact, legible, clickable) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setSelectedPlayerId(userEntry.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedPlayerId(userEntry.id);
          }
        }}
        style={{
          backgroundColor: activeTheme.surfaceBg,
          borderColor: activeTheme.accentHex,
        }}
        className="shrink-0 px-3 py-2 rounded-xl border flex items-center justify-between gap-2 shadow-sm cursor-pointer hover:brightness-110 transition-all"
        title="Tap to view your stats & profile"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <PlayerAvatar
            letter={userEntry.avatarLetter}
            avatarUrl={userEntry.avatarUrl}
            sizeClass="w-8 h-8"
            textClass="text-xs"
            accentColor={activeTheme.accentHex}
            bgColor={activeTheme.boardBg}
            borderColor={activeTheme.surfaceBorder}
          />

          <div className="flex flex-col text-left min-w-0 flex-1 gap-[5px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-white font-['Orbitron',sans-serif] truncate leading-none">
                {userEntry.username}
              </span>
              {userEntry.tag && (
                <span className="text-[9.5px] text-slate-400 font-mono leading-none">
                  #{userEntry.tag}
                </span>
              )}
              <span
                style={{
                  color: activeTheme.accentHex,
                  borderColor: activeTheme.surfaceBorder,
                }}
                className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#121c30] border font-['Orbitron',sans-serif] leading-none"
              >
                LV.{userLevel}
              </span>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white font-['Orbitron',sans-serif] leading-none">
                YOU
              </span>
              {!isSignedIn ? (
                <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30 font-['Orbitron',sans-serif] leading-none">
                  LOCAL ONLY
                </span>
              ) : isSyncingCloud ? (
                <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 font-['Orbitron',sans-serif] leading-none">
                  SYNCING
                </span>
              ) : hasPendingSync ? (
                <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30 font-['Orbitron',sans-serif] leading-none">
                  SYNC PENDING
                </span>
              ) : null}
            </div>

            <span className="text-[9.5px] text-slate-400 font-['Orbitron',sans-serif] leading-none truncate">
              {activeGridCfg.boardSize}×{activeGridCfg.boardSize} BEST:{' '}
              <strong className="text-[#f6c445] font-black">{userEntry.score.toLocaleString()}</strong> •{' '}
              <span style={{ color: activeTheme.accentHex }}>PROFILE ›</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 gap-[5px] pl-0 ml-0 mr-[6px]">
          <span className="text-[8px] font-bold text-slate-400 font-['Orbitron',sans-serif] leading-none">
            RANK
          </span>
          <span
            style={{ color: activeTheme.accentHex }}
            className="text-base font-black font-['Orbitron',sans-serif] leading-none tabular-nums"
          >
            #{userRank}
          </span>
        </div>
      </div>

      {/* 3. Search Bar + Friends Button */}
      <div className="shrink-0 flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search player name..."
            className={`h-9 w-full box-border pl-3 ${
              searchQuery ? 'pr-18' : 'pr-3'
            } bg-[#101625] border border-[#1d273f] rounded-xl text-[11px] font-bold text-white font-['Orbitron',sans-serif] focus:outline-none focus:border-[#3debe0]/60 placeholder:text-slate-500 placeholder:font-normal`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 px-2 rounded-lg bg-[#141b2e] hover:bg-[#1a253f] border border-[#233250] text-slate-400 hover:text-white text-[9px] font-bold flex items-center justify-center cursor-pointer transition-colors leading-none"
            >
              CLEAR
            </button>
          )}
        </div>

        {onOpenFriends && (
          <button
            type="button"
            onClick={onOpenFriends}
            style={{
              backgroundColor: activeTheme.surfaceBg,
              borderColor:
                incomingFriendRequests > 0
                  ? activeTheme.accentHex
                  : activeTheme.surfaceBorder,
              color: activeTheme.accentHex,
            }}
            className="h-9 px-3 rounded-xl border text-[9.5px] font-black font-['Orbitron',sans-serif] tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            title="Manage friends & friend requests"
          >
            <span>FRIENDS</span>
            {incomingFriendRequests > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black leading-none">
                {incomingFriendRequests}
              </span>
            )}
          </button>
        )}
      </div>

      {/* 4. Scrollable List (Compact rows so Top 5+ are visible without scrolling) */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1.5 pb-1 custom-scrollbar">
        {filteredList.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-3 text-center">
            <span className="text-xs font-bold font-['Orbitron',sans-serif]">
              No player found matching "{searchQuery}"
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ color: activeTheme.accentHex }}
              className="h-9 px-4 rounded-lg bg-[#121f35] border border-[#253a5e] text-xs hover:text-white font-bold flex items-center justify-center cursor-pointer transition-colors leading-none"
            >
              Reset Search
            </button>
          </div>
        ) : (
          filteredList.map((player) => {
            const tierStyle = getTierBadgeStyle(player.tier);
            const isUser = player.isCurrentUser;
            const playerLevel = player.level ?? 1;
            const rel = !isUser ? relationshipByPlayerId.get(player.id) : undefined;
            const isFriend = rel?.status === 'accepted';
            const isPending = rel?.status === 'pending';

            return (
              <div
                key={player.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPlayerId(player.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPlayerId(player.id);
                  }
                }}
                style={{
                  borderColor: isUser ? activeTheme.accentHex : activeTheme.surfaceBorder,
                  backgroundColor: isUser ? activeTheme.surfaceBg : '#0d1322',
                }}
                className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border transition-all cursor-pointer hover:brightness-110 active:scale-[0.99]"
                title={`View ${player.username}'s profile & stats`}
              >
                {/* Left: Rank & Player Info */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Clean Rank Number */}
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[9.5px] font-black font-['Orbitron',sans-serif] shrink-0 ${
                      player.rank === 1
                        ? 'bg-[#f6c445]/20 text-[#f6c445] border border-[#f6c445]/40'
                        : 'bg-[#141b2e] text-slate-400'
                    }`}
                  >
                    #{player.rank}
                  </div>

                  {/* Avatar */}
                  <PlayerAvatar
                    letter={player.avatarLetter}
                    avatarUrl={player.avatarUrl}
                    sizeClass="w-7 h-7"
                    textClass="text-[10px]"
                    roundedClass="rounded-md"
                    accentColor={isUser ? activeTheme.accentHex : '#cbd5e1'}
                    bgColor="#141d30"
                    borderColor="#1f2d47"
                  />

                  {/* Name, Level Badge and Tier */}
                  <div className="flex flex-col min-w-0 flex-1 text-left gap-[5px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        style={{ color: isUser ? activeTheme.accentHex : '#f1f5f9' }}
                        className="text-[11px] font-bold truncate font-['Orbitron',sans-serif] leading-none"
                      >
                        {player.username}
                      </span>
                      {player.tag && (
                        <span className="text-[9.5px] text-slate-500 font-mono shrink-0 leading-none">
                          #{player.tag}
                        </span>
                      )}
                      <span
                        style={{ color: activeTheme.accentHex }}
                        className="text-[7.5px] font-black px-1.5 py-0.5 rounded bg-[#141e33] border border-[#243456] font-['Orbitron',sans-serif] shrink-0 leading-none"
                      >
                        LV.{playerLevel}
                      </span>
                      {isUser && !isSignedIn && (
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30 font-['Orbitron',sans-serif] leading-none">
                          LOCAL ONLY
                        </span>
                      )}
                      {isFriend && (
                        <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-['Orbitron',sans-serif] leading-none">
                          FRIEND
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30 font-['Orbitron',sans-serif] leading-none">
                          PENDING
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded-full border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border} font-['Orbitron',sans-serif] leading-none`}
                      >
                        {player.tier}
                      </span>
                      <span className="text-[7.5px] font-bold text-slate-400 font-['Orbitron',sans-serif] leading-none">
                        PROFILE ›
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Score */}
                <div className="flex flex-col items-end shrink-0 pl-2 gap-[5px]">
                  <span
                    style={{ color: isUser ? activeTheme.accentHex : '#f6c445' }}
                    className="text-[11.5px] font-black font-['Orbitron',sans-serif] tabular-nums leading-none"
                  >
                    {player.score.toLocaleString()}
                  </span>
                  <span className="text-[7px] text-slate-400 font-['Orbitron',sans-serif] tracking-wider leading-none">
                    {activeGridCfg.boardSize}×{activeGridCfg.boardSize} BEST
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Clean explanatory card */}
        <div
          style={{ borderColor: activeTheme.surfaceBorder }}
          className="p-2.5 rounded-xl bg-[#0e1628]/50 border text-center flex flex-col gap-1.5"
        >
          <span className="text-[9.5px] text-emerald-400 font-bold font-['Orbitron',sans-serif] block leading-snug">
            TAP ANY PLAYER TO VIEW PROFILE OR ADD FRIEND
          </span>
          <span className="text-[8.5px] text-slate-400 font-['Orbitron',sans-serif] block leading-snug">
            Inspect levels, total playtime, longest session, streaks, and send friend requests.
          </span>
        </div>
      </div>

      {/* 5. Fixed Bottom Footer */}
      <footer
        style={{ borderColor: activeTheme.surfaceBorder }}
        className="shrink-0 pt-2 border-t"
      >
        <button
          type="button"
          onClick={onPlayGame}
          style={{
            backgroundColor: activeTheme.primaryBtnBg,
            color: activeTheme.primaryBtnText,
            boxShadow: `0 0 20px ${activeTheme.accentGlowRgba}`,
          }}
          className="w-full py-2.5 min-h-[38px] rounded-2xl font-black tracking-widest text-xs font-['Orbitron',sans-serif] active:scale-95 transition-all cursor-pointer"
        >
          PLAY NOW
        </button>
      </footer>
    </div>
  );
};

