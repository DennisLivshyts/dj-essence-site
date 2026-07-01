'use client'

import { useEffect, useState } from 'react'

interface Post {
  id: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  mediaUrl: string
  thumbnailUrl?: string
  permalink: string
  timestamp: string
}

const GALLERY_COUNT = 9

const PLACEHOLDERS = [
  { label: 'FIRST DANCE' },
  { label: 'CLUB · SOLD OUT' },
  { label: 'COLD SPARKS' },
  { label: 'MAIN STAGE' },
  { label: 'UP LIGHTS' },
  { label: 'ON CLOUDS' },
  { label: 'LIVE MIX' },
  { label: 'CROWD ENERGY' },
  { label: 'ENCORE' },
]

// First tile is the big "hero" (spans 2x2); the rest cycle through the remaining tile styles.
const BG_CLASSES = ['b', 'c', 'd', 'e', 'f']
function tileClass(i: number): string {
  return i === 0 ? 'a' : BG_CLASSES[(i - 1) % BG_CLASSES.length]
}

function tileLabel(post: Post): string {
  const date = new Date(post.timestamp)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    .toUpperCase()
  return post.mediaType === 'VIDEO' ? `▶ REEL · ${date}` : date
}

export default function GallerySection() {
  const [posts, setPosts] = useState<Post[] | null>(null)

  useEffect(() => {
    fetch('/api/instagram')
      .then(r => r.json())
      .then(d => setPosts(d.posts ?? []))
      .catch(() => setPosts([]))
  }, [])

  const livePosts = posts && posts.length > 0

  return (
    <div className="panel panel-gallery">
      <div className="eyebrow">04 · Events</div>
      <h2>The <em>room</em> in motion.</h2>
      <div className="gallery-grid">
        {!livePosts
          ? PLACEHOLDERS.map((t, i) => (
              <div key={i} className={`gallery-tile ${tileClass(i)}`} data-label={t.label} />
            ))
          : posts!.slice(0, GALLERY_COUNT).map((post, i) => {
              const src = post.mediaType === 'VIDEO'
                ? (post.thumbnailUrl ?? post.mediaUrl)
                : post.mediaUrl
              return (
                <a
                  key={post.id}
                  className={`gallery-tile ${tileClass(i)}`}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-label={tileLabel(post)}
                >
                  <img src={src} alt="" loading="lazy" />
                  {post.mediaType === 'VIDEO' && (
                    <div className="gallery-play" aria-hidden>▶</div>
                  )}
                </a>
              )
            })
        }
      </div>
    </div>
  )
}
