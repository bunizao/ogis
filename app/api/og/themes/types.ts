export interface ThemeProps {
  title: string;
  site: string;
  excerpt: string;
  author: string;
  date: string;
  backgroundImageSrc: string;
}

export interface ThemeFont {
  name: string;
  data: ArrayBuffer;
  style: 'normal';
  weight: 400 | 700;
}

export interface ThemeDefinition {
  loadFonts: () => Promise<ThemeFont[]>;
  render: (props: ThemeProps) => React.ReactElement;
  fontFamily: string;
}
