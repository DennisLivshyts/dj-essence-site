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

export type AddOnGroup = 'Effects & Lighting' | 'Photo & Video' | 'On the Day'

export interface AddOn {
  id: string
  name: string
  group: AddOnGroup
  /** Optional clarifier, shown on the Services section only — chips stay short in the form. */
  note?: string
}

// Grouped because a flat list of fifteen checkboxes is a wall of text in both places
// this renders. Order within a group is Arman's order from his own list.
export const ADDON_GROUPS: AddOnGroup[] = ['Effects & Lighting', 'Photo & Video', 'On the Day']

export const ADDON_GROUP_ACCENT: Record<AddOnGroup, 'acid' | 'magenta' | 'amber'> = {
  'Effects & Lighting': 'magenta',
  'Photo & Video': 'acid',
  'On the Day': 'amber',
}

// Deliberately never bundled into a package — Arman was specific about this.
export const ADDONS: AddOn[] = [
  { id: 'co2',           name: 'CO2 Party Cannon',    group: 'Effects & Lighting' },
  { id: 'sparks',        name: 'Cold Spark Machines', group: 'Effects & Lighting' },
  { id: 'clouds',        name: 'Dancing on Clouds',   group: 'Effects & Lighting', note: 'Dry ice smoke machine' },
  { id: 'confetti',      name: 'Confetti Cannon',     group: 'Effects & Lighting' },
  { id: 'lasers',        name: 'Lasers',              group: 'Effects & Lighting' },
  { id: 'movers',        name: 'Party Light Movers',  group: 'Effects & Lighting' },
  { id: 'uplighting',    name: 'Up Lighting',         group: 'Effects & Lighting' },

  { id: 'booth360',      name: '360 Photobooth',      group: 'Photo & Video' },
  { id: 'booth',         name: 'Regular Photobooth',  group: 'Photo & Video' },
  { id: 'videowall',     name: 'Video Wall',          group: 'Photo & Video' },
  { id: 'photographer',  name: 'Photographer',        group: 'Photo & Video' },
  { id: 'videographer',  name: 'Videographer',        group: 'Photo & Video' },
  { id: 'highlights',    name: 'Highlights & Recaps', group: 'Photo & Video' },

  { id: 'coordination',  name: 'Event Coordination',  group: 'On the Day' },
  { id: 'content',       name: 'Day-of Content Creation', group: 'On the Day' },
]

// Offered so that not knowing which package you want never blocks an enquiry.
export const PACKAGE_UNDECIDED = 'Not sure yet'

export const PACKAGE_CHOICES: string[] = [...PACKAGES.map(p => p.name), PACKAGE_UNDECIDED]
export const ADDON_NAMES: string[] = ADDONS.map(a => a.name)
