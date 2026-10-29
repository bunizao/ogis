import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { ImageResponse } from 'next/og';
import { clearFontDataCache } from '../../app/api/og/themes/font-data';
import { themes } from '../../app/api/og/themes';
import { publicImage } from '../../app/api/og/themes/public-files';
import { coverName, fileName } from '../../app/api/og/themes/terminal';
import type { ThemeContext, ThemeFont, ThemeProps } from '../../app/api/og/themes/types';
import { OG_THEMES } from '../../app/lib/og-themes';

// 4x4 opaque PNG; enough for Satori to decode and lay out every <img>.
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGNwSJgARwzEcQDpQxMBLJSVHwAAAABJRU5ErkJggg==';
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];

const context = (query = ''): ThemeContext => ({
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

describe('terminal cover name', () => {
  test.each([
    ['data:image/jpeg;base64,AAAA', 'cover.jpeg'],
    ['data:image/svg+xml;base64,AAAA', 'cover.svg'],
    ['https://example.com/a.jpg', 'cover.png'],
  ])('%s -> %s', (src, expected) => {
    expect(coverName(src)).toBe(expected);
  });
});

describe('bauhaus pattern', () => {
  test('is stable for a post and changes with the title', () => {
    // The tile column only, so the title text itself can't make two renders differ.
    const tiles = (title: string) => {
      const card = themes.bauhaus.render({ ...minimal, title }, context()) as React.ReactElement<{ children: React.ReactNode[] }>;
      return card.props.children[1];
    };

    expect(tiles('Interstellar')).toEqual(tiles('Interstellar'));
    expect(tiles('Interstellar')).not.toEqual(tiles('Gravity'));
  });
});

describe('oil canvas', () => {
  // The first layer: the brushwork detail, or the cover under the impasto.
  const canvas = async (props: ThemeProps) => {
    const card = (await themes.oil.render(props, context())) as React.ReactElement<{ children: React.ReactElement<{ children: React.ReactElement<{ src: string }>[] }>[] }>;
    return card.props.children[0].props.children.map(layer => layer.props.src);
  };

  test('picks a brushwork detail by title', async () => {
    const [detail] = await canvas({ ...minimal, title: 'Interstellar' });

    expect(detail).toStartWith('data:image/jpeg;base64,');
    expect((await canvas({ ...minimal, title: 'Interstellar' }))[0]).toBe(detail);
  });

  test('lays a cover under the impasto', async () => {
    expect((await canvas({ ...minimal, imageSrc: PNG })).slice(0, 2)).toEqual([PNG, await publicImage('oil/impasto.png')]);
  });
});

describe('starfield', () => {
  test.each(['pixel', 'modern', 'gallery'] as const)('%s draws it only when there is no cover', async key => {
    const starfield = await publicImage('default-bg.jpg');
    const tree = async (props: ThemeProps) => JSON.stringify(await themes[key].render(props, context()));

    expect(await tree(minimal)).toContain(starfield);
    expect(await tree({ ...minimal, imageSrc: PNG })).not.toContain(starfield);
  });
});

describe('font loading', () => {
  test('pixel reads the selected bundled font from disk, not over the network', async () => {
    const requested = mockFontFetch(() => new Response(new ArrayBuffer(8)));
    const [font] = await themes.pixel.loadFonts(context('pixelFont=geist-grid'));

    expect(requested).toEqual([]);
    expect(font?.name).toBe('Geist Pixel Grid');
    expect(font?.data.byteLength).toBeGreaterThan(1000);
  });

  test('pixel falls back to Zpix for unknown fonts', async () => {
    const fonts = await themes.pixel.loadFonts(context('pixelFont=comic-sans'));

    expect(fonts.map(font => font.name)).toEqual(['Zpix']);
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
        const response = new ImageResponse(await themes[key].render(props, context()), {
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
