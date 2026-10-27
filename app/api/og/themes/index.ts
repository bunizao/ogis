import type { OgThemeKey } from '@/app/lib/og-themes';
import { editorialTheme } from './editorial';
import { modernTheme } from './modern';
import { pixelTheme } from './pixel';
import { swissTheme } from './swiss';
import type { ThemeDefinition } from './types';

export const themes: Record<OgThemeKey, ThemeDefinition> = {
  pixel: pixelTheme,
  modern: modernTheme,
  editorial: editorialTheme,
  swiss: swissTheme,
};
