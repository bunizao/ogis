import type { RemoteImage, RemoteImageRejection } from './og-remote-image';

const DEFAULT_CACHE = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';
// Attegi appends ts=<post updated_at in ms>, so an edited post gets a new URL
// and the old one can never change. Vercel scopes its CDN cache per deployment.
const VERSIONED_CACHE = 'public, max-age=31536000, s-maxage=31536000, immutable';
// Long enough to absorb a burst of crawlers, short enough that a flaky image
// host doesn't pin an image-less card for a day (or a year).
const DEGRADED_CACHE = 'public, max-age=0, s-maxage=300';

// Rejections that may pass on retry. The rest (private host, bad format,
// too large, ...) give the same answer every time, so caching them is fine.
const TRANSIENT_REJECTIONS = new Set<RemoteImageRejection>(['fetch-failed', 'unresolvable-host']);

export function ogCacheControl(
  searchParams: URLSearchParams,
  images: Array<Pick<RemoteImage, 'rejection'>>
): string {
  if (images.some(image => image.rejection && TRANSIENT_REJECTIONS.has(image.rejection))) {
    return DEGRADED_CACHE;
  }
  if (/^\d+$/.test(searchParams.get('ts') ?? '')) return VERSIONED_CACHE;
  return DEFAULT_CACHE;
}
