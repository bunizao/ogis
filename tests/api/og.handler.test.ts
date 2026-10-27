import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createElement } from 'react';
import { themes } from '../../app/api/og/themes';
import type { ThemeContext, ThemeFont, ThemeProps } from '../../app/api/og/themes/types';

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

const state = {
  fonts: [] as ThemeFont[],
  renders: [] as Array<{ theme: string; props: ThemeProps; context: ThemeContext }>,
};

// Spy on the real theme objects instead of mock.module: module mocks are
// process-wide in Bun and would leak into the theme render tests.
function stubThemes() {
  for (const [theme, definition] of Object.entries(themes)) {
    spyOn(definition, 'loadFonts').mockImplementation(async () => state.fonts);
    spyOn(definition, 'render').mockImplementation((props, context) => {
      state.renders.push({ theme, props, context });
      return createElement('div', { style: { display: 'flex' } }, props.site);
    });
  }
}

// resolveOgRouteKeys() runs at module load, so env changes need a fresh handler instance.
async function loadHandler(env: Record<string, string> = {}) {
  for (const [key, value] of Object.entries(env)) process.env[key] = value;
  return import(`../../app/api/og/handler.tsx?case=${Math.random()}`);
}

async function render(url: string, routeKey = 'og', env?: Record<string, string>) {
  const { handleOgGet } = await loadHandler(env);
  const response: Response = await handleOgGet(new NextRequest(url), routeKey);
  return { response, rendered: state.renders.at(-1) };
}

// Public DNS for every host, and a PNG for any image path.
function mockNetwork() {
  return spyOn(globalThis, 'fetch').mockImplementation((async (input: string | URL | Request) => {
    const url = new URL(String(input instanceof Request ? input.url : input));
    if (url.hostname === 'dns.google') {
      const ips = url.searchParams.get('type') === 'A' ? ['93.184.216.34'] : [];
      return Response.json({ Status: 0, Answer: ips.map(data => ({ data })) });
    }
    return new Response(PNG_BYTES);
  }) as typeof fetch);
}

// PNG stores width and height as big-endian u32s in the IHDR chunk.
async function pngSize(response: Response) {
  const view = new DataView(await response.arrayBuffer());
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

beforeEach(() => {
  state.fonts = [];
  state.renders = [];
  delete process.env.OG_API_PATH;
  delete process.env.OG_SECRET;
  stubThemes();
});

afterEach(() => {
  mock.restore();
  delete process.env.OG_API_PATH;
  delete process.env.OG_SECRET;
});

describe('route keys', () => {
  test('serves the default og path', async () => {
    const { response, rendered } = await render('https://example.com/api/og?title=Hello');
    expect(response.status).toBe(200);
    expect(rendered?.theme).toBe('pixel');
  });

  test('returns 404 for unknown paths', async () => {
    const { response } = await render('https://example.com/api/other?title=Hello', 'other');
    expect(response.status).toBe(404);
    expect(state.renders).toHaveLength(0);
  });

  test('serves OG_API_PATH as an alias', async () => {
    const { response } = await render('https://example.com/api/custom?title=Hello', 'custom', {
      OG_API_PATH: 'custom',
    });
    expect(response.status).toBe(200);
  });

  test('keeps legacy OG_SECRET paths working and ignores old signature params', async () => {
    const { response } = await render(
      'https://example.com/api/og_fqc4xxjzrnmx?title=Hello&sig=stale&exp=1',
      'og_fqc4xxjzrnmx',
      { OG_SECRET: 'abc123' }
    );
    expect(response.status).toBe(200);
  });
});

describe('themes', () => {
  test.each(['modern'])('selects %s when requested', async theme => {
    const { rendered } = await render(`https://example.com/api/og?theme=${theme}`);
    expect(rendered?.theme).toBe(theme);
  });

  test('falls back to pixel for unknown theme names', async () => {
    const { rendered } = await render('https://example.com/api/og?theme=terminal');
    expect(rendered?.theme).toBe('pixel');
  });
});

describe('text', () => {
  test('uses defaults for missing title and site', async () => {
    const { rendered } = await render('https://example.com/api/og');
    expect(rendered?.props.title).toBe('Untitled');
    expect(rendered?.props.site).toBe('Blog');
    expect(rendered?.props.excerpt).toBe('');
  });

  test('normalizes typographic quotes, dashes, ellipses and odd spaces', async () => {
    const { rendered } = await render(
      'https://example.com/api/og?title=%E2%80%9CHello%E2%80%9D%E2%80%94World%E2%80%A6&site=%E2%80%98My%20Site%E2%80%99&excerpt=Line%E2%80%89Break'
    );
    expect(rendered?.props.title).toBe('"Hello" — World...');
    expect(rendered?.props.site).toBe("'My Site'");
    expect(rendered?.props.excerpt).toBe('Line Break');
  });

  test('keeps single hyphens intact', async () => {
    const { rendered } = await render(
      'https://example.com/api/og?title=state-of-the-art&excerpt=Pause%20%E2%80%94%20resume'
    );
    expect(rendered?.props.title).toBe('state-of-the-art');
    expect(rendered?.props.excerpt).toBe('Pause — resume');
  });

  test('caps long fields by code point without splitting emoji', async () => {
    const title = encodeURIComponent('🚀'.repeat(300));
    const { rendered } = await render(`https://example.com/api/og?title=${title}&tag=${'x'.repeat(100)}`);
    expect(Array.from(rendered?.props.title ?? '')).toHaveLength(200);
    expect(rendered?.props.title.endsWith('🚀')).toBeTrue();
    expect(rendered?.props.tag).toHaveLength(40);
  });

  test('passes tag and reading time through', async () => {
    const { rendered } = await render('https://example.com/api/og?tag=Essay&reading=5%20min%20read');
    expect(rendered?.props.tag).toBe('Essay');
    expect(rendered?.props.readingTime).toBe('5 min read');
  });
});

describe('accent', () => {
  test.each([
    ['ff0', '#ffff00'],
    ['%2312ABef', '#12abef'],
    ['red', null],
    ['', null],
  ])('reads %s as %s', async (value, expected) => {
    const { rendered } = await render(`https://example.com/api/og?accent=${value}`);
    expect(rendered?.props.accent).toBe(expected);
  });
});

describe('images', () => {
  test('embeds accepted images as data URLs', async () => {
    mockNetwork();
    const { rendered } = await render(
      'https://example.com/api/og?image=https://cdn.example.com/hero.png&icon=https://cdn.example.com/icon.png&avatar=https://cdn.example.com/me.png'
    );
    expect(rendered?.props.imageSrc?.startsWith('data:image/png;base64,')).toBeTrue();
    expect(rendered?.props.iconSrc?.startsWith('data:image/png;base64,')).toBeTrue();
    expect(rendered?.props.avatarSrc?.startsWith('data:image/png;base64,')).toBeTrue();
  });

  test('drops rejected images and offers the bundled background instead', async () => {
    const { response, rendered } = await render('https://example.com/api/og?image=http://192.168.1.5/p.png');
    expect(response.status).toBe(200);
    expect(rendered?.props.imageSrc).toBeNull();
    expect(rendered?.props.fallbackImageSrc).toBe('https://example.com/default-bg.jpg');
  });
});

describe('response', () => {
  test('renders a 1200x630 PNG with long-lived CDN caching', async () => {
    const { response } = await render('https://example.com/api/og?title=Hello');
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
    );
    expect(await pngSize(response)).toEqual({ width: 1200, height: 630 });
  });

  test('still renders when the theme could not load any fonts', async () => {
    // Satori rejects an empty font list; the handler must fall back to the bundled font.
    state.fonts = [];
    const { response } = await render('https://example.com/api/og?title=Hello');
    expect(await pngSize(response)).toEqual({ width: 1200, height: 630 });
  });
});
