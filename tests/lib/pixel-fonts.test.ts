import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_PIXEL_FONT,
  PIXEL_FONT_OPTIONS,
  getPixelFontOption,
  normalizePixelFont,
} from '../../app/lib/pixel-fonts';

describe('pixel-fonts', () => {
  test('defaults to zpix when input is empty or unknown', () => {
    expect(normalizePixelFont(undefined)).toBe(DEFAULT_PIXEL_FONT);
    expect(normalizePixelFont(null)).toBe(DEFAULT_PIXEL_FONT);
    expect(normalizePixelFont('')).toBe(DEFAULT_PIXEL_FONT);
    expect(normalizePixelFont('not-exists')).toBe(DEFAULT_PIXEL_FONT);
  });

  test('accepts all known font keys', () => {
    for (const option of PIXEL_FONT_OPTIONS) {
      expect(normalizePixelFont(option.key)).toBe(option.key);
      expect(getPixelFontOption(option.key)).toEqual(option);
    }
  });

  test('returns default font option for unknown key', () => {
    const option = getPixelFontOption('unknown-font-key');
    expect(option.key).toBe(DEFAULT_PIXEL_FONT);
    expect(option.label).toBe('Zpix');
  });
});
