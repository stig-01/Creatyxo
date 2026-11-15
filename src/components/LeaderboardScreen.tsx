/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  PlayerProfile,
  LeaderboardEntry,
  buildLeaderboard,
  fetchSharedLeaderboard,
  subscribeToLeaderboardUpdates,
  isFirestoreOnline,
  getTierBadgeStyle,
  getPlayerId,
} from '../game/leaderboard';
import { FriendshipRecord } from '../game/friends';
import { PlayerStats, getLevelInfo } from '../game/progression';
import { GameTheme } from '../game/themes';
import { PlayerProfileModal } from './PlayerProfileModal';
import { PlayerAvatar } from './PlayerAvatar';

interface LeaderboardScreenProps {
  playerProfile: PlayerProfile;
  bestScore: number;
  playerStats: PlayerStats;
  activeTheme: GameTheme;
  equippedThemeId: string;
  friendships: FriendshipRecord[];
  incomingFriendRequests: number;
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
  playerProfile,
  bestScore,
  playerStats,
  activeTheme,
  equippedThemeId,
  friendships,
  incomingFriendRequests,
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
  const [isOnline, setIsOnline] = useState(() => isFirestoreOnline());
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const currentPlayerId = useMemo(() => getPlayerId(), []);

  // Synchronous initial fallback so UI renders instantaneously
  const [leaderboardData, setLeaderboardData] = useState(() => {
    return buildLeaderboard(playerProfile, bestScore, playerStats, equippedThemeId);
  });

  const refreshSharedBoard = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchSharedLeaderboard(
        playerProfile,
        bestScore,
        playerStats,
        equippedThemeId
      );
      setLeaderboardData(data);
      setIsOnline(isFirestoreOnline());
    } catch {
      // Keep existing data
    } finally {
      setIsRefreshing(false);
    }
  }, [playerProfile, bestScore, playerStats, equippedThemeId]);

  // Fetch live shared leaderboard on mount and subscribe to real-time updates
  useEffect(() => {
    refreshSharedBoard();
    const unsubscribe = subscribeToLeaderboardUpdates(() => {
      refreshSharedBoard();
    });
    return () => {
      unsubscribe();
    };
  }, [refreshSharedBoard]);

  const { list, userRank, userEntry } = leaderboardData;

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
    <div className="w-full h-full flex flex-col overflow-hidden select-none animate-fadeIn">
      {/* Searchable Player Profile Modal */}
      <PlayerProfileModal
        entry={selectedPlayer}
        playerStats={playerStats}
        activeTheme={activeTheme}
        currentPlayerId={currentPlayerId}
        friendships={friendships}
        onEditName={onOpenNameModal}
        onSendFriendRequest={onSendFriendRequest}
        onAcceptFriendRequest={onAcceptFriendRequest}
        onDeclineFriendRequest={onDeclineFriendRequest}
        onRemoveFriendship={onRemoveFriendship}
        onClose={() => setSelectedPlayerId(null)}
      />

      {/* 1. Header: Corner buttons have 10px margins away from screen border and >=4px from neighbors */}
      <header
        style={{ borderColor: activeTheme.surfaceBorder }}
        className="shrink-0 flex items-center justify-between pb-2.5 pt-1 px-1 sm:px-3 border-b"
      >
        <button
          type="button"
          onClick={onBack}
          style={{ marginLeft: 10, marginTop: 10, marginRight: 4, marginBottom: 4 }}
          className="btn-creatyxo rounded-xl bg-[#121828] border border-[#1d273f] text-slate-200 hover:text-white text-xs font-bold tracking-wider font-['Orbitron',sans-serif] active:scale-95 transition-all cursor-pointer"
        >
          BACK
        </button>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white font-['Orbitron',sans-serif] tracking-wider text-center leading-normal">
              LEADERBOARD
            </h2>
            <button
              type="button"
              onClick={refreshSharedBoard}
              disabled={isRefreshing}
              style={{ margin: 4, color: activeTheme.accentHex }}
              title="Refresh shared records from global database"
              className="w-8 h-8 rounded-lg bg-[#121828] border border-[#1b263d] flex items-center justify-center hover:text-white transition-all cursor-pointer disabled:opacity-50 box-border"
            >
              <svg className={`w-3.5 h-3.5 fill-current ${isRefreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
              </svg>
            </button>
          </div>
          <span
            className={`text-[8px] font-bold tracking-widest font-['Orbitron',sans-serif] flex items-center gap-1.5 mt-1 leading-normal ${
              isOnline ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {isOnline ? 'LIVE GLOBAL SYNC' : 'OFFLINE CACHE'} ({list.length}{' '}
            {list.length === 1 ? 'PLAYER' : 'PLAYERS'})
          </span>
        </div>

        {onOpenNameModal ? (
          <button
            type="button"
            onClick={onOpenNameModal}
            style={{
              marginRight: 10,
              marginTop: 10,
              marginLeft: 4,
              marginBottom: 4,
              color: activeTheme.accentHex,
            }}
            className="btn-creatyxo rounded-xl bg-[#121828] border border-[#1d273f] hover:text-white text-xs font-bold tracking-wider font-['Orbitron',sans-serif] transition-all cursor-pointer active:scale-95"
            title="Change your player name & photo"
          >
            EDIT NAME
          </button>
        ) : (
          <div className="w-16 mr-2" />
        )}
      </header>

      {/* 2. Your Rank Summary Card (Clickable to open own full stats profile) */}
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
          marginLeft: 10,
          marginRight: 10,
          backgroundColor: activeTheme.surfaceBg,
          borderColor: activeTheme.accentHex,
        }}
        className="shrink-0 my-2 p-2.5 rounded-xl border flex items-center justify-between shadow-sm cursor-pointer hover:brightness-110 transition-all"
        title="Tap to view your stats & profile"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <PlayerAvatar
            letter={userEntry.avatarLetter}
            avatarUrl={userEntry.avatarUrl}
            sizeClass="w-9 h-9"
            textClass="text-xs"
            accentColor={activeTheme.accentHex}
            bgColor={activeTheme.boardBg}
            borderColor={activeTheme.surfaceBorder}
          />

          <div className="flex flex-col text-left min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white font-['Orbitron',sans-serif] truncate">
                {userEntry.username}
              </span>
              {userEntry.tag && (
                <span className="text-[10px] text-slate-500 font-mono">
                  #{userEntry.tag}
                </span>
              )}
              <span
                style={{
                  color: activeTheme.accentHex,
                  borderColor: activeTheme.surfaceBorder,
                }}
                className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#121c30] border font-['Orbitron',sans-serif]"
              >
                LV.{userLevel}
              </span>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white font-['Orbitron',sans-serif]">
                YOU
              </span>
            </div>

            <span className="text-[10px] text-slate-400 font-['Orbitron',sans-serif] mt-1">
              BEST: <strong className="text-[#f6c445] font-black">{userEntry.score.toLocaleString()}</strong> •{' '}
              <span style={{ color: activeTheme.accentHex }}>VIEW PROFILE ›</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 pl-2">
          <span className="text-[9px] font-bold text-slate-400 font-['Orbitron',sans-serif]">
            RANK
          </span>
          <span
            style={{ color: activeTheme.accentHex }}
            className="text-lg font-black font-['Orbitron',sans-serif]"
          >
            #{userRank}
          </span>
        </div>
      </div>

      {/* 3. Search Bar + Friends Button */}
      <div
        style={{ marginLeft: 10, marginRight: 10, marginTop: 6, marginBottom: 10 }}
        className="shrink-0 flex items-center gap-2"
      >
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search player name..."
            className={`h-11 w-full box-border pl-3.5 ${
              searchQuery ? 'pr-20' : 'pr-3.5'
            } bg-[#101625] border border-[#1d273f] rounded-xl text-xs font-bold text-white font-['Orbitron',sans-serif] focus:outline-none focus:border-[#3debe0]/60 placeholder:text-slate-500 placeholder:font-normal`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ margin: 0 }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2.5 rounded-lg bg-[#141b2e] hover:bg-[#1a253f] border border-[#233250] text-slate-400 hover:text-white text-[10px] font-bold flex items-center justify-center cursor-pointer transition-colors leading-none"
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
              margin: 0,
              backgroundColor: activeTheme.surfaceBg,
              borderColor:
                incomingFriendRequests > 0
                  ? activeTheme.accentHex
                  : activeTheme.surfaceBorder,
              color: activeTheme.accentHex,
            }}
            className="relative h-11 px-3 rounded-xl border text-[10px] font-black font-['Orbitron',sans-serif] tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Manage friends & friend requests"
          >
            FRIENDS
            {incomingFriendRequests > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black leading-none">
                {incomingFriendRequests}
              </span>
            )}
          </button>
        )}
      </div>

      {/* 4. Scrollable List with Themed Scrollbar */}
      <div
        style={{ marginLeft: 10, marginRight: 10, marginTop: 4 }}
        className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1.5 custom-scrollbar"
      >
        {filteredList.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2 text-center">
            <span className="text-xs font-bold font-['Orbitron',sans-serif]">
              No player found matching "{searchQuery}"
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ color: activeTheme.accentHex }}
              className="h-8 px-4 rounded-lg bg-[#121f35] border border-[#253a5e] text-xs hover:text-white font-bold flex items-center justify-center cursor-pointer transition-colors leading-none m-1"
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
                className="flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all cursor-pointer hover:brightness-110 active:scale-[0.99]"
                title={`View ${player.username}'s profile & stats`}
              >
                {/* Left: Rank & Player Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Clean Rank Number */}
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black font-['Orbitron',sans-serif] shrink-0 ${
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
                  <div className="flex flex-col min-w-0 text-left gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        style={{ color: isUser ? activeTheme.accentHex : '#f1f5f9' }}
                        className="text-xs font-bold truncate font-['Orbitron',sans-serif]"
                      >
                        {player.username}
                      </span>
                      {player.tag && (
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          #{player.tag}
                        </span>
                      )}
                      <span
                        style={{ color: activeTheme.accentHex }}
                        className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#141e33] border border-[#243456] font-['Orbitron',sans-serif] shrink-0"
                      >
                        LV.{playerLevel}
                      </span>
                      {isFriend && (
                        <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-['Orbitron',sans-serif]">
                          FRIEND
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30 font-['Orbitron',sans-serif]">
                          PENDING
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border} font-['Orbitron',sans-serif]`}
                      >
                        {player.tier}
                      </span>
                      <span className="text-[7.5px] font-bold text-slate-500 font-['Orbitron',sans-serif]">
                        PROFILE ›
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Score */}
                <div className="flex flex-col items-end shrink-0 pl-2 gap-0.5">
                  <span
                    style={{ color: isUser ? activeTheme.accentHex : '#f6c445' }}
                    className="text-xs font-black font-['Orbitron',sans-serif] tabular-nums"
                  >
                    {player.score.toLocaleString()}
                  </span>
                  <span className="text-[7px] text-slate-500 font-['Orbitron',sans-serif] tracking-wider mt-1">
                    BEST SCORE
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Clean explanatory card */}
        <div
          style={{ marginTop: 9, marginBottom: 0, borderColor: activeTheme.surfaceBorder }}
          className="p-3 rounded-xl bg-[#0e1628]/50 border text-center"
        >
          <span className="text-[10px] text-emerald-400 font-bold font-['Orbitron',sans-serif] block">
            TAP ANY PLAYER TO VIEW PROFILE OR ADD FRIEND
          </span>
          <span className="text-[9px] text-slate-400 font-['Orbitron',sans-serif] mt-1 block">
            Inspect levels, total playtime, longest session, streaks, and send friend requests.
          </span>
        </div>
      </div>

      {/* 5. Fixed Bottom Footer: 10px clearance from screen border */}
      <footer
        style={{ paddingLeft: 10, paddingRight: 10, borderColor: activeTheme.surfaceBorder }}
        className="shrink-0 pt-3 pb-2.5 border-t mt-auto mb-2.5"
      >
        <button
          type="button"
          onClick={onPlayGame}
          style={{
            margin: 0,
            backgroundColor: activeTheme.primaryBtnBg,
            color: activeTheme.primaryBtnText,
            boxShadow: `0 0 20px ${activeTheme.accentGlowRgba}`,
          }}
          className="btn-creatyxo w-full rounded-2xl font-black tracking-widest text-xs sm:text-sm font-['Orbitron',sans-serif] active:scale-95 transition-all cursor-pointer"
        >
          PLAY NOW
        </button>
      </footer>
    </div>
  );
};

