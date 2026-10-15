// ─────────────────────────────────────────────────────────────────────────────
// Service rules — per-service tweaks to the booking flow
// ─────────────────────────────────────────────────────────────────────────────
//
// Most services share one flow: "Do you have a hair unit?" (new / existing /
// none), then Standard or Express customization plus a unit photo. Services
// that work differently get an entry here, keyed by service slug. Slugs are
// not editable in the admin, so they're a stable key even if a service is
// renamed. Shared by the booking form and the bookings API so the server
// never charges for a step the form didn't show.

import type { CustomizationType } from '@/lib/booking-fees'
import { COLORING_POLICY, type ServicePolicy } from '@/lib/policies'

export type HairUnitType = 'own_new' | 'own_existing' | 'own_extensions' | 'none'

export interface HairOption {
  id: HairUnitType
  label: string
  sub: string
  icon: 'sparkle' | 'refresh' | 'scissors'
}

export interface CustomizationCopy {
  /** Under the option name on its card */
  sub: string
  /** Note shown once the option is picked */
  info: string
  /** Short summary for the review step, emails and admin */
  short: string
}

export interface ServiceRules {
  hairTitle: { lead: string; italic: string }
  hairQuestion: string
  hairOptions: HairOption[]
  /** Optional note under the hair options, followed by a WhatsApp link */
  hairNote?: string
  /** Standard / Express choice when the client brings hair */
  customization: boolean
  /** Charge the Express fee online. Off means it's settled with the salon. */
  customizationFees: boolean
  customizationCopy: Record<CustomizationType, CustomizationCopy>
  /** Ask how many bundles the client is bringing (info only, no price impact) */
  askBundles: boolean
  /** Step label and heading for the "about your hair" step */
  unitStepLabel: string
  unitStepTitle: { lead: string; italic: string }
  unitStepIntro: string
  photoLabel: string
  photoHelp: string
  /** Optional line under the date & time heading */
  scheduleNote?: string
  /** A second required upload for inspiration photos */
  inspoPhoto?: { label: string; help: string }
  /** When the rest of a deposit is paid, worded for the booking popup */
  balanceDue: string
  /** Extra terms shown in the booking popup and the confirmation email */
  servicePolicy?: ServicePolicy
  /** Working days from drop-off until the unit is ready, when the booked date is a drop-off */
  turnaround?: Record<CustomizationType, Turnaround>
}

export interface Turnaround {
  min: number
  max: number
  /** Can run longer than `max` */
  orMore?: boolean
}

export const BUNDLE_OPTIONS = [1, 2, 3, 4, 5, 6] as const

const DEFAULT_RULES: ServiceRules = {
  hairTitle: { lead: 'Your', italic: 'hair unit.' },
  hairQuestion: 'Will you be bringing a hair unit, or do you only need the service?',
  hairOptions: [
    { id: 'own_new', label: 'I have a new unit', sub: 'Brand new, never installed', icon: 'sparkle' },
    { id: 'own_existing', label: 'I have an existing unit', sub: 'Previously worn or installed', icon: 'refresh' },
    { id: 'none', label: 'Just the service', sub: 'No unit needed from me', icon: 'scissors' },
  ],
  customization: true,
  customizationFees: true,
  customizationCopy: {
    standard: {
      sub: 'Drop off your unit 48–72 hrs before your appointment',
      info: "You'll need to drop off your unit at the salon 48–72 hours before your appointment date. We'll have everything ready for you on the day.",
      short: 'Drop off 48–72 hrs before',
    },
    express: {
      sub: 'Bring your unit on the day, allow 45 min–2 hrs extra depending on density',
      info: 'Bring your unit along to your appointment. Please allow an additional 45 minutes to 2 hours on top of your scheduled time, exact duration depends on the density of the unit.',
      short: 'Bring unit on the day',
    },
  },
  askBundles: false,
  unitStepLabel: 'Customization',
  unitStepTitle: { lead: 'Unit', italic: 'customization.' },
  unitStepIntro: 'How would you like your unit prepared?',
  photoLabel: 'Unit photo',
  photoHelp: 'Add at least one photo of your unit so your stylist can prepare in advance.',
  balanceDue: 'when the service is done',
}

const PONYTAILS: Partial<ServiceRules> = {
  hairTitle: { lead: 'Your', italic: 'extensions.' },
  hairQuestion: 'Will you be bringing your own extensions?',
  hairOptions: [
    { id: 'own_extensions', label: "Yes, I'm bringing extensions", sub: 'New or previously used', icon: 'sparkle' },
    { id: 'none', label: 'No, just the service', sub: 'No extensions needed from me', icon: 'scissors' },
  ],
  customization: false,
  askBundles: true,
  unitStepLabel: 'Extensions',
  unitStepTitle: { lead: 'About your', italic: 'extensions.' },
  unitStepIntro: 'A quick photo and bundle count so your stylist can prepare.',
  photoLabel: 'Extensions photo',
  photoHelp: 'Add at least one photo of your extensions so your stylist can see what you are bringing.',
}

// Same extensions flow as ponytails, worded for bundles
const SEW_IN: Partial<ServiceRules> = {
  ...PONYTAILS,
  hairTitle: { lead: 'Your', italic: 'bundles.' },
  hairQuestion: 'Will you be bringing your own bundles (and closure or frontal, if needed)?',
  hairOptions: [
    { id: 'own_extensions', label: "Yes, I'm bringing my hair", sub: 'Bundles, closure or frontal', icon: 'sparkle' },
    { id: 'none', label: 'No, just the service', sub: 'No hair needed from me', icon: 'scissors' },
  ],
  unitStepLabel: 'Your hair',
  unitStepTitle: { lead: 'About your', italic: 'hair.' },
  photoLabel: 'Hair photo',
  photoHelp: 'Add at least one photo of the hair you are bringing so your stylist can prepare.',
}

// The booked date is the drop-off day for wig making and coloring: both work
// on the client's own unit and take days, not hours.
const DROP_OFF_NOTE = "This is the day you drop off your unit. We'll start on it from then."

const WIG_MAKING: Partial<ServiceRules> = {
  hairQuestion: 'Wig making is done on your own unit. Which are you bringing?',
  hairOptions: DEFAULT_RULES.hairOptions.filter((o) => o.id !== 'none'),
  hairNote: 'Need help getting a unit?',
  customizationCopy: {
    standard: {
      sub: 'Ready in 5 to 7 working days',
      info: "Drop off your unit on your booking date. Standard takes 5 to 7 working days (Tuesday to Saturday), and we'll message you on WhatsApp when it's ready.",
      short: 'Ready in 5 to 7 working days',
    },
    express: {
      sub: 'Ready in 24 to 72 hours',
      info: "Drop off your unit on your booking date. Express takes 24 to 72 hours (Tuesday to Saturday), and we'll message you on WhatsApp when it's ready.",
      short: 'Ready in 24 to 72 hours',
    },
  },
  scheduleNote: DROP_OFF_NOTE,
  turnaround: {
    standard: { min: 5, max: 7 },
    // 24 to 72 hours
    express: { min: 1, max: 3 },
  },
}

// Standard and Express cost nothing online. Express still doubles the price,
// settled with the balance when the client drops off their unit.
const COLORING: Partial<ServiceRules> = {
  hairQuestion: 'Coloring is done on your own unit. Which are you bringing?',
  hairOptions: DEFAULT_RULES.hairOptions.filter((o) => o.id !== 'none'),
  hairNote: 'Need help getting a unit?',
  customizationFees: false,
  customizationCopy: {
    standard: {
      sub: 'Ready in 10 to 14 working days or more',
      info: "Drop off your unit on your booking date. Coloring takes 10 to 14 working days or more (Tuesday to Saturday), and we'll message you on WhatsApp when it's ready.",
      short: 'Ready in 10 to 14+ working days',
    },
    express: {
      sub: 'Usually ready in 3 to 5 working days',
      info: "Drop off your unit on your booking date. Express usually takes 3 to 5 working days (Tuesday to Saturday), and we'll confirm the timing on WhatsApp. Express doubles the price, paid with your balance when you drop off your unit.",
      short: 'Ready in 3 to 5 working days, double the price',
    },
  },
  turnaround: {
    standard: { min: 10, max: 14, orMore: true },
    express: { min: 3, max: 5 },
  },
  unitStepLabel: 'Color',
  unitStepTitle: { lead: 'Your', italic: 'color.' },
  unitStepIntro: 'Choose how soon you need it, then add your photos.',
  photoLabel: 'Your unit',
  photoHelp: "A photo of the unit you're dropping off.",
  inspoPhoto: { label: 'Color inspo', help: "A photo of the color you'd like." },
  scheduleNote: DROP_OFF_NOTE,
  balanceDue: 'when you drop off your unit, before colouring begins',
  servicePolicy: COLORING_POLICY,
}

const OVERRIDES: Record<string, Partial<ServiceRules>> = {
  'wig-making': WIG_MAKING,
  coloring: COLORING,
  // Clients bring extensions; the photo shows whether they're new or used,
  // so there's no new/existing split and no Standard/Express step.
  // frontal-ponytails has no entry: it uses the hair unit flow above.
  'regular-ponytails': PONYTAILS,
  'sew-in': SEW_IN,
  // Old slugs, until migrations 017 and 018 have run on every database
  ponytails: PONYTAILS,
  'frontal-styling': PONYTAILS,
}

export function getServiceRules(slug: string | null | undefined): ServiceRules {
  return { ...DEFAULT_RULES, ...(slug ? OVERRIDES[slug] : undefined) }
}

/** "Standard (drop off 48–72 hrs before)", worded for the booked service */
export function customizationLabel(slug: string | null | undefined, type: string | null | undefined): string | null {
  if (type !== 'standard' && type !== 'express') return null
  const { short } = getServiceRules(slug).customizationCopy[type]
  const name = type === 'standard' ? 'Standard' : 'Express'
  return `${name} (${short[0].toLowerCase()}${short.slice(1)})`
}

/** True when the chosen hair option means the client is bringing hair */
export function bringsHair(type: string | null | undefined): boolean {
  return !!type && type !== 'none'
}

// The salon works Tuesday to Saturday
const WORKING_DAYS = new Set([2, 3, 4, 5, 6])

function addWorkingDays(date: Date, days: number): Date {
  const d = new Date(date)
  let left = days
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1)
    if (WORKING_DAYS.has(d.getUTCDay())) left--
  }
  return d
}

export interface ReadyEstimate {
  /** YYYY-MM-DD */
  from: string
  to: string
  orMore: boolean
}

/** When a dropped-off unit should be ready, counted in working days from the drop-off date (YYYY-MM-DD) */
export function readyEstimate(
  slug: string | null | undefined,
  type: string | null | undefined,
  dropOffDate: string | null | undefined,
): ReadyEstimate | null {
  if (type !== 'standard' && type !== 'express') return null
  const t = getServiceRules(slug).turnaround?.[type]
  if (!t || !dropOffDate || !/^\d{4}-\d{2}-\d{2}$/.test(dropOffDate)) return null
  const start = new Date(`${dropOffDate}T00:00:00Z`)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return {
    from: iso(addWorkingDays(start, t.min)),
    to: iso(addWorkingDays(start, t.max)),
    orMore: !!t.orMore,
  }
}

/** "Sat 18 Oct to Tue 21 Oct", with ", or later" when it can run longer */
export function formatReadyEstimate(est: ReadyEstimate): string {
  const fmt = (s: string) =>
    new Date(`${s}T00:00:00Z`).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
    })
  return `${fmt(est.from)} to ${fmt(est.to)}${est.orMore ? ', or later' : ''}`
}
