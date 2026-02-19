import { NextResponse } from 'next/server';
import { buildOgApiEndpoint } from '@/app/lib/og-api-path';
import { resolveOgSecurityConfig } from '@/app/lib/og-security';

export const runtime = 'edge';

function isConfigEndpointEnabled(): boolean {
  return process.env.OG_ENABLE_CONFIG_ENDPOINT === 'true';
}

export async function GET() {
  if (!isConfigEndpointEnabled()) {
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }

  const config = resolveOgSecurityConfig();
  return NextResponse.json(
    {
      endpoint: buildOgApiEndpoint(config.primaryRouteKey),
      signatureRequired: config.hasSignatureProtection,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=30',
      },
    }
  );
}
