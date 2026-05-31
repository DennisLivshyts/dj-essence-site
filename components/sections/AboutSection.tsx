'use client'

import { useEffect, useRef, useState } from 'react'

interface Props { isActive: boolean }

const TARGETS = [5000, 20, 50]
const DURATION = 1400

function fmt(i: number, n: number): string {
  if (i === 0) return n >= 5000 ? '5K+' : n.toLocaleString()
  if (i === 1) return `${n}+`
  return `${n}`
}

export default function AboutSection({ isActive }: Props) {
  const [counts, setCounts] = useState([0, 0, 0])
  const hasRun = useRef(false)

  useEffect(() => {
    if (!isActive || hasRun.current) return
    hasRun.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION)
      const eased = 1 - Math.pow(1 - t, 3)
      setCounts(TARGETS.map(target => Math.round(eased * target)))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isActive])

  return (
    <div className="panel panel-about">
      <img src="/djEssenceSymbol.png" alt="" className="panel-watermark" />
      <div className="eyebrow">02 · About</div>
      <h2>The <em>essence</em> of every great night.</h2>
      <p>
        DJ Essence has been running the booth since the early 2000s — more than twenty years and
        over 5,000 events deep. Weddings, nightclubs, concerts, private parties, corporate
        takeovers: if the moment matters, the music has to move.
      </p>
      <p>
        Internationally known across all 50 states and Mexico, Essence has shared the stage with
        celebrities and headlined events where nothing less than perfect would do. Every booking
        includes a full production package: sound, lights, MC, and every effect your room can handle.
        Check out <b>@djessence_official</b> on Instagram for real event highlights.
      </p>
      <div className="stat-row">
        {TARGETS.map((_, i) => (
          <div key={i} className="stat">
            <div className="n">{fmt(i, counts[i])}</div>
            <div className="l">{['Events Worked', 'Years on Decks', 'States + Mexico'][i]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
