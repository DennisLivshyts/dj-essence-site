import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// ── Rate limiting ────────────────────────────────────────────────────────────
// In-memory store: works per warm serverless instance. Sufficient for a
// low-traffic booking form; upgrade to Upstash Redis if multi-instance needed.
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT  = 5
const RATE_WINDOW = 10 * 60 * 1000 // 10 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_BODY_BYTES = 8_000  // 8 KB

const FIELD_LIMITS: Record<string, number> = {
  name:           100,
  email:          254,
  phone:           20,
  eventDate:       10,
  eventType:       40,
  eventTypeOther:  60,
  venue:          200,
  message:      2_000,
}

// Must stay in sync with EVENT_TYPES in components/sections/BookSection.tsx.
// 'Mitzvah' and 'Other' were offered by the form but missing here, so both were
// rejected with a 422 before reaching the inbox.
const ALLOWED_EVENT_TYPES = new Set([
  'Wedding',
  'Quinceañera',
  'Mitzvah',
  'Birthday / Private',
  'Corporate',
  'Club / Concert',
  'Other',
])

// ── Helpers ───────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

function isValidPhone(p: string) {
  return p.replace(/\D/g, '').length >= 7
}

function isValidDate(d: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false
  const date = new Date(d)
  if (isNaN(date.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

// HTML-escape for email body
function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// Safe string for email header fields (strip CR/LF/quotes to prevent injection)
function escHeader(s: string) {
  return s.replace(/[\r\n"]/g, ' ').trim()
}

function buildEmailHtml(data: {
  name: string; email: string; phone: string
  eventDate: string; eventType: string; venue: string; message: string
}) {
  const { name, email, phone, eventDate, eventType, venue, message } = data

  const row = (label: string, val: string) => `
    <tr>
      <td style="padding:10px 16px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.15em;white-space:nowrap;vertical-align:top;border-bottom:1px solid #1a1a1a;">${label}</td>
      <td style="padding:10px 16px;color:#e8e8e8;font-size:14px;border-bottom:1px solid #1a1a1a;">${val}</td>
    </tr>`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="background:#0a0a0a;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="color:#00ff88;font-size:11px;letter-spacing:.25em;text-transform:uppercase;margin:0 0 6px;">DJ Essence</p>
    <h1 style="color:#e8e8e8;font-size:24px;margin:0 0 28px;font-weight:700;letter-spacing:-.02em;">New Booking Request</h1>
    <table style="width:100%;border-collapse:collapse;background:#111;border-radius:8px;overflow:hidden;border:1px solid #1a1a1a;">
      ${row('Name', esc(name))}
      ${row('Email', `<a href="mailto:${esc(email)}" style="color:#00ff88;text-decoration:none;">${esc(email)}</a>`)}
      ${row('Phone', `<a href="tel:${esc(phone.replace(/[^\d\s\-+().]/g, ''))}" style="color:#00ff88;text-decoration:none;">${esc(phone)}</a>`)}
      ${row('Event Type', esc(eventType))}
      ${row('Event Date', esc(fmt(eventDate)))}
      ${row('Venue Address', esc(venue))}
      ${message.trim() ? row('Message', esc(message)) : ''}
    </table>
    <p style="color:#555;font-size:12px;margin-top:20px;line-height:1.6;">
      Hit <strong style="color:#777;">Reply</strong> to respond directly to ${esc(name)}.<br>
      Sent from the booking form on djessence.com.
    </p>
  </div>
</body>
</html>`
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // Rate limiting
  const ip = (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests — please wait before submitting again.' },
      { status: 429 }
    )
  }

  // Payload size guard
  let text: string
  try {
    text = await request.text()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  // JSON parse
  let body: Record<string, unknown>
  try {
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  // Extract and coerce to strings
  const raw: Record<string, string> = {}
  for (const key of ['name', 'email', 'phone', 'eventDate', 'eventType', 'eventTypeOther', 'venue', 'message']) {
    const val = body[key]
    if (val !== undefined && typeof val !== 'string') {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }
    raw[key] = typeof val === 'string' ? val : ''
  }

  // Field length caps
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    if (raw[field].length > limit) {
      return NextResponse.json(
        { errors: { [field]: `Too long (max ${limit} characters)` } },
        { status: 422 }
      )
    }
  }

  const { name, email, phone, eventDate, eventType, eventTypeOther, venue, message } = raw

  // Semantic validation
  const errors: Record<string, string> = {}
  if (!name.trim())       errors.name      = 'Required'
  if (!email.trim())      errors.email     = 'Required'
  else if (!isValidEmail(email.trim())) errors.email = 'Invalid email'
  if (!phone.trim())      errors.phone     = 'Required'
  else if (!isValidPhone(phone))        errors.phone = 'Invalid phone number'
  if (!eventDate.trim())  errors.eventDate = 'Required'
  else if (!isValidDate(eventDate.trim())) errors.eventDate = 'Must be a future date'
  if (!eventType.trim())  errors.eventType = 'Required'
  else if (!ALLOWED_EVENT_TYPES.has(eventType.trim())) errors.eventType = 'Invalid event type'
  else if (eventType.trim() === 'Other' && !eventTypeOther.trim()) {
    errors.eventTypeOther = 'Tell us what kind of event'
  }
  if (!venue.trim())      errors.venue     = 'Required'

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 })
  }

  // Trim everything before use. For "Other", the customer's own wording replaces
  // the literal word in the email — the free text is only trusted when the
  // whitelisted value is actually 'Other', so it can't smuggle in a label otherwise.
  const type = eventType.trim()
  const clean = {
    name:      name.trim(),
    email:     email.trim(),
    phone:     phone.trim(),
    eventDate: eventDate.trim(),
    eventType: type === 'Other' ? `${eventTypeOther.trim()} (Other)` : type,
    venue:     venue.trim(),
    message:   message.trim(),
  }

  try {
    await transporter.sendMail({
      from: `"${escHeader(clean.name)} via DJEssence.com" <${process.env.GMAIL_USER}>`,
      to: 'djessence916@gmail.com',
      replyTo: clean.email,
      subject: `Booking Request — ${escHeader(clean.eventType)} · ${fmt(clean.eventDate)}`,
      html: buildEmailHtml(clean),
    })
  } catch (err) {
    console.error('Mail error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
