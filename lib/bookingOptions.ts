// Single source of truth for every choice the booking form offers.
//
// The Services section renders these, the booking form offers them, and
// app/api/booking/route.ts validates submissions against the very same lists.
// Keeping them in one module means the UI can never offer an option the server
// rejects — which is exactly how "Mitzvah" and "Other" ended up returning 422s
// while the dropdown happily showed them.

export const EVENT_TYPES = [
  'Wedding',
  'Quinceañera',
  'Mitzvah',
  'Birthday / Private',
  'Corporate',
  'Club / Concert',
  'Other',
] as const

export interface Package {
  id: string
  tier: string
  name: string
  tagline: string
  deco: 'wave' | 'knobs' | 'beams'
  accent: 'acid' | 'magenta' | 'amber'
  feats: string[]
}

// Each tier stacks on the one before it — the feature lists are written to read
// top-to-bottom as an escalation, not as a checkbox matrix.
export const PACKAGES: Package[] = [
  {
    id: 'essentials',
    tier: '01',
    name: 'Essentials',
    tagline: 'The music, handled.',
    deco: 'wave',
    accent: 'acid',
    feats: [
      'Professional sound system',
      'Open‑format DJ for the full event',
      'Basic announcements & introductions',
    ],
  },
  {
    id: 'signature',
    tier: '02',
    name: 'Signature',
    tagline: 'The music and the room, hosted.',
    deco: 'knobs',
    accent: 'magenta',
    feats: [
      'Everything in Essentials',
      'Full MC hosting — leads the event start to finish',
      'Runs your timeline so the night flows',
    ],
  },
  {
    id: 'full',
    tier: '03',
    name: 'Full Production',
    tagline: 'The whole show.',
    deco: 'beams',
    accent: 'amber',
    feats: [
      'Everything in Signature',
      'State‑of‑the‑art lighting for the full party',
      'Sound, hosting and lighting from one team',
    ],
  },
]

export interface AddOn {
  id: string
  accent: 'acid' | 'magenta' | 'amber'
  name: string
  desc: string
}

// Deliberately never bundled into a package — Arman was specific about this.
export const ADDONS: AddOn[] = [
  {
    id: 'clouds',
    accent: 'acid',
    name: 'Dancing on Clouds',
    desc: 'Low‑fog floor effect for the first dance. Magazine‑cover photos, guaranteed.',
  },
  {
    id: 'sparks',
    accent: 'magenta',
    name: 'Cold Sparks',
    desc: 'Indoor‑safe spark fountains for grand entrances & first dances. Zero heat. All drama.',
  },
]

// Offered so that not knowing which package you want never blocks an enquiry.
export const PACKAGE_UNDECIDED = 'Not sure yet'

export const PACKAGE_CHOICES: string[] = [...PACKAGES.map(p => p.name), PACKAGE_UNDECIDED]
export const ADDON_NAMES: string[] = ADDONS.map(a => a.name)
