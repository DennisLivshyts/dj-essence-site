// Shared review types, limits and validation.
//
// PURE MODULE — the only import is the (also pure) bookingOptions list. This is
// deliberate: both the public form (a client component) and the route handlers
// need this, and lib/reviewStore.ts pulls in the *server* @vercel/blob SDK.
// Importing that from a client component drags server code into the browser
// bundle. Exactly the same reasoning as lib/galleryPaths.ts vs lib/galleryStore.ts
// — don't merge them back.
//
// Validation lives here rather than in the route so the form and the server apply
// byte-for-byte the same rules. The drift between two hand-maintained copies of a
// whitelist is what caused the "Mitzvah"/"Other" 422s on the booking form.

import { EVENT_TYPES } from './bookingOptions'

export interface Review {
  id: string
  /** "Jordan M." — first name + last initial is what the form asks for. */
  name: string
  eventType: string
  /** 'YYYY-MM' — displayed as "JUNE 2026". No day: nobody remembers the date. */
  eventDate: string
  rating: number
  text: string
  venue?: string
  /** Must be true to submit. Recorded so there's a stored record of consent. */
  consent: boolean
  submittedAt: string
  approvedAt?: string
}

export const REVIEW_LIMITS = {
  name: 60,
  eventType: 40,
  eventDate: 7,
  venue: 120,
  text: 400,
} as const

export const MIN_REVIEW_TEXT = 20

export const REVIEW_EVENT_TYPES: readonly string[] = EVENT_TYPES

/** Reviews older than this can't be submitted — a typo'd year, not a real event. */
const OLDEST_YEAR = 2000

export type ReviewErrors = Partial<Record<string, string>>

export interface ReviewInput {
  name?: unknown
  eventType?: unknown
  eventDate?: unknown
  rating?: unknown
  text?: unknown
  venue?: unknown
  consent?: unknown
}

/**
 * The single validation pass, run on the client for inline errors and again on
 * the server as the real gate. Returns a field->message map; empty means valid.
 */
export function validateReview(input: ReviewInput): ReviewErrors {
  const errors: ReviewErrors = {}

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

  const name = str(input.name)
  if (!name) errors.name = 'Required'
  else if (name.length > REVIEW_LIMITS.name) errors.name = `Max ${REVIEW_LIMITS.name} characters`

  const eventType = str(input.eventType)
  if (!eventType) errors.eventType = 'Required'
  else if (!REVIEW_EVENT_TYPES.includes(eventType)) errors.eventType = 'Pick an event type'

  const eventDate = str(input.eventDate)
  if (!eventDate) {
    errors.eventDate = 'Required'
  } else if (!/^\d{4}-\d{2}$/.test(eventDate)) {
    errors.eventDate = 'Pick a month'
  } else {
    const [y, m] = eventDate.split('-').map(Number)
    const now = new Date()
    const thisMonth = now.getFullYear() * 12 + now.getMonth()
    const given = y * 12 + (m - 1)
    if (m < 1 || m > 12) errors.eventDate = 'Pick a month'
    else if (y < OLDEST_YEAR) errors.eventDate = 'Check the year'
    else if (given > thisMonth) errors.eventDate = "That's in the future"
  }

  const rating = input.rating
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = 'Pick a rating'
  }

  const text = str(input.text)
  if (!text) errors.text = 'Required'
  else if (text.length < MIN_REVIEW_TEXT) errors.text = `A little more detail — at least ${MIN_REVIEW_TEXT} characters`
  else if (text.length > REVIEW_LIMITS.text) errors.text = `Max ${REVIEW_LIMITS.text} characters`

  const venue = str(input.venue)
  if (venue.length > REVIEW_LIMITS.venue) errors.venue = `Max ${REVIEW_LIMITS.venue} characters`

  if (input.consent !== true) errors.consent = 'Please tick this so we can publish it'

  return errors
}

/** '2026-06' → 'JUNE 2026'. Returns '' for anything unparseable rather than throwing. */
export function formatEventDate(eventDate: string): string {
  if (!/^\d{4}-\d{2}$/.test(eventDate)) return ''
  const [y, m] = eventDate.split('-').map(Number)
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  })
  return `${month} ${y}`.toUpperCase()
}

export function starString(rating: number): string {
  const n = Math.max(0, Math.min(5, Math.round(rating)))
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}
