// Client-side image upload. Photos are shrunk and re-encoded as JPEG in the
// browser first: the host rejects request bodies over ~4.5 MB, full-size phone
// photos are often bigger than that, and iPhone HEIC files don't display in
// most browsers.

const MAX_EDGE = 2400
const JPEG_QUALITY = 0.85
// Web-friendly files at or under this size are uploaded untouched, so small
// PNGs keep their transparency.
const PASSTHROUGH_BYTES = 1.5 * 1024 * 1024
const WEB_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

function isHeic(file: File) {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

function jpegName(name: string) {
  return (name.replace(/\.[^.]+$/, '') || 'photo') + '.jpg'
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    // Safari decodes HEIC natively
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch (err) {
    if (!isHeic(file)) throw err
    // Chrome and Firefox can't, so convert it in JavaScript first
    const { default: heic2any } = await import('heic2any')
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY })
    return createImageBitmap(Array.isArray(out) ? out[0] : out)
  }
}

export async function prepareImage(file: File): Promise<File> {
  const webFriendly = WEB_TYPES.includes(file.type)
  if (webFriendly && file.size <= PASSTHROUGH_BYTES) return file
  // Re-encoding would drop a GIF's animation
  if (file.type === 'image/gif') return file

  const bitmap = await decode(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  )
  if (!blob) throw new Error('Could not encode image')
  return new File([blob], jpegName(file.name), { type: 'image/jpeg' })
}

export type UploadResult = { url: string } | { error: string }

export async function uploadImage(
  endpoint: string,
  file: File,
  fields: Record<string, string> = {},
): Promise<UploadResult> {
  let prepared: File
  try {
    prepared = await prepareImage(file)
  } catch {
    if (isHeic(file)) {
      return { error: `"${file.name}" couldn't be converted. Please export it as a JPG and try again.` }
    }
    return { error: `"${file.name}" couldn't be read as an image.` }
  }

  const fd = new FormData()
  fd.append('file', prepared)
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)

  let res: Response
  try {
    res = await fetch(endpoint, { method: 'POST', body: fd })
  } catch {
    return { error: 'Upload failed. Please check your connection and try again.' }
  }

  const data = await res.json().catch(() => null)
  if (res.ok && data?.url) return { url: data.url }
  if (data?.error) return { error: data.error }
  if (res.status === 413) return { error: `"${file.name}" is too large to upload. Please choose a smaller photo.` }
  if (res.status === 401) return { error: 'Your session has expired. Please sign in again.' }
  return { error: `Upload failed (error ${res.status}). Please try again.` }
}
