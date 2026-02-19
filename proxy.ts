import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isAllowedWhenApiOnly(pathname: string): boolean {
  if (pathname.startsWith('/api/')) return true;
  if (pathname === '/api') return true;

  // Required by OG rendering fallback/background and local font loading.
  if (pathname === '/default-bg.jpg') return true;
  if (pathname.startsWith('/fonts/')) return true;

  // Next internals/static assets.
  if (pathname.startsWith('/_next/')) return true;
  return false;
}

export function proxy(request: NextRequest) {
  const apiOnlyEnabled = process.env.OG_API_ONLY === 'true';
  if (!apiOnlyEnabled) return NextResponse.next();

  if (isAllowedWhenApiOnly(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return new NextResponse('Not Found', { status: 404 });
}

export const config = {
  matcher: '/:path*',
};
