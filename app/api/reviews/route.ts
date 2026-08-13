import { NextResponse } from 'next/server'
import { readApproved } from '@/lib/reviewStore'

/**
 * Public read. Returns only what the Reviews section renders, in Arman's order.
 *
 * NOTE THE ABSENCE OF ANY AGGREGATE. No average, no total count, no
 * `AggregateRating` structured data — anywhere. Curating which testimonials appear
 * on your own marketing site is normal and fine; publishing "4.9 from 62 reviews"
 * computed only over the ones you approved is a factual claim about your reviews
 * that isn't true. Each review shows its own stars and nothing sums them.
 * See 06-Projects/DJ-Essence-Review-System.md.
 */
export async function GET() {
  try {
    const approved = await readApproved()

    // Whitelist the public shape rather than spreading the stored object — that way
    // a field added to Review later can't silently start being served.
    const reviews = approved.map(r => ({
      id: r.id,
      name: r.name,
      eventType: r.eventType,
      eventDate: r.eventDate,
      rating: r.rating,
      text: r.text,
      venue: r.venue,
    }))

    return NextResponse.json({ reviews })
  } catch (err) {
    console.error('Reviews list error:', err)
    // Degrade to empty so the section hides itself rather than erroring the page.
    return NextResponse.json({ reviews: [] })
  }
}
