/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { LeaderboardEntry, getTierBadgeStyle } from '../game/leaderboard';
import { FriendshipRecord } from '../game/friends';
import { GameTheme } from '../game/themes';
import { PlayerAvatar } from './PlayerAvatar';

interface FriendsModalProps {
  isOpen: boolean;
  currentPlayerId: string;
  allPlayers: LeaderboardEntry[];
  friendships: FriendshipRecord[];
  activeTheme: GameTheme;
  onSendRequest: (target: LeaderboardEntry) => void;
  onAcceptRequest: (friendshipId: string) => void;
  onDeclineRequest: (friendshipId: string) => void;
  onRemoveFriendship: (friendshipId: string) => void;
  onSelectPlayer: (entry: LeaderboardEntry) => void;
  onClose: () => void;
}

type FriendsTab = 'friends' | 'requests' | 'find';

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  currentPlayerId,
  allPlayers,
  friendships,
  activeTheme,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriendship,
  onSelectPlayer,
  onClose,
}) => {
  const [tab, setTab] = useState<FriendsTab>('friends');
  const [searchQuery, setSearchQuery] = useState('');

  const playerMap = useMemo(() => {
    const map = new Map<string, LeaderboardEntry>();
    allPlayers.forEach((p) => map.set(p.id, p));
    return map;
  }, [allPlayers]);

  const { accepted, incomingPending, outgoingPending } = useMemo(() => {
    const acc: Array<{ friendship: FriendshipRecord; otherId: string; entry?: LeaderboardEntry }> = [];
    const inc: Array<{ friendship: FriendshipRecord; otherId: string; entry?: LeaderboardEntry }> = [];
    const out: Array<{ friendship: FriendshipRecord; otherId: string; entry?: LeaderboardEntry }> = [];

    friendships.forEach((f) => {
      const otherId = f.fromId === currentPlayerId ? f.toId : f.fromId;
      const entry = playerMap.get(otherId);
      if (f.status === 'accepted') {
        acc.push({ friendship: f, otherId, entry });
      } else if (f.status === 'pending') {
        if (f.toId === currentPlayerId) {
          inc.push({ friendship: f, otherId, entry });
        } else {
          out.push({ friendship: f, otherId, entry });
        }
      }
    });

    return { accepted: acc, incomingPending: inc, outgoingPending: out };
  }, [friendships, currentPlayerId, playerMap]);

  const relationshipByOtherId = useMemo(() => {
    const map = new Map<string, FriendshipRecord>();
    friendships.forEach((f) => {
      const otherId = f.fromId === currentPlayerId ? f.toId : f.fromId;
      map.set(otherId, f);
    });
    return map;
  }, [friendships, currentPlayerId]);

  const discoverablePlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allPlayers.filter((p) => {
      if (p.id === currentPlayerId || p.isCurrentUser) return false;
      if (!q) return true;
      const full = `${p.username}${p.tag ? `#${p.tag}` : ''}`.toLowerCase();
      return p.username.toLowerCase().includes(q) || full.includes(q);
    });
  }, [allPlayers, currentPlayerId, searchQuery]);

  if (!isOpen) return null;

  const totalRequests = incomingPending.length + outgoingPending.length;

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
        className="w-full max-w-sm max-h-full border rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{ borderColor: activeTheme.surfaceBorder }}
          className="flex items-center justify-between border-b pb-3 shrink-0"
        >
          <div className="min-w-0">
            <h2 className="text-sm font-black text-white font-['Orbitron',sans-serif] tracking-wider">
              FRIENDS & REQUESTS
            </h2>
            <p className="text-[9.5px] text-slate-400 font-['Orbitron',sans-serif] mt-0.5">
              {accepted.length} {accepted.length === 1 ? 'FRIEND' : 'FRIENDS'} •{' '}
              {incomingPending.length} INCOMING
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close friends modal"
            style={{ margin: 0 }}
            className="btn-creatyxo-icon rounded-xl bg-[#141d2f] hover:bg-[#1a263d] border border-[#22304d] text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setTab('friends')}
            style={{
              margin: 0,
              backgroundColor: tab === 'friends' ? activeTheme.surfaceBg : '#0e1524',
              borderColor: tab === 'friends' ? activeTheme.accentHex : activeTheme.surfaceBorder,
              color: tab === 'friends' ? activeTheme.accentHex : '#94a3b8',
            }}
            className="py-2 px-2 rounded-xl border text-[9.5px] font-black font-['Orbitron',sans-serif] tracking-wider cursor-pointer transition-all"
          >
            FRIENDS ({accepted.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('requests')}
            style={{
              margin: 0,
              backgroundColor: tab === 'requests' ? activeTheme.surfaceBg : '#0e1524',
              borderColor: tab === 'requests' ? activeTheme.accentHex : activeTheme.surfaceBorder,
              color: tab === 'requests' ? activeTheme.accentHex : '#94a3b8',
            }}
            className="relative py-2 px-2 rounded-xl border text-[9.5px] font-black font-['Orbitron',sans-serif] tracking-wider cursor-pointer transition-all"
          >
            REQUESTS ({totalRequests})
            {incomingPending.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-400 absolute top-1 right-1 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('find')}
            style={{
              margin: 0,
              backgroundColor: tab === 'find' ? activeTheme.surfaceBg : '#0e1524',
              borderColor: tab === 'find' ? activeTheme.accentHex : activeTheme.surfaceBorder,
              color: tab === 'find' ? activeTheme.accentHex : '#94a3b8',
            }}
            className="py-2 px-2 rounded-xl border text-[9.5px] font-black font-['Orbitron',sans-serif] tracking-wider cursor-pointer transition-all"
          >
            ADD PLAYER
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {tab === 'friends' && (
            <>
              {accepted.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center gap-2.5">
                  <span className="text-xs font-bold text-slate-300 font-['Orbitron',sans-serif]">
                    No friends added yet
                  </span>
                  <span className="text-[9.5px] text-slate-400 font-['Orbitron',sans-serif] max-w-[230px] leading-relaxed">
                    Search players in the Add Player tab or Leaderboard and send a friend request!
                  </span>
                  <button
                    type="button"
                    onClick={() => setTab('find')}
                    style={{
                      margin: 0,
                      backgroundColor: activeTheme.primaryBtnBg,
                      color: activeTheme.primaryBtnText,
                    }}
                    className="px-4 py-2 rounded-xl text-[10px] font-black font-['Orbitron',sans-serif] tracking-wider cursor-pointer"
                  >
                    FIND PLAYERS
                  </button>
                </div>
              ) : (
                accepted.map(({ friendship, entry, otherId }) => {
                  const fallbackName =
                    friendship.fromId === currentPlayerId
                      ? friendship.toUsername
                      : friendship.fromUsername;
                  const displayName = entry?.username || fallbackName;
                  const level = entry?.level ?? 1;
                  const tier = entry?.tier || 'Bronze';
                  const tierStyle = getTierBadgeStyle(tier);

                  return (
                    <div
                      key={friendship.id}
                      style={{
                        backgroundColor: activeTheme.surfaceBg,
                        borderColor: activeTheme.surfaceBorder,
                      }}
                      className="rounded-xl border p-2.5 flex items-center justify-between gap-2"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => entry && onSelectPlayer(entry)}
                        onKeyDown={(e) => {
                          if (entry && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onSelectPlayer(entry);
                          }
                        }}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <PlayerAvatar
                          letter={entry?.avatarLetter || displayName.charAt(0)}
                          avatarUrl={entry?.avatarUrl}
                          sizeClass="w-9 h-9"
                          textClass="text-xs"
                          accentColor={activeTheme.accentHex}
                          bgColor={activeTheme.boardBg}
                          borderColor={activeTheme.surfaceBorder}
                        />
                        <div className="flex flex-col min-w-0 text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white font-['Orbitron',sans-serif] truncate">
                              {displayName}
                            </span>
                            <span
                              style={{ color: activeTheme.accentHex }}
                              className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#141e33] border border-[#243456] font-['Orbitron',sans-serif]"
                            >
                              LV.{level}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded-full border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border} font-['Orbitron',sans-serif]`}
                            >
                              {tier}
                            </span>
                            {entry && (
                              <span className="text-[9px] font-bold text-[#f6c445] font-['Orbitron',sans-serif] tabular-nums">
                                {entry.score.toLocaleString()} pts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {entry && (
                          <button
                            type="button"
                            onClick={() => onSelectPlayer(entry)}
                            style={{ margin: 0, color: activeTheme.accentHex }}
                            className="px-2 py-1.5 rounded-lg bg-[#121a2d] border border-[#233252] text-[8.5px] font-bold font-['Orbitron',sans-serif] cursor-pointer"
                          >
                            STATS
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveFriendship(friendship.id)}
                          style={{ margin: 0 }}
                          title={`Remove ${displayName || otherId}`}
                          className="px-2 py-1.5 rounded-lg bg-[#1b1421] border border-rose-500/30 text-[8.5px] font-bold text-rose-300 hover:bg-rose-500/20 font-['Orbitron',sans-serif] cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {tab === 'requests' && (
            <>
              <div className="text-[9px] font-bold text-slate-400 font-['Orbitron',sans-serif] tracking-wider px-1">
                INCOMING REQUESTS ({incomingPending.length})
              </div>
              {incomingPending.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#0d1322] border border-[#1a243b] text-center text-[10px] text-slate-500 font-['Orbitron',sans-serif]">
                  No pending incoming friend requests
                </div>
              ) : (
                incomingPending.map(({ friendship, entry }) => {
                  const senderName = entry?.username || friendship.fromUsername;
                  return (
                    <div
                      key={friendship.id}
                      style={{
                        backgroundColor: activeTheme.surfaceBg,
                        borderColor: activeTheme.accentHex,
                      }}
                      className="rounded-xl border p-3 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PlayerAvatar
                          letter={entry?.avatarLetter || senderName.charAt(0)}
                          avatarUrl={entry?.avatarUrl}
                          sizeClass="w-8 h-8"
                          textClass="text-xs"
                          accentColor={activeTheme.accentHex}
                          bgColor={activeTheme.boardBg}
                          borderColor={activeTheme.surfaceBorder}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white font-['Orbitron',sans-serif] truncate">
                            {senderName}
                          </span>
                          <span className="text-[8.5px] text-slate-400 font-['Orbitron',sans-serif]">
                            LV.{entry?.level ?? 1} • WANTS TO BE FRIENDS
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onAcceptRequest(friendship.id)}
                          style={{
                            margin: 0,
                            backgroundColor: activeTheme.primaryBtnBg,
                            color: activeTheme.primaryBtnText,
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[8.5px] font-black font-['Orbitron',sans-serif] cursor-pointer"
                        >
                          ACCEPT
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineRequest(friendship.id)}
                          style={{ margin: 0 }}
                          className="px-2 py-1.5 rounded-lg bg-[#1a1522] border border-rose-500/30 text-[8.5px] font-bold text-rose-300 font-['Orbitron',sans-serif] cursor-pointer"
                        >
                          DECLINE
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              <div className="text-[9px] font-bold text-slate-400 font-['Orbitron',sans-serif] tracking-wider px-1 pt-2">
                SENT REQUESTS ({outgoingPending.length})
              </div>
              {outgoingPending.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#0d1322] border border-[#1a243b] text-center text-[10px] text-slate-500 font-['Orbitron',sans-serif]">
                  No outgoing friend requests
                </div>
              ) : (
                outgoingPending.map(({ friendship, entry }) => {
                  const targetName = entry?.username || friendship.toUsername;
                  return (
                    <div
                      key={friendship.id}
                      style={{
                        backgroundColor: '#0e1524',
                        borderColor: activeTheme.surfaceBorder,
                      }}
                      className="rounded-xl border p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <PlayerAvatar
                          letter={entry?.avatarLetter || targetName.charAt(0)}
                          avatarUrl={entry?.avatarUrl}
                          sizeClass="w-8 h-8"
                          textClass="text-xs"
                          accentColor={activeTheme.accentHex}
                          bgColor={activeTheme.boardBg}
                          borderColor={activeTheme.surfaceBorder}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-200 font-['Orbitron',sans-serif] truncate">
                            {targetName}
                          </span>
                          <span className="text-[8.5px] text-amber-300 font-['Orbitron',sans-serif]">
                            AWAITING ACCEPTANCE
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveFriendship(friendship.id)}
                        style={{ margin: 0 }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#161d2f] border border-[#26324d] text-[8.5px] font-bold text-slate-300 hover:text-white font-['Orbitron',sans-serif] cursor-pointer shrink-0"
                      >
                        CANCEL
                      </button>
                    </div>
                  );
                })
              )}
            </>
          )}

          {tab === 'find' && (
            <>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search player name to add..."
                  style={{
                    backgroundColor: activeTheme.surfaceBg,
                    borderColor: activeTheme.surfaceBorder,
                  }}
                  className="h-10 w-full box-border px-3 border rounded-xl text-xs font-bold text-white font-['Orbitron',sans-serif] focus:outline-none placeholder:text-slate-500 placeholder:font-normal"
                />
              </div>

              {discoverablePlayers.length === 0 ? (
                <div className="py-6 text-center text-[10px] text-slate-400 font-['Orbitron',sans-serif]">
                  No players found matching "{searchQuery}"
                </div>
              ) : (
                discoverablePlayers.map((player) => {
                  const rel = relationshipByOtherId.get(player.id);
                  const isFriend = rel?.status === 'accepted';
                  const isPendingOut = rel?.status === 'pending' && rel.fromId === currentPlayerId;
                  const isPendingIn = rel?.status === 'pending' && rel.toId === currentPlayerId;

                  return (
                    <div
                      key={player.id}
                      style={{
                        backgroundColor: '#0e1524',
                        borderColor: activeTheme.surfaceBorder,
                      }}
                      className="rounded-xl border p-2.5 flex items-center justify-between gap-2"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectPlayer(player)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectPlayer(player);
                          }
                        }}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <PlayerAvatar
                          letter={player.avatarLetter}
                          avatarUrl={player.avatarUrl}
                          sizeClass="w-8 h-8"
                          textClass="text-xs"
                          accentColor={activeTheme.accentHex}
                          bgColor={activeTheme.boardBg}
                          borderColor={activeTheme.surfaceBorder}
                        />
                        <div className="flex flex-col min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white font-['Orbitron',sans-serif] truncate">
                              {player.username}
                            </span>
                            <span
                              style={{ color: activeTheme.accentHex }}
                              className="text-[8px] font-black font-['Orbitron',sans-serif]"
                            >
                              LV.{player.level ?? 1}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-['Orbitron',sans-serif]">
                            BEST: {player.score.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isFriend ? (
                          <span className="text-[8.5px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-['Orbitron',sans-serif]">
                            FRIENDS ✓
                          </span>
                        ) : isPendingOut ? (
                          <span className="text-[8.5px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-400/30 font-['Orbitron',sans-serif]">
                            PENDING
                          </span>
                        ) : isPendingIn && rel ? (
                          <button
                            type="button"
                            onClick={() => onAcceptRequest(rel.id)}
                            style={{
                              margin: 0,
                              backgroundColor: activeTheme.primaryBtnBg,
                              color: activeTheme.primaryBtnText,
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[8.5px] font-black font-['Orbitron',sans-serif] cursor-pointer"
                          >
                            ACCEPT
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSendRequest(player)}
                            style={{
                              margin: 0,
                              borderColor: activeTheme.accentHex,
                              color: activeTheme.accentHex,
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#132036] border text-[8.5px] font-black font-['Orbitron',sans-serif] cursor-pointer hover:brightness-125"
                          >
                            + ADD
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
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
