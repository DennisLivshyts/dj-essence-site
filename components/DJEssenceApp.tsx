'use client'

import { useEffect, useRef, useState } from 'react'
import Nav from '@/components/Nav'
import Preloader from '@/components/Preloader'
import FXLayer from '@/components/FXLayer'
import VuMeter from '@/components/VuMeter'
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
  const [scrollProgress, setScrollProgress]       = useState(0)
  const [theme, setTheme]                         = useState('dark')
  const [preloaderDone, setPreloaderDone]         = useState(false)
  const [tilt, setTilt]                           = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile]                   = useState(false)
  const [mobileActiveIdx, setMobileActiveIdx]     = useState(0)
  const [mobileVinylRot, setMobileVinylRot]       = useState(0)

  const rafRef        = useRef<number | null>(null)
  const tiltRafRef    = useRef<number | null>(null)
  const tiltTarget    = useRef({ x: 0, y: 0 })
  const atmosRef      = useRef<HTMLDivElement>(null)
  const sweep1Ref     = useRef<HTMLDivElement>(null)
  const sweep2Ref     = useRef<HTMLDivElement>(null)
  const sweep1Angle   = useRef(0)
  const sweep2Angle   = useRef(0)
  const energyRef     = useRef(0)
  const decayRafRef   = useRef<number | null>(null)
  const lastScrollY   = useRef(0)

  // Mobile detection via matchMedia
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

  // Scroll → record rotation + sweep energy (desktop)
  useEffect(() => {
    lastScrollY.current = window.scrollY

    const decay = () => {
      energyRef.current *= 0.975
      const se = energyRef.current

      sweep1Angle.current = (sweep1Angle.current + 0.06 + 1.2 * se) % 360
      sweep2Angle.current = (sweep2Angle.current - 0.05 - 0.9 * se + 720) % 360
      if (sweep1Ref.current) {
        sweep1Ref.current.style.transform = `translate(-50%,-50%) rotate(${sweep1Angle.current.toFixed(2)}deg)`
      }
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
        const delta = Math.abs(window.scrollY - prev)
        energyRef.current = Math.min(1, energyRef.current + delta * 0.0009)

        if (!decayRafRef.current && energyRef.current > 0) {
          decayRafRef.current = requestAnimationFrame(decay)
        }
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

  // Mobile swipe-to-navigate — ignores swipes that start inside the panel
  useEffect(() => {
    if (!isMobile) return

    let startY = 0
    let startedInPanel = false

    const onTouchStart = (e: TouchEvent) => {
      startedInPanel = !!(e.target as Element).closest?.('.panel-glass')
      startY = e.touches[0].clientY
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (startedInPanel) return
      const deltaY = startY - e.changedTouches[0].clientY
      if (Math.abs(deltaY) > 44) {
        if (deltaY > 0) {
          setMobileActiveIdx(prev => Math.min(N - 1, prev + 1))
        } else {
          setMobileActiveIdx(prev => Math.max(0, prev - 1))
        }
        setMobileVinylRot(r => r + 240)
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [isMobile])

  // Mouse → vinyl parallax tilt (desktop only)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      tiltTarget.current = {
        x:  (e.clientX / window.innerWidth  - 0.5) * 2,
        y:  (e.clientY / window.innerHeight - 0.5) * 2,
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
  const recordRotation   = isMobile ? mobileVinylRot  : scrollProgress * 540
  const current          = SECTIONS[activeIdx]

  const goTo = (i: number) => {
    if (isMobile) {
      setMobileActiveIdx(i)
      setMobileVinylRot(r => r + 240)
      return
    }
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: (i / (N - 1)) * max, behavior: 'smooth' })
  }

  return (
    <>
      {/* height: 0 on mobile suppresses outer-scroll; CSS fallback also sets this */}
      <div className="scroll-driver" aria-hidden style={isMobile ? { height: 0 } : undefined} />

      <div className="site-viewport">

        {/* Club atmosphere — sweeps rotated by JS, --se drives opacity only */}
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

        {/* Spinning vinyl — perspective on stage, tilt on wrapper, rotation on vinyl */}
        <div className="vinyl-stage">
          <div
            className="vinyl-tilt"
            style={isMobile ? undefined : {
              transform: `rotateX(${-tilt.y * 5}deg) rotateY(${tilt.x * 5}deg)`,
            }}
          >
            <div
              className={`vinyl${isMobile ? ' vinyl--mobile' : ''}`}
              style={{ transform: `rotate(${recordRotation}deg)` }}
            >
              <div className="grooves" />
              <div className="light-sheen" />
              <div
                className="center-label"
                style={{ background: current.color }}
              >
                <b>Essence</b>
                <span>{current.sub}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content panels */}
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
                {s.id === 'about'    && <AboutSection />}
                {s.id === 'services' && <ServicesSection />}
                {s.id === 'gallery'  && <GallerySection />}
                {s.id === 'reviews'  && <ReviewsSection />}
                {s.id === 'book'     && <BookSection />}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile section position dots */}
        {isMobile && (
          <div className="mobile-nav-dots" aria-label="Section navigation">
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                className={`mobile-nav-dot${i === activeIdx ? ' active' : ''}`}
                style={i === activeIdx ? { background: s.color } : undefined}
                onClick={() => goTo(i)}
                aria-label={`Go to ${s.label}`}
              />
            ))}
          </div>
        )}

        <div className="tonearm">
          <div className="arm">
            <div className="head"><div className="needle" /></div>
          </div>
        </div>

        <Nav activeIdx={activeIdx} goTo={goTo} theme={theme} setTheme={setTheme} />

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
          <div className="scroll-hint-wheel">
            <div className="scroll-hint-dot" />
          </div>
        </div>
      </div>

      {/* Scroll-reactive vinyl glow — three layers, opacity crossfade between section colors */}
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
