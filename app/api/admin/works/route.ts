import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin as requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const serviceId = searchParams.get('service_id')
  if (!serviceId) return NextResponse.json({ error: 'service_id required' }, { status: 400 })

  const { data, error } = await adminDb
    .from('service_works')
    .select('*')
    .eq('service_id', serviceId)
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { service_id, image_url, caption, display_order } = body

  if (!service_id || !image_url) {
    return NextResponse.json({ error: 'service_id and image_url are required' }, { status: 400 })
  }

  const { data, error } = await adminDb
    .from('service_works')
    .insert({
      service_id,
      image_url,
      caption: caption ?? null,
      display_order: display_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
