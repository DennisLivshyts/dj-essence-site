'use client'

import { PACKAGES, ADDONS, ADDON_GROUPS, ADDON_GROUP_ACCENT } from '@/lib/bookingOptions'

interface Props { goToBook: () => void }

// The old "What he brings" list lived here — six services with one-line descriptions.
// Removed 2026-08-05: every entry already appeared below, either as a package feature
// or an add-on chip, and it framed Dancing on Clouds / Cold Sparks as included when
// the add-on band directly beneath says they aren't. The packages answer "what does
// he bring" better, because they say what you get at each tier.

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

      {/* ── PACKAGES ── */}
      <div className="svc-row-label svc-row-label--pkg">
        <span className="svc-dot svc-dot--acid" />
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

      {ADDON_GROUPS.map(g => (
        <div key={g} className="svc-addon-group">
          <div className="svc-addon-group-name">{g}</div>
          <div className="svc-chips">
            {ADDONS.filter(a => a.group === g).map(a => (
              <span key={a.id} className={`svc-chip svc-chip--${ADDON_GROUP_ACCENT[g]}`}>
                {a.name}
                {a.note && <em>{a.note}</em>}
              </span>
            ))}
          </div>
        </div>
      ))}

      <div className="svc-cta">
        <span>Every event is quoted individually.</span>
        <button type="button" onClick={goToBook}>Get a quote →</button>
      </div>
    </div>
  )
}
