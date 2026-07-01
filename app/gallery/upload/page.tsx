import type { Metadata } from 'next'
import Link from 'next/link'
import UploadClientLoader from '@/components/gallery/UploadClientLoader'

export const metadata: Metadata = {
  title: 'Upload — DJ Essence Gallery',
  robots: { index: false, follow: false },
}

export default function UploadPage() {
  return (
    <div className="standalone-page">
      <header className="standalone-header">
        <Link href="/" className="standalone-back">← Back to site</Link>
        <img src="/djEssence.PNG" alt="DJ Essence" className="standalone-logo" />
      </header>
      <div className="standalone-title">
        <div className="eyebrow">Upload</div>
        <h1>Add photos to the <em>gallery</em>.</h1>
        <p>Upload photos from a recent event — they&apos;ll show up in the Photos section of the site right away.</p>
      </div>
      <UploadClientLoader />
    </div>
  )
}
