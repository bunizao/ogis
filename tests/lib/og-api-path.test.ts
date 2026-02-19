import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_OG_API_PATH,
  buildOgApiEndpoint,
  normalizeOgApiPath,
} from '../../app/lib/og-api-path';

describe('og-api-path', () => {
  test('uses default path for empty values', () => {
    expect(normalizeOgApiPath()).toBe(DEFAULT_OG_API_PATH);
    expect(normalizeOgApiPath('')).toBe(DEFAULT_OG_API_PATH);
    expect(normalizeOgApiPath('   ')).toBe(DEFAULT_OG_API_PATH);
  });

  test('strips leading and trailing slashes', () => {
    expect(normalizeOgApiPath('/custom-key/')).toBe('custom-key');
    expect(normalizeOgApiPath('///abc_123///')).toBe('abc_123');
  });

  test('rejects invalid path characters', () => {
    expect(normalizeOgApiPath('with space')).toBe(DEFAULT_OG_API_PATH);
    expect(normalizeOgApiPath('中文')).toBe(DEFAULT_OG_API_PATH);
    expect(normalizeOgApiPath('../escape')).toBe(DEFAULT_OG_API_PATH);
    expect(normalizeOgApiPath('-bad')).toBe(DEFAULT_OG_API_PATH);
  });

  test('builds api endpoint from normalized path', () => {
    expect(buildOgApiEndpoint('custom')).toBe('/api/custom');
    expect(buildOgApiEndpoint('/foo/')).toBe('/api/foo');
    expect(buildOgApiEndpoint('')).toBe('/api/og');
  });
});
