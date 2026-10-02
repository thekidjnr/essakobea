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
  /** Charge the Standard / Express fee online. Off means it's settled with the salon. */
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

// The booked date is the drop-off day, and coloring takes days, not hours.
// Standard and Express cost nothing online; the salon agrees any extra cost
// with the client on WhatsApp.
const COLORING: Partial<ServiceRules> = {
  hairQuestion: 'Coloring is done on your own unit. Which are you bringing?',
  hairOptions: DEFAULT_RULES.hairOptions.filter((o) => o.id !== 'none'),
  hairNote: 'Need help getting a unit?',
  customizationFees: false,
  customizationCopy: {
    standard: {
      sub: 'Ready in 14 or more working days',
      info: "Drop off your unit on your booking date. Coloring takes 14 working days or more (Tuesday to Saturday), and we'll message you on WhatsApp when it's ready.",
      short: 'Ready in 14+ working days',
    },
    express: {
      sub: 'Usually ready in 3 to 5 working days',
      info: "Drop off your unit on your booking date. Express usually takes 3 to 5 working days (Tuesday to Saturday). We'll confirm the timing and the extra cost on WhatsApp.",
      short: 'Ready in 3 to 5 working days, extra cost confirmed on WhatsApp',
    },
  },
  unitStepLabel: 'Color',
  unitStepTitle: { lead: 'Your', italic: 'color.' },
  unitStepIntro: 'Choose how soon you need it, then add your photos.',
  photoLabel: 'Your unit',
  photoHelp: "A photo of the unit you're dropping off.",
  inspoPhoto: { label: 'Color inspo', help: "A photo of the color you'd like." },
  scheduleNote: "This is the day you drop off your unit. We'll start on it from then.",
  balanceDue: 'when you drop off your unit, before colouring begins',
  servicePolicy: COLORING_POLICY,
}

const OVERRIDES: Record<string, Partial<ServiceRules>> = {
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
