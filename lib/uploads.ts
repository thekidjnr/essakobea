import { adminDb } from '@/lib/supabase/admin'

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

// Longest edge and size a stored image may have. Bigger ones are shrunk on the
// server before they reach Storage, as a backstop for anything the browser
// didn't compress (old clients, HEIC it couldn't convert, direct API calls).
const MAX_EDGE = 1600
const MAX_STORED_BYTES = 400 * 1024

export type StoredImage = { buffer: Buffer; contentType: string; ext: string }

export async function compressImage(file: File, ext: string): Promise<StoredImage> {
  const original = { buffer: Buffer.from(await file.arrayBuffer()), contentType: file.type, ext }
  // Re-encoding would drop a GIF's animation, and sharp can't read HEIC
  if (ext === 'gif' || ext === 'heic' || ext === 'heif') return original

  try {
    const { default: sharp } = await import('sharp')
    const image = sharp(original.buffer).rotate()
    const { width = 0, height = 0, hasAlpha } = await image.metadata()
    if (Math.max(width, height) <= MAX_EDGE && original.buffer.length <= MAX_STORED_BYTES) return original

    const resized = image.resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
    // WebP keeps transparency; everything else becomes a JPEG
    if (hasAlpha) {
      return { buffer: await resized.webp({ quality: 80 }).toBuffer(), contentType: 'image/webp', ext: 'webp' }
    }
    return { buffer: await resized.jpeg({ quality: 80, mozjpeg: true }).toBuffer(), contentType: 'image/jpeg', ext: 'jpg' }
  } catch {
    // A file sharp can't process is still a valid upload; store it as-is
    return original
  }
}

// Card and grid sized copy, stored next to the full image (see lib/media.ts)
const THUMB_WIDTH = 800
const THUMB_MAX_HEIGHT = 1200

export async function makeThumbnail(image: StoredImage): Promise<Buffer> {
  // Formats sharp won't re-encode keep a copy of the original, so the
  // thumbnail URL always resolves
  if (image.ext === 'gif' || image.ext === 'heic' || image.ext === 'heif') return image.buffer
  try {
    const { default: sharp } = await import('sharp')
    const resized = sharp(image.buffer)
      .rotate()
      .resize(THUMB_WIDTH, THUMB_MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true })
    if (image.ext === 'png') return await resized.png({ compressionLevel: 9, palette: true, quality: 80 }).toBuffer()
    if (image.ext === 'webp') return await resized.webp({ quality: 75 }).toBuffer()
    if (image.ext === 'avif') return await resized.avif({ quality: 55 }).toBuffer()
    return await resized.jpeg({ quality: 75, mozjpeg: true }).toBuffer()
  } catch {
    return image.buffer
  }
}

export function thumbPath(path: string): string {
  return path.replace(/(\.[a-z0-9]+)$/i, '.thumb$1')
}

// Compresses an upload and stores it with its thumbnail. Filenames are unique,
// so the CDN may cache them for a year.
export async function storeImage(file: File, ext: string, folder: string): Promise<{ url: string } | { error: string }> {
  const image = await compressImage(file, ext)
  const thumb = await makeThumbnail(image)
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${image.ext}`
  const options = { contentType: image.contentType, cacheControl: '31536000', upsert: false }

  const bucket = adminDb.storage.from('media')
  const { error } = await bucket.upload(path, image.buffer, options)
  if (error) return { error: error.message }
  const { error: thumbError } = await bucket.upload(thumbPath(path), thumb, options)
  if (thumbError) {
    await bucket.remove([path])
    return { error: thumbError.message }
  }
  return { url: bucket.getPublicUrl(path).data.publicUrl }
}
