'use client'

import { useEffect, useRef, useState } from 'react'

interface Ripple { id: number; x: number; y: number; variant: string }
interface Trail  { id: number; x: number; y: number; variant: string }

export default function FXLayer() {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [trails,  setTrails]  = useState<Trail[]>([])
  const [cursor,  setCursor]  = useState({ x: -100, y: -100, active: false })
  const [isTouch, setIsTouch] = useState(false)
  const idRef        = useRef(0)
  const lastTrailRef = useRef(0)

  useEffect(() => {
    const onTouch = () => setIsTouch(true)
    window.addEventListener('touchstart', onTouch, { once: true, passive: true })
    return () => window.removeEventListener('touchstart', onTouch)
  }, [])

  // When touch is detected: custom cursor is removed but CSS cursor:none is still active,
  // which makes the cursor completely invisible. Restore native cursor.
  useEffect(() => {
    if (!isTouch) return
    document.documentElement.style.cursor = 'auto'
    document.body.style.cursor = 'auto'
  }, [isTouch])

  useEffect(() => {
    if (isTouch) return

    const onMove = (e: MouseEvent) => {
      setCursor(c => ({ ...c, x: e.clientX, y: e.clientY }))
      const now = performance.now()
      if (now - lastTrailRef.current > 24) {
        lastTrailRef.current = now
        const variant = Math.random() < 0.6 ? '' : Math.random() < 0.5 ? 'm' : 'a'
        const id = ++idRef.current
        setTrails(t => [...t, { id, x: e.clientX, y: e.clientY, variant }])
        setTimeout(() => setTrails(t => t.filter(x => x.id !== id)), 600)
      }
    }

    const onDown = (e: MouseEvent) => {
      setCursor(c => ({ ...c, active: true }))
      const colors = ['', 'm', 'a']
      colors.forEach((v, i) => {
        const id = ++idRef.current
        setTimeout(() => {
          setRipples(r => [...r, { id, x: e.clientX, y: e.clientY, variant: v }])
          setTimeout(() => setRipples(r => r.filter(x => x.id !== id)), 900)
        }, i * 80)
      })
    }

    const onUp = () => setCursor(c => ({ ...c, active: false }))

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [isTouch])

  if (isTouch) return null

  return (
    <div id="fx-layer">
      {trails.map(t => (
        <span
          key={t.id}
          className={`needle-trail${t.variant ? ' ' + t.variant : ''}`}
          style={{ left: t.x, top: t.y }}
        />
      ))}
      {ripples.map(r => (
        <span
          key={r.id}
          className={`ripple${r.variant ? ' ' + r.variant : ''}`}
          style={{ left: r.x, top: r.y }}
        />
      ))}
      <span
        className={`cursor-ring${cursor.active ? ' dot' : ''}`}
        style={{ left: cursor.x, top: cursor.y }}
      />
    </div>
  )
}
