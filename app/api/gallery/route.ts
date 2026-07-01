import { list } from '@vercel/blob'
import { NextResponse } from 'next/server'

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ photos: [] })
  }

  try {
    const { blobs } = await list({ prefix: 'gallery/' })
    const photos = blobs
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .map(b => ({ url: b.url, uploadedAt: b.uploadedAt }))
    return NextResponse.json({ photos })
  } catch (err) {
    console.error('Gallery list error:', err)
    return NextResponse.json({ photos: [] })
  }
}
