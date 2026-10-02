// ─────────────────────────────────────────────────────────────────────────────
// Service policies — extra terms some services add on top of the booking policy
// ─────────────────────────────────────────────────────────────────────────────
//
// Shown in the booking popup before payment and in the confirmation email, so
// the client agrees to the same wording they later receive. Attached to a
// service through `servicePolicy` in lib/service-rules.ts.

export interface PolicySection {
  heading?: string
  paragraphs?: string[]
  bullets?: string[]
  numbered?: string[]
  /** Paragraphs after the list */
  after?: string[]
}

export interface ServicePolicy {
  title: string
  intro: string
  sections: PolicySection[]
  closing: string
}

export const COLORING_POLICY: ServicePolicy = {
  title: 'Essakobea Colouring Policy',
  intro: 'Please read and agree to the following before booking a colouring service.',
  sections: [
    {
      bullets: [
        'Inspo photos are references, not guarantees. They help us understand your preferred tone, brightness, blonde level, warmth or coolness, brunette shade, etc. Hair colouring is craftsmanship, so an exact recreation or colour match cannot be guaranteed.',
        'Please remain open-minded. Our stylists may recommend different shades or tones based on the hair, previous colour, condition and how the hair processes.',
        "Hair reacts differently. Even two units from the same brand can produce different results. Hair quality, previous processing and the hair's individual characteristics all affect the final colour. A colour test will be done before the full service where necessary.",
        'Lighting matters. The same colour can look different indoors, under salon lighting, in natural daylight or direct sunlight. Colours with lightening or bleaching also reflect differently depending on lighting.',
      ],
    },
    {
      heading: 'Colour Corrections',
      paragraphs: [
        'A correction will only be considered where the finished colour has a clear technical issue, specifically:',
      ],
      numbered: [
        'The colour is visibly uneven or poorly blended due to the colouring process; or',
        'The finished colour is significantly darker or significantly brighter than the agreed colour direction discussed before the service.',
      ],
      after: [
        'A correction does not apply where the result differs from the inspiration photo due to lighting, hair quality, previous colour, natural hair characteristics, or normal variation in how hair processes.',
        'If you were unsure about the colour you wanted, did not clearly communicate your preference before the service, approved the recommended shade, or simply change your mind after the colour is completed, this is not considered a correction. Any additional colouring or adjustment in these circumstances will be charged separately.',
        'All correction requests must be raised promptly so that we can assess the hair and determine the appropriate solution.',
      ],
    },
    {
      bullets: [
        'Full payment is required before colouring begins. Your deposit counts towards this, and the balance is due when you drop off your unit.',
        'Hair and unit availability: we will confirm the availability of requested colours or suitable units before your appointment. You may need to consider alternative shades where a specific colour is unavailable.',
      ],
    },
  ],
  closing: 'By booking a colouring service, you confirm that you have read, understood and agreed to this policy. These terms apply throughout your service.',
}
