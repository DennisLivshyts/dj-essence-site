'use client'

interface Props { goToBook: () => void }

// Everything Arman offers. The two add-on effects are listed here as well because
// they're part of what he does — where they sit commercially is spelled out below.
const SERVICES = [
  {
    id: 'dj',
    name: 'DJ Services',
    desc: 'Open‑format mixing that reads the floor and keeps it full.',
  },
  {
    id: 'mc',
    name: 'MC Hosting',
    desc: 'Entrances, introductions, toasts and announcements.',
  },
  {
    id: 'production',
    name: 'Full Production',
    desc: 'Sound, hosting and lighting from one point of contact.',
  },
  {
    id: 'lighting',
    name: 'State‑of‑the‑Art Lighting',
    desc: 'Moving‑head and wash lighting programmed to the music.',
  },
  {
    id: 'clouds',
    name: 'Dancing on Clouds',
    desc: 'Low‑fog floor effect for the first dance.',
  },
  {
    id: 'sparks',
    name: 'Cold Sparks',
    desc: 'Indoor‑safe spark fountains. All the drama, no heat.',
  },
]

// Three ways to book. Each tier stacks on the one before it — the feature lists are
// written to read top-to-bottom as an escalation, not as a checkbox matrix.
const PACKAGES = [
  {
    id: 'essentials',
    tier: '01',
    name: 'Essentials',
    tagline: 'The music, handled.',
    deco: 'wave',
    accent: 'acid',
    feats: [
      'Professional sound system',
      'Open‑format DJ for the full event',
      'Basic announcements & introductions',
    ],
  },
  {
    id: 'signature',
    tier: '02',
    name: 'Signature',
    tagline: 'The music and the room, hosted.',
    deco: 'knobs',
    accent: 'magenta',
    feats: [
      'Everything in Essentials',
      'Full MC hosting — leads the event start to finish',
      'Runs your timeline so the night flows',
    ],
  },
  {
    id: 'full',
    tier: '03',
    name: 'Full Production',
    tagline: 'The whole show.',
    deco: 'beams',
    accent: 'amber',
    feats: [
      'Everything in Signature',
      'State‑of‑the‑art lighting for the full party',
      'Sound, hosting and lighting from one team',
    ],
  },
]

const ADDONS = [
  {
    id: 'clouds',
    accent: 'acid',
    name: 'Dancing on Clouds',
    desc: 'Low‑fog floor effect for the first dance. Magazine‑cover photos, guaranteed.',
  },
  {
    id: 'sparks',
    accent: 'magenta',
    name: 'Cold Sparks',
    desc: 'Indoor‑safe spark fountains for grand entrances & first dances. Zero heat. All drama.',
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

export default function ServicesSection({ goToBook }: Props) {
  return (
    <div className="panel panel-services">
      <div className="eyebrow">03 · Services</div>
      <h2>The <em>full</em> production.</h2>

      {/* ── WHAT HE DOES ── */}
      <div className="svc-row-label svc-row-label--included">
        <span className="svc-dot svc-dot--acid" />
        What he brings
      </div>

      <div className="svc-list">
        {SERVICES.map((s, i) => (
          <div key={s.id} className="svc-item">
            <span className="svc-item-num">{String(i + 1).padStart(2, '0')}</span>
            <div className="svc-item-text">
              <div className="svc-item-name">{s.name}</div>
              <div className="svc-item-desc">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── PACKAGES ── */}
      <div className="svc-row-label svc-row-label--pkg">
        <span className="svc-dot svc-dot--magenta" />
        Three ways to book
      </div>

      <div className="svc-pkg-grid">
        {PACKAGES.map(p => (
          <div key={p.id} className={`svc-pkg svc-pkg--${p.accent}`}>
            <div className="svc-card-deco">
              {p.deco === 'wave'  && <WaveDeco />}
              {p.deco === 'knobs' && <KnobsDeco />}
              {p.deco === 'beams' && <BeamsDeco />}
            </div>
            <div className="svc-pkg-body">
              <div className="svc-pkg-tier">Package {p.tier}</div>
              <div className="svc-pkg-name">{p.name}</div>
              <div className="svc-pkg-tagline">{p.tagline}</div>
              <ul className="svc-pkg-feats">
                {p.feats.map(f => (
                  <li key={f}><span className="svc-tick" aria-hidden>✓</span>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* ── ADD-ONS ── */}
      <div className="svc-row-label svc-row-label--addon">
        <span className="svc-dot svc-dot--amber" />
        Add‑ons · not included in any package
      </div>

      <div className="svc-addon-grid svc-addon-grid--pair">
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

      <div className="svc-cta">
        <span>Every event is quoted individually.</span>
        <button type="button" onClick={goToBook}>Get a quote →</button>
      </div>
    </div>
  )
}
