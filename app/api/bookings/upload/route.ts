import { NextResponse } from 'next/server'
import { imageExtension, MAX_UPLOAD_BYTES, storeImage } from '@/lib/uploads'
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

  const result = await storeImage(file, ext, 'booking-units')
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })

  return NextResponse.json({ url: result.url })
}
