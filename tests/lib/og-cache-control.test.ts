import { describe, expect, test } from 'bun:test';
import { ogCacheControl } from '../../app/lib/og-cache-control';

const NOW_MS = 1_800_000_000_000;

function cacheFor(query: string, complete = true): string {
  return ogCacheControl(new URLSearchParams(query), complete, NOW_MS);
}

describe('ogCacheControl', () => {
  test('defaults to a day at the CDN with stale-while-revalidate', () => {
    expect(cacheFor('title=Hello')).toBe(
      'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
    );
  });

  test('caches ts-versioned URLs as immutable', () => {
    expect(cacheFor('title=Hello&ts=1730000000000')).toBe(
      'public, max-age=31536000, s-maxage=31536000, immutable'
    );
  });

  test('ignores non-numeric ts values', () => {
    expect(cacheFor('ts=abc')).toContain('s-maxage=86400');
    expect(cacheFor('ts=')).toContain('s-maxage=86400');
  });

  test('keeps degraded renders short even when versioned', () => {
    expect(cacheFor('title=Hello', false)).toBe('public, max-age=0, s-maxage=300');
    expect(cacheFor('ts=1730000000000', false)).toBe('public, max-age=0, s-maxage=300');
  });

  test('never caches a signed URL past its expiry', () => {
    const nowSeconds = NOW_MS / 1000;
    expect(cacheFor(`exp=${nowSeconds + 120}&ts=1`)).toBe('public, max-age=0, s-maxage=120');
    expect(cacheFor(`exp=${nowSeconds + 10 * 86400}`)).toBe('public, max-age=0, s-maxage=86400');
    expect(cacheFor(`exp=${nowSeconds - 5}`)).toBe('public, max-age=0, s-maxage=0');
    expect(cacheFor('exp=soon')).toBe('public, max-age=0, s-maxage=0');
  });
});
