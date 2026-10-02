// Booking add-on fees and the service charge, in GHS. The booking form shows
// these and the bookings API charges them, so both read from here.
export const CUSTOMIZATION_FEES = { standard: 100, express: 150 } as const
export const EMERGENCY_FEE = 200
export const SERVICE_CHARGE_RATE = 0.05

export type CustomizationType = keyof typeof CUSTOMIZATION_FEES

export function bookingTotals(input: {
  base: number
  stylistAdj: number
  customizationType: string | null | undefined
  isEmergency: boolean
}) {
  const customizationFee =
    input.customizationType === 'standard' || input.customizationType === 'express'
      ? CUSTOMIZATION_FEES[input.customizationType]
      : 0
  const emergencyFee = input.isEmergency ? EMERGENCY_FEE : 0
  const subtotal = input.base + input.stylistAdj + customizationFee + emergencyFee
  const serviceCharge = Math.round(subtotal * SERVICE_CHARGE_RATE)
  return { customizationFee, emergencyFee, subtotal, serviceCharge, total: subtotal + serviceCharge }
}

// A price shown as a range ("₵250 – ₵450", "₵250-450", "₵250 to ₵450") means
// what the client pays online is a deposit, not the full price.
export function isPriceRange(price: string | null | undefined): boolean {
  return !!price && /\d\s*(?:[-–—]|to)\s*(?:₵|GHS)?\s*\d/i.test(price)
}
