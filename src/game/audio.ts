/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let audioCtx: AudioContext | null = null;
let musicGainNode: GainNode | null = null;
let isMusicPlaying = false;
let musicTimer: number | null = null;
let activeMusicNodes: (OscillatorNode | GainNode)[] = [];

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      try {
        audioCtx = new AudioContextClass();
      } catch {
        return null;
      }
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Browsers will reject or warn if resumed prior to a user gesture
    });
  }
  return audioCtx;
}

/**
 * Call on any explicit user interaction (click, pointer down, key down, touch start)
 * to unlock Web Audio playback seamlessly in Chrome and Safari.
 */
export function unlockAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

// Volume Levels (0.0 to 1.0)
let currentSoundVolume = 0.8;
let currentMusicVolume = 0.8;

export function setSoundVolume(volume: number) {
  currentSoundVolume = Math.max(0, Math.min(1, volume));
}

export function getSoundVolume(): number {
  return currentSoundVolume;
}

export function setMusicVolume(volume: number) {
  currentMusicVolume = Math.max(0, Math.min(1, volume));
  if (audioCtx && musicGainNode && isMusicPlaying) {
    try {
      musicGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      musicGainNode.gain.setValueAtTime(musicGainNode.gain.value, audioCtx.currentTime);
      musicGainNode.gain.linearRampToValueAtTime(0.92 * currentMusicVolume, audioCtx.currentTime + 0.05);
    } catch {
      // Ignore
    }
  }
}

export function getMusicVolume(): number {
  return currentMusicVolume;
}

/**
 * Preview chime for real-time sound volume adjustment feedback
 */
export function playSoundVolumePreview(volume: number) {
  if (volume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.09); // A5

    const peak = 0.45 * Math.max(0, Math.min(1, volume));
    gain.gain.setValueAtTime(peak, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignore
  }
}

/**
 * Pick up a block from tray (Louder, crisp pop)
 */
export function playPickSound(enabled = true) {
  if (!enabled || currentSoundVolume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(460, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(720, ctx.currentTime + 0.08);

    const peak = 0.35 * currentSoundVolume;
    gain.gain.setValueAtTime(peak, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Ignore audio failures
  }
}

/**
 * Place a piece on the board (Louder, tactile solid lock)
 */
export function playPlaceSound(enabled = true) {
  if (!enabled || currentSoundVolume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.14);

    const peak = 0.58 * currentSoundVolume;
    gain.gain.setValueAtTime(peak, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch {
    // Ignore
  }
}

let sfxCompressorNode: DynamicsCompressorNode | null = null;

function getSfxDestination(ctx: AudioContext): AudioNode {
  if (!sfxCompressorNode) {
    sfxCompressorNode = ctx.createDynamicsCompressor();
    sfxCompressorNode.threshold.setValueAtTime(-12, ctx.currentTime);
    sfxCompressorNode.knee.setValueAtTime(12, ctx.currentTime);
    sfxCompressorNode.ratio.setValueAtTime(4, ctx.currentTime);
    sfxCompressorNode.attack.setValueAtTime(0.003, ctx.currentTime);
    sfxCompressorNode.release.setValueAtTime(0.15, ctx.currentTime);
    sfxCompressorNode.connect(ctx.destination);
  }
  return sfxCompressorNode;
}

/**
 * Clear rows/columns and trigger combo with pitch-shifted harmonic chimes and escalating intensity
 */
export function playClearSound(
  combo = 1,
  linesCleared = 1,
  enabled = true,
  comboMultiplier?: number
) {
  if (!enabled || currentSoundVolume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const destination = getSfxDestination(ctx);

    const safeCombo = Math.max(1, combo);
    const safeLines = Math.max(1, linesCleared);
    const effectiveMultiplier =
      typeof comboMultiplier === 'number' && Number.isFinite(comboMultiplier)
        ? Math.max(1, comboMultiplier)
        : 1 + Math.max(0, safeCombo - 1) * 0.5;

    // Continuous upward pitch shift scaled by combo multiplier (2 semitones per 0.5x step up to +12st, then +1st per step up to +18st)
    const comboSteps = Math.max(0, (effectiveMultiplier - 1) * 2);
    const semitoneShift =
      comboSteps <= 6 ? comboSteps * 2 : 12 + Math.min(6, comboSteps - 6);
    const pitchMultiplier = Math.pow(2, semitoneShift / 12);

    // Normalized intensity (0.0 at 1.0x -> 1.0 at 4.5x+), boosted slightly by multi-line clears
    const comboIntensity = Math.min(1, Math.max(0, (effectiveMultiplier - 1) / 3.5));
    const lineBoost = Math.min(0.25, (safeLines - 1) * 0.08);
    const intensity = Math.min(1, comboIntensity + lineBoost);

    // Low-end tactile impact punch that intensifies with longer chains
    if (safeCombo >= 2 || safeLines >= 2) {
      const punchOsc = ctx.createOscillator();
      const punchGain = ctx.createGain();
      punchOsc.type = 'sine';
      const startPunchFreq = 120 + intensity * 60;
      punchOsc.frequency.setValueAtTime(startPunchFreq, now);
      punchOsc.frequency.exponentialRampToValueAtTime(48, now + 0.11);

      const punchPeak = (0.16 + intensity * 0.22) * currentSoundVolume;
      punchGain.gain.setValueAtTime(0.001, now);
      punchGain.gain.linearRampToValueAtTime(punchPeak, now + 0.008);
      punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      punchOsc.connect(punchGain);
      punchGain.connect(destination);
      punchOsc.start(now);
      punchOsc.stop(now + 0.13);
    }

    // Bright ascending major-9th/10th arpeggio anchored at C5, transposed upward by pitchMultiplier
    const baseRootHz = 523.25; // C5
    const arpeggioSemitones = [0, 4, 7, 12, 14, 16];
    const noteCount = safeLines >= 4 ? 6 : safeLines >= 3 ? 5 : safeLines >= 2 ? 4 : 3;
    const stepInterval = Math.max(0.032, 0.058 - intensity * 0.024);
    const noteDuration = 0.28 + intensity * 0.14;

    // Shared sweeping lowpass filter for rich harmonic overtones on intense combos
    const harmonicFilter = ctx.createBiquadFilter();
    harmonicFilter.type = 'lowpass';
    const filterStartHz = 1600 + intensity * 2400;
    const filterPeakHz = 2800 + intensity * 3600;
    harmonicFilter.frequency.setValueAtTime(filterStartHz, now);
    harmonicFilter.frequency.exponentialRampToValueAtTime(
      filterPeakHz,
      now + noteCount * stepInterval + 0.08
    );
    harmonicFilter.Q.setValueAtTime(1.0 + intensity * 2.2, now);
    harmonicFilter.connect(destination);

    for (let idx = 0; idx < noteCount; idx++) {
      const noteStart = now + idx * stepInterval;
      const intervalSemis = arpeggioSemitones[idx % arpeggioSemitones.length];
      const freq = baseRootHz * pitchMultiplier * Math.pow(2, intervalSemis / 12);

      // Core voice
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = safeCombo >= 3 ? 'triangle' : 'sine';

      // Energetic upward snap into pitch as combo intensity rises
      if (intensity > 0.05) {
        osc.frequency.setValueAtTime(freq * (1 - 0.05 * intensity), noteStart);
        osc.frequency.exponentialRampToValueAtTime(freq, noteStart + 0.026);
      } else {
        osc.frequency.setValueAtTime(freq, noteStart);
      }

      const peak = (0.38 + intensity * 0.22) * currentSoundVolume;
      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(peak, noteStart + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

      osc.connect(gain);
      gain.connect(destination);
      osc.start(noteStart);
      osc.stop(noteStart + noteDuration + 0.01);

      // Intensity harmonic layer (adds bright sawtooth/triangle edge & detuned chorus at higher combos)
      if (safeCombo >= 2 || safeLines >= 2) {
        const harmOsc = ctx.createOscillator();
        const harmGain = ctx.createGain();
        harmOsc.type = safeCombo >= 4 ? 'sawtooth' : 'triangle';
        harmOsc.frequency.setValueAtTime(freq * (1 + 0.004 * (1 + intensity)), noteStart);

        const harmPeak = (0.09 + intensity * 0.16) * currentSoundVolume;
        harmGain.gain.setValueAtTime(0.001, noteStart);
        harmGain.gain.linearRampToValueAtTime(harmPeak, noteStart + 0.016);
        harmGain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration * 0.9);

        harmOsc.connect(harmGain);
        harmGain.connect(harmonicFilter);
        harmOsc.start(noteStart);
        harmOsc.stop(noteStart + noteDuration);
      }

      // Final note crystalline octave shimmer for high-energy chains
      if (idx === noteCount - 1 && (safeCombo >= 2 || safeLines >= 2)) {
        const shimmerFreq = Math.min(4400, freq * 2);
        const shimmerOsc = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmerOsc.type = 'sine';
        shimmerOsc.frequency.setValueAtTime(shimmerFreq, noteStart);

        const shimmerPeak = (0.1 + intensity * 0.18) * currentSoundVolume;
        const shimmerDuration = noteDuration + 0.14;
        shimmerGain.gain.setValueAtTime(0.001, noteStart);
        shimmerGain.gain.linearRampToValueAtTime(shimmerPeak, noteStart + 0.02);
        shimmerGain.gain.exponentialRampToValueAtTime(0.001, noteStart + shimmerDuration);

        shimmerOsc.connect(shimmerGain);
        shimmerGain.connect(destination);
        shimmerOsc.start(noteStart);
        shimmerOsc.stop(noteStart + shimmerDuration + 0.01);
      }
    }
  } catch {
    // Ignore
  }
}

/**
 * Game Over sound (Louder, arcade descent)
 */
export function playGameOverSound(enabled = true) {
  if (!enabled || currentSoundVolume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const freqs = [360, 300, 240, 180];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      const peak = 0.28 * currentSoundVolume;
      gain.gain.setValueAtTime(peak, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.2);
    });
  } catch {
    // Ignore
  }
}

// -------------------------------------------------------------
// CHILL AMBIENT BACKGROUND MUSIC GENERATOR (Web Audio API)
// -------------------------------------------------------------

// Chord progression: Cmaj7 -> Am9 -> Fmaj7 -> Gsus4
const CHORD_PROGRESSION = [
  { root: 65.41, notes: [130.81, 196.0, 246.94, 329.63] }, // Cmaj7 (C2 root, C3, G3, B3, E4)
  { root: 55.0, notes: [110.0, 164.81, 196.0, 246.94] },  // Am9 (A1 root, A2, E3, G3, B3)
  { root: 43.65, notes: [87.31, 130.81, 164.81, 220.0] },  // Fmaj7 (F1 root, F2, C3, E3, A3)
  { root: 49.0, notes: [98.0, 146.83, 196.0, 246.94] },   // G7 (G1 root, G2, D3, G3, B3)
];

const CHILL_LEAD_NOTES = [523.25, 659.25, 783.99, 987.77, 1046.5]; // C5, E5, G5, B5, C6
let chordIndex = 0;

let compressorNode: DynamicsCompressorNode | null = null;

function scheduleChillChord(ctx: AudioContext, masterMusicGain: GainNode) {
  if (!isMusicPlaying) return;

  const chord = CHORD_PROGRESSION[chordIndex % CHORD_PROGRESSION.length];
  chordIndex++;

  const chordDuration = 3.6; // seconds per chord
  const now = ctx.currentTime;

  try {
    // 1. Warm Filter - opened up to 3200Hz for vibrant, audible presence (3x clearer)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.Q.setValueAtTime(0.9, now);
    filter.connect(masterMusicGain);

    // 2. Sub Bass (Warm Sine, boosted ~2x)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(chord.root, now);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.75, now + 0.4);
    subGain.gain.linearRampToValueAtTime(0.001, now + chordDuration);

    subOsc.connect(subGain);
    subGain.connect(filter);
    subOsc.start(now);
    subOsc.stop(now + chordDuration);
    activeMusicNodes.push(subOsc);

    // 3. Polyphonic Warm Synth Pad (Boosted 3x louder: 0.14 -> 0.42)
    chord.notes.forEach((freq, idx) => {
      // Primary Oscillator
      const padOsc = ctx.createOscillator();
      const padGain = ctx.createGain();
      padOsc.type = 'triangle';
      padOsc.frequency.setValueAtTime(freq, now);

      // Warm attack envelope
      padGain.gain.setValueAtTime(0.001, now);
      padGain.gain.linearRampToValueAtTime(0.42, now + 0.6 + idx * 0.05);
      padGain.gain.linearRampToValueAtTime(0.001, now + chordDuration);

      padOsc.connect(padGain);
      padGain.connect(filter);
      padOsc.start(now);
      padOsc.stop(now + chordDuration);
      activeMusicNodes.push(padOsc);

      // Detuned secondary oscillator for lush stereo chorus (Boosted 3x: 0.10 -> 0.32)
      const detunedOsc = ctx.createOscillator();
      const detunedGain = ctx.createGain();
      detunedOsc.type = 'sine';
      detunedOsc.frequency.setValueAtTime(freq * 1.004, now); // +7 cents

      detunedGain.gain.setValueAtTime(0.001, now);
      detunedGain.gain.linearRampToValueAtTime(0.32, now + 0.7);
      detunedGain.gain.linearRampToValueAtTime(0.001, now + chordDuration);

      detunedOsc.connect(detunedGain);
      detunedGain.connect(filter);
      detunedOsc.start(now);
      detunedOsc.stop(now + chordDuration);
      activeMusicNodes.push(detunedOsc);
    });

    // 4. Ambient Sparkle Bell (Boosted 3x: 0.09 -> 0.28)
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    const bellNote = CHILL_LEAD_NOTES[Math.floor(Math.random() * CHILL_LEAD_NOTES.length)];
    const bellTime = now + 1.4;

    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(bellNote, bellTime);

    bellGain.gain.setValueAtTime(0.001, bellTime);
    bellGain.gain.linearRampToValueAtTime(0.28, bellTime + 0.04);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, bellTime + 1.4);

    bellOsc.connect(bellGain);
    bellGain.connect(filter);
    bellOsc.start(bellTime);
    bellOsc.stop(bellTime + 1.4);
    activeMusicNodes.push(bellOsc);
  } catch {
    // Ignore audio schedule exceptions
  }

  // Schedule next chord slightly before current one finishes for seamless crossfade
  if (isMusicPlaying) {
    musicTimer = window.setTimeout(() => {
      if (isMusicPlaying) {
        scheduleChillChord(ctx, masterMusicGain);
      }
    }, (chordDuration - 0.25) * 1000);
  }
}

/**
 * Starts chill looping background music (significantly louder, rich & crisp)
 */
export function startBackgroundMusic(enabled = true) {
  if (!enabled || isMusicPlaying) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    isMusicPlaying = true;

    // Use Dynamics Compressor to prevent clipping and enhance punch
    if (!compressorNode) {
      compressorNode = ctx.createDynamicsCompressor();
      compressorNode.threshold.setValueAtTime(-14, ctx.currentTime);
      compressorNode.knee.setValueAtTime(10, ctx.currentTime);
      compressorNode.ratio.setValueAtTime(4, ctx.currentTime);
      compressorNode.attack.setValueAtTime(0.01, ctx.currentTime);
      compressorNode.release.setValueAtTime(0.2, ctx.currentTime);
      compressorNode.connect(ctx.destination);
    }

    if (!musicGainNode) {
      musicGainNode = ctx.createGain();
      musicGainNode.connect(compressorNode);
    }

    // Smooth fade in with loud master volume scaled by currentMusicVolume
    const targetGain = Math.max(0.0001, 0.92 * currentMusicVolume);
    musicGainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    musicGainNode.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.8);

    chordIndex = 0;
    scheduleChillChord(ctx, musicGainNode);
  } catch {
    isMusicPlaying = false;
  }
}


/**
 * Stops chill background music smoothly
 */
export function stopBackgroundMusic() {
  if (!isMusicPlaying) return;
  isMusicPlaying = false;

  if (musicTimer) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }

  const ctx = getAudioContext();
  if (ctx && musicGainNode) {
    try {
      musicGainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      setTimeout(() => {
        activeMusicNodes.forEach((node) => {
          try {
            (node as OscillatorNode).stop?.();
            node.disconnect();
          } catch {
            // Ignore
          }
        });
        activeMusicNodes = [];
      }, 700);
    } catch {
      // Ignore
    }
  }
}

/**
 * Toggles music playback state
 */
export function setBackgroundMusicEnabled(enabled: boolean) {
  if (enabled) {
    startBackgroundMusic(true);
  } else {
    stopBackgroundMusic();
  }
}
