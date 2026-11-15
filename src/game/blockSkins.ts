/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BlockSkinId =
  | 'classic-gloss'
  | 'cyber-circuit'
  | 'prism-crystal'
  | 'astral-nova';

export interface BlockSkinDef {
  id: BlockSkinId;
  name: string;
  tagline: string;
  requiredStreakDays: number;
  unlockRequirementLabel: string;
  badgeIcon: string;
  accentHex: string;
  isStarter: boolean;
}

export const BLOCK_SKINS: Record<BlockSkinId, BlockSkinDef> = {
  'classic-gloss': {
    id: 'classic-gloss',
    name: 'CLASSIC GLOSS',
    tagline: 'Original beveled 3D arcade finish',
    requiredStreakDays: 0,
    unlockRequirementLabel: 'Starter Block Skin',
    badgeIcon: '🧊',
    accentHex: '#3debe0',
    isStarter: true,
  },
  'cyber-circuit': {
    id: 'cyber-circuit',
    name: 'NEON CIRCUIT',
    tagline: 'Etched microchip trace & luminous core node',
    requiredStreakDays: 3,
    unlockRequirementLabel: '3-Day Consecutive Streak Reward',
    badgeIcon: '⚡',
    accentHex: '#fbbf24',
    isStarter: false,
  },
  'prism-crystal': {
    id: 'prism-crystal',
    name: 'PRISM CRYSTAL',
    tagline: 'Faceted diamond geometry & glacial refraction',
    requiredStreakDays: 7,
    unlockRequirementLabel: '7-Day Consecutive Streak Reward',
    badgeIcon: '💎',
    accentHex: '#38bdf8',
    isStarter: false,
  },
  'astral-nova': {
    id: 'astral-nova',
    name: 'ASTRAL NOVA',
    tagline: 'Cosmic starburst core & gilded stellar rim',
    requiredStreakDays: 14,
    unlockRequirementLabel: '14-Day Consecutive Streak Reward',
    badgeIcon: '🌌',
    accentHex: '#c084fc',
    isStarter: false,
  },
};

export const BLOCK_SKIN_ORDER: BlockSkinId[] = [
  'classic-gloss',
  'cyber-circuit',
  'prism-crystal',
  'astral-nova',
];

export const STREAK_SKIN_MILESTONES: BlockSkinDef[] = [
  BLOCK_SKINS['cyber-circuit'],
  BLOCK_SKINS['prism-crystal'],
  BLOCK_SKINS['astral-nova'],
];

export function getBlockSkin(skinId?: string | null): BlockSkinDef {
  if (skinId && skinId in BLOCK_SKINS) {
    return BLOCK_SKINS[skinId as BlockSkinId];
  }
  return BLOCK_SKINS['classic-gloss'];
}

export function isBlockSkinUnlocked(
  skinId: BlockSkinId,
  bestStreak: number,
  unlockedSkins?: string[]
): boolean {
  const skin = BLOCK_SKINS[skinId];
  if (skin.isStarter || skin.requiredStreakDays <= 0) return true;
  if (bestStreak >= skin.requiredStreakDays) return true;
  return Array.isArray(unlockedSkins) && unlockedSkins.includes(skinId);
}

export function getUnlockedBlockSkinsForStreak(
  bestStreak: number,
  existingUnlocked: BlockSkinId[] = []
): { allUnlocked: BlockSkinId[]; newlyUnlocked: BlockSkinDef[] } {
  const set = new Set<BlockSkinId>(['classic-gloss', ...existingUnlocked]);
  const newlyUnlocked: BlockSkinDef[] = [];

  for (const id of BLOCK_SKIN_ORDER) {
    const def = BLOCK_SKINS[id];
    if (def.isStarter || bestStreak >= def.requiredStreakDays) {
      if (!set.has(id) && !def.isStarter) {
        newlyUnlocked.push(def);
      }
      set.add(id);
    }
  }

  return {
    allUnlocked: BLOCK_SKIN_ORDER.filter((id) => set.has(id)),
    newlyUnlocked,
  };
}
