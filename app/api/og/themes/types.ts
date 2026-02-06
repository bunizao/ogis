export interface ThemeProps {
  title: string;
  site: string;
  excerpt: string;
  author: string;
  date: string;
  backgroundImageSrc: string;
}

export interface ThemeContext {
  baseUrl: string;
  searchParams: URLSearchParams;
}

export interface ThemeFont {
  name: string;
  data: ArrayBuffer;
  style: 'normal';
  weight: 400 | 700;
}

export interface ThemeDefinition {
  loadFonts: (context: ThemeContext) => Promise<ThemeFont[]>;
  render: (props: ThemeProps, context: ThemeContext) => React.ReactElement;
  fontFamily: string;
}
