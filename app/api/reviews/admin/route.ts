import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { isValidGalleryPassword } from '@/lib/galleryStore'
import { readApproved, readArchived, readPending } from '@/lib/reviewStore'

/**
 * Everything Arman can see, in one call: awaiting-decision, published, and the
 * private feedback he chose not to publish.
 *
 * POST rather than GET purely so the password travels in the body — a GET would put
 * it in the URL, where it lands in server logs and browser history. It reads rather
 * than mutates, which is the one deviation from REST here and the reason for this note.
 */
export async function POST(request: Request) {
  if (!checkRateLimit('reviews-admin', getClientIp(request), 60, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: { password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  if (!isValidGalleryPassword(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [pending, live, archived] = await Promise.all([
      readPending(),
      readApproved(),
      readArchived(),
    ])
    return NextResponse.json({ pending, live, archived })
  } catch (err) {
    console.error('Review admin list error:', err)
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}
