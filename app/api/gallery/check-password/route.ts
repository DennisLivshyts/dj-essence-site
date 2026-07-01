import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { isValidGalleryPassword } from '@/lib/galleryStore'

export async function POST(request: Request) {
  if (!checkRateLimit('gallery-check-password', getClientIp(request), 10, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts' }, { status: 429 })
  }

  let password: unknown
  try {
    const body = await request.json()
    password = body.password
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  return NextResponse.json({ ok: isValidGalleryPassword(password) })
}
