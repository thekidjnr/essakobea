// Every image uploaded to the media bucket has a smaller copy stored next to
// it ("photo.jpg" -> "photo.thumb.jpg"). Use it wherever an image is shown at
// card or grid size; keep the full image for lightboxes. Other URLs (local
// files, external hosts) are returned unchanged.
const MEDIA_PATH = '/storage/v1/object/public/media/'

export function thumbUrl(url: string): string
export function thumbUrl(url: string | null | undefined): string | null | undefined
export function thumbUrl(url: string | null | undefined) {
  if (!url || !url.includes(MEDIA_PATH) || /\.thumb\.[a-z0-9]+$/i.test(url)) return url
  return url.replace(/(\.[a-z0-9]+)$/i, '.thumb$1')
}
