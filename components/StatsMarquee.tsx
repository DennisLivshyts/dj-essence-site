const ITEMS = [
  '5,000+ EVENTS', 'ALL 50 STATES + MEXICO', '20+ YEARS ON THE DECKS',
  'WEDDINGS', 'NIGHTCLUBS', 'CONCERTS', 'QUINCEAÑERAS', 'CORPORATE EVENTS',
  'MULTI-AWARD WINNING', 'SACRAMENTO, CA', 'FULL PRODUCTION',
]

const SEP = '  ✦  '
const TRACK = ITEMS.join(SEP) + SEP

export default function StatsMarquee() {
  return (
    <div className="stats-marquee" aria-hidden>
      <div className="sm-track sm-track--fwd">
        <span>{TRACK}</span><span>{TRACK}</span>
      </div>
      <div className="sm-track sm-track--rev">
        <span>{TRACK}</span><span>{TRACK}</span>
      </div>
    </div>
  )
}
