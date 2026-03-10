import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'

export async function GET() {
  const { data, error } = await adminDb
    .from('stylists')
    .select('*')
    .eq('is_available', true)
    .order('display_order')

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch stylists' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
