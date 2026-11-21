/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HapticPattern =
  | 'tap'
  | 'pick'
  | 'snap'
  | 'place'
  | 'clear'
  | 'combo'
  | 'megaClear'
  | 'gameOver';

let hapticsEnabled = true;
let iosSwitchLabel: HTMLLabelElement | null = null;
let lastSnapTimestamp = 0;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

function canUseVibrationApi(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  );
}

function isTouchCapableDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
  );
}

/**
 * iOS Safari 17.4+ triggers native Taptic Engine feedback when toggling a
 * <input type="checkbox" switch> via a hidden <label>.click() during a user gesture.
 */
function triggerIosSwitchFallback(): void {
  if (typeof document === 'undefined' || !isTouchCapableDevice()) return;

  try {
    if (!iosSwitchLabel) {
      const id = 'klick-haptic-switch';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.setAttribute('switch', '');
      input.setAttribute('aria-hidden', 'true');
      input.tabIndex = -1;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
      input.style.width = '1px';
      input.style.height = '1px';
      input.style.left = '-9999px';
      input.style.top = '-9999px';

      const label = document.createElement('label');
      label.htmlFor = id;
      label.setAttribute('aria-hidden', 'true');
      label.style.position = 'fixed';
      label.style.opacity = '0';
      label.style.pointerEvents = 'none';
      label.style.width = '1px';
      label.style.height = '1px';
      label.style.left = '-9999px';
      label.style.top = '-9999px';
      label.appendChild(input);

      document.body.appendChild(label);
      iosSwitchLabel = label;
    }

    iosSwitchLabel.click();
  } catch {
    // Ignore on unsupported browsers
  }
}

const VIBRATION_PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  pick: 14,
  snap: 6,
  place: 24,
  clear: [30, 32, 48],
  combo: [34, 28, 56, 28, 56],
  megaClear: [40, 24, 64, 24, 80, 24, 52],
  gameOver: [55, 45, 45, 45, 95],
};

export function triggerHaptic(pattern: HapticPattern, enabledOverride?: boolean): void {
  const active = enabledOverride !== undefined ? enabledOverride : hapticsEnabled;
  if (!active) return;

  if (pattern === 'snap') {
    const now = Date.now();
    if (now - lastSnapTimestamp < 45) return;
    lastSnapTimestamp = now;
  }

  try {
    if (canUseVibrationApi()) {
      navigator.vibrate(VIBRATION_PATTERNS[pattern]);
      return;
    }

    // Fallback for iOS Safari 17.4+ (skip rapid drag snaps so it doesn't feel jittery)
    if (pattern !== 'snap') {
      triggerIosSwitchFallback();
    }
  } catch {
    // Ignore unsupported environments or blocked vibration calls
  }
}

export function triggerClearHaptic(
  linesCleared: number,
  combo: number,
  enabledOverride?: boolean
): void {
  if (linesCleared >= 3 || combo >= 4) {
    triggerHaptic('megaClear', enabledOverride);
  } else if (linesCleared >= 2 || combo >= 2) {
    triggerHaptic('combo', enabledOverride);
  } else {
    triggerHaptic('clear', enabledOverride);
  }
}
