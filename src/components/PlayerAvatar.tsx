/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isValidAvatarUrl } from '../game/avatar';

interface PlayerAvatarProps {
  letter: string;
  avatarUrl?: string;
  sizeClass?: string;
  textClass?: string;
  roundedClass?: string;
  accentColor?: string;
  bgColor?: string;
  borderColor?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  letter,
  avatarUrl,
  sizeClass = 'w-8 h-8',
  textClass = 'text-xs',
  roundedClass = 'rounded-lg',
  accentColor = '#3debe0',
  bgColor = '#141d30',
  borderColor = '#233250',
}) => {
  const safeLetter = (letter || 'P').charAt(0).toUpperCase();
  const hasPhoto = isValidAvatarUrl(avatarUrl);

  return (
    <div
      style={{
        backgroundColor: bgColor,
        borderColor,
        color: accentColor,
      }}
      className={`${sizeClass} ${roundedClass} border font-black ${textClass} flex items-center justify-center font-['Orbitron',sans-serif] shrink-0 overflow-hidden select-none`}
    >
      {hasPhoto ? (
        <img
          src={avatarUrl}
          alt="Player avatar"
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        safeLetter
      )}
    </div>
  );
};
