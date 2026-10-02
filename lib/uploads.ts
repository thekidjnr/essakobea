// Raster images only. SVG and HTML can carry scripts, and the media bucket
// is public, so they're never accepted. The stored extension comes from the
// MIME type, not the user's filename.
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/avif': 'avif',
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export function imageExtension(file: File): string | null {
  return IMAGE_TYPES[file.type] ?? null
}
