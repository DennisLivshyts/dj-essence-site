'use client'

import { useEffect, useState } from 'react'

const BARS = 8

export default function VuMeter() {
  const [heights, setHeights] = useState(() => Array.from({ length: BARS }, () => 30))

  useEffect(() => {
    const tick = () => {
      setHeights(h => h.map(() => 20 + Math.random() * 78))
    }
    const id = setInterval(tick, 120)
    return () => clearInterval(id)
  }, [])

  const colors = ['var(--acid)', 'var(--acid)', 'var(--amber)', 'var(--acid)', 'var(--magenta)', 'var(--acid)', 'var(--amber)', 'var(--magenta)']

  return (
    <div className="vu-meter">
      {heights.map((h, i) => (
        <div
          key={i}
          className="vu-bar"
          style={{
            height: `${h}%`,
            background: colors[i],
            boxShadow: `0 0 6px ${colors[i]}`,
            transition: 'height 120ms ease',
          }}
        />
      ))}
    </div>
  )
}
