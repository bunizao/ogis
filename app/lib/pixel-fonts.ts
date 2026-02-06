export const PIXEL_FONT_OPTIONS = [
  {
    key: 'zpix',
    label: 'Zpix',
    fontName: 'Zpix',
    filePath: '/fonts/zpix.ttf',
  },
  {
    key: 'geist-square',
    label: 'Geist Pixel Square',
    fontName: 'Geist Pixel Square',
    filePath: '/fonts/geist-pixel/GeistPixel-Square.ttf',
  },
  {
    key: 'geist-circle',
    label: 'Geist Pixel Circle',
    fontName: 'Geist Pixel Circle',
    filePath: '/fonts/geist-pixel/GeistPixel-Circle.ttf',
  },
  {
    key: 'geist-line',
    label: 'Geist Pixel Line',
    fontName: 'Geist Pixel Line',
    filePath: '/fonts/geist-pixel/GeistPixel-Line.ttf',
  },
  {
    key: 'geist-triangle',
    label: 'Geist Pixel Triangle',
    fontName: 'Geist Pixel Triangle',
    filePath: '/fonts/geist-pixel/GeistPixel-Triangle.ttf',
  },
  {
    key: 'geist-grid',
    label: 'Geist Pixel Grid',
    fontName: 'Geist Pixel Grid',
    filePath: '/fonts/geist-pixel/GeistPixel-Grid.ttf',
  },
] as const;

export type PixelFontOption = (typeof PIXEL_FONT_OPTIONS)[number];
export type PixelFontKey = PixelFontOption['key'];

export const DEFAULT_PIXEL_FONT: PixelFontKey = 'zpix';

const pixelFontMap: Record<PixelFontKey, PixelFontOption> = Object.fromEntries(
  PIXEL_FONT_OPTIONS.map(option => [option.key, option])
) as Record<PixelFontKey, PixelFontOption>;

export function normalizePixelFont(value: string | null | undefined): PixelFontKey {
  if (!value) return DEFAULT_PIXEL_FONT;
  return value in pixelFontMap ? (value as PixelFontKey) : DEFAULT_PIXEL_FONT;
}

export function getPixelFontOption(value: string | null | undefined): PixelFontOption {
  return pixelFontMap[normalizePixelFont(value)];
}
