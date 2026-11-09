// Optional social handles a client can leave when booking, so the stylists can
// see their page. Stored as a bare handle ("akua.hair"), never a URL or "@".
// No server imports, so the booking form and the API share it.

export const MAX_HANDLE_LENGTH = 40

/** "@Akua.Hair", "instagram.com/akua.hair/" or a pasted profile URL → "Akua.Hair" */
export function normalizeHandle(raw: unknown): string {
  let h = String(raw ?? '').trim()
  h = h.replace(/^https?:\/\//i, '').replace(/^(www\.)?(instagram\.com|tiktok\.com)\//i, '')
  h = h.split(/[/?#]/)[0].replace(/^@+/, '').trim()
  return h.slice(0, MAX_HANDLE_LENGTH)
}

/** Letters, numbers, dots and underscores only, which both platforms allow */
export function isValidHandle(handle: string): boolean {
  return handle === '' || /^[A-Za-z0-9._]+$/.test(handle)
}

export const instagramUrl = (handle: string) => `https://instagram.com/${handle}`
export const tiktokUrl = (handle: string) => `https://tiktok.com/@${handle}`
