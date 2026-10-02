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

export type HairUnitType = 'own_new' | 'own_existing' | 'own_extensions' | 'none'

export interface HairOption {
  id: HairUnitType
  label: string
  sub: string
  icon: 'sparkle' | 'refresh' | 'scissors'
}

export interface ServiceRules {
  hairTitle: { lead: string; italic: string }
  hairQuestion: string
  hairOptions: HairOption[]
  /** Standard / Express choice (and its fee) when the client brings hair */
  customization: boolean
  /** Ask how many bundles the client is bringing (info only, no price impact) */
  askBundles: boolean
  /** Step label and heading for the "about your hair" step */
  unitStepLabel: string
  unitStepTitle: { lead: string; italic: string }
  unitStepIntro: string
  photoLabel: string
  photoHelp: string
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
  askBundles: false,
  unitStepLabel: 'Customization',
  unitStepTitle: { lead: 'Unit', italic: 'customization.' },
  unitStepIntro: 'How would you like your unit prepared?',
  photoLabel: 'Unit photo',
  photoHelp: 'Add at least one photo of your unit so your stylist can prepare in advance.',
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

const OVERRIDES: Record<string, Partial<ServiceRules>> = {
  // Clients bring extensions; the photo shows whether they're new or used,
  // so there's no new/existing split and no Standard/Express step.
  ponytails: PONYTAILS,
  // Old slug, until migration 017 has run on every database
  'frontal-styling': PONYTAILS,
}

export function getServiceRules(slug: string | null | undefined): ServiceRules {
  return { ...DEFAULT_RULES, ...(slug ? OVERRIDES[slug] : undefined) }
}

/** True when the chosen hair option means the client is bringing hair */
export function bringsHair(type: string | null | undefined): boolean {
  return !!type && type !== 'none'
}
