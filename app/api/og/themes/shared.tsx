import { fetchFontData } from './font-data';
import type { ThemeFont, ThemeProps } from './types';

// Pinned so a CDN-side "latest" bump can't silently change rendering.
const FONTSOURCE_VERSION = '5.3.0';

type FontVariant = { weight: ThemeFont['weight']; style?: ThemeFont['style'] };

// Loads latin TTF cuts from Fontsource. Satori needs TTF/OTF, not woff2.
// Missing cuts are skipped; Satori falls back to its bundled font.
export async function loadFontsourceFamily(
  id: string,
  name: string,
  variants: FontVariant[]
): Promise<ThemeFont[]> {
  const base = `https://cdn.jsdelivr.net/fontsource/fonts/${id}@${FONTSOURCE_VERSION}`;
  const loaded = await Promise.all(
    variants.map(async ({ weight, style = 'normal' }) => {
      const data = await fetchFontData(`${base}/latin-${weight}-${style}.ttf`);
      return data ? { name, data, weight, style } : null;
    })
  );
  return loaded.filter((font): font is ThemeFont => font !== null);
}

// CJK and other full-width glyphs take roughly two Latin columns, so a
// 20-character Chinese title needs the same room as a 40-character English one.
export function visualLength(text: string): number {
  let length = 0;
  for (const char of text) {
    length += /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(char)
      ? 1.8
      : 1;
  }
  return length;
}

// Picks the first size whose length budget fits, else the last (smallest) size.
export function fitFontSize(text: string, steps: Array<[maxLength: number, size: number]>): number {
  const length = visualLength(text);
  for (const [maxLength, size] of steps) {
    if (length <= maxLength) return size;
  }
  return steps[steps.length - 1][1];
}

export function metaItems({ author, date, readingTime }: ThemeProps): string[] {
  return [author, date, readingTime].filter(Boolean);
}

// Satori needs explicit width/height on <img>; with them a failed load leaves an
// empty box instead of aborting the render.
export function Img({
  src,
  width,
  height,
  style,
}: {
  src: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
}) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img src={src} width={width} height={height} style={{ width, height, objectFit: 'cover', ...style }} />;
}

// Full-canvas layer. Satori ignores the `inset` shorthand, so spell out the box.
export const FILL: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: 1200,
  height: 630,
  display: 'flex',
};

export function Cover({ src, style }: { src: string; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img
      src={src}
      width={1200}
      height={630}
      style={{
        ...FILL,
        objectFit: 'cover',
        objectPosition: 'center',
        ...style,
      }}
    />
  );
}
