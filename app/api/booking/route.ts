import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())
}

function isValidPhone(p: string) {
  return p.replace(/\D/g, '').length >= 7
}

function isValidDate(d: string) {
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

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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
      ${row('Phone', `<a href="tel:${esc(phone)}" style="color:#00ff88;text-decoration:none;">${esc(phone)}</a>`)}
      ${row('Event Type', esc(eventType))}
      ${row('Event Date', fmt(eventDate))}
      ${row('Venue / City', esc(venue))}
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

export async function POST(request: Request) {
  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const {
    name = '', email = '', phone = '',
    eventDate = '', eventType = '', venue = '', message = '',
  } = body

  const errors: Record<string, string> = {}
  if (!name.trim()) errors.name = 'Required'
  if (!email.trim()) errors.email = 'Required'
  else if (!isValidEmail(email)) errors.email = 'Invalid email'
  if (!phone.trim()) errors.phone = 'Required'
  else if (!isValidPhone(phone)) errors.phone = 'Invalid phone number'
  if (!eventDate.trim()) errors.eventDate = 'Required'
  else if (!isValidDate(eventDate)) errors.eventDate = 'Must be a future date'
  if (!eventType.trim()) errors.eventType = 'Required'
  if (!venue.trim()) errors.venue = 'Required'

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 })
  }

  try {
    await transporter.sendMail({
      from: `"${name.trim()} via DJEssence.com" <${process.env.GMAIL_USER}>`,
      to: 'djessence916@gmail.com',
      replyTo: email.trim(),
      subject: `Booking Request — ${eventType} · ${fmt(eventDate)}`,
      html: buildEmailHtml({ name, email, phone, eventDate, eventType, venue, message }),
    })
  } catch (err) {
    console.error('Mail error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
