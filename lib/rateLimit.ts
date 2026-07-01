const buckets = new Map<string, Map<string, { count: number; resetAt: number }>>()

export function checkRateLimit(bucket: string, ip: string, limit: number, windowMs: number): boolean {
  let map = buckets.get(bucket)
  if (!map) {
    map = new Map()
    buckets.set(bucket, map)
  }

  const now = Date.now()
  const entry = map.get(ip)
  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
