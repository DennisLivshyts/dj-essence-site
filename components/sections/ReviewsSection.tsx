const QUOTES = [
  { q: 'Cold sparks for our first dance, clouds on the floor, packed until 1am. Guests are still texting us.', who: 'Marisol & Jay', tag: 'WEDDING · 2025' },
  { q: '1,800‑cap club night. Read the room from track one, never lost them. Easiest pro I\'ve worked with.', who: 'Eli Ramos', tag: 'PROMOTER · SAC' },
  { q: 'Quinceañera of the century. Bilingual MC, cold sparks, full transformation. My daughter cried happy tears.', who: 'The Navarros', tag: 'QUINCE · 2024' },
  { q: 'Corporate gala, 600 guests, zero margin for error. He nailed it. We\'re booking him again next year.', who: 'K. Patel', tag: 'CORP · BAY AREA' },
]

export default function ReviewsSection() {
  return (
    <div className="panel panel-reviews">
      <img src="/djEssenceSymbol.png" alt="" className="panel-watermark" />
      <div className="eyebrow">06 · Reviews</div>
      <h2>What they <em>say.</em></h2>
      <div className="quotes">
        {QUOTES.map((q, i) => (
          <blockquote key={i}>
            <p>{q.q}</p>
            <cite><b>{q.who}</b><span>{q.tag}</span></cite>
          </blockquote>
        ))}
      </div>
    </div>
  )
}
