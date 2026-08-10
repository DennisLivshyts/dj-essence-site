'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  /** Sticky bar at the bottom of the sheet — used by the pickers for a "Done" button. */
  footer?: React.ReactNode
  children: React.ReactNode
}

/**
 * Full-screen overlay used wherever a section has more content than fits one screen.
 *
 * The whole point is discoverability: every one of these replaces a nested scroll area
 * that a visitor had to *find*. A labelled button that opens a sheet is obvious; an
 * invisible inner scrollbar inside a scroll-snapped section is not.
 *
 * PORTALLED TO document.body ON PURPOSE — do not render it in place. `.panel-book` sets
 * `container-type: inline-size`, which implies layout containment, which makes it a
 * containing block for `position: fixed` descendants. A sheet rendered inside it would
 * be trapped inside the panel instead of covering the viewport. `.mobile-section` and
 * `.site-viewport` are both `overflow: hidden` for the same reason.
 */
export default function Sheet({ open, onClose, title, subtitle, footer, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-card">
        <header className="sheet-head">
          <div className="sheet-heading">
            <div className="sheet-title">{title}</div>
            {subtitle && <div className="sheet-sub">{subtitle}</div>}
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </header>
        {/* The one scroll area on the site that is meant to be scrolled, and it says so:
            it is inside an explicitly opened overlay rather than hidden in a section. */}
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
