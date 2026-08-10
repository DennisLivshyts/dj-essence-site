'use client'

import { useEffect, useRef, useState } from 'react'
import { EVENT_TYPES, PACKAGES, ADDONS, ADDON_GROUPS, PACKAGE_UNDECIDED } from '@/lib/bookingOptions'
import Sheet from '@/components/ui/Sheet'

interface Props {
  /** Mobile. The package and add-on pickers move into sheets and the duplicated contact
   *  block is dropped, which is what gets this form inside one 100dvh section. */
  compact?: boolean
}

interface FormState {
  name: string
  email: string
  phone: string
  eventDate: string
  eventType: string
  eventTypeOther: string
  venue: string
  pkg: string
  addOns: string[]
  message: string
}

const INITIAL: FormState = {
  name: '', email: '', phone: '',
  eventDate: '', eventType: '', eventTypeOther: '', venue: '',
  pkg: '', addOns: [], message: '',
}

const OTHER_MAX = 60

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
  else if (f.eventType === 'Other' && !f.eventTypeOther.trim()) e.eventTypeOther = 'Tell us what kind of event'
  if (!f.venue.trim()) e.venue = 'Required'
  if (!f.pkg) e.pkg = 'Pick one — "Not sure yet" is fine'
  return e
}

export default function BookSection({ compact = false }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [pkgSheet, setPkgSheet] = useState(false)
  const [addonSheet, setAddonSheet] = useState(false)
  const otherRef = useRef<HTMLInputElement>(null)

  // Focus the free-text box when "Other" is picked. `preventScroll` matters here:
  // the panel's scrollTop is driven by the vinyl scroll math on laptop layouts,
  // so letting the browser scroll the input into view would jerk the panel.
  useEffect(() => {
    if (form.eventType === 'Other') otherRef.current?.focus({ preventScroll: true })
  }, [form.eventType])

  const update = (k: keyof FormState, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const toggleAddOn = (name: string) => {
    setForm(f => ({
      ...f,
      addOns: f.addOns.includes(name) ? f.addOns.filter(a => a !== name) : [...f.addOns, name],
    }))
  }

  // Switching away from "Other" discards whatever was typed in the free-text box,
  // so a stale value can never be submitted alongside a different event type.
  const updateEventType = (v: string) => {
    setForm(f => ({ ...f, eventType: v, eventTypeOther: v === 'Other' ? f.eventTypeOther : '' }))
    setErrors(e => {
      const n = { ...e }
      delete n.eventType
      if (v !== 'Other') delete n.eventTypeOther
      return n
    })
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

  // Extracted so the same controls render either inline (desktop) or inside a sheet
  // (mobile) without duplicating the markup — and so both paths stay real radios and
  // checkboxes, which is where the keyboard nav and screen-reader grouping come from.
  const packageGroup = (
    <div className="pick-group">
      {[...PACKAGES.map(p => ({ name: p.name, hint: p.tagline })),
        { name: PACKAGE_UNDECIDED, hint: 'Help me choose' }].map(opt => (
        <div key={opt.name} className="pick">
          <input
            type="radio"
            name="pkg"
            id={`pkg-${opt.name}`}
            value={opt.name}
            checked={form.pkg === opt.name}
            onChange={() => update('pkg', opt.name)}
          />
          <label htmlFor={`pkg-${opt.name}`}>
            <span className="pick-name">{opt.name}</span>
            <span className="pick-hint">{opt.hint}</span>
          </label>
        </div>
      ))}
    </div>
  )

  const addonGroup = (
    <div className="pick-scroll">
      {ADDON_GROUPS.map(g => (
        <div key={g} className="pick-subgroup">
          <div className="pick-subgroup-name">{g}</div>
          <div className="pick-group">
            {ADDONS.filter(a => a.group === g).map(a => (
              <div key={a.id} className="pick pick--addon">
                <input
                  type="checkbox"
                  id={`addon-${a.id}`}
                  checked={form.addOns.includes(a.name)}
                  onChange={() => toggleAddOn(a.name)}
                />
                <label htmlFor={`addon-${a.id}`}>
                  <span className="pick-check" aria-hidden>✓</span>
                  <span className="pick-name">{a.name}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const directContact = (
    <div className="direct">
      <div>EMAIL<b><a className="contact-email" href="mailto:djessence916@gmail.com">djessence916@gmail.com</a></b></div>
      <div>INSTAGRAM<b><a href="https://instagram.com/djessence_official" target="_blank" rel="noreferrer">@djessence_official</a></b></div>
    </div>
  )

  if (status === 'sent') {
    return (
      <div className="panel panel-book panel-book--sent">
        <div className="eyebrow">07 · Book</div>
        <div className="success-msg">
          <span className="check">✓</span>
          Request received — DJ Essence will be in touch shortly.
        </div>
        {directContact}
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="panel panel-book">
      <div className="book-head">
        <div className="eyebrow">07 · Book</div>
        {/* The italic accent goes last, as it does in every other section heading —
            mid-string, the italic's overhang swallows the following space. */}
        <h2>Request <em>your date</em></h2>
        <p className="book-lede">
          Every event is quoted individually — send the details, get a number back.
        </p>
      </div>

      <form onSubmit={submit} noValidate className="book-form">
        {/* Three short blocks rather than one long column: at full-bleed width the old
            stacked layout left most of the card empty and pushed the submit button below
            the fold. Collapses back to a single column below 1100px. */}
        <div className="book-grid">
          <section className="book-block">
            <h3 className="book-block-title"><b>01</b>Your details</h3>
            <div className="field">
              <label htmlFor="bk-name">Your Name</label>
              <input id="bk-name" type="text" autoComplete="name" placeholder="Full name" value={form.name} onChange={e => update('name', e.target.value)} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="bk-email">Email</label>
              <input id="bk-email" type="email" autoComplete="email" placeholder="you@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="field">
              <label htmlFor="bk-phone">Phone</label>
              <input id="bk-phone" type="tel" autoComplete="tel" placeholder="555-555-5555" value={form.phone} onChange={e => update('phone', e.target.value)} />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
          </section>

          <section className="book-block">
            <h3 className="book-block-title"><b>02</b>The event</h3>
            <div className="field">
              <label htmlFor="bk-date">Event Date</label>
              <input id="bk-date" type="date" min={today} value={form.eventDate} onChange={e => update('eventDate', e.target.value)} />
              {errors.eventDate && <span className="field-error">{errors.eventDate}</span>}
            </div>
            <div className="field">
              <label htmlFor="bk-type">Event Type</label>
              <select id="bk-type" value={form.eventType} onChange={e => updateEventType(e.target.value)}>
                <option value="">Select…</option>
                {EVENT_TYPES.map((t: string) => <option key={t}>{t}</option>)}
              </select>
              {form.eventType === 'Other' && (
                <input
                  ref={otherRef}
                  type="text"
                  className="field-other"
                  aria-label="What kind of event?"
                  placeholder="What kind of event?"
                  maxLength={OTHER_MAX}
                  value={form.eventTypeOther}
                  onChange={e => update('eventTypeOther', e.target.value)}
                />
              )}
              {errors.eventType && <span className="field-error">{errors.eventType}</span>}
              {errors.eventTypeOther && <span className="field-error">{errors.eventTypeOther}</span>}
            </div>
            <div className="field">
              <label htmlFor="bk-venue">Venue Address</label>
              <input id="bk-venue" type="text" placeholder="Venue name + street, city" value={form.venue} onChange={e => update('venue', e.target.value)} />
              {errors.venue && <span className="field-error">{errors.venue}</span>}
            </div>
          </section>

          <section className="book-block book-block--note">
            <h3 className="book-block-title"><b>03</b>Anything else</h3>
            <div className="field field--grow">
              <label htmlFor="bk-msg">Message <span className="field-opt">optional</span></label>
              <textarea
                id="bk-msg"
                placeholder="Guest count, timings, a song you have to hear, anything you already know…"
                value={form.message}
                onChange={e => update('message', e.target.value)}
              />
            </div>
          </section>
        </div>

        {/* Mobile: these two pickers are 315px of a form that overflows its section by
            385px, and the add-on list carried its own capped inner scroller on top of
            that — a hidden scroll area nested inside a hidden scroll area. Both collapse
            to a one-line row that opens a sheet and shows the current selection at rest. */}
        {compact && (
          <>
            <button type="button" className="picker-row" onClick={() => setPkgSheet(true)}>
              <span className="picker-row-label">Package</span>
              <span className={`picker-row-value${form.pkg ? '' : ' is-empty'}`}>
                {form.pkg || 'Choose…'}
              </span>
              <span className="picker-row-chevron" aria-hidden>▸</span>
            </button>
            {errors.pkg && <span className="field-error">{errors.pkg}</span>}

            <button type="button" className="picker-row" onClick={() => setAddonSheet(true)}>
              <span className="picker-row-label">Add-ons <em>optional</em></span>
              <span className={`picker-row-value${form.addOns.length ? '' : ' is-empty'}`}>
                {form.addOns.length ? `${form.addOns.length} selected` : 'None'}
              </span>
              <span className="picker-row-chevron" aria-hidden>▸</span>
            </button>
          </>
        )}

        {/* Real radios behind styled labels: keyboard nav, arrow-key cycling and
            screen-reader grouping all come free, which a div-with-onClick would not give.
            The sheets below render the very same groups, so mobile keeps all of that. */}
        {!compact && (
          <fieldset className="pick-field">
            <legend><b>04</b>Choose a package</legend>
            {packageGroup}
            {errors.pkg && <span className="field-error">{errors.pkg}</span>}
          </fieldset>
        )}

        {!compact && <fieldset className="pick-field pick-field--addons">
          <legend>
            <b>05</b>Add‑ons
            <span className="pick-optional">optional · not included in any package</span>
            {form.addOns.length > 0 && <span className="pick-count">{form.addOns.length} selected</span>}
          </legend>
          {addonGroup}
        </fieldset>}

        <div className="book-foot">
          {/* Dropped on mobile: it is 102px, and the same address already sits in the
              Home meta row and the mobile menu. */}
          {!compact && directContact}
          <div className="book-foot-action">
            {status === 'error' && (
              <p className="book-error">
                Something went wrong — <a href="mailto:djessence916@gmail.com">email djessence916@gmail.com</a>
              </p>
            )}
            <button type="submit" className="submit-btn" disabled={status === 'loading'}>
              <span>{status === 'loading' ? 'SENDING…' : 'REQUEST BOOKING'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </form>

      {/* Deliberately OUTSIDE <form>. Sheets portal to document.body, but React events
          bubble through the REACT tree, not the DOM tree — rendered inside the form, a
          stray button in here would bubble a click straight into submit. */}
      <Sheet
        open={pkgSheet}
        onClose={() => setPkgSheet(false)}
        title="Choose a package"
        subtitle="Every event is quoted individually"
        footer={
          <button type="button" className="sheet-done" onClick={() => setPkgSheet(false)}>Done</button>
        }
      >
        {packageGroup}
      </Sheet>

      <Sheet
        open={addonSheet}
        onClose={() => setAddonSheet(false)}
        title="Add-ons"
        subtitle={`Optional · not included in any package${form.addOns.length ? ` · ${form.addOns.length} selected` : ''}`}
        footer={
          <button type="button" className="sheet-done" onClick={() => setAddonSheet(false)}>
            {form.addOns.length ? `Done · ${form.addOns.length} selected` : 'Done'}
          </button>
        }
      >
        {addonGroup}
      </Sheet>
    </div>
  )
}
