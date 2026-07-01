import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { isValidGalleryPassword } from '@/lib/galleryStore'

export async function POST(request: Request): Promise<NextResponse> {
  if (!checkRateLimit('gallery-upload', getClientIp(request), 30, 10 * 60 * 1000)) {
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

        if (!isValidGalleryPassword(password)) {
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
    // The Blob client SDK only surfaces a generic "Failed to retrieve the client token"
    // to the browser regardless of cause — log the real reason here so it shows up in
    // Vercel's function logs (missing BLOB_READ_WRITE_TOKEN vs. wrong upload password, etc.)
    console.error('Gallery upload token generation failed:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }
}
