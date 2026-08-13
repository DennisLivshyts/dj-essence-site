import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Thanks — DJ Essence',
  robots: { index: false, follow: false },
}

/**
 * Self-contained by design: NO outbound links to Google, Yelp or any third-party
 * review platform. Funnelling only the happy submitters onward to a public review
 * site is review-gating, and it's the thing the FTC's 2024 rule is aimed at.
 * The page ends on his own booking link instead.
 */
export default function ThanksPage() {
  return (
    <div className="standalone-page">
      <header className="standalone-header">
        <Link href="/" className="standalone-back">← Back to site</Link>
        <img src="/djEssence.PNG" alt="DJ Essence" className="standalone-logo" />
      </header>

      <div className="rev-thanks">
        <div className="rev-thanks-mark">★</div>
        <h1>Thank you.</h1>
        <p>
          Your review went straight to DJ Essence. He reads every one himself before
          anything goes on the site, so give it a day or two to appear.
        </p>
        <p className="rev-thanks-sub">
          Got an event coming up, or know someone who does?
        </p>
        <Link href="/" className="rev-thanks-cta">Book a date →</Link>
      </div>
    </div>
  )
}
