import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { newReviewId, putPending } from '@/lib/reviewStore'
import { formatEventDate, starString, validateReview, type Review } from '@/lib/reviewTypes'
import { esc, escHeader, transporter } from '@/lib/mailer'

const MAX_BODY_BYTES = 4_000

function buildEmailHtml(r: Review) {
  const row = (label: string, val: string) => `
    <tr>
      <td style="padding:10px 16px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.15em;white-space:nowrap;vertical-align:top;border-bottom:1px solid #1a1a1a;">${label}</td>
      <td style="padding:10px 16px;color:#e8e8e8;font-size:14px;border-bottom:1px solid #1a1a1a;">${val}</td>
    </tr>`

  // Low ratings are tinted amber rather than hidden. The whole value of seeing a bad
  // review first is that it's still fixable — it should be the most visible thing here.
  const ratingColor = r.rating >= 4 ? '#00ff88' : '#fbbf24'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="background:#0a0a0a;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="color:#00ff88;font-size:11px;letter-spacing:.25em;text-transform:uppercase;margin:0 0 6px;">DJ Essence</p>
    <h1 style="color:#e8e8e8;font-size:24px;margin:0 0 8px;font-weight:700;letter-spacing:-.02em;">New Review Submitted</h1>
    <p style="color:${ratingColor};font-size:22px;margin:0 0 24px;letter-spacing:.1em;">${starString(r.rating)}</p>
    <table style="width:100%;border-collapse:collapse;background:#111;border-radius:8px;overflow:hidden;border:1px solid #1a1a1a;">
      ${row('From', esc(r.name))}
      ${row('Event', esc(r.eventType))}
      ${row('When', esc(formatEventDate(r.eventDate)))}
      ${r.venue ? row('Venue', esc(r.venue)) : ''}
      ${row('Review', esc(r.text))}
    </table>
    <p style="color:#e8e8e8;font-size:13px;margin-top:24px;line-height:1.6;">
      <strong>This is not on your site yet.</strong> Nothing appears publicly until you approve it.
    </p>
    <p style="color:#555;font-size:12px;margin-top:14px;line-height:1.6;">
      Open the admin page to publish it or keep it private.<br>
      Sent from the review form on djessence.com.
    </p>
  </div>
</body>
</html>`
}

export async function POST(request: Request) {
  // 5/hour/IP. The approval gate is the real defence against junk — this just keeps
  // a bot from filling the blob store overnight.
  if (!checkRateLimit('reviews-submit', getClientIp(request), 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many submissions — please try again later.' },
      { status: 429 }
    )
  }

  let text: string
  try {
    text = await request.text()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  // Honeypot: a hidden field no human ever fills. Return 201 rather than an error so
  // a bot gets no signal that it was caught — nothing is stored.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  const errors = validateReview(body)
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Review submit failed: BLOB_READ_WRITE_TOKEN is not set')
    return NextResponse.json(
      { error: 'Reviews are temporarily unavailable — please try again later.' },
      { status: 503 }
    )
  }

  const venue = typeof body.venue === 'string' ? body.venue.trim() : ''
  const review: Review = {
    id: newReviewId(),
    name: String(body.name).trim(),
    eventType: String(body.eventType).trim(),
    eventDate: String(body.eventDate).trim(),
    rating: body.rating as number,
    text: String(body.text).trim(),
    ...(venue ? { venue } : {}),
    consent: true,
    submittedAt: new Date().toISOString(),
  }

  // Store BEFORE emailing. If the mail step fails the review is still safely
  // pending and shows up in the admin page; the reverse would lose it outright.
  try {
    await putPending(review)
  } catch (err) {
    console.error('Review store error:', err)
    return NextResponse.json({ error: 'Failed to save your review' }, { status: 500 })
  }

  try {
    await transporter.sendMail({
      from: `"${escHeader(review.name)} via DJEssence.com" <${process.env.GMAIL_USER}>`,
      to: 'djessence916@gmail.com',
      subject: `${starString(review.rating)} New review from ${escHeader(review.name)}`,
      html: buildEmailHtml(review),
    })
  } catch (err) {
    // Non-fatal: the review is stored. Arman sees it in the admin page regardless.
    console.error('Review notification mail error:', err)
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
