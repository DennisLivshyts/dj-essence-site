import nodemailer from 'nodemailer'

// Shared Gmail SMTP transport + the escaping helpers every outbound email needs.
//
// app/api/booking/route.ts still carries its own private copies of all three. They
// are byte-identical to these; it was left alone deliberately because it is a
// tested, live send path and there was no reason to touch it while adding reviews.
// Worth folding into this module next time that route is edited anyway.

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

/** HTML-escape for an email body. */
export function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/** Strip CR/LF/quotes so a value can't inject extra email headers. */
export function escHeader(s: string) {
  return s.replace(/[\r\n"]/g, ' ').trim()
}
