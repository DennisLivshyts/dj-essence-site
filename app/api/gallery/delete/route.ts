import { del } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { isValidGalleryPassword, readGalleryOrder, writeGalleryOrder } from '@/lib/galleryStore'
import { posterPathFor } from '@/lib/galleryPaths'

export async function POST(request: Request) {
  if (!checkRateLimit('gallery-delete', getClientIp(request), 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: { password?: unknown; pathname?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  if (!isValidGalleryPassword(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { pathname } = body
  if (typeof pathname !== 'string' || !pathname.startsWith('gallery/') || pathname.length > 300) {
    return NextResponse.json({ error: 'Invalid pathname' }, { status: 422 })
  }

  try {
    await del(pathname)

    // Deleting a clip must take its poster with it, or `_meta/posters/` fills up with
    // orphans that nothing lists and nobody ever cleans out. Best-effort: a missing
    // poster (upload failed, or this is a photo) must not fail the delete.
    if (/\.(mp4|mov|m4v|webm)$/i.test(pathname)) {
      try {
        await del(posterPathFor(pathname))
      } catch {
        // no poster for this clip — nothing to clean up
      }
    }

    const order = await readGalleryOrder()
    if (order.includes(pathname)) {
      await writeGalleryOrder(order.filter(p => p !== pathname))
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Gallery delete error:', err)
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 })
  }
}
