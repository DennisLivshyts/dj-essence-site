import { NextResponse } from 'next/server'

interface CuratorPost {
  id: number
  image: string
  url: string
  text: string
  type: string       // "photo" | "video"
  created_at: string // "2024-01-01 12:00:00"
}

interface CuratorResponse {
  posts: CuratorPost[]
}

function isSafeHttpsUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

export async function GET() {
  const apiKey = process.env.CURATOR_API_KEY
  const feedId = process.env.CURATOR_FEED_ID
  if (!apiKey || !feedId) {
    return NextResponse.json({ posts: [] })
  }

  // Validate feedId is numeric to prevent path traversal in the URL
  if (!/^\d+$/.test(feedId)) {
    return NextResponse.json({ posts: [] })
  }

  try {
    const res = await fetch(
      `https://api.curator.io/v1/feeds/${feedId}/posts?api_key=${apiKey}&status=1&limit=12`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) throw new Error(`Curator ${res.status}`)
    const data: CuratorResponse = await res.json()

    const posts = data.posts
      .filter(p =>
        // Only include posts with safe, valid https URLs
        isSafeHttpsUrl(p.image) && isSafeHttpsUrl(p.url)
      )
      .map(p => ({
        id: String(Number(p.id)),  // coerce to numeric string, reject non-numeric ids
        mediaType: p.type === 'video' ? 'VIDEO' : 'IMAGE',
        mediaUrl: p.image,
        thumbnailUrl: p.type === 'video' ? p.image : undefined,
        permalink: p.url,
        timestamp: new Date(p.created_at).toISOString(),
      }))
      .filter(p => p.id !== 'NaN')

    return NextResponse.json({ posts })
  } catch {
    return NextResponse.json({ posts: [] })
  }
}
