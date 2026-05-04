'use client'

import Glitch from '@/components/Glitch'

interface Props { goTo: (i: number) => void }

export default function HomeSection({ goTo }: Props) {
  return (
    <div className="panel panel-home">
      <div className="eyebrow">Weddings · Clubs · Concerts · Private</div>
      <h1>
        <Glitch every={5200}>DJ</Glitch>{' '}
        <span className="ital">ESSENCE</span>
        <br />
        <span className="outline">MAKE IT</span>{' '}
        <span className="mag">EPIC.</span>
      </h1>
      <p>
        Multi‑award‑winning DJ with 20+ years on the decks and over 5,000 events across all 50
        states and Mexico. Sound, lights, MC, cold sparks, dancing on clouds — the full production,
        one phone call.
      </p>
      <div className="meta-row">
        <div>EVENTS<b>5,000+</b></div>
        <div>REACH<b>50 States + MX</b></div>
        <div>SINCE<b>Early 2000s</b></div>
        <div>CALL / TEXT<b>916.910.4684</b></div>
      </div>
      <div className="cta">
        <button className="primary" onClick={() => goTo(5)}>Book Your Date →</button>
        <button className="ghost"   onClick={() => goTo(2)}>See Services</button>
      </div>
    </div>
  )
}
