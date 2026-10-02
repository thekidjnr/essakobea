import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { allowRequest, clientIp } from '@/lib/rate-limit'

// GET /api/bookings/lookup?phone=+233557205803
// Lets the booking form greet a returning client. This is public, so it only
// ever reveals a first name: never the full name, email or booking history.
// Anyone could type someone else's number here.
const LOOKUP_LIMIT = 10
const LOOKUP_WINDOW_MS = 10 * 60 * 1000

export async function GET(req: Request) {
  if (!allowRequest(`lookup:${clientIp(req)}`, LOOKUP_LIMIT, LOOKUP_WINDOW_MS)) {
    return NextResponse.json({ client: null }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')?.trim()

  if (!phone || phone.length < 9) {
    return NextResponse.json({ client: null })
  }

  // Normalise: strip leading + and spaces
  const normalised = phone.replace(/\s+/g, '').replace(/^\+/, '')
  // Only digits may reach the query filter below
  if (!/^\d{7,15}$/.test(normalised)) {
    return NextResponse.json({ client: null })
  }
  // Legacy bookings were stored as a raw Ghana local number (e.g. "0557205803")
  // before the country-code picker existed, so also match against that format.
  const legacyLocal = normalised.startsWith('233') ? `0${normalised.slice(3)}` : null

  const variants = [normalised, `+${normalised}`, ...(legacyLocal ? [legacyLocal] : [])]
  const orFilter = variants.map((v) => `client_phone.eq.${v}`).join(',')

  const { data } = await adminDb
    .from('bookings')
    .select('client_name')
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const firstName = String(data?.client_name ?? '').trim().split(/\s+/)[0]
  if (!firstName) return NextResponse.json({ client: null })

  return NextResponse.json({ client: { firstName } })
}
