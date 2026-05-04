const TILES = [
  { cls: 'a', label: 'FIRST DANCE' },
  { cls: 'b', label: 'CLUB · SOLD OUT' },
  { cls: 'c', label: 'COLD SPARKS' },
  { cls: 'd', label: 'MAIN STAGE' },
  { cls: 'e', label: 'UP LIGHTS' },
  { cls: 'f', label: 'ON CLOUDS' },
]

export default function GallerySection() {
  return (
    <div className="panel panel-gallery">
      <div className="eyebrow">04 · Events</div>
      <h2>The <em>room</em> in motion.</h2>
      <div className="gallery-grid">
        {TILES.map((t, i) => (
          <div key={i} className={`gallery-tile ${t.cls}`} data-label={t.label} />
        ))}
      </div>
    </div>
  )
}
