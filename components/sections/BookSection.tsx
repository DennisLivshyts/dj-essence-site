'use client'

import { useState } from 'react'

interface FormState {
  name: string
  email: string
  phone: string
  eventDate: string
  eventType: string
  venue: string
  message: string
}

const INITIAL: FormState = {
  name: '', email: '', phone: '',
  eventDate: '', eventType: '', venue: '', message: '',
}

function validate(f: FormState): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.name.trim()) e.name = 'Required'
  if (!f.email.trim()) e.email = 'Required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Invalid email'
  if (!f.phone.trim()) e.phone = 'Required'
  else if (f.phone.replace(/\D/g, '').length < 7) e.phone = 'Invalid phone'
  if (!f.eventDate) e.eventDate = 'Required'
  else {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (new Date(f.eventDate) < today) e.eventDate = 'Must be a future date'
  }
  if (!f.eventType) e.eventType = 'Required'
  if (!f.venue.trim()) e.venue = 'Required'
  return e
}

export default function BookSection() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  const update = (k: keyof FormState, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
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
        <div className="eyebrow">07 · Book</div>
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

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="panel panel-book">
      <div className="eyebrow">07 · Book</div>
      <h2>Let&apos;s make it <em>epic.</em></h2>
      <form onSubmit={submit} noValidate>
        <div className="two">
          <div className="field">
            <label>Your Name</label>
            <input type="text" placeholder="Full name" value={form.name} onChange={e => update('name', e.target.value)} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label>Phone</label>
            <input type="tel" placeholder="555-555-5555" value={form.phone} onChange={e => update('phone', e.target.value)} />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>
          <div className="field">
            <label>Event Date</label>
            <input type="date" min={today} value={form.eventDate} onChange={e => update('eventDate', e.target.value)} />
            {errors.eventDate && <span className="field-error">{errors.eventDate}</span>}
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label>Event Type</label>
            <select value={form.eventType} onChange={e => update('eventType', e.target.value)}>
              <option value="">Select…</option>
              <option>Wedding</option>
              <option>Quinceañera</option>
              <option>Birthday / Private</option>
              <option>Corporate</option>
              <option>Club / Concert</option>
            </select>
            {errors.eventType && <span className="field-error">{errors.eventType}</span>}
          </div>
          <div className="field">
            <label>Venue / City</label>
            <input type="text" placeholder="Where?" value={form.venue} onChange={e => update('venue', e.target.value)} />
            {errors.venue && <span className="field-error">{errors.venue}</span>}
          </div>
        </div>
        <div className="field">
          <label>Message (optional)</label>
          <textarea rows={2} placeholder="Any details…" value={form.message} onChange={e => update('message', e.target.value)} />
        </div>
        {status === 'error' && (
          <p style={{ color: 'var(--magenta)', fontFamily: 'var(--f-mono)', fontSize: 11 }}>
            Something went wrong — <a href="tel:9169104684" style={{ color: 'inherit' }}>call or text: 916.910.4684</a>
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
