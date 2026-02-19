import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';

type SecurityConfig = {
  primaryRouteKey: string;
  allowLegacyPath: boolean;
  signatureSecret: string;
  hasSignatureProtection: boolean;
};

type ThemeRenderCall = {
  props: {
    title: string;
    site: string;
    excerpt: string;
    author: string;
    date: string;
    backgroundImageSrc: string;
  };
  context: {
    baseUrl: string;
    searchParams: URLSearchParams;
  };
};

const root = process.cwd();

const state = {
  securityConfig: {
    primaryRouteKey: 'og',
    allowLegacyPath: true,
    signatureSecret: '',
    hasSignatureProtection: false,
  } as SecurityConfig,
  pixelFonts: [
    {
      name: 'Pixel Mock',
      data: new ArrayBuffer(4),
      style: 'normal' as const,
      weight: 400 as const,
    },
  ],
  modernFonts: [
    {
      name: 'Modern Mock',
      data: new ArrayBuffer(4),
      style: 'normal' as const,
      weight: 400 as const,
    },
  ],
  pixelRenderCalls: [] as ThemeRenderCall[],
  modernRenderCalls: [] as ThemeRenderCall[],
  imageResponseCalls: [] as Array<{ element: unknown; init: Record<string, unknown> }>,
};

function resetState() {
  state.securityConfig = {
    primaryRouteKey: 'og',
    allowLegacyPath: true,
    signatureSecret: '',
    hasSignatureProtection: false,
  };
  state.pixelFonts = [
    {
      name: 'Pixel Mock',
      data: new ArrayBuffer(4),
      style: 'normal',
      weight: 400,
    },
  ];
  state.modernFonts = [
    {
      name: 'Modern Mock',
      data: new ArrayBuffer(4),
      style: 'normal',
      weight: 400,
    },
  ];
  state.pixelRenderCalls = [];
  state.modernRenderCalls = [];
  state.imageResponseCalls = [];
}

function installModuleMocks() {
  const securityFactory = () => ({
    resolveOgSecurityConfig: () => state.securityConfig,
  });

  mock.module('@/app/lib/og-security', securityFactory);
  mock.module(`${root}/app/lib/og-security.ts`, securityFactory);

  mock.module(`${root}/app/api/og/themes/pixel.tsx`, () => ({
    pixelTheme: {
      fontFamily: 'Mock Pixel',
      loadFonts: async () => state.pixelFonts,
      render: (props: ThemeRenderCall['props'], context: ThemeRenderCall['context']) => {
        state.pixelRenderCalls.push({ props, context });
        return { theme: 'pixel', props, context } as unknown as object;
      },
    },
  }));

  mock.module(`${root}/app/api/og/themes/modern.tsx`, () => ({
    modernTheme: {
      fontFamily: 'Mock Modern',
      loadFonts: async () => state.modernFonts,
      render: (props: ThemeRenderCall['props'], context: ThemeRenderCall['context']) => {
        state.modernRenderCalls.push({ props, context });
        return { theme: 'modern', props, context } as unknown as object;
      },
    },
  }));

  mock.module('@vercel/og', () => ({
    ImageResponse: class MockImageResponse extends Response {
      constructor(element: unknown, init: Record<string, unknown>) {
        super('mock-image', {
          status: 200,
          headers: (init.headers ?? {}) as HeadersInit,
        });
        state.imageResponseCalls.push({ element, init });
      }
    },
  }));
}

async function loadHandler() {
  installModuleMocks();
  return import(`../../app/api/og/handler.tsx?case=${Math.random()}`);
}

function canonicalize(searchParams: URLSearchParams): string {
  const entries: Array<[string, string]> = [];
  searchParams.forEach((value, key) => {
    if (key === 'sig' || key === 'ogKey') return;
    entries.push([key, value]);
  });

  entries.sort((a, b) => {
    if (a[0] === b[0]) {
      if (a[1] === b[1]) return 0;
      return a[1] < b[1] ? -1 : 1;
    }
    return a[0] < b[0] ? -1 : 1;
  });

  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

function signUrl(url: string, secret: string): string {
  const parsed = new URL(url);
  parsed.searchParams.delete('sig');
  const canonical = canonicalize(parsed.searchParams);
  const payload = canonical || '__empty__';
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  parsed.searchParams.set('sig', sig);
  return parsed.toString();
}

function mockDns(records: Record<string, { A?: string[]; AAAA?: string[]; status?: number }>) {
  return spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const url = new URL(rawUrl);
    if (url.hostname !== 'dns.google') {
      throw new Error(`Unexpected fetch target: ${url.toString()}`);
    }

    const hostname = url.searchParams.get('name') ?? '';
    const type = (url.searchParams.get('type') ?? 'A') as 'A' | 'AAAA';
    const record = records[hostname];

    if (!record) {
      return new Response(JSON.stringify({ Status: 3 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ips = type === 'A' ? (record.A ?? []) : (record.AAAA ?? []);
    return new Response(
      JSON.stringify({
        Status: record.status ?? 0,
        Answer: ips.map((data) => ({ data })),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });
}

beforeEach(() => {
  resetState();
  mock.restore();
});

afterEach(() => {
  mock.restore();
});

describe('handleOgGet', () => {
  test('returns 404 when route key is not allowed', async () => {
    state.securityConfig = {
      primaryRouteKey: 'og_custom',
      allowLegacyPath: false,
      signatureSecret: '',
      hasSignatureProtection: false,
    };

    const { handleOgGet } = await loadHandler();
    const response = await handleOgGet(
      new NextRequest('https://example.com/api/og?title=Hello&site=Blog'),
      'og'
    );

    expect(response.status).toBe(404);
  });

  test('allows legacy path when explicitly enabled', async () => {
    state.securityConfig = {
      primaryRouteKey: 'og_custom',
      allowLegacyPath: true,
      signatureSecret: '',
      hasSignatureProtection: false,
    };

    const { handleOgGet } = await loadHandler();
    const response = await handleOgGet(
      new NextRequest('https://example.com/api/og?title=Hello&site=Blog'),
      'og'
    );

    expect(response.status).toBe(200);
    expect(state.pixelRenderCalls).toHaveLength(1);
  });

  test('requires signature when protection is enabled', async () => {
    state.securityConfig = {
      primaryRouteKey: 'og_secure',
      allowLegacyPath: false,
      signatureSecret: 'sig-secret',
      hasSignatureProtection: true,
    };

    const { handleOgGet } = await loadHandler();
    const response = await handleOgGet(
      new NextRequest('https://example.com/api/og_secure?title=Hello&site=Blog'),
      'og_secure'
    );

    expect(response.status).toBe(404);
  });

  test('rejects invalid or expired signatures', async () => {
    state.securityConfig = {
      primaryRouteKey: 'og_secure',
      allowLegacyPath: false,
      signatureSecret: 'sig-secret',
      hasSignatureProtection: true,
    };

    const { handleOgGet } = await loadHandler();

    const invalidSigResponse = await handleOgGet(
      new NextRequest('https://example.com/api/og_secure?title=Hello&site=Blog&sig=invalid'),
      'og_secure'
    );

    const expiredBase = `https://example.com/api/og_secure?title=Hello&site=Blog&exp=${Math.floor(
      Date.now() / 1000
    ) - 10}`;
    const expiredUrl = signUrl(expiredBase, 'sig-secret');
    const expiredResponse = await handleOgGet(new NextRequest(expiredUrl), 'og_secure');

    expect(invalidSigResponse.status).toBe(404);
    expect(expiredResponse.status).toBe(404);
  });

  test('accepts valid signatures with canonical query ordering', async () => {
    state.securityConfig = {
      primaryRouteKey: 'og_secure',
      allowLegacyPath: false,
      signatureSecret: 'sig-secret',
      hasSignatureProtection: true,
    };

    const { handleOgGet } = await loadHandler();

    const unsignedUrl =
      'https://example.com/api/og_secure?site=Blog&title=Hello&ogKey=ignored&author=Neo';
    const signedUrl = signUrl(unsignedUrl, 'sig-secret');

    const response = await handleOgGet(new NextRequest(signedUrl), 'og_secure');

    expect(response.status).toBe(200);
    expect(state.pixelRenderCalls).toHaveLength(1);
  });

  test('selects modern theme when requested and sanitizes text inputs', async () => {
    const { handleOgGet } = await loadHandler();

    const response = await handleOgGet(
      new NextRequest(
        'https://example.com/api/og?theme=modern&title=%E2%80%9CHello%E2%80%9D%E2%80%94World%E2%80%A6&site=%E2%80%98My%20Site%E2%80%99&excerpt=Line%E2%80%89Break'
      ),
      'og'
    );

    expect(response.status).toBe(200);
    expect(state.modernRenderCalls).toHaveLength(1);

    const rendered = state.modernRenderCalls[0]?.props;
    expect(rendered?.title).toBe('"Hello" — World...');
    expect(rendered?.site).toBe("'My Site'");
    expect(rendered?.excerpt).toBe('Line Break');
  });

  test('falls back to pixel theme for unknown theme names', async () => {
    const { handleOgGet } = await loadHandler();

    const response = await handleOgGet(
      new NextRequest('https://example.com/api/og?theme=unknown&title=Hello&site=Blog'),
      'og'
    );

    expect(response.status).toBe(200);
    expect(state.pixelRenderCalls).toHaveLength(1);
    expect(state.modernRenderCalls).toHaveLength(0);
  });

  test('sets fonts as undefined when theme font loader returns empty list', async () => {
    state.pixelFonts = [];

    const { handleOgGet } = await loadHandler();
    const response = await handleOgGet(
      new NextRequest('https://example.com/api/og?title=Hello&site=Blog'),
      'og'
    );

    expect(response.status).toBe(200);
    const init = state.imageResponseCalls[0]?.init;
    expect(init?.fonts).toBeUndefined();
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
    );
  });

  test('uses default title and site when required params are missing', async () => {
    const { handleOgGet } = await loadHandler();
    const response = await handleOgGet(new NextRequest('https://example.com/api/og'), 'og');

    expect(response.status).toBe(200);

    const rendered = state.pixelRenderCalls[0]?.props;
    expect(rendered?.title).toBe('Untitled');
    expect(rendered?.site).toBe('Blog');
  });

  test('accepts valid public image url and keeps it as background', async () => {
    const fetchSpy = mockDns({
      'cdn.example.com': { A: ['8.8.8.8'], AAAA: [] },
    });

    const { handleOgGet } = await loadHandler();
    const response = await handleOgGet(
      new NextRequest('https://example.com/api/og?title=Hello&site=Blog&image=https://cdn.example.com/hero.png'),
      'og'
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(state.pixelRenderCalls[0]?.props.backgroundImageSrc).toBe('https://cdn.example.com/hero.png');
  });

  test('reconstructs truncated unsplash params from top-level query', async () => {
    mockDns({
      'images.unsplash.com': { A: ['1.1.1.1'], AAAA: [] },
    });

    const { handleOgGet } = await loadHandler();
    const response = await handleOgGet(
      new NextRequest(
        'https://example.com/api/og?title=Hello&site=Blog&image=https://images.unsplash.com/photo-123?auto=format&crop=entropy&q=80&w=1200'
      ),
      'og'
    );

    expect(response.status).toBe(200);

    const background = state.pixelRenderCalls[0]?.props.backgroundImageSrc;
    expect(background?.startsWith('https://images.unsplash.com/photo-123?auto=format')).toBeTrue();
    expect(background?.includes('&crop=entropy')).toBeTrue();
    expect(background?.includes('&q=80')).toBeTrue();
    expect(background?.includes('&w=1200')).toBeTrue();
  });

  test('rejects unsupported image format even when url is public', async () => {
    mockDns({
      'cdn.example.com': { A: ['8.8.8.8'], AAAA: [] },
    });

    const { handleOgGet } = await loadHandler();
    const response = await handleOgGet(
      new NextRequest('https://example.com/api/og?title=Hello&site=Blog&image=https://cdn.example.com/image.webp'),
      'og'
    );

    expect(response.status).toBe(200);
    expect(state.pixelRenderCalls[0]?.props.backgroundImageSrc).toBe('https://example.com/default-bg.jpg');
  });

  test('rejects private and local image urls (IPv4, IPv6, localhost)', async () => {
    const { handleOgGet } = await loadHandler();

    const privateIpv4 = await handleOgGet(
      new NextRequest('https://example.com/api/og?title=Hello&site=Blog&image=http://192.168.1.5/p.png'),
      'og'
    );
    const privateIpv6 = await handleOgGet(
      new NextRequest('https://example.com/api/og?title=Hello&site=Blog&image=http://[fd00::1]/p.png'),
      'og'
    );
    const localhost = await handleOgGet(
      new NextRequest('https://example.com/api/og?title=Hello&site=Blog&image=http://localhost/p.png'),
      'og'
    );

    expect(privateIpv4.status).toBe(200);
    expect(privateIpv6.status).toBe(200);
    expect(localhost.status).toBe(200);

    expect(state.pixelRenderCalls[0]?.props.backgroundImageSrc).toBe('https://example.com/default-bg.jpg');
    expect(state.pixelRenderCalls[1]?.props.backgroundImageSrc).toBe('https://example.com/default-bg.jpg');
    expect(state.pixelRenderCalls[2]?.props.backgroundImageSrc).toBe('https://example.com/default-bg.jpg');
  });

  test('rejects image urls with credentials or non-standard ports', async () => {
    const { handleOgGet } = await loadHandler();

    const withCredentials = await handleOgGet(
      new NextRequest(
        'https://example.com/api/og?title=Hello&site=Blog&image=https://user:pass@cdn.example.com/a.jpg'
      ),
      'og'
    );

    const withPort = await handleOgGet(
      new NextRequest('https://example.com/api/og?title=Hello&site=Blog&image=https://cdn.example.com:8080/a.jpg'),
      'og'
    );

    expect(withCredentials.status).toBe(200);
    expect(withPort.status).toBe(200);

    expect(state.pixelRenderCalls[0]?.props.backgroundImageSrc).toBe('https://example.com/default-bg.jpg');
    expect(state.pixelRenderCalls[1]?.props.backgroundImageSrc).toBe('https://example.com/default-bg.jpg');
  });

  test('rejects hostnames resolved to private addresses via DNS', async () => {
    const fetchSpy = mockDns({
      'internal.example.com': { A: ['10.0.0.2'], AAAA: [] },
    });

    const { handleOgGet } = await loadHandler();
    const response = await handleOgGet(
      new NextRequest(
        'https://example.com/api/og?title=Hello&site=Blog&image=https://internal.example.com/image.jpg'
      ),
      'og'
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(state.pixelRenderCalls[0]?.props.backgroundImageSrc).toBe('https://example.com/default-bg.jpg');
  });

  test('reuses DNS cache for repeated hostname lookups', async () => {
    const fetchSpy = mockDns({
      'cache.example.com': { A: ['8.8.4.4'], AAAA: [] },
    });

    const { handleOgGet } = await loadHandler();
    const request = new NextRequest(
      'https://example.com/api/og?title=Hello&site=Blog&image=https://cache.example.com/image.jpg'
    );

    const first = await handleOgGet(request, 'og');
    const second = await handleOgGet(request, 'og');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
