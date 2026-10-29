export interface ThemeProps {
  title: string;
  site: string;
  excerpt: string;
  author: string;
  date: string;
  tag: string;
  readingTime: string;
  // Validated `#rrggbb`, or null to use the theme's own accent.
  accent: string | null;
  // Caller-supplied images, already fetched and inlined as data URLs; null when
  // absent or rejected so themes can lay out without them.
  imageSrc: string | null;
  iconSrc: string | null;
  avatarSrc: string | null;
  // Bundled starfield for themes that always want a photo behind the text.
  fallbackImageSrc: string;
}

export interface ThemeContext {
  baseUrl: string;
  searchParams: URLSearchParams;
}

export interface ThemeFont {
  name: string;
  data: ArrayBuffer;
  style: 'normal' | 'italic';
  weight: 300 | 400 | 500 | 600 | 700 | 800 | 900;
}

export interface ThemeDefinition {
  loadFonts: (context: ThemeContext) => Promise<ThemeFont[]>;
  render: (props: ThemeProps, context: ThemeContext) => React.ReactElement;
  fontFamily: string;
}
