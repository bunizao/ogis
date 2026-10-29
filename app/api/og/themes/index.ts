import type { OgThemeKey } from '@/app/lib/og-themes';
import { bauhausTheme } from './bauhaus';
import { blueprintTheme } from './blueprint';
import { editorialTheme } from './editorial';
import { galleryTheme } from './gallery';
import { modernTheme } from './modern';
import { oilTheme } from './oil';
import { pixelTheme } from './pixel';
import { postcardTheme } from './postcard';
import { swissTheme } from './swiss';
import { terminalTheme } from './terminal';
import type { ThemeDefinition } from './types';

export const themes: Record<OgThemeKey, ThemeDefinition> = {
  pixel: pixelTheme,
  modern: modernTheme,
  editorial: editorialTheme,
  swiss: swissTheme,
  terminal: terminalTheme,
  gallery: galleryTheme,
  postcard: postcardTheme,
  bauhaus: bauhausTheme,
  blueprint: blueprintTheme,
  oil: oilTheme,
};
