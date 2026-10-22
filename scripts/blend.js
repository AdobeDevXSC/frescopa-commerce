/**
 * Product photos with an opaque, near-white background are tinted into their
 * ground with `mix-blend-mode: multiply` (class `blend-multiply`). Transparent
 * cut-outs keep the normal blend. Detection samples the image corners, so
 * authors never have to choose.
 */

function whenLoaded(img) {
  if (img.complete && img.naturalWidth) return Promise.resolve(img);
  return new Promise((resolve) => {
    img.addEventListener('load', () => resolve(img), { once: true });
    img.addEventListener('error', () => resolve(null), { once: true });
  });
}

// cross-origin images (e.g. DAM delivery in local previews) need a CORS copy to be readable
function readable(img) {
  const src = img.currentSrc || img.src;
  const { origin } = new URL(src, window.location.href);
  if (origin === window.location.origin) return Promise.resolve(img);
  return new Promise((resolve) => {
    const probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.onload = () => resolve(probe);
    probe.onerror = () => resolve(null);
    probe.src = src;
  });
}

function hasOpaqueWhiteCorners(img) {
  const size = 8;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  return [0, size - 1, size * (size - 1), size * size - 1].every((px) => {
    const i = px * 4;
    return data[i + 3] === 255 && data[i] > 230 && data[i + 1] > 230 && data[i + 2] > 230;
  });
}

/**
 * Flags opaque white-background images for multiply blending
 * @param {Iterable<HTMLImageElement>} images The images to check
 */
export default function blendOpaqueImages(images) {
  [...images].forEach(async (img) => {
    const loaded = await whenLoaded(img);
    const sample = loaded && await readable(loaded);
    if (!sample) return;
    try {
      if (hasOpaqueWhiteCorners(sample)) img.classList.add('blend-multiply');
    } catch (e) {
      // unreadable (tainted) image: keep the normal blend
    }
  });
}
