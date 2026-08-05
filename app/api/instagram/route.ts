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

  // Validate feedId format to prevent path traversal in the URL
  if (!/^(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|feed_[a-z0-9]+)$/.test(feedId)) {
    return NextResponse.json({ posts: [] })
  }

  try {
    const url = `https://api.curator.io/v1/feeds/${feedId}/posts?api_key=${apiKey}&limit=12`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const raw = await res.json()

    if (!res.ok || !raw.posts?.length) {
      // Log server-side only — visible in Vercel's Logs tab, never sent to the client.
      console.error('[instagram] curator returned no posts', { status: res.status })
      return NextResponse.json({ posts: [] })
    }

    const posts = (raw as CuratorResponse).posts
      .filter(p => isSafeHttpsUrl(p.image) && isSafeHttpsUrl(p.url))
      .map(p => ({
        id: String(Number(p.id)),
        mediaType: p.type === 'video' ? 'VIDEO' : 'IMAGE',
        mediaUrl: p.image,
        thumbnailUrl: p.type === 'video' ? p.image : undefined,
        permalink: p.url,
        timestamp: isNaN(new Date(p.created_at).getTime()) ? new Date().toISOString() : new Date(p.created_at).toISOString(),
      }))
      .filter(p => p.id !== 'NaN')

    return NextResponse.json({ posts })
  } catch (e) {
    console.error('[instagram] curator fetch failed', e)
    return NextResponse.json({ posts: [] })
  }
}
