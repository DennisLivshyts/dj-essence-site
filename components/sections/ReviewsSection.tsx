'use client'

import { useEffect, useState } from 'react'
import Sheet from '@/components/ui/Sheet'
import { formatEventDate } from '@/lib/reviewTypes'

interface PublicReview {
  id: string
  name: string
  eventType: string
  eventDate: string
  rating: number
  text: string
  venue?: string
}

// Mobile sections are locked to one 100dvh screen, so the count that fits is smaller
// there and the rest goes behind the sheet — same pattern as Events and Gallery.
const VISIBLE_DESKTOP = 4
const VISIBLE_MOBILE = 2

/**
 * Stars for ONE review. There is deliberately no average and no total anywhere on
 * this site: publishing an aggregate computed only over the reviews Arman approved
 * would be a false claim about his reviews. Curating which ones appear is fine;
 * summing them is not. See 06-Projects/DJ-Essence-Review-System.md.
 */
function Stars({ rating }: { rating: number }) {
  const n = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span className="rev-quote-stars" aria-label={`${n} out of 5 stars`}>
      {'★'.repeat(n)}
      <span className="rev-quote-stars-off">{'★'.repeat(5 - n)}</span>
    </span>
  )
}

/* Class names here are intentionally NOT scoped under .panel-reviews — this markup
   also renders inside <Sheet>, which portals to document.body and would lose any
   ancestor-scoped styling. That has already caused two real bugs on this site. */
function Quote({ review }: { review: PublicReview }) {
  const when = formatEventDate(review.eventDate)
  return (
    <blockquote className="rev-quote">
      <Stars rating={review.rating} />
      <p>{review.text}</p>
      <cite>
        <b>{review.name}</b>
        <span>{[review.eventType, when].filter(Boolean).join(' · ')}</span>
      </cite>
    </blockquote>
  )
}

export default function ReviewsSection({ compact = false }: { compact?: boolean }) {
  const [reviews, setReviews] = useState<PublicReview[] | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/reviews')
      .then(r => r.json())
      .then(d => { if (!cancelled) setReviews(Array.isArray(d.reviews) ? d.reviews : []) })
      .catch(() => { if (!cancelled) setReviews([]) })
    return () => { cancelled = true }
  }, [])

  const limit = compact ? VISIBLE_MOBILE : VISIBLE_DESKTOP
  const shown = reviews?.slice(0, limit) ?? []
  const hasMore = (reviews?.length ?? 0) > limit

  return (
    <div className="panel panel-reviews">
      <img src="/djEssenceSymbol.png" alt="" className="panel-watermark" />
      <div className="eyebrow">06 · Reviews</div>
      <h2>What they <em>say.</em></h2>

      {/* null = still loading. Render nothing rather than flashing the empty state. */}
      {reviews === null ? null : reviews.length === 0 ? (
        <div className="rev-empty">
          <p>
            Reviews from recent events will appear here. If DJ Essence played yours,
            he&apos;d love to hear how it went.
          </p>
          <a href="/review" className="rev-empty-cta">Leave a review →</a>
        </div>
      ) : (
        <>
          <div className="quotes">
            {shown.map(r => <Quote key={r.id} review={r} />)}
          </div>

          <div className="rev-section-foot">
            {hasMore && (
              <button type="button" className="see-all" onClick={() => setSheetOpen(true)}>
                See all {reviews.length} reviews →
              </button>
            )}
            <a href="/review" className="rev-leave-link">Leave a review</a>
          </div>

          <Sheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title="What they say"
            subtitle={`${reviews.length} reviews`}
          >
            <div className="rev-sheet-list">
              {reviews.map(r => <Quote key={r.id} review={r} />)}
            </div>
          </Sheet>
        </>
      )}
    </div>
  )
}
