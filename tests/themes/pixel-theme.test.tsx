import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';

async function loadPixelTheme() {
  const mod = await import(`../../app/api/og/themes/pixel.tsx?case=${Math.random()}`);
  return mod.pixelTheme;
}

afterEach(() => {
  mock.restore();
});

describe('pixel theme', () => {
  test('loads selected local pixel font', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3, 4]), { status: 200 })
    );

    const pixelTheme = await loadPixelTheme();
    const fonts = await pixelTheme.loadFonts({
      baseUrl: 'https://example.com',
      searchParams: new URLSearchParams('pixelFont=geist-square'),
    });

    expect(fonts).toHaveLength(1);
    expect(fonts[0]?.name).toBe('Geist Pixel Square');
    expect(fonts[0]?.weight).toBe(400);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
      'https://example.com/fonts/geist-pixel/GeistPixel-Square.ttf'
    );
  });

  test('caches font data by url', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([9, 8, 7]), { status: 200 })
    );

    const pixelTheme = await loadPixelTheme();
    const context = {
      baseUrl: 'https://cache-test.example.com',
      searchParams: new URLSearchParams('pixelFont=zpix'),
    };

    const first = await pixelTheme.loadFonts(context);
    const second = await pixelTheme.loadFonts(context);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test('returns no fonts when fetch fails', async () => {
    spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }));

    const pixelTheme = await loadPixelTheme();
    const fonts = await pixelTheme.loadFonts({
      baseUrl: 'https://example.com',
      searchParams: new URLSearchParams('pixelFont=geist-grid'),
    });

    expect(fonts).toHaveLength(0);
  });

  test('render truncates title and excerpt and computes font size for long titles', async () => {
    const pixelTheme = await loadPixelTheme();

    const element = pixelTheme.render(
      {
        title: 'A'.repeat(61),
        site: 'My Site',
        excerpt: 'B'.repeat(81),
        author: 'Author',
        date: '2026-01-01',
        backgroundImageSrc: 'https://example.com/bg.jpg',
      },
      {
        baseUrl: 'https://example.com',
        searchParams: new URLSearchParams('pixelFont=zpix'),
      }
    ) as unknown as {
      props: {
        children: Array<{ props: { children: unknown[] } }>;
      };
    };

    const content = element.props.children[2] as {
      props: { children: unknown[] };
    };
    const children = content.props.children;
    const titleNode = children[1] as { props: { children: string; style: { fontSize: string } } };
    const excerptNode = children[2] as { props: { children: string } };

    expect(titleNode.props.children.endsWith('...')).toBeTrue();
    expect(titleNode.props.children.length).toBe(60);
    expect(titleNode.props.style.fontSize).toBe('56px');
    expect(excerptNode.props.children.endsWith('...')).toBeTrue();
    expect(excerptNode.props.children.length).toBe(80);
  });
});
