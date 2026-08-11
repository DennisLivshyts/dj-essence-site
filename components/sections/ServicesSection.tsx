'use client'

import { useState } from 'react'
import { PACKAGES, ADDONS, ADDON_GROUPS, ADDON_GROUP_ACCENT } from '@/lib/bookingOptions'
import Sheet from '@/components/ui/Sheet'

interface Props {
  goToBook: () => void
  /** Mobile. The fifteen add-on chips are 210px of the 176px this section overflows by,
   *  so there they collapse to a single row that opens them in a sheet. */
  compact?: boolean
}

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

export default function ServicesSection({ goToBook, compact = false }: Props) {
  const [showAddons, setShowAddons] = useState(false)
  const [showPkgs, setShowPkgs] = useState(false)

  // Tiers 02 and 03 each spend a whole bullet on "Everything in <previous tier>". That is
  // a cross-reference, not information, and on a phone it is a third of the card's height.
  // Rendered as a small tag instead, the ladder reads MORE clearly in a fraction of the
  // space. Matched on the data rather than by index so reordering PACKAGES can't break it.
  const splitFeats = (feats: string[]) => ({
    inherits: feats.some(f => /^Everything in /i.test(f)),
    own: feats.filter(f => !/^Everything in /i.test(f)),
  })

  // `dense` is passed explicitly rather than read from `compact` so the sheet — which has
  // room — can still show the full written-out list on the screens that open it.
  const renderPackages = (dense: boolean) => (
    <div className="svc-pkg-grid">
      {PACKAGES.map(p => {
        const { inherits, own } = splitFeats(p.feats)
        return (
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
              {dense && inherits && <div className="svc-pkg-inherit">+ Everything above</div>}
              <ul className="svc-pkg-feats">
                {(dense ? own : p.feats).map(f => (
                  <li key={f}><span className="svc-tick" aria-hidden>✓</span>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        )
      })}
    </div>
  )

  // Flat, ungrouped, still in group order so the colour clusters stay intact.
  const addonChips = ADDONS.map(a => (
    <span key={a.id} className={`svc-chip svc-chip--${ADDON_GROUP_ACCENT[a.group]}`}>
      {a.name}
    </span>
  ))

  const addonGroups = (
    <>
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
    </>
  )

  return (
    <div className="panel panel-services">
      <div className="eyebrow">03 · Services</div>
      <h2>The <em>full</em> production.</h2>

      {/* ── PACKAGES ── */}
      <div className="svc-row-label svc-row-label--pkg">
        <span className="svc-dot svc-dot--acid" />
        Three ways to book
      </div>

      {renderPackages(compact)}

      {/* Short phones only (see the max-height block in globals.css). There the feature
          lists are hidden — three of them do not fit a 486px content box — so this is the
          way back to them. It is display:none at every other size, where the features are
          visible inline and a button would just be noise. */}
      {compact && (
        <button type="button" className="see-all see-all--pkg" onClick={() => setShowPkgs(true)}>
          <span>See what&apos;s included</span>
          <span aria-hidden>→</span>
        </button>
      )}

      {/* ── ADD-ONS ── */}
      <div className="svc-row-label svc-row-label--addon">
        <span className="svc-dot svc-dot--amber" />
        Add‑ons · not included in any package
      </div>

      {/* Mobile shows all fifteen inline as one colour-coded cloud rather than hiding them
          behind the button. The group HEADERS are what get dropped, not the add-ons —
          every chip is already tinted by its group (magenta / acid / amber) and they stay
          in group order, so the clusters still read without three header rows costing
          ~48px. The button below only appears on short screens, where even this doesn't fit. */}
      {compact ? <div className="svc-chip-cloud">{addonChips}</div> : addonGroups}

      <button type="button" className="see-all see-all--addon" onClick={() => setShowAddons(true)}>
        <span>See all {ADDONS.length} add‑ons</span>
        <span aria-hidden>→</span>
      </button>

      <div className="svc-cta">
        <span>Every event is quoted individually.</span>
        <button type="button" onClick={goToBook}>Get a quote →</button>
      </div>

      <Sheet
        open={showPkgs}
        onClose={() => setShowPkgs(false)}
        title="Three ways to book"
        subtitle="Every event is quoted individually"
      >
        <div className="svc-pkg-sheet">{renderPackages(false)}</div>
      </Sheet>

      <Sheet
        open={showAddons}
        onClose={() => setShowAddons(false)}
        title="Add-ons"
        subtitle="Not included in any package — priced per event"
      >
        <div className="svc-addon-sheet">{addonGroups}</div>
      </Sheet>
    </div>
  )
}
