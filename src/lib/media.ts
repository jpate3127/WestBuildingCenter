/**
 * URL helpers for stored files. Safe to import from client components
 * (no Node modules). Every image upload produces two objects:
 *   images/<id>.webp     up to 1600 px on the long side (pages)
 *   images/<id>.t.webp   up to 480 px (cards, thumbnails, link previews)
 */

export function mediaUrl(key: string): string {
  return `/media/${key}`;
}

export function thumbKey(key: string): string {
  return key.replace(/\.webp$/i, ".t.webp");
}

export function thumbUrl(key: string): string {
  return mediaUrl(thumbKey(key));
}

export function isImageKey(key: string): boolean {
  return /\.(webp|jpe?g|png)$/i.test(key);
}

export function isPdfKey(key: string): boolean {
  return /\.pdf$/i.test(key);
}
