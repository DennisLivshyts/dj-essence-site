import type { Metadata } from 'next'
import Link from 'next/link'
import ReviewForm from '@/components/reviews/ReviewForm'

export const metadata: Metadata = {
  title: 'Leave a review — DJ Essence',
  description: 'Tell DJ Essence how your event went.',
}

export default function ReviewPage() {
  return (
    <div className="standalone-page">
      <header className="standalone-header">
        <Link href="/" className="standalone-back">← Back to site</Link>
        <img src="/djEssence.PNG" alt="DJ Essence" className="standalone-logo" />
      </header>
      <div className="standalone-title">
        <div className="eyebrow">Leave a review</div>
        <h1>How was the <em>night</em>?</h1>
        <p>
          Takes about a minute. If it was great, it helps other people find him — and if
          something fell short, he&apos;d genuinely rather hear it from you directly.
        </p>
      </div>
      <ReviewForm />
    </div>
  )
}
