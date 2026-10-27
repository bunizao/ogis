import type { OgThemeKey } from '@/app/lib/og-themes';
import { modernTheme } from './modern';
import { pixelTheme } from './pixel';
import type { ThemeDefinition } from './types';

export const themes: Record<OgThemeKey, ThemeDefinition> = {
  pixel: pixelTheme,
  modern: modernTheme,
};
