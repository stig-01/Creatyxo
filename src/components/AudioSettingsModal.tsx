/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { playSoundVolumePreview } from '../game/audio';
import { GameTheme } from '../game/themes';

interface AudioSettingsModalProps {
  isOpen: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
  musicVolume: number; // 0.0 to 1.0
  activeTheme: GameTheme;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleHaptics: () => void;
  onChangeSoundVolume: (volume: number) => void;
  onChangeMusicVolume: (volume: number) => void;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  soundEnabled,
  musicEnabled,
  hapticsEnabled,
  soundVolume,
  musicVolume,
  activeTheme,
  onToggleSound,
  onToggleMusic,
  onToggleHaptics,
  onChangeSoundVolume,
  onChangeMusicVolume,
  onClose,
}) => {
  if (!isOpen) return null;

  const soundPercent = Math.round(soundVolume * 100);
  const musicPercent = Math.round(musicVolume * 100);

  const handleSoundSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) / 100;
    onChangeSoundVolume(val);
    playSoundVolumePreview(val);
  };

  const handleMusicSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) / 100;
    onChangeMusicVolume(val);
  };

  const handleSetPreset = (preset: 'mute' | 'balanced' | 'max') => {
    if (preset === 'mute') {
      onChangeSoundVolume(0);
      onChangeMusicVolume(0);
    } else if (preset === 'balanced') {
      onChangeSoundVolume(0.6);
      onChangeMusicVolume(0.6);
      playSoundVolumePreview(0.6);
    } else if (preset === 'max') {
      onChangeSoundVolume(1.0);
      onChangeMusicVolume(1.0);
      playSoundVolumePreview(1.0);
    }
  };

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
        className="w-full max-w-sm max-h-full overflow-y-auto border rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 text-left m-1 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{ borderColor: activeTheme.surfaceBorder }}
          className="flex items-center justify-between border-b pb-3"
        >
          <div className="flex items-center gap-2">
            <div
              style={{
                backgroundColor: activeTheme.surfaceBg,
                borderColor: activeTheme.surfaceBorder,
                color: activeTheme.accentHex,
              }}
              className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-black text-white font-['Orbitron',sans-serif] tracking-wider">
                AUDIO & HAPTICS
              </h2>
              <p className="text-[10px] text-slate-400 font-['Orbitron',sans-serif] tracking-wide mt-1">
                MUSIC, SOUND & MOBILE VIBRATION
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close audio settings"
            style={{ margin: 0 }}
            className="btn-creatyxo-icon rounded-xl bg-[#141d2f] hover:bg-[#1a263d] border border-[#22304d] text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Music Volume Slider Control */}
        <div
          style={{
            backgroundColor: activeTheme.surfaceBg,
            borderColor: activeTheme.surfaceBorder,
          }}
          className="border rounded-xl p-3.5 flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ color: activeTheme.accentHex }}>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </span>
              <span className="text-xs font-bold text-slate-200 font-['Orbitron',sans-serif] tracking-wide">
                BACKGROUND MUSIC
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleMusic}
              style={{
                margin: 0,
                backgroundColor: musicEnabled ? activeTheme.boardBg : '#181f2f',
                borderColor: musicEnabled ? activeTheme.accentHex : '#25324b',
                color: musicEnabled ? activeTheme.accentHex : '#64748b',
              }}
              className="btn-creatyxo text-xs font-bold rounded-xl border transition-colors cursor-pointer"
            >
              {musicEnabled ? 'ACTIVE' : 'MUTED'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={musicPercent}
              onChange={handleMusicSlider}
              style={{ accentColor: activeTheme.accentHex }}
              className="cyber-slider flex-1"
              aria-label="Background music volume"
            />
            <span
              style={{ color: activeTheme.accentHex }}
              className="text-xs font-black font-['Orbitron',sans-serif] w-10 text-right tabular-nums"
            >
              {musicPercent}%
            </span>
          </div>
        </div>

        {/* Sound Effects Volume Slider Control */}
        <div
          style={{
            backgroundColor: activeTheme.surfaceBg,
            borderColor: activeTheme.surfaceBorder,
          }}
          className="border rounded-xl p-3.5 flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ color: activeTheme.accentHex }}>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              </span>
              <span className="text-xs font-bold text-slate-200 font-['Orbitron',sans-serif] tracking-wide">
                SOUND EFFECTS
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleSound}
              style={{
                margin: 0,
                backgroundColor: soundEnabled ? activeTheme.boardBg : '#181f2f',
                borderColor: soundEnabled ? activeTheme.accentHex : '#25324b',
                color: soundEnabled ? activeTheme.accentHex : '#64748b',
              }}
              className="btn-creatyxo text-xs font-bold rounded-xl border transition-colors cursor-pointer"
            >
              {soundEnabled ? 'ACTIVE' : 'MUTED'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={soundPercent}
              onChange={handleSoundSlider}
              style={{ accentColor: activeTheme.accentHex }}
              className="cyber-slider flex-1"
              aria-label="Sound effects volume"
            />
            <span
              style={{ color: activeTheme.accentHex }}
              className="text-xs font-black font-['Orbitron',sans-serif] w-10 text-right tabular-nums"
            >
              {soundPercent}%
            </span>
          </div>
        </div>

        {/* Haptic Feedback Toggle */}
        <div
          style={{
            backgroundColor: activeTheme.surfaceBg,
            borderColor: activeTheme.surfaceBorder,
          }}
          className="border rounded-xl p-3.5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span style={{ color: activeTheme.accentHex }} className="shrink-0">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M0 15h2V9H0v6zm3 2h2V7H3v10zm19-8v6h2V9h-2zm-3 8h2V7h-2v10zM16.5 3h-9C6.67 3 6 3.67 6 4.5v15c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zM16 19H8V5h8v14z" />
              </svg>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-200 font-['Orbitron',sans-serif] tracking-wide">
                HAPTIC FEEDBACK
              </span>
              <span className="text-[9px] text-slate-400 font-['Orbitron',sans-serif] tracking-wide mt-0.5">
                MOBILE VIBRATION ON MOVES
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleHaptics}
            style={{
              margin: 0,
              backgroundColor: hapticsEnabled ? activeTheme.boardBg : '#181f2f',
              borderColor: hapticsEnabled ? activeTheme.accentHex : '#25324b',
              color: hapticsEnabled ? activeTheme.accentHex : '#64748b',
            }}
            className="btn-creatyxo text-xs font-bold rounded-xl border transition-colors cursor-pointer shrink-0"
          >
            {hapticsEnabled ? 'ACTIVE' : 'OFF'}
          </button>
        </div>

        {/* Preset Quick Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleSetPreset('mute')}
            style={{ margin: 0, borderColor: activeTheme.surfaceBorder }}
            className="btn-creatyxo rounded-xl bg-[#141b2a] hover:bg-[#192236] border text-[10px] sm:text-xs font-bold text-slate-400 hover:text-white font-['Orbitron',sans-serif] transition-all cursor-pointer"
          >
            MUTE ALL
          </button>
          <button
            type="button"
            onClick={() => handleSetPreset('balanced')}
            style={{ margin: 0, borderColor: activeTheme.surfaceBorder }}
            className="btn-creatyxo rounded-xl bg-[#141b2a] hover:bg-[#192236] border text-[10px] sm:text-xs font-bold text-slate-300 hover:text-white font-['Orbitron',sans-serif] transition-all cursor-pointer"
          >
            60% CHILL
          </button>
          <button
            type="button"
            onClick={() => handleSetPreset('max')}
            style={{
              margin: 0,
              borderColor: activeTheme.surfaceBorder,
              color: activeTheme.accentHex,
            }}
            className="btn-creatyxo rounded-xl bg-[#141b2a] hover:bg-[#192236] border text-[10px] sm:text-xs font-bold font-['Orbitron',sans-serif] transition-all cursor-pointer"
          >
            100% MAX
          </button>
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            margin: 0,
            backgroundColor: activeTheme.primaryBtnBg,
            color: activeTheme.primaryBtnText,
            boxShadow: `0 0 18px ${activeTheme.accentGlowRgba}`,
          }}
          className="btn-creatyxo w-full rounded-2xl font-black tracking-widest text-xs sm:text-sm font-['Orbitron',sans-serif] cursor-pointer mt-1 active:scale-95 transition-all"
        >
          CONFIRM & CLOSE
        </button>
      </div>
    </div>
  );
};
