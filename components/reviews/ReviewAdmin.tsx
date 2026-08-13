'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { formatEventDate, REVIEW_LIMITS, MIN_REVIEW_TEXT, type Review } from '@/lib/reviewTypes'

// Same key and same password as the photo uploader (GALLERY_UPLOAD_PASSWORD), so
// unlocking either page unlocks the other for the session.
const SESSION_KEY = 'dj-essence-gallery-pw'

type Tab = 'pending' | 'live' | 'archived'

interface Data {
  pending: Review[]
  live: Review[]
  archived: Review[]
}

const EMPTY: Data = { pending: [], live: [], archived: [] }

function Stars({ rating }: { rating: number }) {
  const n = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span className={`radm-stars ${n <= 3 ? 'low' : ''}`} aria-label={`${n} out of 5 stars`}>
      {'★'.repeat(n)}
      <span className="radm-stars-off">{'★'.repeat(5 - n)}</span>
    </span>
  )
}

function PasswordGate({ onUnlock }: { onUnlock: (password: string, data: Data) => void }) {
  const [password, setPassword] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!password.trim()) return
    setChecking(true)
    setError('')
    try {
      // The listing endpoint doubles as the password check — a wrong password 401s,
      // and a right one already returns everything the page needs.
      const res = await fetch('/api/reviews/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        const data = await res.json()
        sessionStorage.setItem(SESSION_KEY, password)
        onUnlock(password, { pending: data.pending ?? [], live: data.live ?? [], archived: data.archived ?? [] })
      } else if (res.status === 401) {
        setError('Wrong password — try again.')
      } else {
        setError('Something went wrong — try again.')
      }
    } catch {
      setError('Something went wrong — try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="upload-gate">
      <p>Enter your password to review submissions.</p>
      <input
        type="password"
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

/**
 * Mounted only while editing, so `useState(initial)` is the whole reset story —
 * no effect syncing draft back to props when the review changes or the box reopens.
 */
function EditBox({
  initial,
  onCancel,
  onSave,
}: {
  initial: string
  onCancel?: () => void
  onSave?: (text: string) => void
}) {
  const [draft, setDraft] = useState(initial)
  const tooShort = draft.trim().length < MIN_REVIEW_TEXT

  return (
    <div className="radm-edit">
      <textarea
        value={draft}
        maxLength={REVIEW_LIMITS.text}
        rows={5}
        onChange={e => setDraft(e.target.value)}
        autoFocus
      />
      <p className="radm-edit-warn">
        Typos and formatting only. Changing what someone said — even to make it
        warmer — is putting words in their mouth.
      </p>
      <div className="radm-actions">
        <button className="radm-btn radm-btn--go" disabled={tooShort} onClick={() => onSave?.(draft.trim())}>
          Save
        </button>
        <button className="radm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function ReviewCard({
  review,
  children,
  editing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
}: {
  review: Review
  children?: React.ReactNode
  editing: boolean
  onEdit?: () => void
  onCancelEdit?: () => void
  onSaveEdit?: (text: string) => void
}) {
  return (
    <article className="radm-card">
      <header className="radm-card-head">
        <Stars rating={review.rating} />
        <div className="radm-meta">
          <b>{review.name}</b>
          <span>
            {review.eventType}
            {review.eventDate ? ` · ${formatEventDate(review.eventDate)}` : ''}
            {review.venue ? ` · ${review.venue}` : ''}
          </span>
        </div>
      </header>

      {editing ? (
        <EditBox initial={review.text} onCancel={onCancelEdit} onSave={onSaveEdit} />
      ) : (
        <p className="radm-text">{review.text}</p>
      )}

      {!editing && (
        <div className="radm-actions">
          {children}
          {onEdit && <button className="radm-btn" onClick={onEdit}>✎ Fix typo</button>}
        </div>
      )}
    </article>
  )
}

export default function ReviewAdmin() {
  // Lazy-init straight from sessionStorage — this component is loaded with `ssr: false`,
  // so there's no server render to mismatch against.
  const [password, setPassword] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY))
  const [data, setData] = useState<Data>(EMPTY)
  const [tab, setTab] = useState<Tab>('pending')
  // Starts true when a stored password means the mount effect will fetch immediately.
  // Setting it inside load() instead would be a synchronous setState in an effect body.
  const [loading, setLoading] = useState(() => Boolean(sessionStorage.getItem(SESSION_KEY)))
  const [busy, setBusy] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmPurge, setConfirmPurge] = useState<string | null>(null)
  const [error, setError] = useState('')
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Nothing may run synchronously before the first `await` here: this is called from a
  // mount effect, and a synchronous setState in an effect body cascades renders.
  // Callers own switching `loading` on; this only ever switches it off.
  const load = useCallback(async (pw: string) => {
    try {
      const res = await fetch('/api/reviews/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (res.status === 401) {
        // Password changed server-side since this tab unlocked — drop back to the gate.
        sessionStorage.removeItem(SESSION_KEY)
        setPassword(null)
        return
      }
      if (!res.ok) throw new Error('load failed')
      const d = await res.json()
      setData({ pending: d.pending ?? [], live: d.live ?? [], archived: d.archived ?? [] })
      setError('')
    } catch {
      setError('Could not load reviews — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch-on-mount for the case where `password` was restored from sessionStorage —
  // unlocking through the gate already supplies the data, so this is the only path
  // that needs it. load() deliberately touches no state before its first `await`,
  // but react-hooks/set-state-in-effect flags any call that transitively reaches
  // setState and cannot see that boundary. It is a false positive here and it does
  // NOT honour an eslint-disable directive (a React Compiler diagnostic, not a
  // normal rule), so it stands as a 4th error of the same class as the three
  // pre-existing ones in DJEssenceApp.tsx. `npm run lint` already fails on those.
  useEffect(() => {
    if (password) load(password)
  }, [password, load])

  useEffect(() => () => { if (confirmTimer.current) clearTimeout(confirmTimer.current) }, [])

  const act = async (
    action: string,
    payload: Record<string, unknown>,
    id?: string,
  ) => {
    if (!password) return
    setBusy(id ?? action)
    setError('')
    try {
      const res = await fetch('/api/reviews/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action, ...payload }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'That did not work — try again.')
        return false
      }
      await load(password)
      return true
    } catch {
      setError('That did not work — try again.')
      return false
    } finally {
      setBusy(null)
    }
  }

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...data.live]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setData(d => ({ ...d, live: next })) // optimistic — the arrows must feel instant
    await act('reorder', { order: next.map(r => r.id) }, 'reorder')
  }

  const armPurge = (id: string) => {
    setConfirmPurge(id)
    if (confirmTimer.current) clearTimeout(confirmTimer.current)
    // Auto-disarm, so a mis-tap on a phone doesn't leave a live delete button sitting there.
    confirmTimer.current = setTimeout(() => setConfirmPurge(null), 4000)
  }

  if (!password) {
    return <PasswordGate onUnlock={(pw, d) => { setPassword(pw); setData(d) }} />
  }

  const list = data[tab]
  const TABS: { key: Tab; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'live', label: 'Live' },
    { key: 'archived', label: 'Private feedback' },
  ]

  return (
    <div className="radm">
      <nav className="radm-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`radm-tab ${tab === t.key ? 'on' : ''}`}
            onClick={() => { setTab(t.key); setEditingId(null) }}
          >
            {t.label}
            <span className={`radm-count ${t.key === 'pending' && data.pending.length ? 'alert' : ''}`}>
              {data[t.key].length}
            </span>
          </button>
        ))}
        <button className="radm-refresh" onClick={() => { setLoading(true); load(password) }} disabled={loading}>
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </nav>

      {error && <div className="radm-error">{error}</div>}

      {tab === 'pending' && (
        <p className="radm-blurb">
          Nothing here is on your site. Publish the ones you want shown; the rest move to
          Private feedback where only you can read them.
        </p>
      )}
      {tab === 'live' && (
        <p className="radm-blurb">
          These are on your site right now, in this order. Use the arrows to reorder.
        </p>
      )}
      {tab === 'archived' && (
        <p className="radm-blurb">
          Only you can see these — they are not on the site and no public page can read
          them. Worth keeping: an unhappy client is usually still a fixable one.
        </p>
      )}

      {list.length === 0 ? (
        <div className="radm-empty">
          {tab === 'pending' && 'No reviews waiting. New ones land here and you get an email.'}
          {tab === 'live' && 'Nothing published yet — approved reviews show up here.'}
          {tab === 'archived' && 'Nothing here.'}
        </div>
      ) : (
        <div className="radm-list">
          {list.map((r, i) => (
            <ReviewCard
              key={r.id}
              review={r}
              editing={editingId === r.id}
              onEdit={tab === 'archived' ? undefined : () => setEditingId(r.id)}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={async text => {
                const ok = await act('edit', { id: r.id, text }, r.id)
                if (ok) setEditingId(null)
              }}
            >
              {tab === 'pending' && (
                <>
                  <button
                    className="radm-btn radm-btn--go"
                    disabled={busy === r.id}
                    onClick={() => act('approve', { id: r.id }, r.id)}
                  >
                    ✓ Publish
                  </button>
                  <button
                    className="radm-btn"
                    disabled={busy === r.id}
                    onClick={() => act('reject', { id: r.id }, r.id)}
                  >
                    ✕ Don&apos;t publish
                  </button>
                </>
              )}

              {tab === 'live' && (
                <>
                  <button className="radm-btn radm-btn--icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button className="radm-btn radm-btn--icon" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down">↓</button>
                  <button
                    className="radm-btn"
                    disabled={busy === r.id}
                    onClick={() => act('unpublish', { id: r.id }, r.id)}
                  >
                    Take down
                  </button>
                </>
              )}

              {tab === 'archived' && (
                confirmPurge === r.id ? (
                  <button
                    className="radm-btn radm-btn--danger"
                    disabled={busy === r.id}
                    onClick={() => act('purge', { id: r.id }, r.id)}
                  >
                    Delete forever?
                  </button>
                ) : (
                  <button className="radm-btn" onClick={() => armPurge(r.id)}>Delete permanently</button>
                )
              )}
            </ReviewCard>
          ))}
        </div>
      )}

      <div className="radm-foot">
        <Link href="/gallery/upload" className="standalone-back">Photo &amp; video uploads →</Link>
      </div>
    </div>
  )
}
