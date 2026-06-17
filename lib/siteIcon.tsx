import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const SYMBOL_PATH = join(process.cwd(), 'public/djEssenceSymbol.png')
// Muted site green (light-theme --acid) — neon #00ff88 washes out at favicon size
const ICON_GREEN = '#00934a'

export async function generateSiteIcon(size: number) {
  const symbol = await readFile(SYMBOL_PATH)
  const base64 = symbol.toString('base64')
  const inset = Math.round(size * 0.08)
  const symbolSize = size - inset * 2

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: ICON_GREEN,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* screen blend drops the symbol's black background onto the green */}
        <img
          src={`data:image/png;base64,${base64}`}
          width={symbolSize}
          height={symbolSize}
          style={{
            mixBlendMode: 'screen',
            filter: 'brightness(1.35) contrast(1.4)',
          }}
        />
      </div>
    ),
    { width: size, height: size }
  )
}
