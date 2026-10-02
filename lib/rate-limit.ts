// Small in-memory rate limiter for public endpoints.
//
// Counts live in this server instance's memory, so on serverless hosting each
// running instance keeps its own count. That still stops a single script from
// hammering an endpoint, but it isn't a hard global cap; move this to a shared
// store (e.g. Upstash Redis) if one is ever needed.

const buckets = new Map<string, number[]>()

// True if this key may make another request now, recording it if so.
export function allowRequest(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    buckets.set(key, recent)
    return false
  }
  recent.push(now)
  buckets.set(key, recent)

  // Keep memory bounded: occasionally drop keys with no recent requests
  if (buckets.size > 5000) {
    for (const [k, times] of buckets) {
      if (times.every((t) => now - t >= windowMs)) buckets.delete(k)
    }
  }
  return true
}

// Best-effort client IP behind a proxy (Vercel and most hosts set these)
export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
}
