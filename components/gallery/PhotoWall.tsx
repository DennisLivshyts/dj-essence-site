'use client'

import { useEffect, useState } from 'react'
import Sheet from '@/components/ui/Sheet'

interface Props {
  /** Mobile. Sections are locked to one screen there, so the wall shows far less. */
  compact?: boolean
}

interface Photo {
  url: string
  uploadedAt: string
  isVideo?: boolean
  posterUrl?: string
}

// Shown until Arman uploads real photos — lets the layout be previewed with real images
// instead of empty tiles. Tagged "DEMO" so they're never mistaken for real event photos.
const PLACEHOLDER_PHOTOS = Array.from({ length: 10 }, (_, i) => `/gallery-placeholder/demo-${i + 1}.jpg`)

// First tile is the big "hero" (spans 2x2, reuses .gallery-tile.a from the Events section CSS).
const BG_CLASSES = ['b', 'c', 'd', 'e', 'f']
function tileClass(i: number): string {
  return i === 0 ? 'a' : BG_CLASSES[(i - 1) % BG_CLASSES.length]
}

function tileLabel(photo: Photo): string {
  return new Date(photo.uploadedAt)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    .toUpperCase()
}

// How many tiles the section shows before handing off to the sheet. See the matching
// note in GallerySection — mobile is a uniform 2×2 rather than one full-width hero.
const VISIBLE_DESKTOP = 9
const VISIBLE_MOBILE  = 4

export default function PhotoWall({ compact = false }: Props) {
  const [photos, setPhotos] = useState<Photo[] | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch('/api/gallery')
      .then(r => r.json())
      .then(d => setPhotos(d.photos ?? []))
      .catch(() => setPhotos([]))
  }, [])

  if (photos === null) return null

  const isDemo  = photos.length === 0
  const items: Photo[] = isDemo
    ? PLACEHOLDER_PHOTOS.map(src => ({ url: src, uploadedAt: '' }))
    : photos
  const total   = items.length
  const visible = compact ? VISIBLE_MOBILE : VISIBLE_DESKTOP
  const videoCount = items.filter(p => p.isVideo).length

  const renderTiles = (limit: number) =>
    items.slice(0, limit).map((photo, i) => (
      <div
        key={photo.url}
        className={`gallery-tile ${tileClass(i)}`}
        data-label={isDemo ? 'DEMO' : tileLabel(photo)}
      >
        {photo.isVideo ? (
          // preload="metadata" is doing the heavy lifting: the browser fetches only
          // the header, not the clip, so a wall of videos costs a few hundred KB
          // instead of tens of MB. There is no transcoding in this stack, so the
          // full file downloads only when a visitor actually presses play.
          // The #t=0.1 fragment makes it seek to a real frame for the still.
          <video
            src={`${photo.url}#t=0.1`}
            poster={photo.posterUrl}
            // With a poster the browser needs nothing until play is pressed, so the
            // wall costs a few JPEGs. Without one, fall back to fetching just the
            // header so it can at least try to paint a frame instead of a black box.
            preload={photo.posterUrl ? 'none' : 'metadata'}
            controls
            playsInline
            muted
          />
        ) : (
          <img src={photo.url} alt="" loading="lazy" />
        )}
      </div>
    ))

  return (
    <div className="photo-wall">
      {isDemo && (
        <div className="photo-wall-demo-note">Preview — Arman&apos;s real photos will replace these</div>
      )}
      <div className="gallery-grid">{renderTiles(visible)}</div>

      {total > visible && (
        <button type="button" className="see-all" onClick={() => setShowAll(true)}>
          <span>
            See all {total} {videoCount > 0 ? 'photos & videos' : 'photos'}
          </span>
          <span aria-hidden>→</span>
        </button>
      )}

      <Sheet
        open={showAll}
        onClose={() => setShowAll(false)}
        title="From the booth"
        subtitle={
          videoCount > 0
            ? `${total - videoCount} photo${total - videoCount === 1 ? '' : 's'} · ${videoCount} video${videoCount === 1 ? '' : 's'}`
            : `${total} photo${total === 1 ? '' : 's'}`
        }
      >
        <div className="gallery-grid gallery-grid--sheet">{renderTiles(total)}</div>
      </Sheet>
    </div>
  )
}
