import { describe, expect, test } from 'bun:test';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { config } from '../proxy';

function matchesProxy(pathname: string): boolean {
  return unstable_doesMiddlewareMatch({
    config,
    nextConfig: {},
    url: `https://example.com${pathname}`,
  });
}

describe('proxy matcher', () => {
  test('skips API and required static asset paths', () => {
    expect(matchesProxy('/api/og')).toBeFalse();
    expect(matchesProxy('/api/custom-key')).toBeFalse();
    expect(matchesProxy('/_next/static/app.js')).toBeFalse();
    expect(matchesProxy('/fonts/zpix.ttf')).toBeFalse();
    expect(matchesProxy('/default-bg.jpg')).toBeFalse();
  });

  test('keeps frontend paths behind API-only mode', () => {
    expect(matchesProxy('/')).toBeTrue();
    expect(matchesProxy('/preview.png')).toBeTrue();
    expect(matchesProxy('/docs')).toBeTrue();
  });
});
