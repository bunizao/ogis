import { describe, expect, test } from 'bun:test';
import { ogCacheControl } from '../../app/lib/og-cache-control';
import type { RemoteImageRejection } from '../../app/lib/og-remote-image';

const DEFAULT = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';
const VERSIONED = 'public, max-age=0, s-maxage=31536000';
const DEGRADED = 'public, max-age=0, s-maxage=300';

function cacheFor(query: string, rejections: Array<RemoteImageRejection | null> = []): string {
  return ogCacheControl(
    new URLSearchParams(query),
    rejections.map(rejection => ({ rejection }))
  );
}

describe('ogCacheControl', () => {
  test('caches for a day at the CDN by default', () => {
    expect(cacheFor('title=Hello')).toBe(DEFAULT);
  });

  test('caches ts-versioned URLs for a year at the CDN only', () => {
    expect(cacheFor('title=Hello&ts=1730000000000')).toBe(VERSIONED);
  });

  test('ignores ts values that are not a timestamp', () => {
    expect(cacheFor('ts=abc')).toBe(DEFAULT);
    expect(cacheFor('ts=')).toBe(DEFAULT);
    expect(cacheFor('ts=-1')).toBe(DEFAULT);
  });

  test('keeps the cache short when an image may load on retry', () => {
    expect(cacheFor('title=Hello', [null, 'fetch-failed'])).toBe(DEGRADED);
    expect(cacheFor('ts=1730000000000', ['unresolvable-host'])).toBe(DEGRADED);
  });

  test('caches permanent image rejections normally', () => {
    expect(cacheFor('title=Hello', ['missing', 'non-public-host', 'unsupported-format', 'too-large'])).toBe(
      DEFAULT
    );
  });
});
