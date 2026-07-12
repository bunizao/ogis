import { afterEach, describe, expect, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { config, proxy } from '../proxy';

const originalApiOnly = process.env.OG_API_ONLY;

afterEach(() => {
  if (originalApiOnly === undefined) {
    delete process.env.OG_API_ONLY;
  } else {
    process.env.OG_API_ONLY = originalApiOnly;
  }
});

function matchProxyPaths(pathnames: string[]): boolean[] {
  const matcher = new RegExp(`^${config.matcher}$`);
  return pathnames.map(pathname => matcher.test(pathname));
}

describe('proxy matcher', () => {
  test('skips API and required static asset paths', () => {
    expect(
      matchProxyPaths([
        '/api/og',
        '/api/custom-key',
        '/_next/static/app.js',
        '/fonts/zpix.ttf',
        '/default-bg.jpg',
      ])
    ).toEqual([false, false, false, false, false]);
  });

  test('keeps frontend paths behind API-only mode', () => {
    expect(matchProxyPaths(['/', '/preview.png', '/docs'])).toEqual([true, true, true]);
  });
});

describe('API-only proxy behavior', () => {
  test('returns 404 for frontend routes when API-only mode is enabled', () => {
    process.env.OG_API_ONLY = 'true';

    const response = proxy(new NextRequest('https://example.com/docs'));

    expect(response.status).toBe(404);
  });

  test('allows frontend routes when API-only mode is disabled', () => {
    process.env.OG_API_ONLY = 'false';

    const response = proxy(new NextRequest('https://example.com/docs'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
