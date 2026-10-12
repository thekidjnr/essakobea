import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/supabase/admin'
import { getAdmin as requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await adminDb.from('service_works').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Public pages are cached; show the change right away
  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const { data, error } = await adminDb
    .from('service_works')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Public pages are cached; show the change right away
  revalidatePath('/', 'layout')
  return NextResponse.json(data)
}
