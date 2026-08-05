'use client'

import PhotoWall from '@/components/gallery/PhotoWall'

export default function PhotosSection() {
  return (
    <div className="panel panel-photos">
      <div className="eyebrow">05 · Gallery</div>
      <h2>Straight from the <em>booth</em>.</h2>
      <PhotoWall />
    </div>
  )
}
