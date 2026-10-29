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
  {
    key: 'gallery',
    label: 'Gallery',
    description: 'Your cover printed edge to edge on a gallery wall, with the post as its museum label.',
  },
  {
    key: 'postcard',
    label: 'Postcard',
    description: 'The back of a postcard: printed caption, a note in pen, and your cover as the stamp.',
  },
  {
    key: 'bauhaus',
    label: 'Bauhaus',
    description: 'Flat geometric tiles drawn from the title, so every post gets its own pattern.',
  },
  {
    key: 'blueprint',
    label: 'Blueprint',
    description: 'A sheet from a drawing set, with a title block. A cover image becomes a detail callout.',
  },
  {
    key: 'oil',
    label: 'Oil',
    description: "The title lettered on a close-up of Van Gogh's brushwork. A cover image is laid under real impasto.",
  },
] as const;

export type OgThemeOption = (typeof OG_THEMES)[number];
export type OgThemeKey = OgThemeOption['key'];

export const DEFAULT_OG_THEME: OgThemeKey = 'pixel';

const themeKeys = new Set<string>(OG_THEMES.map(theme => theme.key));

export function normalizeOgTheme(value: string | null | undefined): OgThemeKey {
  return value && themeKeys.has(value) ? (value as OgThemeKey) : DEFAULT_OG_THEME;
}
