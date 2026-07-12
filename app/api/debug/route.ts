import { NextRequest, NextResponse } from 'next/server';
import { resolveOgBackgroundImage } from '@/app/lib/og-background-image';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const debugEnabled = process.env.OG_ENABLE_DEBUG === 'true';
  if (!debugEnabled) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const backgroundImage = await resolveOgBackgroundImage(requestUrl);

  return NextResponse.json({
    ...backgroundImage,
    allParams: Object.fromEntries(requestUrl.searchParams.entries()),
  });
}
