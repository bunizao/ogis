const DAY_SECONDS = 86400;
const YEAR_SECONDS = 31536000;

// Browsers revalidate; the CDN keeps a day and serves stale for a week while re-rendering.
const DEFAULT_CACHE = `public, max-age=0, s-maxage=${DAY_SECONDS}, stale-while-revalidate=604800`;
// Attegi appends ts=<post updated_at ms>: editing a post changes the URL, so a ts URL
// never needs to change content.
const VERSIONED_CACHE = `public, max-age=${YEAR_SECONDS}, s-maxage=${YEAR_SECONDS}, immutable`;
// A render that fell back (fonts failed, image host unresolvable) may be a transient
// failure: let the CDN absorb bursts but re-render soon.
const DEGRADED_CACHE = 'public, max-age=0, s-maxage=300';

export function ogCacheControl(
  searchParams: URLSearchParams,
  complete: boolean,
  nowMs: number = Date.now()
): string {
  if (!complete) return DEGRADED_CACHE;

  // A signed URL with an expiry must not be served from cache after it expires.
  const exp = searchParams.get('exp');
  if (exp !== null) {
    const remaining = Number(exp) - Math.floor(nowMs / 1000);
    const ttl = Number.isFinite(remaining) ? Math.min(DAY_SECONDS, Math.max(0, remaining)) : 0;
    return `public, max-age=0, s-maxage=${ttl}`;
  }

  if (/^\d+$/.test(searchParams.get('ts') ?? '')) return VERSIONED_CACHE;
  return DEFAULT_CACHE;
}
