import { list } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { readGalleryOrder } from '@/lib/galleryStore'

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ photos: [] })
  }

  try {
    const { blobs } = await list({ prefix: 'gallery/' })
    const order = await readGalleryOrder()

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

    const photos = [...ordered, ...rest].map(b => ({
      url: b.url,
      pathname: b.pathname,
      uploadedAt: b.uploadedAt,
    }))

    return NextResponse.json({ photos })
  } catch (err) {
    console.error('Gallery list error:', err)
    return NextResponse.json({ photos: [] })
  }
}
