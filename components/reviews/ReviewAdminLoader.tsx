'use client'

import dynamic from 'next/dynamic'

// `ssr: false` must live inside a Client Component boundary — this file exists solely
// to host it. ReviewAdmin reads sessionStorage in a lazy state initializer, which would
// hydration-mismatch if it were server-rendered. Same shape as UploadClientLoader.
const ReviewAdmin = dynamic(() => import('./ReviewAdmin'), { ssr: false })

export default function ReviewAdminLoader() {
  return <ReviewAdmin />
}
