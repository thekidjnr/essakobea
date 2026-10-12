import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { compressImage, imageExtension, MAX_UPLOAD_BYTES } from '@/lib/uploads'
import { allowRequest, clientIp } from '@/lib/rate-limit'

// A booking needs a handful of photos at most; this stops scripts filling Storage
const UPLOAD_LIMIT = 20
const UPLOAD_WINDOW_MS = 60 * 60 * 1000

// Public endpoint: clients upload hair unit photos during booking
export async function POST(req: Request) {
  if (!allowRequest(`booking-upload:${clientIp(req)}`, UPLOAD_LIMIT, UPLOAD_WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Basic validation
  const ext = imageExtension(file)
  if (!ext) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP, GIF, HEIC or AVIF images are allowed' }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
  }

  const image = await compressImage(file, ext)
  const filename = `booking-units/${Date.now()}-${Math.random().toString(36).slice(2)}.${image.ext}`

  const { error } = await adminDb.storage
    .from('media')
    .upload(filename, image.buffer, { contentType: image.contentType, cacheControl: '31536000', upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = adminDb.storage.from('media').getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
