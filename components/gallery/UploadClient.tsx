'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { upload } from '@vercel/blob/client'

const SESSION_KEY = 'dj-essence-gallery-pw'
const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB, matches server-side cap
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

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
  error?: string
}

interface LivePhoto {
  url: string
  pathname: string
  uploadedAt: string
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
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = async (files: FileList | File[]) => {
    const valid = Array.from(files).filter(f => ALLOWED_TYPES.has(f.type) && f.size <= MAX_FILE_BYTES)
    const next = await Promise.all(valid.map(async (file): Promise<QueueItem> => {
      const { blob, name } = await resizeImage(file)
      return { blob, name, previewUrl: URL.createObjectURL(blob), status: 'pending' }
    }))
    setQueue(q => [...q, ...next])
  }

  const uploadAll = async () => {
    setUploading(true)
    let anySucceeded = false
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status !== 'pending') continue
      setQueue(q => q.map((item, idx) => (idx === i ? { ...item, status: 'uploading' } : item)))
      try {
        await upload(`gallery/${Date.now()}-${queue[i].name}`, queue[i].blob, {
          access: 'public',
          handleUploadUrl: '/api/gallery/upload',
          clientPayload: JSON.stringify({ password }),
        })
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
        <p><strong>Click to choose photos</strong> or drag them here</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {queue.length > 0 && (
        <>
          <div className="upload-queue">
            {queue.map((item, i) => (
              <div key={i} className="upload-item">
                <img src={item.previewUrl} alt="" />
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
              {uploading ? 'Uploading…' : `Upload ${pendingCount} photo${pendingCount === 1 ? '' : 's'}`}
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
                <img src={photo.url} alt="" loading="lazy" />
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
