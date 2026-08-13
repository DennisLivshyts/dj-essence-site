import type { Metadata } from 'next'
import Link from 'next/link'
import ReviewAdminLoader from '@/components/reviews/ReviewAdminLoader'

export const metadata: Metadata = {
  title: 'Reviews — DJ Essence Admin',
  robots: { index: false, follow: false },
}

export default function ReviewAdminPage() {
  return (
    <div className="standalone-page">
      <header className="standalone-header">
        <Link href="/" className="standalone-back">← Back to site</Link>
        <img src="/djEssence.PNG" alt="DJ Essence" className="standalone-logo" />
      </header>
      <div className="standalone-title">
        <div className="eyebrow">Admin</div>
        <h1>Your <em>reviews</em>.</h1>
        <p>
          Every review lands here first. Nothing goes on the site until you publish it.
        </p>
      </div>
      <ReviewAdminLoader />
    </div>
  )
}
