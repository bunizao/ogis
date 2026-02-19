import { afterEach, describe, expect, mock, test } from 'bun:test';

type SecurityConfig = {
  primaryRouteKey: string;
  allowLegacyPath: boolean;
  signatureSecret: string;
  hasSignatureProtection: boolean;
};

const root = process.cwd();

async function loadRouteWithConfig(config: SecurityConfig) {
  const factory = () => ({
    resolveOgSecurityConfig: () => config,
  });

  mock.module('@/app/lib/og-security', factory);
  mock.module(`${root}/app/lib/og-security.ts`, factory);

  return import(`../../app/api/og-config/route.ts?case=${Math.random()}`);
}

afterEach(() => {
  mock.restore();
});

describe('/api/og-config', () => {
  test('returns endpoint and signature flag from security config', async () => {
    const route = await loadRouteWithConfig({
      primaryRouteKey: 'og_custom_key',
      allowLegacyPath: false,
      signatureSecret: 'secret',
      hasSignatureProtection: true,
    });

    const response = await route.GET();
    const body = (await response.json()) as { endpoint: string; signatureRequired: boolean };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      endpoint: '/api/og_custom_key',
      signatureRequired: true,
    });
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=30, s-maxage=30');
  });

  test('normalizes invalid path through buildOgApiEndpoint', async () => {
    const route = await loadRouteWithConfig({
      primaryRouteKey: ' invalid path ',
      allowLegacyPath: false,
      signatureSecret: '',
      hasSignatureProtection: false,
    });

    const response = await route.GET();
    const body = (await response.json()) as { endpoint: string; signatureRequired: boolean };

    expect(body.endpoint).toBe('/api/og');
    expect(body.signatureRequired).toBeFalse();
  });
});
