import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono, Bricolage_Grotesque } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DJ Essence — Weddings · Clubs · Concerts',
  description:
    'Multi-award-winning DJ with 20+ years and 5,000+ events across all 50 states and Mexico. Sound, lights, MC, cold sparks, dancing on clouds.',
  openGraph: {
    title: 'DJ Essence — Make It Epic',
    description: 'Book the DJ that makes every moment unforgettable.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${bricolageGrotesque.variable}`}>
        {children}
      </body>
    </html>
  )
}
