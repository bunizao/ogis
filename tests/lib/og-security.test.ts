import { describe, expect, test } from 'bun:test';
import { DEFAULT_OG_API_PATH } from '../../app/lib/og-api-path';
import {
  deriveOgApiPathFromSecret,
  resolveOgSecurityConfig,
} from '../../app/lib/og-security';

describe('og-security', () => {
  test('deriveOgApiPathFromSecret is deterministic and normalized', () => {
    const a = deriveOgApiPathFromSecret('  my-secret  ');
    const b = deriveOgApiPathFromSecret('my-secret');

    expect(a).toBe(b);
    expect(a.startsWith('og_')).toBeTrue();
    expect(a.length).toBe(15); // og_ + 12 chars
  });

  test('falls back to default path when secret is empty', () => {
    expect(deriveOgApiPathFromSecret('')).toBe(DEFAULT_OG_API_PATH);
    expect(deriveOgApiPathFromSecret('   ')).toBe(DEFAULT_OG_API_PATH);
  });

  test('returns defaults when no security env is provided', () => {
    const config = resolveOgSecurityConfig({});

    expect(config.primaryRouteKey).toBe(DEFAULT_OG_API_PATH);
    expect(config.allowLegacyPath).toBeTrue();
    expect(config.signatureSecret).toBe('');
    expect(config.hasSignatureProtection).toBeFalse();
  });

  test('enables signature and strict legacy path by default in OG_SECRET mode', () => {
    const config = resolveOgSecurityConfig({ OG_SECRET: 'abc123' });

    expect(config.primaryRouteKey).toStartWith('og_');
    expect(config.primaryRouteKey).not.toBe(DEFAULT_OG_API_PATH);
    expect(config.signatureSecret).toBe('abc123');
    expect(config.hasSignatureProtection).toBeTrue();
    expect(config.allowLegacyPath).toBeFalse();
  });

  test('honors explicit OG_API_PATH and normalizes it', () => {
    const config = resolveOgSecurityConfig({
      OG_SECRET: 'abc123',
      OG_API_PATH: '/custom_key/',
    });

    expect(config.primaryRouteKey).toBe('custom_key');
    expect(config.hasSignatureProtection).toBeTrue();
    expect(config.allowLegacyPath).toBeFalse();
  });

  test('uses OG_SIGNATURE_SECRET over OG_SECRET when provided', () => {
    const config = resolveOgSecurityConfig({
      OG_SECRET: 'unified-secret',
      OG_SIGNATURE_SECRET: 'signature-only-secret',
    });

    expect(config.signatureSecret).toBe('signature-only-secret');
    expect(config.hasSignatureProtection).toBeTrue();
  });

  test('supports explicit legacy path policy override', () => {
    const enabled = resolveOgSecurityConfig({
      OG_SECRET: 'abc123',
      OG_API_ALLOW_LEGACY_PATH: 'true',
    });
    const disabled = resolveOgSecurityConfig({
      OG_API_PATH: 'og',
      OG_API_ALLOW_LEGACY_PATH: 'false',
    });

    expect(enabled.allowLegacyPath).toBeTrue();
    expect(disabled.allowLegacyPath).toBeFalse();
  });

  test('in non-unified mode, legacy path is allowed only when primary path is og', () => {
    const sameAsLegacy = resolveOgSecurityConfig({ OG_API_PATH: 'og' });
    const customPath = resolveOgSecurityConfig({ OG_API_PATH: 'custom' });

    expect(sameAsLegacy.allowLegacyPath).toBeTrue();
    expect(customPath.allowLegacyPath).toBeFalse();
  });

  test('invalid OG_API_ALLOW_LEGACY_PATH value falls back to derived default policy', () => {
    const config = resolveOgSecurityConfig({
      OG_SECRET: 'abc123',
      OG_API_ALLOW_LEGACY_PATH: 'yes',
    });

    expect(config.allowLegacyPath).toBeFalse();
  });
});
