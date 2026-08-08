'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { upload } from '@vercel/blob/client'
import { posterPathFor } from '@/lib/galleryPaths'

const SESSION_KEY = 'dj-essence-gallery-pw'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm'])

const MAX_IMAGE_BYTES = 20 * 1024 * 1024   // images are downscaled first, so this is generous
const MAX_VIDEO_BYTES = 120 * 1024 * 1024  // must match maximumSizeInBytes in the upload route
const MAX_VIDEO_SECONDS = 60

const mb = (bytes: number) => Math.round(bytes / 1024 / 1024)

// Phone photos are routinely 3000-4000px and several MB — uploaded as-is, the gallery
// would have to download/decode the full original just to show it in a small tile, which
// is what makes hovering those tiles laggy. Downscale before upload so what's actually
// stored (and later displayed) is already web-sized.
const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

type ItemStatus = 'pending' | 'uploading' | 'done' | 'error'

interface QueueItem {
  blob: Blob
  name: string
  previewUrl: string
  status: ItemStatus
  isVideo: boolean
  error?: string
}

interface LivePhoto {
  url: string
  pathname: string
  uploadedAt: string
  isVideo?: boolean
  posterUrl?: string
}

async function resizeImage(file: File): Promise<{ blob: Blob; name: string }> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob) throw new Error('Canvas toBlob failed')

    return { blob, name: file.name.replace(/\.[^./]+$/, '') + '.jpg' }
  } catch (err) {
    // Some formats (e.g. HEIC on non-Apple browsers) can't be decoded client-side —
    // fall back to uploading the original file rather than blocking the upload.
    console.error('Client-side resize failed, uploading original file:', err)
    return { blob: file, name: file.name }
  }
}

/** Reads duration from metadata only — never downloads/decodes the whole clip. */
function videoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    const src = URL.createObjectURL(file)
    v.preload = 'metadata'
    v.onloadedmetadata = () => { URL.revokeObjectURL(src); resolve(v.duration) }
    v.onerror = () => { URL.revokeObjectURL(src); reject(new Error('unreadable')) }
    v.src = src
  })
}

/**
 * Returns a rejection reason, or null if the file is fine.
 * Previously unsupported files were silently dropped from the queue — dragging in a
 * video simply did nothing, which looked like the page was broken.
 */
async function rejectionReason(file: File): Promise<string | null> {
  if (VIDEO_TYPES.has(file.type)) {
    if (file.size > MAX_VIDEO_BYTES) {
      return `${file.name} is ${mb(file.size)} MB — max ${mb(MAX_VIDEO_BYTES)} MB. Record or export at 1080p rather than 4K.`
    }
    try {
      const secs = await videoDuration(file)
      if (secs > MAX_VIDEO_SECONDS + 0.5) {
        return `${file.name} is ${Math.round(secs)}s — clips must be ${MAX_VIDEO_SECONDS}s or shorter.`
      }
    } catch {
      // Some codecs (e.g. HEVC .mov on non-Apple browsers) won't expose metadata here.
      // Let it through rather than block a valid upload — the size cap still applies.
      console.warn('Could not read duration for', file.name, '— allowing upload')
    }
    return null
  }
  if (IMAGE_TYPES.has(file.type)) {
    return file.size > MAX_IMAGE_BYTES
      ? `${file.name} is ${mb(file.size)} MB — max ${mb(MAX_IMAGE_BYTES)} MB for photos.`
      : null
  }
  return `${file.name} isn't a supported photo or video format.`
}

/**
 * Grabs a still from ~0.5s in for use as the tile thumbnail.
 * Without one, a video tile renders as a black rectangle until someone presses play —
 * `preload="metadata"` is not reliable about painting a first frame across browsers.
 * Returns null on failure; the caller treats a poster as strictly optional.
 */
async function capturePoster(file: Blob): Promise<Blob | null> {
  const src = URL.createObjectURL(file)
  const v = document.createElement('video')
  try {
    v.preload = 'auto'
    v.muted = true
    v.playsInline = true
    // Detached <video> elements get deprioritised — Safari in particular may never fire
    // loadeddata for one that isn't in the document. Park it off-screen while capturing.
    v.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0'
    document.body.appendChild(v)
    v.src = src

    await new Promise<void>((resolve, reject) => {
      v.onloadeddata = () => resolve()
      v.onerror = () => reject(new Error('video decode failed'))
      setTimeout(() => reject(new Error('timed out')), 10_000)
    })

    // Seek a little way in — frame zero is often a black or blurred lead-in.
    await new Promise<void>(resolve => {
      v.onseeked = () => resolve()
      v.currentTime = Math.min(0.5, (v.duration || 1) / 2)
      setTimeout(resolve, 3_000)   // seeking can silently no-op on some codecs
    })

    const scale = Math.min(1, MAX_DIMENSION / Math.max(v.videoWidth, v.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(v.videoWidth * scale)
    canvas.height = Math.round(v.videoHeight * scale)
    if (!canvas.width || !canvas.height) return null

    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height)

    return await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    )
  } catch (err) {
    console.warn('Poster capture failed — clip will upload without a thumbnail:', err)
    return null
  } finally {
    v.remove()
    URL.revokeObjectURL(src)
  }
}

function PasswordGate({ onUnlock }: { onUnlock: (password: string) => void }) {
  const [password, setPassword] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!password.trim()) return
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/gallery/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.ok) {
        sessionStorage.setItem(SESSION_KEY, password)
        onUnlock(password)
      } else {
        setError('Wrong password — try again.')
      }
    } catch {
      setError('Something went wrong — try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="upload-gate">
      <p>Enter the upload password to add photos to the gallery.</p>
      <input
        type="password"
        inputMode="numeric"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        autoFocus
      />
      <button onClick={submit} disabled={checking || !password.trim()}>
        {checking ? 'Checking…' : 'Unlock'}
      </button>
      {error && <div className="upload-error">{error}</div>}
    </div>
  )
}

function Uploader({ password, onUploaded }: { password: string; onUploaded: () => void }) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [rejections, setRejections] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = async (files: FileList | File[]) => {
    const accepted: QueueItem[] = []
    const rejected: string[] = []

    for (const file of Array.from(files)) {
      const reason = await rejectionReason(file)
      if (reason) { rejected.push(reason); continue }

      if (VIDEO_TYPES.has(file.type)) {
        // No client-side transcoding: ffmpeg.wasm is a ~30 MB download, takes minutes
        // on a clip this size and routinely runs out of memory on phones — which is
        // where Arman uploads from. The clip is stored exactly as shot.
        accepted.push({
          blob: file, name: file.name, previewUrl: URL.createObjectURL(file),
          status: 'pending', isVideo: true,
        })
      } else {
        const { blob, name } = await resizeImage(file)
        accepted.push({
          blob, name, previewUrl: URL.createObjectURL(blob),
          status: 'pending', isVideo: false,
        })
      }
    }

    setQueue(q => [...q, ...accepted])
    setRejections(rejected)
  }

  const uploadAll = async () => {
    setUploading(true)
    let anySucceeded = false
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status !== 'pending') continue
      setQueue(q => q.map((item, idx) => (idx === i ? { ...item, status: 'uploading' } : item)))
      try {
        const result = await upload(`gallery/${Date.now()}-${queue[i].name}`, queue[i].blob, {
          access: 'public',
          handleUploadUrl: '/api/gallery/upload',
          clientPayload: JSON.stringify({ password }),
        })

        // Thumbnail for video tiles. Strictly best-effort — a clip with no poster
        // still works, so a failure here must never fail the upload itself.
        if (queue[i].isVideo) {
          try {
            const poster = await capturePoster(queue[i].blob)
            if (poster) {
              await upload(posterPathFor(result.pathname), poster, {
                access: 'public',
                handleUploadUrl: '/api/gallery/upload',
                clientPayload: JSON.stringify({ password }),
              })
            }
          } catch (err) {
            console.warn('Poster upload failed; clip is live without a thumbnail:', err)
          }
        }

        setQueue(q => q.map((item, idx) => (idx === i ? { ...item, status: 'done' } : item)))
        anySucceeded = true
      } catch (err) {
        console.error('Gallery upload failed:', err)
        setQueue(q =>
          q.map((item, idx) =>
            idx === i ? { ...item, status: 'error', error: (err as Error).message } : item
          )
        )
      }
    }
    setUploading(false)
    if (anySucceeded) onUploaded()
  }

  const pendingCount = queue.filter(i => i.status === 'pending').length
  const doneCount = queue.filter(i => i.status === 'done').length

  return (
    <div>
      <div
        className={`upload-dropzone${dragOver ? ' drag-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
        }}
      >
        <p><strong>Click to choose photos or videos</strong> or drag them here</p>
        <p className="upload-hint">Videos up to {MAX_VIDEO_SECONDS} seconds · shoot or export at 1080p, not 4K</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
          multiple
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {rejections.length > 0 && (
        <div className="upload-rejections">
          {rejections.map((r, i) => <div key={i}>{r}</div>)}
        </div>
      )}

      {queue.length > 0 && (
        <>
          <div className="upload-queue">
            {queue.map((item, i) => (
              <div key={i} className="upload-item">
                {item.isVideo
                  ? <video src={item.previewUrl} muted playsInline preload="metadata" />
                  : <img src={item.previewUrl} alt="" />}
                {item.isVideo && <span className="upload-item-badge">VIDEO</span>}
                <div className={`upload-item-status ${item.status}`}>
                  {item.status === 'pending'    && 'Ready'}
                  {item.status === 'uploading'  && 'Uploading…'}
                  {item.status === 'done'       && '✓ Uploaded'}
                  {item.status === 'error'      && 'Failed — try again'}
                </div>
              </div>
            ))}
          </div>

          <div className="upload-actions">
            <button onClick={uploadAll} disabled={uploading || pendingCount === 0}>
              {uploading ? 'Uploading…' : `Upload ${pendingCount} file${pendingCount === 1 ? '' : 's'}`}
            </button>
            {doneCount > 0 && <Link href="/">View on the site →</Link>}
          </div>
        </>
      )}
    </div>
  )
}

function ManagePhotos({ password, refreshKey }: { password: string; refreshKey: number }) {
  const [photos, setPhotos] = useState<LivePhoto[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadPhotos = () => {
    fetch('/api/gallery')
      .then(r => r.json())
      .then(d => setPhotos(d.photos ?? []))
      .catch(() => setPhotos([]))
  }

  useEffect(() => { loadPhotos() }, [refreshKey])

  const saveOrder = async (next: LivePhoto[]) => {
    setPhotos(next)
    setSaving(true)
    try {
      await fetch('/api/gallery/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, order: next.map(p => p.pathname) }),
      })
    } catch (err) {
      console.error('Failed to save gallery order:', err)
    } finally {
      setSaving(false)
    }
  }

  const move = (index: number, dir: -1 | 1) => {
    if (!photos) return
    const target = index + dir
    if (target < 0 || target >= photos.length) return
    const next = [...photos]
    ;[next[index], next[target]] = [next[target], next[index]]
    saveOrder(next)
  }

  const onDrop = (index: number) => {
    if (!photos || dragIndex === null || dragIndex === index) { setDragIndex(null); return }
    const next = [...photos]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setDragIndex(null)
    saveOrder(next)
  }

  const askDelete = (pathname: string) => {
    setConfirmDelete(pathname)
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current)
    confirmTimeoutRef.current = setTimeout(() => setConfirmDelete(null), 4000)
  }

  const deletePhoto = async (pathname: string) => {
    if (!photos) return
    setConfirmDelete(null)
    setPhotos(photos.filter(p => p.pathname !== pathname))
    try {
      await fetch('/api/gallery/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, pathname }),
      })
    } catch (err) {
      console.error('Failed to delete photo:', err)
    }
  }

  if (photos === null) return null

  return (
    <div className="manage-photos">
      <div className="manage-header">
        <h3>Currently live ({photos.length})</h3>
        {saving && <span className="manage-saving">Saving order…</span>}
      </div>
      {photos.length === 0 ? (
        <p className="manage-empty">No photos live yet — upload some above.</p>
      ) : (
        <>
          <p className="manage-hint">Drag a photo to reorder it, or use the arrows. The first photo is the big featured tile.</p>
          <div className="manage-grid">
            {photos.map((photo, i) => (
              <div
                key={photo.pathname}
                className={`manage-tile${dragIndex === i ? ' dragging' : ''}`}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDrop(i)}
                onDragEnd={() => setDragIndex(null)}
              >
                {photo.isVideo
                  ? <video
                      src={`${photo.url}#t=0.1`}
                      poster={photo.posterUrl}
                      muted playsInline
                      preload={photo.posterUrl ? 'none' : 'metadata'}
                    />
                  : <img src={photo.url} alt="" loading="lazy" />}
                <div className="manage-tile-overlay">
                  <span className="manage-tile-num">{i + 1}</span>
                  <div className="manage-tile-actions">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier">↑</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label="Move later">↓</button>
                    {confirmDelete === photo.pathname ? (
                      <button type="button" className="manage-confirm-delete" onClick={() => deletePhoto(photo.pathname)}>Delete?</button>
                    ) : (
                      <button type="button" onClick={() => askDelete(photo.pathname)} aria-label="Delete">✕</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function UnlockedUpload({ password }: { password: string }) {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div>
      <Uploader password={password} onUploaded={() => setRefreshKey(k => k + 1)} />
      <ManagePhotos password={password} refreshKey={refreshKey} />
    </div>
  )
}

export default function UploadClient() {
  // Lazy-init straight from sessionStorage: this component is loaded with `ssr: false`
  // (see app/gallery/upload/page.tsx), so there's no server-rendered HTML to diverge from.
  const [password, setPassword] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY))

  return password ? <UnlockedUpload password={password} /> : <PasswordGate onUnlock={setPassword} />
}
