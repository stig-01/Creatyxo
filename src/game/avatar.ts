/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const MAX_AVATAR_DATA_URL_LENGTH = 23000;

/**
 * Center-crops and compresses an imported image file into a crisp 96x96 JPEG data URL
 * so it stays fast and well within Firestore document size limits.
 */
export function resizeAvatarImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (PNG, JPG, or WEBP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unsupported or corrupted image format.'));
      img.onload = () => {
        const size = 96;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Image processing is not supported on this browser.'));
          return;
        }

        // Fill dark base in case source PNG has transparency
        ctx.fillStyle = '#0c1220';
        ctx.fillRect(0, 0, size, size);

        const minSide = Math.min(img.width, img.height);
        const sx = Math.max(0, (img.width - minSide) / 2);
        const sy = Math.max(0, (img.height - minSide) / 2);
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        let quality = 0.78;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH && quality > 0.25) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
          reject(new Error('Image is still too large after compression. Try a simpler image.'));
          return;
        }

        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function isValidAvatarUrl(url?: string | null): url is string {
  if (!url || typeof url !== 'string') return false;
  if (url.length > 24000) return false;
  return /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(url);
}
