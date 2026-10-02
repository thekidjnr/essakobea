import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin } from '@/lib/admin-auth'
import { imageExtension, MAX_UPLOAD_BYTES } from '@/lib/uploads'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const user = await getAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = imageExtension(file)
  if (!ext) return NextResponse.json({ error: 'Only JPG, PNG, WebP, GIF, HEIC or AVIF images are allowed' }, { status: 400 })
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })

  const rawFolder = (formData.get('folder') as string | null) ?? 'uploads'
  const folder = rawFolder.replace(/[^a-z0-9-]/gi, '') || 'uploads'
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await adminDb.storage
    .from('media')
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = adminDb.storage.from('media').getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
