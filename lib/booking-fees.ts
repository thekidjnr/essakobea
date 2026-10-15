// Booking add-on fees and the service charge, in GHS. The booking form shows
// these and the bookings API charges them, so both read from here.
export const EMERGENCY_FEE = 200
export const SERVICE_CHARGE_RATE = 0.05

export type CustomizationType = 'standard' | 'express'

// Standard costs nothing extra. Express doubles the service price: the online
// price (the deposit, for range prices) is charged again, and the balance
// paid at the salon is doubled too. A stylist's fee is not doubled.
export function customizationFee(type: string | null | undefined, base: number): number {
  return type === 'express' ? base : 0
}

export function bookingTotals(input: {
  base: number
  stylistAdj: number
  customizationType: string | null | undefined
  isEmergency: boolean
}) {
  const custFee = customizationFee(input.customizationType, input.base)
  const emergencyFee = input.isEmergency ? EMERGENCY_FEE : 0
  const subtotal = input.base + input.stylistAdj + custFee + emergencyFee
  const serviceCharge = Math.round(subtotal * SERVICE_CHARGE_RATE)
  return { customizationFee: custFee, emergencyFee, subtotal, serviceCharge, total: subtotal + serviceCharge }
}

// A price shown as a range ("₵250 – ₵450", "₵250-450", "₵250 to ₵450") means
// what the client pays online is a deposit, not the full price.
export function isPriceRange(price: string | null | undefined): boolean {
  return !!price && /\d\s*(?:[-–—]|to)\s*(?:₵|GHS)?\s*\d/i.test(price)
}
