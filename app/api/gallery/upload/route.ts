import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'

// ── Rate limiting (mirrors app/api/booking/route.ts) ────────────────────────
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT  = 30
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

export async function POST(request: Request): Promise<NextResponse> {
  const ip = (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let password: string | undefined
        try {
          password = clientPayload ? (JSON.parse(clientPayload) as { password?: string }).password : undefined
        } catch {
          password = undefined
        }

        if (!process.env.GALLERY_UPLOAD_PASSWORD || password !== process.env.GALLERY_UPLOAD_PASSWORD) {
          throw new Error('Unauthorized')
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
          addRandomSuffix: true,
          maximumSizeInBytes: 20 * 1024 * 1024, // 20 MB — phone photos, occasionally large
        }
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Gallery photo uploaded:', blob.url)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }
}
