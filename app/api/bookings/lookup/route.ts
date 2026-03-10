import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'

// GET /api/bookings/lookup?phone=0557205803
// Returns the most recent booking for this phone number for pre-filling returning client details
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')?.trim()

  if (!phone || phone.length < 9) {
    return NextResponse.json({ client: null })
  }

  // Normalise: strip leading + and spaces
  const normalised = phone.replace(/\s+/g, '').replace(/^\+/, '')

  const { data } = await adminDb
    .from('bookings')
    .select('client_name, client_email, client_phone')
    .or(`client_phone.eq.${phone},client_phone.eq.${normalised},client_phone.eq.+${normalised}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return NextResponse.json({ client: null })

  return NextResponse.json({
    client: {
      name: data.client_name,
      email: data.client_email,
      phone: data.client_phone,
    },
  })
}
