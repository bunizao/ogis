import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';
import {
  checkPublicImageUrl,
  loadRemoteImage,
  reconstructImageUrl,
  resolveHostnameWithGoogleDns,
  sniffImageType,
  type RemoteImageDeps,
} from '../../app/lib/og-remote-image';

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const WEBP_BYTES = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ');

const publicDns = async () => ['93.184.216.34'];

function deps(
  routes: Record<string, () => Response>,
  resolveHostname: RemoteImageDeps['resolveHostname'] = publicDns
): RemoteImageDeps & { requested: string[] } {
  const requested: string[] = [];
  return {
    requested,
    resolveHostname,
    fetch: async url => {
      requested.push(url);
      const route = routes[url];
      if (!route) throw new Error(`unexpected fetch ${url}`);
      return route();
    },
  };
}

describe('checkPublicImageUrl', () => {
  test.each([
    ['', 'missing'],
    ['https://a.co/…', 'truncated'],
    ['ftp://files.example.com/image.png', 'unsupported-protocol'],
    ['https://user:pass@cdn.example.com/a.png', 'credentials'],
    ['https://cdn.example.com:8080/a.png', 'unsupported-port'],
    ['http://localhost/image.png', 'blocked-host'],
    ['http://printer.local/image.png', 'blocked-host'],
    ['http://192.168.1.5/private.png', 'non-public-host'],
    ['http://169.254.169.254/latest/meta-data', 'non-public-host'],
    ['http://[fd00::1]/private.png', 'non-public-host'],
    ['http://[::ffff:127.0.0.1]/private.png', 'non-public-host'],
  ])('rejects %s as %s', async (value, rejection) => {
    const result = await checkPublicImageUrl(value, publicDns);
    expect(result.rejection).toBe(rejection as never);
  });

  test('rejects hostnames that resolve to private addresses', async () => {
    const result = await checkPublicImageUrl('https://internal.example.com/a.png', async () => ['10.0.0.2']);
    expect(result.rejection).toBe('non-public-host');
  });

  test('rejects hostnames that do not resolve', async () => {
    const result = await checkPublicImageUrl('https://nowhere.example.com/a.png', async () => []);
    expect(result.rejection).toBe('unresolvable-host');
  });

  test('accepts public hosts', async () => {
    const result = await checkPublicImageUrl('https://cdn.example.com/hero.png', publicDns);
    expect(result.rejection).toBeNull();
    expect(result.url?.hostname).toBe('cdn.example.com');
  });
});

describe('loadRemoteImage', () => {
  test('returns a data URL typed from the bytes, not the extension', async () => {
    const image = await loadRemoteImage(
      'https://cdn.example.com/photo.jpg',
      deps({ 'https://cdn.example.com/photo.jpg': () => new Response(PNG_BYTES) })
    );

    expect(image.rejection).toBeNull();
    expect(image.host).toBe('cdn.example.com');
    expect(image.dataUrl?.startsWith('data:image/png;base64,')).toBeTrue();
  });

  test('rejects formats Satori cannot decode', async () => {
    const image = await loadRemoteImage(
      'https://cdn.example.com/photo.png',
      deps({ 'https://cdn.example.com/photo.png': () => new Response(WEBP_BYTES) })
    );

    expect(image.dataUrl).toBeNull();
    expect(image.rejection).toBe('unsupported-format');
  });

  test('follows redirects to public hosts', async () => {
    const image = await loadRemoteImage(
      'https://github.com/someone.png',
      deps({
        'https://github.com/someone.png': () =>
          new Response(null, { status: 302, headers: { location: 'https://avatars.example.com/u/1' } }),
        'https://avatars.example.com/u/1': () => new Response(PNG_BYTES),
      })
    );

    expect(image.rejection).toBeNull();
    expect(image.dataUrl).not.toBeNull();
  });

  test('refuses to follow a redirect into a private network', async () => {
    const context = deps({
      'https://cdn.example.com/a.png': () =>
        new Response(null, { status: 302, headers: { location: 'http://10.0.0.5/admin.png' } }),
    });
    const image = await loadRemoteImage('https://cdn.example.com/a.png', context);

    expect(image.rejection).toBe('non-public-host');
    expect(context.requested).toEqual(['https://cdn.example.com/a.png']);
  });

  test('rejects oversized responses', async () => {
    const image = await loadRemoteImage(
      'https://cdn.example.com/huge.png',
      deps({
        'https://cdn.example.com/huge.png': () =>
          new Response(PNG_BYTES, { headers: { 'content-length': String(50 * 1024 * 1024) } }),
      })
    );

    expect(image.rejection).toBe('too-large');
  });

  test('turns network errors and bad statuses into fetch-failed', async () => {
    const notFound = await loadRemoteImage(
      'https://cdn.example.com/missing.png',
      deps({ 'https://cdn.example.com/missing.png': () => new Response('nope', { status: 404 }) })
    );
    const thrown = await loadRemoteImage('https://cdn.example.com/boom.png', deps({}));

    expect(notFound.rejection).toBe('fetch-failed');
    expect(thrown.rejection).toBe('fetch-failed');
  });
});

describe('resolveHostnameWithGoogleDns', () => {
  afterEach(() => mock.restore());

  // Answers each record type from `answers`, failing the first `failures` calls.
  function mockDns(answers: Record<string, string[]>, failures: number) {
    const calls: string[] = [];
    spyOn(globalThis, 'fetch').mockImplementation((async (input: string | URL | Request) => {
      const type = new URL(String(input)).searchParams.get('type') ?? '';
      calls.push(type);
      if (calls.length <= failures) throw new DOMException('timed out', 'AbortError');
      return Response.json({ Status: 0, Answer: (answers[type] ?? []).map(data => ({ data })) });
    }) as typeof fetch);
    return calls;
  }

  test('retries a lookup that times out', async () => {
    const calls = mockDns({ A: ['93.184.216.34'] }, 1);
    expect(await resolveHostnameWithGoogleDns('retry.example.com')).toEqual(['93.184.216.34']);
    expect(calls).toHaveLength(3);
  });

  test('does not retry an answer without records', async () => {
    const calls = mockDns({}, 0);
    expect(await resolveHostnameWithGoogleDns('empty.example.com')).toEqual([]);
    expect(calls.sort()).toEqual(['A', 'AAAA']);
  });
});

describe('sniffImageType', () => {
  test('recognises svg by content type or markup', () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(sniffImageType(svg, '')).toBe('image/svg+xml');
    expect(sniffImageType(new TextEncoder().encode('<x/>'), 'image/svg+xml')).toBe('image/svg+xml');
    expect(sniffImageType(new TextEncoder().encode('<html>'), 'text/html')).toBeNull();
  });
});

describe('reconstructImageUrl', () => {
  test('moves stray Unsplash params back onto the image URL', () => {
    const params = new URLSearchParams('image=https://images.unsplash.com/photo-1&crop=entropy&q=80&title=Hi');
    expect(reconstructImageUrl(params)).toBe('https://images.unsplash.com/photo-1?crop=entropy&q=80');
  });

  test('leaves other hosts untouched', () => {
    const params = new URLSearchParams('image=https://cdn.example.com/a.png&q=80');
    expect(reconstructImageUrl(params)).toBe('https://cdn.example.com/a.png');
  });
});
