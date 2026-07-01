'use client'

import dynamic from 'next/dynamic'

// `ssr: false` must live inside a Client Component boundary — this file exists solely to host it.
const UploadClient = dynamic(() => import('./UploadClient'), { ssr: false })

export default function UploadClientLoader() {
  return <UploadClient />
}
