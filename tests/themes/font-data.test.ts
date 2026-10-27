import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import {
  clearFontDataCache,
  loadPixelFonts,
  zpixChunksForQuery,
} from '../../app/api/og/themes/font-data';
import { ZPIX_CHUNKS } from '../../app/lib/zpix-chunks';

function chunkOf(char: string): number {
  return ZPIX_CHUNKS.findIndex(chunk => chunk.chars.includes(char));
}

function mockFontFetch(failing: string[] = []) {
  return spyOn(globalThis, 'fetch').mockImplementation((async (input: RequestInfo | URL) => {
    const url = String(input);
    if (failing.some(part => url.includes(part))) return new Response('nope', { status: 500 });
    return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
  }) as unknown as typeof fetch);
}

function context(query: string) {
  return { baseUrl: 'https://example.com', searchParams: new URLSearchParams(query) };
}

beforeEach(() => {
  clearFontDataCache();
});

afterEach(() => {
  mock.restore();
});

describe('zpixChunksForQuery', () => {
  test('latin text needs only the base chunk', () => {
    expect(zpixChunksForQuery(new URLSearchParams('title=Hello world&site=Blog'))).toEqual([0]);
  });

  test('CJK text adds the chunks that hold its characters', () => {
    const chunks = zpixChunksForQuery(new URLSearchParams('title=你好，鬱'));
    expect(chunks).toEqual([...new Set([0, chunkOf('你'), chunkOf('，'), chunkOf('鬱')])].sort((a, b) => a - b));
  });

  test('ignores characters past the per-param scan limit', () => {
    const query = new URLSearchParams({ excerpt: 'a'.repeat(200) + '鬱' });
    expect(zpixChunksForQuery(query)).toEqual([0]);
  });

  test('ignores characters zpix does not have', () => {
    expect(zpixChunksForQuery(new URLSearchParams('title=🚀한'))).toEqual([0]);
  });
});

describe('loadPixelFonts', () => {
  test('zpix with a latin title fetches only the latin chunk', async () => {
    const fetchSpy = mockFontFetch();
    const fonts = await loadPixelFonts(context('title=Hello'));

    expect(fonts.map(font => font.name)).toEqual(['Zpix']);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toBe('https://example.com/fonts/zpix/zpix-00.ttf');
  });

  test('zpix with a CJK title adds named fallback chunks', async () => {
    mockFontFetch();
    const fonts = await loadPixelFonts(context('title=你好'));

    expect(fonts.map(font => font.name)).toEqual(['Zpix', `Zpix ${chunkOf('你')}`]);
  });

  test('keeps the fonts that loaded when one chunk fails', async () => {
    mockFontFetch([ZPIX_CHUNKS[chunkOf('你')].file]);
    const fonts = await loadPixelFonts(context('title=Hi 你好'));

    expect(fonts.map(font => font.name)).toEqual(['Zpix']);
  });
});
