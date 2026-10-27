import { getPixelFontOption } from '@/app/lib/pixel-fonts';
import { ZPIX_CHUNKS } from '@/app/lib/zpix-chunks';
import type { ThemeContext, ThemeFont } from './types';

const fontDataCache = new Map<string, Promise<ArrayBuffer | null>>();

// Cached across requests per edge isolate; failed fetches are evicted so they retry.
export async function fetchFontData(url: string): Promise<ArrayBuffer | null> {
  let pending = fontDataCache.get(url);
  if (!pending) {
    pending = (async () => {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (!response.ok) return null;
        return await response.arrayBuffer();
      } catch {
        return null;
      }
    })();
    fontDataCache.set(url, pending);
  }

  const data = await pending;
  if (!data) {
    fontDataCache.delete(url);
  }
  return data;
}

// Test hook: the cache is module-level, so isolated test cases must reset it.
export function clearFontDataCache(): void {
  fontDataCache.clear();
}

// Themes truncate every field far below this; scanning further would only fetch
// glyphs that never reach the image (Ghost excerpts can run to 500 characters).
const MAX_SCANNED_CHARS_PER_PARAM = 200;

const ZPIX = getPixelFontOption('zpix');
let zpixChunkByCodePoint: Map<number, number> | null = null;

function zpixChunkIndex(codePoint: number): number | undefined {
  if (!zpixChunkByCodePoint) {
    const map = new Map<number, number>();
    ZPIX_CHUNKS.forEach((chunk, index) => {
      for (const char of chunk.chars) map.set(char.codePointAt(0)!, index);
    });
    zpixChunkByCodePoint = map;
  }
  return zpixChunkByCodePoint.get(codePoint);
}

// Zpix chunks covering the query text; chunk 0 (Latin) is always included.
export function zpixChunksForQuery(searchParams: URLSearchParams): number[] {
  const chunks = new Set<number>([0]);
  searchParams.forEach(value => {
    let scanned = 0;
    for (const char of value) {
      if (++scanned > MAX_SCANNED_CHARS_PER_PARAM) break;
      const index = zpixChunkIndex(char.codePointAt(0)!);
      if (index !== undefined) chunks.add(index);
    }
  });
  return [...chunks].sort((a, b) => a - b);
}

// Zpix loads only the chunks the query needs; other pixel fonts load whole.
export async function loadPixelFonts(context: ThemeContext): Promise<ThemeFont[]> {
  const selected = getPixelFontOption(context.searchParams.get('pixelFont'));
  const isZpix = selected.key === ZPIX.key;

  const sources: Array<{ path: string; name: string }> = [];
  if (!isZpix) sources.push({ path: selected.filePath, name: selected.fontName });
  for (const index of isZpix ? zpixChunksForQuery(context.searchParams) : []) {
    // Chunk 0 carries the family name themes reference; the rest only need unique names.
    sources.push({
      path: ZPIX_CHUNKS[index].file,
      name: index === 0 ? ZPIX.fontName : `${ZPIX.fontName} ${index}`,
    });
  }

  const fonts = await Promise.all(
    sources.map(async ({ path, name }): Promise<ThemeFont | null> => {
      const data = await fetchFontData(new URL(path, context.baseUrl).toString());
      return data ? { name, data, style: 'normal', weight: 400 } : null;
    })
  );
  return fonts.filter((font): font is ThemeFont => font !== null);
}
