import { del, head, list, put } from '@vercel/blob'
import type { Review } from './reviewTypes'

// SERVER ONLY — this imports the @vercel/blob SDK. Never import it from a client
// component; use lib/reviewTypes.ts for anything the browser needs.

// Layout mirrors the gallery's: data under its own top-level prefix, manifests
// under _meta/ so no listing picks them up as content.
export const PENDING_PREFIX = 'reviews/pending/'
export const ARCHIVE_PREFIX = 'reviews/archive/'
const APPROVED_PATH = '_meta/reviews-approved.json'

/**
 * WHY ONE FILE PER SUBMISSION rather than appending to a shared JSON blob:
 * the public submit path must never do a read-modify-write. Two guests submitting
 * in the same second would clobber each other. Creating a uniquely-named file is
 * atomic by construction.
 *
 * The approved manifest below *is* a read-modify-write — but only Arman writes to
 * it, one click at a time, so there's no realistic race. Same trade-off already
 * made by _meta/gallery-order.json.
 */

/**
 * Blob storage on this project is Public-access (the gallery serves <img> straight
 * from blob URLs), so a pending or archived review is protected by having an
 * unguessable URL, not by an access check. The UUID carries ~122 bits of entropy
 * and list() requires the token, so nothing can be enumerated — but this is
 * "unguessable", not "authenticated". That matches the security bar of the rest of
 * the site (there are no user accounts anywhere). No public route ever returns an
 * archive URL.
 */
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function newReviewId(): string {
  return crypto.randomUUID()
}

/**
 * Ids arrive from the admin client and are interpolated into a blob pathname, so
 * they are whitelisted to the UUID shape rather than merely escaped — otherwise
 * an id of '../../gallery/photo.jpg' would let the moderate route delete photos.
 */
export function isValidReviewId(id: unknown): id is string {
  return typeof id === 'string' && ID_RE.test(id)
}

function pathFor(prefix: string, id: string): string {
  return `${prefix}${id}.json`
}

async function readJsonBlob(pathname: string): Promise<Review | null> {
  try {
    const meta = await head(pathname)
    const res = await fetch(meta.url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return isReview(data) ? data : null
  } catch {
    return null
  }
}

function isReview(v: unknown): v is Review {
  if (!v || typeof v !== 'object') return false
  const r = v as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    typeof r.text === 'string' &&
    typeof r.rating === 'number'
  )
}

/** Newest first — the order Arman wants to review them in. */
async function readAllUnder(prefix: string): Promise<Review[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return []
  try {
    const { blobs } = await list({ prefix })
    const reviews = await Promise.all(
      blobs.map(async b => {
        try {
          const res = await fetch(b.url, { cache: 'no-store' })
          if (!res.ok) return null
          const data = await res.json()
          return isReview(data) ? data : null
        } catch {
          return null
        }
      })
    )
    return reviews
      .filter((r): r is Review => r !== null)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
  } catch (err) {
    console.error('Review list error:', err)
    return []
  }
}

export function readPending(): Promise<Review[]> {
  return readAllUnder(PENDING_PREFIX)
}

export function readArchived(): Promise<Review[]> {
  return readAllUnder(ARCHIVE_PREFIX)
}

/** The published list, in Arman's chosen display order. */
export async function readApproved(): Promise<Review[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return []
  try {
    const meta = await head(APPROVED_PATH)
    const res = await fetch(meta.url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data.filter(isReview) : []
  } catch {
    // No manifest yet — nothing has been approved. Not an error.
    return []
  }
}

export async function writeApproved(reviews: Review[]): Promise<void> {
  await put(APPROVED_PATH, JSON.stringify(reviews), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  })
}

export async function putPending(review: Review): Promise<void> {
  await put(pathFor(PENDING_PREFIX, review.id), JSON.stringify(review), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  })
}

export function readPendingById(id: string): Promise<Review | null> {
  return readJsonBlob(pathFor(PENDING_PREFIX, id))
}

export function readArchivedById(id: string): Promise<Review | null> {
  return readJsonBlob(pathFor(ARCHIVE_PREFIX, id))
}

export async function archiveReview(review: Review): Promise<void> {
  await put(pathFor(ARCHIVE_PREFIX, review.id), JSON.stringify(review), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  })
}

export async function deletePending(id: string): Promise<void> {
  try {
    await del(pathFor(PENDING_PREFIX, id))
  } catch {
    // Already gone — the end state is what matters.
  }
}

export async function deleteArchived(id: string): Promise<void> {
  try {
    await del(pathFor(ARCHIVE_PREFIX, id))
  } catch {
    // Already gone.
  }
}
