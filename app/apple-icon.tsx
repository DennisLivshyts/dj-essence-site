import { generateSiteIcon } from '@/lib/siteIcon'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return generateSiteIcon(180)
}
