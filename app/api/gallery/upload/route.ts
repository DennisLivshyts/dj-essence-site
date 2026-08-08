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

        // Video poster frames go to _meta/posters/ — outside the gallery/ prefix, so
        // list() never returns them as gallery items of their own. They must keep a
        // deterministic name (no random suffix) because that name is what pairs a
        // poster back to its clip.
        const isPoster = pathname.startsWith('_meta/posters/')
        if (isPoster) {
          return {
            allowedContentTypes: ['image/jpeg'],
            addRandomSuffix: false,
            maximumSizeInBytes: 2 * 1024 * 1024,
          }
        }

        return {
          allowedContentTypes: [
            'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
            // Clips up to a minute. quicktime is what iPhones actually send for .mov.
            'video/mp4', 'video/quicktime', 'video/webm',
          ],
          addRandomSuffix: true,
          // Sized for video: ~1 min of 1080p H.264 lands at 40-75 MB. 4K at 60fps blows
          // past this, which is intentional — there's no transcoding in this stack, so
          // whatever is stored is what every visitor downloads. The upload page tells
          // Arman to shoot/export 1080p, and the client rejects oversize before upload.
          maximumSizeInBytes: 120 * 1024 * 1024,
          // Required for files this size — the SDK splits them into parts.
          multipart: true,
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
