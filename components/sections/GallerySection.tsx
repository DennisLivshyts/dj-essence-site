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

const PLACEHOLDERS = [
  { cls: 'a', label: 'FIRST DANCE' },
  { cls: 'b', label: 'CLUB · SOLD OUT' },
  { cls: 'c', label: 'COLD SPARKS' },
  { cls: 'd', label: 'MAIN STAGE' },
  { cls: 'e', label: 'UP LIGHTS' },
  { cls: 'f', label: 'ON CLOUDS' },
]

const SPANS = ['a', 'b', 'c', 'd', 'e', 'f']

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
              <div key={i} className={`gallery-tile ${t.cls}`} data-label={t.label} />
            ))
          : posts!.slice(0, 6).map((post, i) => {
              const src = post.mediaType === 'VIDEO'
                ? (post.thumbnailUrl ?? post.mediaUrl)
                : post.mediaUrl
              return (
                <a
                  key={post.id}
                  className={`gallery-tile ${SPANS[i]}`}
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
