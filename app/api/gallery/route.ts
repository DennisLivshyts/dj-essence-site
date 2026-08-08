import { list } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { readGalleryOrder } from '@/lib/galleryStore'
import { POSTER_PREFIX, posterPathFor } from '@/lib/galleryPaths'

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ photos: [] })
  }

  try {
    const [{ blobs }, { blobs: posterBlobs }, order] = await Promise.all([
      list({ prefix: 'gallery/' }),
      list({ prefix: POSTER_PREFIX }),
      readGalleryOrder(),
    ])
    const posterByPath = new Map(posterBlobs.map(b => [b.pathname, b.url]))

    const byPathname = new Map(blobs.map(b => [b.pathname, b]))
    const ordered: typeof blobs = []
    for (const pathname of order) {
      const blob = byPathname.get(pathname)
      if (blob) {
        ordered.push(blob)
        byPathname.delete(pathname)
      }
    }

    // Anything not yet in the manifest (freshly uploaded) — append, newest first
    const rest = [...byPathname.values()].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )

    // Blob's list() doesn't return contentType (only head() does), so videos are
    // identified by extension here rather than every consumer re-deriving it.
    const photos = [...ordered, ...rest].map(b => {
      const isVideo = /\.(mp4|mov|m4v|webm)$/i.test(b.pathname)
      return {
        url: b.url,
        pathname: b.pathname,
        uploadedAt: b.uploadedAt,
        isVideo,
        // undefined when the poster upload failed — the tile just falls back to
        // whatever frame the browser can paint, same as having no poster at all.
        posterUrl: isVideo ? posterByPath.get(posterPathFor(b.pathname)) : undefined,
      }
    })

    return NextResponse.json({ photos })
  } catch (err) {
    console.error('Gallery list error:', err)
    return NextResponse.json({ photos: [] })
  }
}
