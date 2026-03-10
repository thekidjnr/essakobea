import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'

// Public endpoint: clients upload hair unit photos during booking
export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Basic validation
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only images are allowed' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `booking-units/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await adminDb.storage
    .from('media')
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = adminDb.storage.from('media').getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
