'use client'

const SECTIONS = [
  { id: 'home',     label: 'Home' },
  { id: 'about',    label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'gallery',  label: 'Events' },
  { id: 'reviews',  label: 'Reviews' },
  { id: 'book',     label: 'Book' },
]

interface Props {
  activeIdx: number
  goTo: (i: number) => void
  theme: string
  setTheme: (t: string) => void
}

export default function Nav({ activeIdx, goTo, theme, setTheme }: Props) {
  return (
    <>
      <nav className="nav">
        <button className="brand" onClick={() => goTo(0)}>
          <span className="dot" />
          DJ ESSENCE
        </button>
        <ul>
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <button className={i === activeIdx ? 'active' : ''} onClick={() => goTo(i)}>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
        <button className="book-btn" onClick={() => goTo(5)}>BOOK NOW</button>
      </nav>
      <div className="theme-toggle">
        <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>DARK</button>
        <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>LIGHT</button>
      </div>
    </>
  )
}
