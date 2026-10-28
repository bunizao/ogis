import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { ImageResponse } from '@vercel/og';
import { clearFontDataCache } from '../../app/api/og/themes/font-data';
import { themes } from '../../app/api/og/themes';
import { fileName } from '../../app/api/og/themes/terminal';
import type { ThemeContext, ThemeFont, ThemeProps } from '../../app/api/og/themes/types';
import { OG_THEMES } from '../../app/lib/og-themes';

// 4x4 opaque PNG; enough for Satori to decode and lay out every <img>.
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGNwSJgARwzEcQDpQxMBLJSVHwAAAABJRU5ErkJggg==';
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];

const context = (query = ''): ThemeContext => ({
  baseUrl: 'https://og.example.com',
  searchParams: new URLSearchParams(query),
});

const minimal: ThemeProps = {
  title: 'Untitled',
  site: 'Blog',
  excerpt: '',
  author: '',
  date: '',
  tag: '',
  readingTime: '',
  accent: null,
  imageSrc: null,
  iconSrc: null,
  avatarSrc: null,
  fallbackImageSrc: PNG,
};

const full: ThemeProps = {
  title: 'How we cut our edge render times by sixty percent without touching the renderer at all',
  site: 'buxx.me',
  excerpt: 'Do not go gentle into that good night. Old age should burn and rave at close of day; rage, rage against the dying of the light.',
  author: 'bunizao',
  date: 'Jan 5, 2026',
  tag: 'Engineering',
  readingTime: '5 min read',
  accent: '#3366ff',
  imageSrc: PNG,
  iconSrc: PNG,
  avatarSrc: PNG,
  fallbackImageSrc: PNG,
};

let fetchSpy: ReturnType<typeof spyOn> | null = null;

function mockFontFetch(handler: (url: string) => Response) {
  const requested: string[] = [];
  fetchSpy = spyOn(globalThis, 'fetch').mockImplementation((async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input);
    requested.push(url);
    return handler(url);
  }) as typeof fetch);
  return requested;
}

beforeEach(() => clearFontDataCache());

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = null;
});

describe('theme registry', () => {
  test('every advertised theme has a renderer', () => {
    expect(Object.keys(themes).sort()).toEqual(OG_THEMES.map(theme => theme.key).sort());
  });
});

describe('terminal file name', () => {
  test.each([
    ['Interstellar', 'interstellar.md'],
    ['How we rebuilt our image pipeline on the edge', 'how-we-rebuilt-our-image.md'],
    ['Next.js 16: what changed?', 'next-js-16-what-changed.md'],
    ['如何在边缘重建图片管线', '如何在边缘重建图片管线.md'],
    ['!!!', 'post.md'],
  ])('%s -> %s', (title, expected) => {
    expect(fileName(title)).toBe(expected);
  });
});

describe('font loading', () => {
  test('pixel loads the selected bundled font from the deployment origin', async () => {
    const requested = mockFontFetch(() => new Response(new ArrayBuffer(8)));
    const fonts = await themes.pixel.loadFonts(context('pixelFont=geist-grid'));

    expect(requested).toEqual(['https://og.example.com/fonts/geist-pixel/GeistPixel-Grid.ttf']);
    expect(fonts.map(font => font.name)).toEqual(['Geist Pixel Grid']);
  });

  test('pixel falls back to Zpix for unknown fonts', async () => {
    const requested = mockFontFetch(() => new Response(new ArrayBuffer(8)));
    await themes.pixel.loadFonts(context('pixelFont=comic-sans'));

    expect(requested).toEqual(['https://og.example.com/fonts/zpix.ttf']);
  });

  test('font fetches are cached per isolate', async () => {
    const requested = mockFontFetch(() => new Response(new ArrayBuffer(8)));
    await themes.modern.loadFonts(context());
    await themes.modern.loadFonts(context());

    expect(requested).toHaveLength(3);
  });

  test('fontsource cuts are pinned TTFs and missing cuts are skipped', async () => {
    const requested = mockFontFetch(url =>
      url.includes('italic') ? new Response('missing', { status: 404 }) : new Response(new ArrayBuffer(8))
    );
    const fonts = await themes.editorial.loadFonts(context());

    expect(requested.sort()).toEqual([
      'https://cdn.jsdelivr.net/fontsource/fonts/instrument-sans@5.3.0/latin-400-normal.ttf',
      'https://cdn.jsdelivr.net/fontsource/fonts/instrument-sans@5.3.0/latin-500-normal.ttf',
      'https://cdn.jsdelivr.net/fontsource/fonts/instrument-serif@5.3.0/latin-400-italic.ttf',
      'https://cdn.jsdelivr.net/fontsource/fonts/instrument-serif@5.3.0/latin-400-normal.ttf',
    ]);
    expect(fonts.map(font => `${font.name} ${font.weight} ${font.style}`)).toEqual([
      'Instrument Serif 400 normal',
      'Instrument Sans 400 normal',
      'Instrument Sans 500 normal',
    ]);
  });
});

describe('rendering', () => {
  // One local font stands in for every family; Satori falls back to it for
  // unknown names, which is all a layout smoke test needs.
  const fontsPromise: Promise<ThemeFont[]> = Bun.file('public/fonts/zpix.ttf')
    .arrayBuffer()
    .then(data => [{ name: 'Zpix', data, weight: 400, style: 'normal' }]);

  for (const key of Object.keys(themes) as Array<keyof typeof themes>) {
    for (const [label, props] of [
      ['minimal', minimal],
      ['full', full],
    ] as const) {
      test(`${key} renders a PNG with ${label} props`, async () => {
        const response = new ImageResponse(themes[key].render(props, context()), {
          width: 1200,
          height: 630,
          fonts: await fontsPromise,
        });
        const bytes = new Uint8Array(await response.arrayBuffer());

        expect(Array.from(bytes.subarray(0, 4))).toEqual(PNG_SIGNATURE);
      });
    }
  }
});
