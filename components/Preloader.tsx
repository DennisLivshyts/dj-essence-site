'use client'
import { useEffect, useState } from 'react'

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const t1 = setTimeout(() => setHiding(true), 2300)
    const t2 = setTimeout(() => {
      document.body.style.overflow = ''
      onDone()
    }, 2850)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      document.body.style.overflow = ''
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`pre${hiding ? ' pre--out' : ''}`}>

      <div className="pre-brand">
        <span className="pre-dj">DJ</span>
        <span className="pre-name">ESSENCE</span>
      </div>

      <div className="pre-stage">
        {/* Spinning record */}
        <div className="pre-vinyl">
          <div className="pre-grooves" />
          <div className="pre-sheen" />
          <div className="pre-label">
            <img src="/djEssenceSymbol.png" alt="" className="vinyl-label-symbol" />
          </div>
        </div>

        {/* Tonearm — drops at 0.9s */}
        <div className="pre-tonearm">
          <div className="pre-pivot" />
          <div className="pre-shaft">
            <div className="pre-head">
              <div className="pre-needle" />
            </div>
          </div>
        </div>

        {/* Flash on needle contact */}
        <div className="pre-flash" />
      </div>

      <div className="pre-status">
        <span className="pre-status-dot" />
        INITIALIZING SET
      </div>

    </div>
  )
}
