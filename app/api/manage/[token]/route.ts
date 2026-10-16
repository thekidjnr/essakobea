import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { normalizePhone } from '@/lib/phone'
import { clientEditBlock, editablePhotos, MAX_NOTES_LENGTH, MAX_PHOTOS } from '@/lib/booking-edits'
import { sendSmsSafely, clientUpdatedAdminSms, ADMIN_NOTIFY_PHONE } from '@/lib/sms'

// PATCH { clientPhone, clientEmail, notes, unitPhotos?, inspoPhotos? }
// The client updating their own booking from the manage link. Only details
// that don't change the price or the time; rules in lib/booking-edits.

// Photos must be ones this booking already has, or new uploads to our own storage
const UPLOAD_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/booking-units/`

function cleanPhotos(input: unknown, existing: string[] | null | undefined): string[] | null {
  if (!Array.isArray(input) || input.length > MAX_PHOTOS) return null
  const ok = input.every((u) => typeof u === 'string' && (existing?.includes(u) || u.startsWith(UPLOAD_PREFIX)))
  return ok ? [...new Set(input as string[])] : null
}

const sameList = (a: string[] | null | undefined, b: string[]) =>
  (a ?? []).length === b.length && b.every((u, i) => a?.[i] === u)

export async function PATCH(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { data: booking } = await adminDb.from('bookings').select('*').eq('cancel_token', token).maybeSingle()
  if (!booking) return NextResponse.json({ error: 'Invalid booking link' }, { status: 404 })
  const block = clientEditBlock(booking)
  if (block) return NextResponse.json({ error: block }, { status: 409 })

  const phone = normalizePhone(String(body.clientPhone ?? ''))
  if (phone.replace(/\D/g, '').length < 9) {
    return NextResponse.json({ error: 'Enter your full WhatsApp number.' }, { status: 400 })
  }
  const email = String(body.clientEmail ?? '').trim()
  if (email ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : booking.source !== 'manual') {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  const notes = String(body.notes ?? '').trim()
  if (notes.length > MAX_NOTES_LENGTH) {
    return NextResponse.json({ error: `Notes can be up to ${MAX_NOTES_LENGTH} characters.` }, { status: 400 })
  }

  const update: Record<string, unknown> = { client_phone: phone, client_email: email, notes: notes || null }
  const changed: string[] = []
  if (phone !== booking.client_phone) changed.push(`WhatsApp number (now ${phone})`)
  if (email !== (booking.client_email ?? '')) changed.push('email')
  if ((notes || null) !== (booking.notes || null)) changed.push('notes')

  const photos = editablePhotos(booking)
  if (photos.unit && body.unitPhotos !== undefined) {
    const list = cleanPhotos(body.unitPhotos, booking.unit_photos)
    if (!list) return NextResponse.json({ error: 'Those photos couldn\'t be saved. Please try again.' }, { status: 400 })
    if (list.length === 0) return NextResponse.json({ error: `Add at least one ${photos.unit.label.toLowerCase()}.` }, { status: 400 })
    update.unit_photos = list
    if (!sameList(booking.unit_photos, list)) changed.push('photos')
  }
  if (photos.inspo && body.inspoPhotos !== undefined) {
    const list = cleanPhotos(body.inspoPhotos, booking.inspo_photos)
    if (!list) return NextResponse.json({ error: 'Those photos couldn\'t be saved. Please try again.' }, { status: 400 })
    update.inspo_photos = list
    if (!sameList(booking.inspo_photos, list)) changed.push('inspo photos')
  }

  if (changed.length === 0) return NextResponse.json({ success: true, changed })

  // Only while it's still active, so a cancel in another tab wins
  const { data: updated, error } = await adminDb
    .from('bookings')
    .update(update)
    .eq('id', booking.id)
    .eq('status', 'confirmed')
    .select('id')
    .maybeSingle()
  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Could not save your changes. Please try again.' }, { status: 500 })
  }
  if (!updated) return NextResponse.json({ error: 'This booking was just changed. Please refresh the page.' }, { status: 409 })

  await sendSmsSafely('admin client-update SMS', ADMIN_NOTIFY_PHONE, clientUpdatedAdminSms(booking, changed))

  return NextResponse.json({ success: true, changed })
}
