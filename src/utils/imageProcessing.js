/**
 * Load an image URL safely for HTML5 Canvas usage (handles CORS for Supabase public URLs
 * and direct loading for data: / blob: URLs).
 */
export function loadImageForCanvas(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      resolve(null);
      return;
    }

    const img = new Image();
    const isLocalOrData = src.startsWith('data:') || src.startsWith('blob:');
    if (!isLocalOrData) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => resolve(img);
    img.onerror = async () => {
      if (!isLocalOrData) {
        try {
          const resp = await fetch(src, { mode: 'cors' });
          if (!resp.ok) throw new Error('Fetch failed');
          const blob = await resp.blob();
          const objUrl = URL.createObjectURL(blob);
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = (err) => reject(err);
          fallbackImg.src = objUrl;
          return;
        } catch (err) {
          reject(err);
          return;
        }
      }
      reject(new Error('Failed to load image'));
    };

    img.src = src;
  });
}

/**
 * Read a File/Blob into a base64 payload (without the data:* prefix) and mimeType.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaIdx = result.indexOf(',');
      const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
      resolve({
        base64,
        dataUrl: result,
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * Fetch an image URL or data URL and return base64 + mimeType for Gemini AI studio staging.
 */
export async function imageUrlToBase64(url) {
  if (url.startsWith('data:')) {
    const [header, data] = url.split(',');
    const match = header.match(/data:([^;]+)/);
    const mimeType = match ? match[1] : 'image/png';
    if (mimeType === 'image/svg+xml') {
      const img = await loadImageForCanvas(url);
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL('image/png');
      return {
        base64: pngUrl.split(',')[1],
        mimeType: 'image/png',
        dataUrl: pngUrl,
      };
    }
    return { base64: data, mimeType, dataUrl: url };
  }

  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Could not fetch ornament image for AI studio staging.');
  const blob = await resp.blob();
  return fileToBase64(blob);
}
