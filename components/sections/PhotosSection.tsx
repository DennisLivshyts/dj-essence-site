'use client'

import PhotoWall from '@/components/gallery/PhotoWall'

interface Props {
  /** Mobile — passed straight through to the wall, which does the capping. */
  compact?: boolean
}

export default function PhotosSection({ compact = false }: Props) {
  return (
    <div className="panel panel-photos">
      <div className="eyebrow">05 · Gallery</div>
      <h2>Straight from the <em>booth</em>.</h2>
      <PhotoWall compact={compact} />
    </div>
  )
}
