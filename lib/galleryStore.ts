import { head, put } from '@vercel/blob'

// Kept outside the `gallery/` prefix so it's never picked up by list({ prefix: 'gallery/' })
// and rendered as a photo tile.
const ORDER_PATH = '_meta/gallery-order.json'

export async function readGalleryOrder(): Promise<string[]> {
  try {
    const meta = await head(ORDER_PATH)
    const res = await fetch(meta.url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export async function writeGalleryOrder(order: string[]): Promise<void> {
  await put(ORDER_PATH, JSON.stringify(order), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  })
}

export function isValidGalleryPassword(password: unknown): password is string {
  return (
    typeof password === 'string' &&
    Boolean(process.env.GALLERY_UPLOAD_PASSWORD) &&
    password === process.env.GALLERY_UPLOAD_PASSWORD
  )
}
