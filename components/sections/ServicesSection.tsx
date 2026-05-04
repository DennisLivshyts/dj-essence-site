'use client'

const INCLUDED = [
  {
    id: 'sound',
    name: 'Sound System',
    desc: 'Pro‑grade PA tuned to your room. Crystal‑clear vocals, floor‑shaking low end — indoors or outdoors.',
    deco: 'wave',
  },
  {
    id: 'mc',
    name: 'MC / Emcee',
    desc: 'Live mic from arrival to send‑off. Grand entrances, toasts, intros — complete event flow handled.',
    deco: 'knobs',
  },
  {
    id: 'lights',
    name: 'Party Lights',
    desc: 'Moving‑head & wash lighting programmed to the set. Club‑grade energy at any venue.',
    deco: 'beams',
  },
]

const ADDONS = [
  {
    id: 'up',
    accent: 'amber',
    name: 'Up Lighting',
    desc: 'Wireless uplights in your event colors. Any room looks twice as expensive — every time.',
  },
  {
    id: 'sparks',
    accent: 'magenta',
    name: 'Cold Sparks',
    desc: 'Indoor‑safe spark fountains for grand entrances & first dances. Zero heat. All drama.',
  },
  {
    id: 'clouds',
    accent: 'acid',
    name: 'Dancing on Clouds',
    desc: 'Low‑fog floor effect for the first dance. Magazine‑cover photos, guaranteed.',
  },
]

function WaveDeco() {
  return (
    <div className="svc-deco-wave">
      {Array.from({ length: 20 }).map((_, i) => (
        <span
          key={i}
          className="svc-wf-bar"
          style={{
            height: `${32 + Math.sin(i * 0.75) * 26 + (i % 3) * 8}%`,
            animationDelay: `${(i * 0.08).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  )
}

function KnobsDeco() {
  return (
    <div className="svc-deco-knobs">
      {(['hi', 'mid', 'lo'] as const).map(k => (
        <div key={k} className="svc-knob-unit">
          <div className={`svc-knob svc-knob-${k}`}>
            <div className="svc-knob-line" />
          </div>
          <span>{k.toUpperCase()}</span>
        </div>
      ))}
    </div>
  )
}

function BeamsDeco() {
  const colors = ['#00ff88', '#ff006e', '#fbbf24', '#00ff88', '#ff006e']
  return (
    <div className="svc-deco-beams">
      {colors.map((c, i) => (
        <div
          key={i}
          className="svc-beam"
          style={{
            background: `linear-gradient(to top, ${c}, transparent)`,
            transform: `rotate(${-24 + i * 12}deg)`,
            animationDelay: `${(i * 0.22).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function ServicesSection() {
  return (
    <div className="panel panel-services">
      <div className="eyebrow">03 · Services</div>
      <h2>The <em>full</em> production.</h2>

      {/* ── INCLUDED ── */}
      <div className="svc-row-label svc-row-label--included">
        <span className="svc-dot svc-dot--acid" />
        Included in every package
      </div>

      <div className="svc-included-grid">
        {INCLUDED.map(s => (
          <div key={s.id} className="svc-card">
            <div className="svc-card-deco">
              {s.deco === 'wave'  && <WaveDeco />}
              {s.deco === 'knobs' && <KnobsDeco />}
              {s.deco === 'beams' && <BeamsDeco />}
            </div>
            <div className="svc-card-body">
              <div className="svc-badge svc-badge--included">● INCLUDED</div>
              <div className="svc-name">{s.name}</div>
              <div className="svc-desc">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── ADD-ONS ── */}
      <div className="svc-row-label svc-row-label--addon">
        <span className="svc-dot svc-dot--amber" />
        Premium add‑ons
      </div>

      <div className="svc-addon-grid">
        {ADDONS.map(a => (
          <div key={a.id} className={`svc-addon svc-addon--${a.accent}`}>
            <div className="svc-addon-glow" />
            <div className="svc-addon-top">
              <div className="svc-addon-name">{a.name}</div>
              <div className="svc-addon-tag">ADD‑ON</div>
            </div>
            <div className="svc-addon-desc">{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
