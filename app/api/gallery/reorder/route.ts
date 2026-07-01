import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { isValidGalleryPassword, writeGalleryOrder } from '@/lib/galleryStore'

const MAX_ITEMS = 500

export async function POST(request: Request) {
  if (!checkRateLimit('gallery-reorder', getClientIp(request), 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: { password?: unknown; order?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  if (!isValidGalleryPassword(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { order } = body
  if (
    !Array.isArray(order) ||
    order.length > MAX_ITEMS ||
    !order.every(p => typeof p === 'string' && p.startsWith('gallery/') && p.length <= 300)
  ) {
    return NextResponse.json({ error: 'Invalid order payload' }, { status: 422 })
  }

  try {
    await writeGalleryOrder(order)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Gallery reorder error:', err)
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
  }
}
