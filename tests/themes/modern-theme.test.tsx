import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';

async function loadModernTheme() {
  const mod = await import(`../../app/api/og/themes/modern.tsx?case=${Math.random()}`);
  return mod.modernTheme;
}

afterEach(() => {
  mock.restore();
});

describe('modern theme', () => {
  test('loads both regular and bold inter fonts', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 })
    );

    const modernTheme = await loadModernTheme();
    const fonts = await modernTheme.loadFonts({
      baseUrl: 'https://example.com',
      searchParams: new URLSearchParams(),
    });

    expect(fonts).toHaveLength(2);
    expect(fonts.map((font) => font.weight)).toEqual([400, 700]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test('returns partial font list when one request fails', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { status: 200 }))
      .mockResolvedValueOnce(new Response('failed', { status: 500 }));

    const modernTheme = await loadModernTheme();
    const fonts = await modernTheme.loadFonts({
      baseUrl: 'https://example.com',
      searchParams: new URLSearchParams(),
    });

    expect(fonts).toHaveLength(1);
    expect(fonts[0]?.weight).toBe(400);
  });

  test('render truncates text and applies large-title sizing rules', async () => {
    const modernTheme = await loadModernTheme();

    const element = modernTheme.render(
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
        searchParams: new URLSearchParams(),
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
    expect(titleNode.props.style.fontSize).toBe('52px');
    expect(excerptNode.props.children.endsWith('...')).toBeTrue();
    expect(excerptNode.props.children.length).toBe(80);
  });
});
