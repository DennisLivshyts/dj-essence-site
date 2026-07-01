import { NextResponse } from 'next/server'

// ── Rate limiting (mirrors app/api/booking/route.ts) — guards against PIN brute-forcing ──
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT  = 10
const RATE_WINDOW  = 10 * 60 * 1000 // 10 minutes

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

export async function POST(request: Request) {
  const ip = (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts' }, { status: 429 })
  }

  let password = ''
  try {
    const body = await request.json()
    if (typeof body.password === 'string') password = body.password
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const ok = Boolean(process.env.GALLERY_UPLOAD_PASSWORD) && password === process.env.GALLERY_UPLOAD_PASSWORD
  return NextResponse.json({ ok })
}
