'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EVENT_TYPES } from '@/lib/bookingOptions'
import {
  MIN_REVIEW_TEXT,
  REVIEW_LIMITS,
  validateReview,
  type ReviewErrors,
} from '@/lib/reviewTypes'

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Incredible']

export default function ReviewForm() {
  const router = useRouter()

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [name, setName] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [venue, setVenue] = useState('')
  const [text, setText] = useState('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('') // honeypot

  const [errors, setErrors] = useState<ReviewErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [fatal, setFatal] = useState('')

  // A <input type="month"> can't be constrained to the past without this.
  const maxMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const values = { name, eventType, eventDate, venue, text, consent, rating }

  /** Clear one field's error as soon as the visitor starts fixing it. */
  const clearError = (field: string) =>
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFatal('')

    const found = validateReview(values)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      // Send them to the first problem rather than making them hunt for it. The star
      // group isn't focusable, so scrolling is what actually does the work here and
      // focus() is a no-op on it — harmless, and it does the right thing on inputs.
      const first = document.querySelector<HTMLElement>('[data-invalid="true"]')
      if (first) {
        first.scrollIntoView({ block: 'center', behavior: 'smooth' })
        first.focus({ preventScroll: true })
      }
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, website }),
      })

      if (res.ok) {
        router.push('/review/thanks')
        return
      }

      const data = await res.json().catch(() => ({}))
      if (res.status === 422 && data.errors) {
        setErrors(data.errors)
      } else {
        setFatal(data.error || 'Something went wrong — please try again.')
      }
    } catch {
      setFatal('Could not reach the server — please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const shown = hoverRating || rating
  const remaining = REVIEW_LIMITS.text - text.length

  return (
    <form className="rev-form" onSubmit={submit} noValidate>
      {/* Honeypot. Hidden from people and assistive tech; bots fill it and get silently dropped. */}
      <div className="rev-hp" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={e => setWebsite(e.target.value)}
        />
      </div>

      <fieldset className="rev-block">
        <legend>01 · How was it?</legend>
        {/* Real radios behind styled labels: arrow-key cycling and screen-reader
            grouping work with no extra JS. Visually hidden, never display:none. */}
        <div
          className="rev-stars"
          onMouseLeave={() => setHoverRating(0)}
          data-invalid={errors.rating ? 'true' : undefined}
        >
          {[1, 2, 3, 4, 5].map(n => (
            <span key={n} className="rev-star-wrap">
              <input
                type="radio"
                id={`rating-${n}`}
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => {
                  setRating(n)
                  clearError('rating')
                }}
              />
              <label
                htmlFor={`rating-${n}`}
                className={`rev-star ${shown >= n ? 'on' : ''}`}
                onMouseEnter={() => setHoverRating(n)}
                title={`${n} star${n > 1 ? 's' : ''} — ${RATING_LABELS[n - 1]}`}
              >
                ★<span className="sr-only">{`${n} stars — ${RATING_LABELS[n - 1]}`}</span>
              </label>
            </span>
          ))}
          <span className="rev-star-label">{shown ? RATING_LABELS[shown - 1] : ''}</span>
        </div>
        {errors.rating && <div className="rev-err">{errors.rating}</div>}
      </fieldset>

      <fieldset className="rev-block">
        <legend>02 · The event</legend>
        <div className="rev-grid">
          <div className="rev-field">
            <label htmlFor="eventType">Event type</label>
            <select
              id="eventType"
              value={eventType}
              data-invalid={errors.eventType ? 'true' : undefined}
              onChange={e => {
                setEventType(e.target.value)
                clearError('eventType')
              }}
            >
              <option value="">Choose…</option>
              {EVENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.eventType && <div className="rev-err">{errors.eventType}</div>}
          </div>

          <div className="rev-field">
            <label htmlFor="eventDate">When was it?</label>
            <input
              id="eventDate"
              type="month"
              value={eventDate}
              max={maxMonth}
              data-invalid={errors.eventDate ? 'true' : undefined}
              onChange={e => {
                setEventDate(e.target.value)
                clearError('eventDate')
              }}
            />
            {errors.eventDate && <div className="rev-err">{errors.eventDate}</div>}
          </div>

          <div className="rev-field rev-field--wide">
            <label htmlFor="venue">
              Venue <span className="rev-optional">optional</span>
            </label>
            <input
              id="venue"
              type="text"
              placeholder="Where was it held?"
              maxLength={REVIEW_LIMITS.venue}
              value={venue}
              data-invalid={errors.venue ? 'true' : undefined}
              onChange={e => {
                setVenue(e.target.value)
                clearError('venue')
              }}
            />
            {errors.venue && <div className="rev-err">{errors.venue}</div>}
          </div>
        </div>
      </fieldset>

      <fieldset className="rev-block">
        <legend>03 · Your review</legend>
        <div className="rev-field">
          <label htmlFor="text">What stood out?</label>
          <textarea
            id="text"
            rows={5}
            placeholder="The music, the crowd, how the night ran — whatever you'd tell a friend."
            maxLength={REVIEW_LIMITS.text}
            value={text}
            data-invalid={errors.text ? 'true' : undefined}
            onChange={e => {
              setText(e.target.value)
              clearError('text')
            }}
          />
          <div className="rev-counter">
            {text.length < MIN_REVIEW_TEXT
              ? `${MIN_REVIEW_TEXT - text.length} more characters`
              : `${remaining} left`}
          </div>
          {errors.text && <div className="rev-err">{errors.text}</div>}
        </div>

        <div className="rev-field">
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            type="text"
            placeholder="Jordan M."
            autoComplete="name"
            maxLength={REVIEW_LIMITS.name}
            value={name}
            data-invalid={errors.name ? 'true' : undefined}
            onChange={e => {
              setName(e.target.value)
              clearError('name')
            }}
          />
          <div className="rev-hint">First name and last initial is plenty.</div>
          {errors.name && <div className="rev-err">{errors.name}</div>}
        </div>
      </fieldset>

      <label className="rev-consent" data-invalid={errors.consent ? 'true' : undefined}>
        <input
          type="checkbox"
          checked={consent}
          onChange={e => {
            setConsent(e.target.checked)
            clearError('consent')
          }}
        />
        <span>
          It&apos;s OK to publish this on the DJ Essence website, with my name as written above.
        </span>
      </label>
      {errors.consent && <div className="rev-err">{errors.consent}</div>}

      <div className="rev-foot">
        <p className="rev-note">
          Reviews are read before they go up, so this won&apos;t appear on the site right away.
        </p>
        <button type="submit" className="rev-submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send review'}
        </button>
      </div>

      {fatal && <div className="rev-err rev-err--fatal">{fatal}</div>}
    </form>
  )
}
