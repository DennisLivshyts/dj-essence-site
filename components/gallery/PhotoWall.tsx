'use client'

import { useEffect, useState } from 'react'

interface Photo {
  url: string
  uploadedAt: string
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

export default function PhotoWall() {
  const [photos, setPhotos] = useState<Photo[] | null>(null)

  useEffect(() => {
    fetch('/api/gallery')
      .then(r => r.json())
      .then(d => setPhotos(d.photos ?? []))
      .catch(() => setPhotos([]))
  }, [])

  if (photos === null) return null

  if (photos.length === 0) {
    return (
      <div className="photo-wall">
        <div className="photo-wall-demo-note">Preview — Arman&apos;s real photos will replace these</div>
        <div className="gallery-grid">
          {PLACEHOLDER_PHOTOS.map((src, i) => (
            <div key={src} className={`gallery-tile ${tileClass(i)}`} data-label="DEMO">
              <img src={src} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="photo-wall">
      <div className="gallery-grid">
        {photos.map((photo, i) => (
          <div key={photo.url} className={`gallery-tile ${tileClass(i)}`} data-label={tileLabel(photo)}>
            <img src={photo.url} alt="" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  )
}
