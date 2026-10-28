// Theme registry shared by the OG handler and the landing page. Rendering code
// lives in app/api/og/themes; this file stays tiny so the client bundle can use it.

export const OG_THEMES = [
  {
    key: 'pixel',
    label: 'Pixel',
    description: 'Bitmap type over your cover image. The original OGIS look.',
  },
  {
    key: 'modern',
    label: 'Modern',
    description: 'Headline set straight on your cover image, like a magazine cover.',
  },
  {
    key: 'editorial',
    label: 'Editorial',
    description: 'A centred serif opener, like a magazine feature. A cover image turns it into a spread.',
  },
  {
    key: 'swiss',
    label: 'Swiss',
    description: 'Heavy grotesk on a four-column grid. A cover image takes the last column.',
  },
  {
    key: 'terminal',
    label: 'Terminal',
    description: 'A shell session with a status line. Monospace, monochrome.',
  },
] as const;

export type OgThemeOption = (typeof OG_THEMES)[number];
export type OgThemeKey = OgThemeOption['key'];

export const DEFAULT_OG_THEME: OgThemeKey = 'pixel';

const themeKeys = new Set<string>(OG_THEMES.map(theme => theme.key));

export function normalizeOgTheme(value: string | null | undefined): OgThemeKey {
  return value && themeKeys.has(value) ? (value as OgThemeKey) : DEFAULT_OG_THEME;
}
