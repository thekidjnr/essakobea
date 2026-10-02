// The booking form saves its state here before redirecting to Paystack, so a
// client whose payment didn't go through can come back and pay again.
export const BOOKING_DRAFT_KEY = 'essakobea:booking-draft'

export function clearBookingDraft() {
  try {
    sessionStorage.removeItem(BOOKING_DRAFT_KEY)
  } catch {}
}
