/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeId =
  | 'cyber-neon'
  | 'solar-flare'
  | 'emerald-matrix'
  | 'royal-amethyst'
  | 'crimson-inferno'
  | 'midas-gold'
  | 'prism-aurora'
  | 'toxic-venom'
  | 'plasma-rose'
  | 'frost-titanium'
  | 'void-eclipse';

export interface GameTheme {
  id: ThemeId;
  name: string;
  tagline: string;
  unlockRequirementLabel: string;
  requiredAchievementId?: string;
  isStarter: boolean;
  swatchPrimary: string;
  swatchSecondary: string;
  outerBg: string;
  cardBg: string;
  cardBorder: string;
  surfaceBg: string;
  surfaceBorder: string;
  boardBg: string;
  boardBorder: string;
  emptyCellBg: string;
  emptyCellBorder: string;
  accentHex: string;
  accentGlowRgba: string;
  primaryBtnBg: string;
  primaryBtnHoverBg: string;
  primaryBtnText: string;
  titleTextColor: string;
  laserGlowHex: string;
}

export const GAME_THEMES: Record<ThemeId, GameTheme> = {
  'cyber-neon': {
    id: 'cyber-neon',
    name: 'CYBER NEON',
    tagline: 'Original obsidian & electric cyan',
    unlockRequirementLabel: 'Starter Theme',
    isStarter: true,
    swatchPrimary: '#3debe0',
    swatchSecondary: '#0ea5e9',
    outerBg: '#070a11',
    cardBg: '#070a11',
    cardBorder: '#1b263d',
    surfaceBg: '#0c1220',
    surfaceBorder: '#1b263d',
    boardBg: '#090d16',
    boardBorder: '#162035',
    emptyCellBg: '#101625',
    emptyCellBorder: '#172034',
    accentHex: '#3debe0',
    accentGlowRgba: 'rgba(61, 235, 224, 0.38)',
    primaryBtnBg: '#3debe0',
    primaryBtnHoverBg: '#34d1c6',
    primaryBtnText: '#070a11',
    titleTextColor: '#3debe0',
    laserGlowHex: '#3debe0',
  },
  'solar-flare': {
    id: 'solar-flare',
    name: 'SOLAR FLARE',
    tagline: 'Volcanic charcoal & molten amber',
    unlockRequirementLabel: 'Starter Theme',
    isStarter: true,
    swatchPrimary: '#fb923c',
    swatchSecondary: '#f97316',
    outerBg: '#0d0806',
    cardBg: '#0f0907',
    cardBorder: '#3b2116',
    surfaceBg: '#170e0a',
    surfaceBorder: '#3b2116',
    boardBg: '#120a07',
    boardBorder: '#321b12',
    emptyCellBg: '#1c120d',
    emptyCellBorder: '#2e1c14',
    accentHex: '#fb923c',
    accentGlowRgba: 'rgba(251, 146, 60, 0.38)',
    primaryBtnBg: '#fb923c',
    primaryBtnHoverBg: '#f97316',
    primaryBtnText: '#140804',
    titleTextColor: '#fb923c',
    laserGlowHex: '#fb923c',
  },
  'emerald-matrix': {
    id: 'emerald-matrix',
    name: 'EMERALD MATRIX',
    tagline: 'Midnight terminal & phosphor mint',
    unlockRequirementLabel: 'Starter Theme',
    isStarter: true,
    swatchPrimary: '#34d399',
    swatchSecondary: '#10b981',
    outerBg: '#050c09',
    cardBg: '#060e0a',
    cardBorder: '#163829',
    surfaceBg: '#0a1711',
    surfaceBorder: '#163829',
    boardBg: '#07120d',
    boardBorder: '#133023',
    emptyCellBg: '#0d1d16',
    emptyCellBorder: '#173326',
    accentHex: '#34d399',
    accentGlowRgba: 'rgba(52, 211, 153, 0.38)',
    primaryBtnBg: '#34d399',
    primaryBtnHoverBg: '#10b981',
    primaryBtnText: '#04120b',
    titleTextColor: '#34d399',
    laserGlowHex: '#34d399',
  },
  'royal-amethyst': {
    id: 'royal-amethyst',
    name: 'ROYAL AMETHYST',
    tagline: 'Deep astral velvet & neon violet',
    unlockRequirementLabel: 'Starter Theme',
    isStarter: true,
    swatchPrimary: '#c084fc',
    swatchSecondary: '#9333ea',
    outerBg: '#090611',
    cardBg: '#0b0714',
    cardBorder: '#2c1c47',
    surfaceBg: '#130c22',
    surfaceBorder: '#2c1c47',
    boardBg: '#0e0919',
    boardBorder: '#25173d',
    emptyCellBg: '#171029',
    emptyCellBorder: '#271b44',
    accentHex: '#c084fc',
    accentGlowRgba: 'rgba(192, 132, 252, 0.38)',
    primaryBtnBg: '#c084fc',
    primaryBtnHoverBg: '#a855f7',
    primaryBtnText: '#11061e',
    titleTextColor: '#c084fc',
    laserGlowHex: '#c084fc',
  },
  'crimson-inferno': {
    id: 'crimson-inferno',
    name: 'CRIMSON INFERNO',
    tagline: 'Laser ruby & dark obsidian forge',
    unlockRequirementLabel: 'Unlock: Combo Pyromaniac (4x Combo)',
    requiredAchievementId: 'combo_pyromaniac',
    isStarter: false,
    swatchPrimary: '#fb7185',
    swatchSecondary: '#e11d48',
    outerBg: '#100509',
    cardBg: '#12060a',
    cardBorder: '#471726',
    surfaceBg: '#1b0910',
    surfaceBorder: '#471726',
    boardBg: '#15070c',
    boardBorder: '#3b1320',
    emptyCellBg: '#210c14',
    emptyCellBorder: '#381522',
    accentHex: '#fb7185',
    accentGlowRgba: 'rgba(251, 113, 133, 0.42)',
    primaryBtnBg: '#fb7185',
    primaryBtnHoverBg: '#f43f5e',
    primaryBtnText: '#1a0409',
    titleTextColor: '#fb7185',
    laserGlowHex: '#fb7185',
  },
  'midas-gold': {
    id: 'midas-gold',
    name: 'MIDAS GOLD',
    tagline: 'Royal onyx & 24K champion bullion',
    unlockRequirementLabel: 'Unlock: Golden Architect (5,000+ Score)',
    requiredAchievementId: 'golden_architect',
    isStarter: false,
    swatchPrimary: '#facc15',
    swatchSecondary: '#eab308',
    outerBg: '#0c0a04',
    cardBg: '#0e0c05',
    cardBorder: '#423512',
    surfaceBg: '#171307',
    surfaceBorder: '#423512',
    boardBg: '#120f06',
    boardBorder: '#382c0e',
    emptyCellBg: '#1c1709',
    emptyCellBorder: '#302710',
    accentHex: '#facc15',
    accentGlowRgba: 'rgba(250, 204, 21, 0.4)',
    primaryBtnBg: '#facc15',
    primaryBtnHoverBg: '#eab308',
    primaryBtnText: '#141003',
    titleTextColor: '#facc15',
    laserGlowHex: '#facc15',
  },
  'prism-aurora': {
    id: 'prism-aurora',
    name: 'PRISM AURORA',
    tagline: 'Arctic midnight & glacial hyper-blue',
    unlockRequirementLabel: 'Unlock: Grid Grandmaster (Reach Lv.5)',
    requiredAchievementId: 'grid_grandmaster',
    isStarter: false,
    swatchPrimary: '#38bdf8',
    swatchSecondary: '#818cf8',
    outerBg: '#050b14',
    cardBg: '#060d18',
    cardBorder: '#193554',
    surfaceBg: '#0a1526',
    surfaceBorder: '#193554',
    boardBg: '#08111f',
    boardBorder: '#162d47',
    emptyCellBg: '#0d1b2e',
    emptyCellBorder: '#183252',
    accentHex: '#38bdf8',
    accentGlowRgba: 'rgba(56, 189, 248, 0.42)',
    primaryBtnBg: '#38bdf8',
    primaryBtnHoverBg: '#0ea5e9',
    primaryBtnText: '#04101d',
    titleTextColor: '#38bdf8',
    laserGlowHex: '#38bdf8',
  },
  'toxic-venom': {
    id: 'toxic-venom',
    name: 'TOXIC VENOM',
    tagline: 'Bio-obsidian & reactor hyper-lime',
    unlockRequirementLabel: 'Unlock: Quadra Blast (4+ Lines in 1 Move)',
    requiredAchievementId: 'quadra_blast',
    isStarter: false,
    swatchPrimary: '#a3e635',
    swatchSecondary: '#65a30d',
    outerBg: '#070b04',
    cardBg: '#080e05',
    cardBorder: '#263b12',
    surfaceBg: '#0f1909',
    surfaceBorder: '#263b12',
    boardBg: '#0b1206',
    boardBorder: '#20330f',
    emptyCellBg: '#131f0b',
    emptyCellBorder: '#223613',
    accentHex: '#a3e635',
    accentGlowRgba: 'rgba(163, 230, 53, 0.4)',
    primaryBtnBg: '#a3e635',
    primaryBtnHoverBg: '#84cc16',
    primaryBtnText: '#091103',
    titleTextColor: '#a3e635',
    laserGlowHex: '#a3e635',
  },
  'plasma-rose': {
    id: 'plasma-rose',
    name: 'PLASMA ROSE',
    tagline: 'Synthwave plum & neon magenta pulse',
    unlockRequirementLabel: 'Unlock: Streak Seeker (3-Day Streak)',
    requiredAchievementId: 'streak_seeker',
    isStarter: false,
    swatchPrimary: '#f472b6',
    swatchSecondary: '#ec4899',
    outerBg: '#11060d',
    cardBg: '#13070f',
    cardBorder: '#471a38',
    surfaceBg: '#1d0b17',
    surfaceBorder: '#471a38',
    boardBg: '#170812',
    boardBorder: '#3b152e',
    emptyCellBg: '#240d1d',
    emptyCellBorder: '#3e1832',
    accentHex: '#f472b6',
    accentGlowRgba: 'rgba(244, 114, 182, 0.42)',
    primaryBtnBg: '#f472b6',
    primaryBtnHoverBg: '#ec4899',
    primaryBtnText: '#1a0513',
    titleTextColor: '#f472b6',
    laserGlowHex: '#f472b6',
  },
  'frost-titanium': {
    id: 'frost-titanium',
    name: 'FROST TITANIUM',
    tagline: 'Brushed gunmetal & cryo platinum ice',
    unlockRequirementLabel: 'Unlock: Tiny Titan (1,000+ on 4×4 Extreme)',
    requiredAchievementId: 'tiny_titan',
    isStarter: false,
    swatchPrimary: '#e2e8f0',
    swatchSecondary: '#94a3b8',
    outerBg: '#080b10',
    cardBg: '#0b0f16',
    cardBorder: '#2b3648',
    surfaceBg: '#121924',
    surfaceBorder: '#2b3648',
    boardBg: '#0e141d',
    boardBorder: '#253042',
    emptyCellBg: '#161f2d',
    emptyCellBorder: '#273449',
    accentHex: '#e2e8f0',
    accentGlowRgba: 'rgba(226, 232, 240, 0.35)',
    primaryBtnBg: '#e2e8f0',
    primaryBtnHoverBg: '#cbd5e1',
    primaryBtnText: '#090d14',
    titleTextColor: '#e2e8f0',
    laserGlowHex: '#e2e8f0',
  },
  'void-eclipse': {
    id: 'void-eclipse',
    name: 'VOID ECLIPSE',
    tagline: 'Abyssal cosmos & supernova indigo',
    unlockRequirementLabel: 'Unlock: Eclipse Voyager (Reach Lv.8)',
    requiredAchievementId: 'eclipse_voyager',
    isStarter: false,
    swatchPrimary: '#818cf8',
    swatchSecondary: '#6366f1',
    outerBg: '#04050e',
    cardBg: '#060714',
    cardBorder: '#232859',
    surfaceBg: '#0b0e24',
    surfaceBorder: '#232859',
    boardBg: '#080a1c',
    boardBorder: '#1d224c',
    emptyCellBg: '#101433',
    emptyCellBorder: '#1f2659',
    accentHex: '#818cf8',
    accentGlowRgba: 'rgba(129, 140, 248, 0.42)',
    primaryBtnBg: '#818cf8',
    primaryBtnHoverBg: '#6366f1',
    primaryBtnText: '#060717',
    titleTextColor: '#818cf8',
    laserGlowHex: '#818cf8',
  },
};

export const THEME_ORDER: ThemeId[] = [
  'cyber-neon',
  'solar-flare',
  'emerald-matrix',
  'royal-amethyst',
  'crimson-inferno',
  'midas-gold',
  'prism-aurora',
  'toxic-venom',
  'plasma-rose',
  'frost-titanium',
  'void-eclipse',
];

export function getGameTheme(themeId?: string | null): GameTheme {
  if (themeId && themeId in GAME_THEMES) {
    return GAME_THEMES[themeId as ThemeId];
  }
  return GAME_THEMES['cyber-neon'];
}

export function isThemeUnlocked(themeId: ThemeId, unlockedAchievementIds: string[]): boolean {
  const theme = GAME_THEMES[themeId];
  if (theme.isStarter || !theme.requiredAchievementId) return true;
  return unlockedAchievementIds.includes(theme.requiredAchievementId);
}
