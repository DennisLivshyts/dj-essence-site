'use client'

import { useEffect, useState } from 'react'
import Sheet from '@/components/ui/Sheet'

interface Props {
  /** Mobile. Sections are locked to one screen there, so the grid shows far less. */
  compact?: boolean
}

interface Post {
  id: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  mediaUrl: string
  thumbnailUrl?: string
  permalink: string
  timestamp: string
}

// How many tiles the section itself shows before handing off to the sheet.
// Mobile is 3 because that is literally what fits: the hero tile spans the full width of
// a 2-column phone grid (~334px) and one more row of two (~163px) lands at ~505px, which
// is what is left of the 712px content box after the heading and the See-all button.
const VISIBLE_DESKTOP = 9
const VISIBLE_MOBILE  = 3

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

export default function GallerySection({ compact = false }: Props) {
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch('/api/instagram')
      .then(r => r.json())
      .then(d => setPosts(d.posts ?? []))
      .catch(() => setPosts([]))
  }, [])

  const livePosts = posts && posts.length > 0
  const total   = livePosts ? posts!.length : PLACEHOLDERS.length
  const visible = compact ? VISIBLE_MOBILE : VISIBLE_DESKTOP
  const videoCount = livePosts ? posts!.filter(p => p.mediaType === 'VIDEO').length : 0

  const renderTiles = (limit: number) =>
    !livePosts
      ? PLACEHOLDERS.slice(0, limit).map((t, i) => (
          <div key={i} className={`gallery-tile ${tileClass(i)}`} data-label={t.label} />
        ))
      : posts!.slice(0, limit).map((post, i) => {
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

  return (
    <div className="panel panel-gallery">
      <div className="eyebrow">04 · Events</div>
      <h2>The <em>room</em> in motion.</h2>
      <div className="gallery-grid">{renderTiles(visible)}</div>

      {total > visible && (
        <button type="button" className="see-all" onClick={() => setShowAll(true)}>
          <span>See all {total}{videoCount > 0 ? ` · ${videoCount} reels` : ''}</span>
          <span aria-hidden>→</span>
        </button>
      )}

      <Sheet
        open={showAll}
        onClose={() => setShowAll(false)}
        title="Events"
        subtitle={`${total} post${total === 1 ? '' : 's'} from @djessence_official`}
      >
        {/* Uniform tiles in the sheet — the 2×2 hero is a layout accent for the section,
            but when you have opened this specifically to browse, equal weight is right. */}
        <div className="gallery-grid gallery-grid--sheet">{renderTiles(total)}</div>
      </Sheet>
    </div>
  )
}
