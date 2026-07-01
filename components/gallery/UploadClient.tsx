'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { upload } from '@vercel/blob/client'

const SESSION_KEY = 'dj-essence-gallery-pw'
const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB, matches server-side cap
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

type ItemStatus = 'pending' | 'uploading' | 'done' | 'error'

interface QueueItem {
  file: File
  previewUrl: string
  status: ItemStatus
  error?: string
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

function Uploader({ password }: { password: string }) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | File[]) => {
    const next: QueueItem[] = []
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.has(file.type)) continue
      if (file.size > MAX_FILE_BYTES) continue
      next.push({ file, previewUrl: URL.createObjectURL(file), status: 'pending' })
    }
    setQueue(q => [...q, ...next])
  }

  const uploadAll = async () => {
    setUploading(true)
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status !== 'pending') continue
      setQueue(q => q.map((item, idx) => (idx === i ? { ...item, status: 'uploading' } : item)))
      try {
        await upload(`gallery/${Date.now()}-${queue[i].file.name}`, queue[i].file, {
          access: 'public',
          handleUploadUrl: '/api/gallery/upload',
          clientPayload: JSON.stringify({ password }),
        })
        setQueue(q => q.map((item, idx) => (idx === i ? { ...item, status: 'done' } : item)))
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

export default function UploadClient() {
  // Lazy-init straight from sessionStorage: this component is loaded with `ssr: false`
  // (see app/gallery/upload/page.tsx), so there's no server-rendered HTML to diverge from.
  const [password, setPassword] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY))

  return password ? <Uploader password={password} /> : <PasswordGate onUnlock={setPassword} />
}
