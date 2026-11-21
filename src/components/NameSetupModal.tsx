/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { PlayerProfile, generateRandomName } from '../game/leaderboard';
import { validatePlayerName } from '../game/wordFilter';
import { GameTheme } from '../game/themes';
import { resizeAvatarImage } from '../game/avatar';
import { PlayerAvatar } from './PlayerAvatar';

interface NameSetupModalProps {
  currentProfile: PlayerProfile;
  isOpen: boolean;
  activeTheme: GameTheme;
  onSave: (profile: PlayerProfile) => void;
  onClose?: () => void;
  isInitialSetup?: boolean;
  isSignedIn?: boolean;
  onSignInGoogle?: () => void;
}

export const NameSetupModal: React.FC<NameSetupModalProps> = ({
  currentProfile,
  isOpen,
  activeTheme,
  onSave,
  onClose,
  isInitialSetup = false,
  isSignedIn = false,
  onSignInGoogle,
}) => {
  const [username, setUsername] = useState(currentProfile.username || '');
  const [tag, setTag] = useState(currentProfile.tag || '');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentProfile.avatarUrl);
  const [error, setError] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUsername(currentProfile.username || '');
      setTag(currentProfile.tag || '');
      setAvatarUrl(currentProfile.avatarUrl);
      setError('');
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleRollRandom = () => {
    const random = generateRandomName();
    setUsername(random.username);
    setTag(random.tag);
    setError('');
  };

  const handleUsernameChange = (val: string) => {
    const sanitized = val.replace(/[^a-zA-Z0-9_\-\s]/g, '');
    setUsername(sanitized);
    setTag('');
    setError('');
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingPhoto(true);
    setError('');
    try {
      const compressed = await resizeAvatarImage(file);
      setAvatarUrl(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import profile image.');
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a name or click Roll Name');
      return;
    }
    if (trimmed.length > 16) {
      setError('Name must be 16 characters or less');
      return;
    }

    const check = validatePlayerName(trimmed);
    if (!check.isValid) {
      setError(check.reason || 'This name is not allowed. Please choose another.');
      return;
    }

    onSave({
      username: trimmed,
      tag: tag.trim() || undefined,
      avatarLetter: trimmed.charAt(0).toUpperCase() || 'P',
      avatarUrl,
      hasChosenName: true,
    });
  };

  const handleSkip = () => {
    const random = generateRandomName();
    onSave({
      username: random.username,
      tag: random.tag,
      avatarLetter: random.username.charAt(0).toUpperCase(),
      avatarUrl,
      hasChosenName: true,
    });
  };

  const displayInitial = (username.trim().charAt(0) || 'P').toUpperCase();

  return (
    <div className="fixed inset-[10px] z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-fadeIn rounded-2xl overflow-hidden">
      <div
        style={{
          backgroundColor: activeTheme.cardBg,
          borderColor: activeTheme.cardBorder,
        }}
        className="w-full max-w-sm max-h-full overflow-y-auto border rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-center m-1 custom-scrollbar"
      >
        {/* Header & Avatar Upload */}
        <div className="flex flex-col items-center gap-2.5">
          <PlayerAvatar
            letter={displayInitial}
            avatarUrl={avatarUrl}
            sizeClass="w-16 h-16"
            textClass="text-xl"
            roundedClass="rounded-2xl"
            accentColor={activeTheme.accentHex}
            bgColor={activeTheme.surfaceBg}
            borderColor={activeTheme.accentHex}
          />

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <button
              type="button"
              disabled={isProcessingPhoto}
              onClick={() => fileInputRef.current?.click()}
              style={{
                margin: 0,
                backgroundColor: activeTheme.surfaceBg,
                borderColor: activeTheme.surfaceBorder,
                color: activeTheme.accentHex,
              }}
              className="px-3 py-1.5 rounded-lg border text-[10px] font-bold font-['Orbitron',sans-serif] tracking-wider hover:brightness-110 cursor-pointer active:scale-95 transition-all"
            >
              {isProcessingPhoto ? 'PROCESSING...' : avatarUrl ? 'CHANGE PFP' : 'IMPORT PFP'}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(undefined)}
                style={{ margin: 0 }}
                className="px-2.5 py-1.5 rounded-lg bg-[#171d2c] border border-[#2a344d] text-[10px] font-bold text-slate-400 hover:text-rose-300 font-['Orbitron',sans-serif] cursor-pointer transition-colors"
              >
                REMOVE
              </button>
            )}
          </div>

          <h2 className="text-lg font-bold text-white font-['Orbitron',sans-serif] tracking-wider">
            {isInitialSetup ? 'WELCOME TO KLICK' : 'EDIT NAME'}
          </h2>

          <p className="text-xs text-slate-400 font-['Orbitron',sans-serif] max-w-[270px] leading-relaxed">
            {isSignedIn
              ? 'Update your global player name & optional photo.'
              : isInitialSetup
              ? 'Choose a local player name & photo, or sign in with Google to appear on the global leaderboard.'
              : 'Guest names stay on this device. Sign in with Google to publish your profile globally.'}
          </p>
        </div>

        {/* Input Field */}
        <div className="flex flex-col gap-2 text-left">
          <label className="text-[10px] text-slate-400 font-bold tracking-wider font-['Orbitron',sans-serif]">
            PLAYER NAME
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              maxLength={16}
              placeholder="e.g. Alex"
              style={{
                backgroundColor: activeTheme.surfaceBg,
                borderColor: activeTheme.surfaceBorder,
              }}
              className="flex-1 border rounded-xl px-4 py-3 text-sm font-bold text-white font-['Orbitron',sans-serif] focus:outline-none transition-all placeholder:text-slate-600 placeholder:font-normal"
            />

            {tag && (
              <div
                style={{
                  backgroundColor: activeTheme.surfaceBg,
                  borderColor: activeTheme.surfaceBorder,
                }}
                className="border rounded-xl px-3 py-3 text-xs font-bold text-slate-300 font-mono"
                title="Number tag from random roll"
              >
                #{tag}
              </div>
            )}
          </div>

          {error && (
            <span className="text-xs text-rose-400 font-bold font-['Orbitron',sans-serif]">
              {error}
            </span>
          )}

          <span className="text-[10px] text-slate-500 font-['Orbitron',sans-serif] mt-1.5 leading-snug">
            {tag
              ? 'Random name roll includes a number tag.'
              : 'Custom names have no number tag.'}
          </span>
        </div>

        {/* Roll Random Name Button */}
        <button
          type="button"
          onClick={handleRollRandom}
          style={{
            margin: 0,
            backgroundColor: activeTheme.surfaceBg,
            borderColor: activeTheme.surfaceBorder,
          }}
          className="btn-klick w-full rounded-xl border text-slate-200 hover:text-white text-xs font-bold tracking-wider font-['Orbitron',sans-serif] transition-all cursor-pointer active:scale-95"
        >
          ROLL RANDOM NAME
        </button>

        {!isSignedIn && onSignInGoogle && (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={onSignInGoogle}
              style={{
                margin: 0,
                borderColor: activeTheme.accentHex,
                color: activeTheme.accentHex,
                backgroundColor: '#111a2c',
              }}
              className="btn-klick w-full rounded-xl border text-xs font-bold tracking-wider font-['Orbitron',sans-serif] transition-all cursor-pointer hover:brightness-110 active:scale-95"
            >
              SIGN IN / RESTORE WITH GOOGLE
            </button>
            <span className="text-[9.5px] text-amber-300/90 font-['Orbitron',sans-serif] leading-snug">
              Google Sign-In is required to publish new accounts & scores to the global leaderboard.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleSave}
            style={{
              margin: 0,
              backgroundColor: activeTheme.primaryBtnBg,
              color: activeTheme.primaryBtnText,
              boxShadow: `0 0 18px ${activeTheme.accentGlowRgba}`,
            }}
            className="btn-klick w-full rounded-2xl font-black tracking-widest text-xs sm:text-sm font-['Orbitron',sans-serif] active:scale-95 transition-all cursor-pointer"
          >
            CONFIRM NAME
          </button>

          {isInitialSetup ? (
            <button
              type="button"
              onClick={handleSkip}
              style={{ margin: 0 }}
              className="btn-klick w-full rounded-xl bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-400 hover:text-slate-200 text-xs font-bold tracking-wider font-['Orbitron',sans-serif] transition-all cursor-pointer"
            >
              SKIP FOR NOW
            </button>
          ) : (
            onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{ margin: 0 }}
                className="btn-klick w-full rounded-xl bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-400 hover:text-slate-200 text-xs font-bold tracking-wider font-['Orbitron',sans-serif] transition-all cursor-pointer"
              >
                CANCEL
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
