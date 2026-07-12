import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { resolveOgBackgroundImage } from '@/app/lib/og-background-image';
import { DEFAULT_OG_API_PATH } from '@/app/lib/og-api-path';
import { resolveOgSecurityConfig } from '@/app/lib/og-security';
import { pixelTheme } from './themes/pixel';
import { modernTheme } from './themes/modern';
import type { ThemeDefinition } from './themes/types';

const themes: Record<string, ThemeDefinition> = {
  pixel: pixelTheme,
  modern: modernTheme,
};

const securityConfig = resolveOgSecurityConfig();
const primaryRouteKey = securityConfig.primaryRouteKey;
const allowLegacyPath = securityConfig.allowLegacyPath;
const allowedRouteKeys = new Set<string>([primaryRouteKey, DEFAULT_OG_API_PATH]);

const signatureSecret = securityConfig.signatureSecret;
const hasSignatureProtection = securityConfig.hasSignatureProtection;

let signingKeyPromise: Promise<CryptoKey> | null = null;

function createNotFoundResponse(): Response {
  return new Response('Not Found', { status: 404 });
}

// Sanitize text - replace unsupported characters with safe alternatives
function sanitizeText(text: string): string {
  return text
    .replace(/[⸺⸻—–-]+/g, ' — ')
    .replace(/[""“”]/g, '"')
    .replace(/[''‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/[\u2000-\u200F\u2028-\u202F]/g, ' ')
    .trim();
}

function toHex(buffer: ArrayBuffer): string {
  let hex = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function canonicalizeSearchParams(searchParams: URLSearchParams): string {
  const entries: Array<[string, string]> = [];
  searchParams.forEach((value, key) => {
    if (key === 'sig' || key === 'ogKey') return;
    entries.push([key, value]);
  });
  entries.sort((a, b) => {
    if (a[0] === b[0]) {
      if (a[1] === b[1]) return 0;
      return a[1] < b[1] ? -1 : 1;
    }
    return a[0] < b[0] ? -1 : 1;
  });
  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

function buildSigningPayload(searchParams: URLSearchParams): string {
  const canonicalQuery = canonicalizeSearchParams(searchParams);
  return canonicalQuery || '__empty__';
}

async function getSigningKey(): Promise<CryptoKey> {
  if (!signingKeyPromise) {
    const encoder = new TextEncoder();
    signingKeyPromise = crypto.subtle.importKey(
      'raw',
      encoder.encode(signatureSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
  }
  return signingKeyPromise;
}

async function signPayload(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await getSigningKey();
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toHex(signed);
}

function isExpired(searchParams: URLSearchParams): boolean {
  const exp = searchParams.get('exp');
  if (!exp) return false;
  if (!/^\d+$/.test(exp)) return true;
  const expSeconds = Number(exp);
  if (!Number.isFinite(expSeconds)) return true;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return nowSeconds > expSeconds;
}

async function hasValidSignature(requestUrl: URL): Promise<boolean> {
  if (!hasSignatureProtection) return true;
  if (isExpired(requestUrl.searchParams)) return false;

  const providedSig = (requestUrl.searchParams.get('sig') ?? '').trim();
  if (!providedSig) return false;

  const payload = buildSigningPayload(requestUrl.searchParams);
  const expectedSig = await signPayload(payload);
  return constantTimeEqual(expectedSig, providedSig);
}

function requiresSignature(routeKey: string): boolean {
  if (!hasSignatureProtection) return false;
  return routeKey !== DEFAULT_OG_API_PATH;
}

export async function handleOgGet(request: NextRequest, routeKey: string): Promise<Response> {
  if (!allowedRouteKeys.has(routeKey)) {
    return createNotFoundResponse();
  }

  const requestUrl = new URL(request.url);
  if (requiresSignature(routeKey) && !(await hasValidSignature(requestUrl))) {
    return createNotFoundResponse();
  }

  const { searchParams } = requestUrl;
  const baseUrl = requestUrl.origin;
  const themeContext = { searchParams, baseUrl };

  // Theme selection
  const themeName = searchParams.get('theme') || 'pixel';
  const themeDefinition = themes[themeName] ?? themes.pixel;
  const fontPromise = themeDefinition.loadFonts(themeContext);

  // Required parameters
  const rawTitle = searchParams.get('title') || 'Untitled';
  const rawSite = searchParams.get('site') || 'Blog';

  // Optional parameters
  const author = searchParams.get('author') || '';
  const date = searchParams.get('date') || '';
  const rawExcerpt = searchParams.get('excerpt') || '';
  const backgroundImage = await resolveOgBackgroundImage(requestUrl);

  // Sanitize text inputs
  const title = sanitizeText(rawTitle);
  const site = sanitizeText(rawSite);
  const excerpt = sanitizeText(rawExcerpt);

  console.info(
    'og.request',
    JSON.stringify({
      routeKey,
      userAgent: request.headers.get('user-agent') || '',
      theme: themeName,
      title: title.slice(0, 80),
      site: site.slice(0, 80),
      hasExcerpt: rawExcerpt.length > 0,
      hasImageParam: Boolean(backgroundImage.rawImage),
      imageHost: backgroundImage.imageHost,
      imageAccepted: backgroundImage.imageAccepted,
      urlLength: request.url.length,
    })
  );

  // Load theme fonts
  const fonts = await fontPromise;

  return new ImageResponse(
    themeDefinition.render(
      {
        title,
        site,
        excerpt,
        author,
        date,
        backgroundImageSrc: backgroundImage.backgroundImageSrc,
      },
      themeContext
    ),
    {
      width: 1200,
      height: 630,
      fonts: fonts.length > 0 ? fonts : undefined,
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
