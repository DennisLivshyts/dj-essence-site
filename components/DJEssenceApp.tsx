'use client'

import { useEffect, useRef, useState } from 'react'
import Nav from '@/components/Nav'
import Preloader from '@/components/Preloader'
import FXLayer from '@/components/FXLayer'
import VuMeter from '@/components/VuMeter'
import StatsMarquee from '@/components/StatsMarquee'
import HomeSection    from '@/components/sections/HomeSection'
import AboutSection   from '@/components/sections/AboutSection'
import ServicesSection from '@/components/sections/ServicesSection'
import GallerySection from '@/components/sections/GallerySection'
import ReviewsSection from '@/components/sections/ReviewsSection'
import BookSection    from '@/components/sections/BookSection'

const SECTIONS = [
  { id: 'home',     label: 'Home',     sub: 'DJ ESSENCE',  color: '#00ff88' },
  { id: 'about',    label: 'About',    sub: 'THE DJ',      color: '#ff006e' },
  { id: 'services', label: 'Services', sub: 'PRODUCTION',  color: '#fbbf24' },
  { id: 'gallery',  label: 'Events',   sub: 'MOMENTS',     color: '#00ff88' },
  { id: 'reviews',  label: 'Reviews',  sub: 'CLIENT LOVE', color: '#ff006e' },
  { id: 'book',     label: 'Book',     sub: 'CONTACT',     color: '#fbbf24' },
]

const N = SECTIONS.length

export default function DJEssenceApp() {
  const [scrollProgress, setScrollProgress]   = useState(0)
  const [theme, setTheme]                     = useState('light')
  const [preloaderDone, setPreloaderDone]     = useState(false)
  const [tilt, setTilt]                       = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile]               = useState(false)
  const [mobileActiveIdx, setMobileActiveIdx] = useState(0)

  const rafRef          = useRef<number | null>(null)
  const tiltRafRef      = useRef<number | null>(null)
  const tiltTarget      = useRef({ x: 0, y: 0 })
  const atmosRef        = useRef<HTMLDivElement>(null)
  const sweep1Ref       = useRef<HTMLDivElement>(null)
  const sweep2Ref       = useRef<HTMLDivElement>(null)
  const sweep1Angle     = useRef(0)
  const sweep2Angle     = useRef(0)
  const energyRef       = useRef(0)
  const decayRafRef     = useRef<number | null>(null)
  const lastScrollY     = useRef(0)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const mobileVinylRef  = useRef<HTMLDivElement>(null)
  const lastMobileTop   = useRef(0)

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 820px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Desktop: scroll → record rotation + atmosphere energy
  useEffect(() => {
    lastScrollY.current = window.scrollY

    const decay = () => {
      energyRef.current *= 0.975
      const se = energyRef.current
      sweep1Angle.current = (sweep1Angle.current + 0.06 + 1.2 * se) % 360
      sweep2Angle.current = (sweep2Angle.current - 0.05 - 0.9 * se + 720) % 360
      if (sweep1Ref.current)
        sweep1Ref.current.style.transform = `translate(-50%,-50%) rotate(${sweep1Angle.current.toFixed(2)}deg)`
      if (sweep2Ref.current) {
        sweep2Ref.current.style.transform = `translate(-50%,-50%) rotate(${sweep2Angle.current.toFixed(2)}deg)`
        sweep2Ref.current.style.opacity = Math.min(1, Math.max(0, (se - 0.25) * 2)).toFixed(3)
      }
      atmosRef.current?.style.setProperty('--se', se.toFixed(3))
      if (se > 0.005) {
        decayRafRef.current = requestAnimationFrame(decay)
      } else {
        energyRef.current = 0
        atmosRef.current?.style.setProperty('--se', '0')
        if (sweep2Ref.current) sweep2Ref.current.style.opacity = '0'
        decayRafRef.current = null
      }
    }

    const onScroll = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const max = document.documentElement.scrollHeight - window.innerHeight
        setScrollProgress(max > 0 ? window.scrollY / max : 0)
        const prev = lastScrollY.current
        lastScrollY.current = window.scrollY
        energyRef.current = Math.min(1, energyRef.current + Math.abs(window.scrollY - prev) * 0.0009)
        if (!decayRafRef.current && energyRef.current > 0)
          decayRafRef.current = requestAnimationFrame(decay)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (decayRafRef.current) cancelAnimationFrame(decayRafRef.current)
    }
  }, [])

  // Mobile: scroll container drives vinyl rotation + section detection + atmosphere
  useEffect(() => {
    if (!isMobile) return
    const container = mobileScrollRef.current
    if (!container) return

    const onScroll = () => {
      const { scrollTop, clientHeight } = container

      // Vinyl rotation: direct DOM update, no React state, no CSS transition lag
      if (mobileVinylRef.current)
        mobileVinylRef.current.style.transform = `rotate(${(scrollTop * 0.22).toFixed(2)}deg)`

      // Section index
      const idx = Math.min(N - 1, Math.max(0, Math.round(scrollTop / clientHeight)))
      setMobileActiveIdx(idx)

      // Feed atmosphere energy from scroll velocity
      const delta = Math.abs(scrollTop - lastMobileTop.current)
      lastMobileTop.current = scrollTop
      energyRef.current = Math.min(1, energyRef.current + delta * 0.0015)

      sweep1Angle.current = (sweep1Angle.current + 0.06 + 1.2 * energyRef.current) % 360
      sweep2Angle.current = (sweep2Angle.current - 0.05 - 0.9 * energyRef.current + 720) % 360
      if (sweep1Ref.current)
        sweep1Ref.current.style.transform = `translate(-50%,-50%) rotate(${sweep1Angle.current.toFixed(2)}deg)`
      if (sweep2Ref.current) {
        sweep2Ref.current.style.transform = `translate(-50%,-50%) rotate(${sweep2Angle.current.toFixed(2)}deg)`
        sweep2Ref.current.style.opacity = Math.min(1, Math.max(0, (energyRef.current - 0.25) * 2)).toFixed(3)
      }
      atmosRef.current?.style.setProperty('--se', Math.min(1, energyRef.current).toFixed(3))
      energyRef.current *= 0.94
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [isMobile])

  // Desktop: mouse → vinyl parallax tilt
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      tiltTarget.current = {
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
      if (tiltRafRef.current) return
      tiltRafRef.current = requestAnimationFrame(() => {
        tiltRafRef.current = null
        setTilt({ ...tiltTarget.current })
      })
    }
    const onLeave = () => setTilt({ x: 0, y: 0 })
    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      if (tiltRafRef.current) cancelAnimationFrame(tiltRafRef.current)
    }
  }, [])

  const desktopActiveIdx = Math.min(N - 1, Math.round(scrollProgress * (N - 1)))
  const activeIdx        = isMobile ? mobileActiveIdx : desktopActiveIdx
  const current          = SECTIONS[activeIdx]

  const goTo = (i: number) => {
    if (isMobile && mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({
        top: i * mobileScrollRef.current.clientHeight,
        behavior: 'smooth',
      })
      return
    }
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: (i / (N - 1)) * max, behavior: 'smooth' })
  }

  return (
    <>
      <div className="scroll-driver" aria-hidden style={isMobile ? { height: 0 } : undefined} />

      <div className="site-viewport">

        {/* Club atmosphere */}
        <div className="vinyl-atmos" ref={atmosRef} aria-hidden>
          <div className="va-sweep"   ref={sweep1Ref} />
          <div className="va-sweep-2" ref={sweep2Ref} />
          <div className="va-orb va-orb-1" />
          <div className="va-orb va-orb-2" />
          <div className="va-orb va-orb-3" />
          <div className="va-floor" />
          <div className="va-disco va-d1" />
          <div className="va-disco va-d2" />
          <div className="va-disco va-d3" />
          <div className="va-disco va-d4" />
          <div className="va-disco va-d5" />
          <div className="va-disco va-d6" />
          <div className="va-disco va-d7" />
          <div className="va-disco va-d8" />
          {!isMobile && <>
            <div className="va-disco va-d9" />
            <div className="va-disco va-d10" />
            <div className="va-disco va-d11" />
            <div className="va-disco va-d12" />
            <div className="va-disco va-d13" />
            <div className="va-disco va-d14" />
            <div className="va-disco va-d15" />
            <div className="va-disco va-d16" />
          </>}
        </div>

        {/* Spinning vinyl — ref-driven on mobile (no React state), tilt on desktop */}
        <div className="vinyl-stage">
          <div
            className="vinyl-tilt"
            style={isMobile ? undefined : {
              transform: `rotateX(${-tilt.y * 5}deg) rotateY(${tilt.x * 5}deg)`,
            }}
          >
            <div
              className="vinyl"
              ref={isMobile ? mobileVinylRef : undefined}
              style={isMobile ? {} : { transform: `rotate(${scrollProgress * 540}deg)` }}
            >
              <div className="grooves" />
              <div className="light-sheen" />
              <div className="center-label" style={{ background: current.color }}>
                <img src="/djEssenceSymbol.png" alt="" className="vinyl-label-symbol" />
                <span className="vinyl-label-sub">{current.sub}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE: full-screen scroll-snap sections */}
        {isMobile && (
          <div className="mobile-scroll" ref={mobileScrollRef}>
            {SECTIONS.map((s, i) => (
              <div key={s.id} className="mobile-section">
                <div className="mobile-content">
                  {s.id === 'home'     && <HomeSection goTo={goTo} />}
                  {s.id === 'about'    && <AboutSection isActive={activeIdx === 1} />}
                  {s.id === 'services' && <ServicesSection />}
                  {s.id === 'gallery'  && <GallerySection />}
                  {s.id === 'reviews'  && <ReviewsSection />}
                  {s.id === 'book'     && <BookSection />}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DESKTOP: floating panel overlay */}
        {!isMobile && (
          <div className="panel-overlay">
            {SECTIONS.map((s, i) => (
              <div
                key={s.id}
                className={`panel-slot${i === activeIdx ? ' is-active' : ''}`}
                style={{
                  opacity:    i === activeIdx ? 1 : 0,
                  transform:  i === activeIdx ? 'translateY(0)' : 'translateY(16px)',
                  transition: 'opacity 350ms ease, transform 350ms ease',
                }}
              >
                <div className="panel-glass">
                  {s.id === 'home'     && <HomeSection goTo={goTo} />}
                  {s.id === 'about'    && <AboutSection isActive={activeIdx === 1} />}
                  {s.id === 'services' && <ServicesSection />}
                  {s.id === 'gallery'  && <GallerySection />}
                  {s.id === 'reviews'  && <ReviewsSection />}
                  {s.id === 'book'     && <BookSection />}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="tonearm">
          <div className="arm">
            <div className="head"><div className="needle" /></div>
          </div>
        </div>

        <StatsMarquee />

        <Nav activeIdx={activeIdx} goTo={goTo} theme={theme} setTheme={setTheme} />

        {!isMobile && (
          <>
            <div className="side-hud">
              <div className="row">
                <span className="live">ON AIR</span>
                <span>SIDE <b>{String.fromCharCode(65 + Math.floor(activeIdx / 2))}{(activeIdx % 2) + 1}</b></span>
                <span>TRACK <b>{String(activeIdx + 1).padStart(2, '0')}/{String(N).padStart(2, '0')}</b></span>
                <span>PLAYING <b>{current.label.toUpperCase()}</b></span>
              </div>
            </div>
            <VuMeter />
            <div className="scroll-hint" style={{ opacity: scrollProgress > 0.04 ? 0 : 1 }}>
              <div className="scroll-hint-label">Scroll to spin</div>
              <div className="scroll-hint-arrow">↓</div>
            </div>
          </>
        )}
      </div>

      <div className="vinyl-bloom">
        <div className="vb vb--acid"    style={{ opacity: current.color === '#00ff88' ? 1 : 0 }} />
        <div className="vb vb--magenta" style={{ opacity: current.color === '#ff006e' ? 1 : 0 }} />
        <div className="vb vb--amber"   style={{ opacity: current.color === '#fbbf24' ? 1 : 0 }} />
      </div>

      <FXLayer />

      {!preloaderDone && (
        <Preloader onDone={() => setPreloaderDone(true)} />
      )}
    </>
  )
}
