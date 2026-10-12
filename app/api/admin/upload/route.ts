import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin-auth'
import { imageExtension, MAX_UPLOAD_BYTES, storeImage } from '@/lib/uploads'

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
  const result = await storeImage(file, ext, folder)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })

  return NextResponse.json({ url: result.url })
}
