import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('service')
  if (!slug) return NextResponse.json({ error: 'service param required' }, { status: 400 })

  // Resolve service id from slug
  const { data: service, error: svcErr } = await adminDb
    .from('services')
    .select('id, name, slug, tagline')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (svcErr || !service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  const { data: works, error } = await adminDb
    .from('service_works')
    .select('id, image_url, caption, display_order')
    .eq('service_id', service.id)
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ service, works: works ?? [] })
}
