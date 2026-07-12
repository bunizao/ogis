import { describe, expect, test } from 'bun:test';
import { config } from '../proxy';

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
