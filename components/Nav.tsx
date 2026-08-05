'use client'

import { useState } from 'react'

const SECTIONS = [
  { id: 'home',     label: 'Home',     color: '#00ff88' },
  { id: 'about',    label: 'About',    color: '#ff006e' },
  { id: 'services', label: 'Services', color: '#fbbf24' },
  { id: 'gallery',  label: 'Events',   color: '#00ff88' },
  { id: 'photos',   label: 'Gallery',  color: '#fbbf24' },
  { id: 'reviews',  label: 'Reviews',  color: '#ff006e' },
  { id: 'book',     label: 'Book',     color: '#fbbf24' },
]

const BOOK_IDX = SECTIONS.findIndex(s => s.id === 'book')

interface Props {
  activeIdx: number
  goTo: (i: number) => void
  theme: string
  setTheme: (t: string) => void
}

export default function Nav({ activeIdx, goTo, theme, setTheme }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleGoTo = (i: number) => {
    goTo(i)
    setMenuOpen(false)
  }

  return (
    <>
      <nav className="nav">
        <button className="brand" onClick={() => handleGoTo(0)}>
          <img src="/djEssence.PNG" alt="DJ Essence" className="brand-logo" />
        </button>
        <ul>
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <button className={i === activeIdx ? 'active' : ''} onClick={() => handleGoTo(i)}>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
        <button className="book-btn" onClick={() => handleGoTo(BOOK_IDX)}>BOOK NOW</button>
        <button
          className={`nav-hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Full-screen mobile menu overlay */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)}>
        <div className="mobile-menu-inner" onClick={e => e.stopPropagation()}>
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              className={`mobile-menu-item${i === activeIdx ? ' active' : ''}`}
              style={{ '--section-color': s.color } as React.CSSProperties}
              onClick={() => handleGoTo(i)}
            >
              <span className="mobile-menu-num">{String(i + 1).padStart(2, '0')}</span>
              {s.label}
            </button>
          ))}
          <button className="mobile-menu-book" onClick={() => handleGoTo(BOOK_IDX)}>
            Book Your Date →
          </button>
        </div>
      </div>

      <div className="theme-toggle">
        <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>DARK</button>
        <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>LIGHT</button>
      </div>
    </>
  )
}
