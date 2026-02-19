import { NextResponse } from 'next/server';
import { buildOgApiEndpoint } from '@/app/lib/og-api-path';
import { resolveOgSecurityConfig } from '@/app/lib/og-security';

export const runtime = 'edge';

export async function GET() {
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
