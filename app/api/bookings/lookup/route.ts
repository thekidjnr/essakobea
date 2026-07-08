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
  // Legacy bookings were stored as a raw Ghana local number (e.g. "0557205803")
  // before the country-code picker existed — also match against that format.
  const legacyLocal = normalised.startsWith('233') ? `0${normalised.slice(3)}` : null

  const variants = [phone, normalised, `+${normalised}`, ...(legacyLocal ? [legacyLocal] : [])]
  const orFilter = variants.map((v) => `client_phone.eq.${v}`).join(',')

  const { data } = await adminDb
    .from('bookings')
    .select('client_name, client_email, client_phone')
    .or(orFilter)
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
