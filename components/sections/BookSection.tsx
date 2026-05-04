'use client'

import { useState } from 'react'

export default function BookSection() {
  const [form, setForm] = useState({ name: '', email: '', eventDate: '', eventType: '', venue: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="panel panel-book">
        <div className="eyebrow">06 · Book</div>
        <div className="success-msg">
          <span className="check">✓</span>
          Request received — DJ Essence will be in touch shortly.
        </div>
        <div className="direct">
          <div>CALL / TEXT<b><a href="tel:9169104684" style={{ color: 'inherit', textDecoration: 'none' }}>916.910.4684</a></b></div>
          <div>INSTAGRAM<b><a href="https://instagram.com/djessence_official" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>@djessence_official</a></b></div>
        </div>
      </div>
    )
  }

  return (
    <div className="panel panel-book">
      <div className="eyebrow">06 · Book</div>
      <h2>Let&apos;s make it <em>epic.</em></h2>
      <form onSubmit={submit}>
        <div className="two">
          <div className="field">
            <label>Your Name</label>
            <input required type="text" placeholder="Full name" value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input required type="email" placeholder="you@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label>Event Date</label>
            <input required type="text" placeholder="MM / DD / YYYY" value={form.eventDate} onChange={e => update('eventDate', e.target.value)} />
          </div>
          <div className="field">
            <label>Event Type</label>
            <select required value={form.eventType} onChange={e => update('eventType', e.target.value)}>
              <option value="">Select…</option>
              <option>Wedding</option>
              <option>Quinceañera</option>
              <option>Birthday / Private</option>
              <option>Corporate</option>
              <option>Club / Concert</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Venue / City</label>
          <input required type="text" placeholder="Where?" value={form.venue} onChange={e => update('venue', e.target.value)} />
        </div>
        <div className="field">
          <label>Message (optional)</label>
          <textarea rows={2} placeholder="Any details…" value={form.message} onChange={e => update('message', e.target.value)} />
        </div>
        {status === 'error' && (
          <p style={{ color: 'var(--magenta)', fontFamily: 'var(--f-mono)', fontSize: 11 }}>
            Something went wrong — <a href="tel:9169104684" style={{ color: 'inherit' }}>call or text directly: 916.910.4684</a>
          </p>
        )}
        <button type="submit" className="submit-btn" disabled={status === 'loading'}>
          <span>{status === 'loading' ? 'SENDING…' : 'REQUEST BOOKING'}</span>
          <span>→</span>
        </button>
      </form>
      <div className="direct">
        <div>CALL / TEXT<b><a href="tel:9169104684" style={{ color: 'inherit', textDecoration: 'none' }}>916.910.4684</a></b></div>
        <div>INSTAGRAM<b><a href="https://instagram.com/djessence_official" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>@djessence_official</a></b></div>
      </div>
    </div>
  )
}
