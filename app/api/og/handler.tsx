import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { DEFAULT_OG_API_PATH } from '@/app/lib/og-api-path';
import { resolveOgSecurityConfig } from '@/app/lib/og-security';
import { pixelTheme } from './themes/pixel';
import { modernTheme } from './themes/modern';
import type { ThemeDefinition } from './themes/types';

const themes: Record<string, ThemeDefinition> = {
  pixel: pixelTheme,
  modern: modernTheme,
};

const DNS_TIMEOUT_MS = 2000;
const DNS_CACHE_TTL_MS = 10 * 60 * 1000;

const securityConfig = resolveOgSecurityConfig();
const primaryRouteKey = securityConfig.primaryRouteKey;
const allowLegacyPath = securityConfig.allowLegacyPath;
const allowedRouteKeys = new Set<string>([primaryRouteKey]);
if (allowLegacyPath) {
  allowedRouteKeys.add(DEFAULT_OG_API_PATH);
}

const signatureSecret = securityConfig.signatureSecret;
const hasSignatureProtection = securityConfig.hasSignatureProtection;

let signingKeyPromise: Promise<CryptoKey> | null = null;

type DnsCacheEntry = { expiresAt: number; ips: string[] };
const dnsCache = new Map<string, DnsCacheEntry>();

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

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
}

function parseIpv4(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const nums: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    if (value < 0 || value > 255) return null;
    nums.push(value);
  }
  return nums;
}

function isPublicIpv4(ip: string): boolean {
  const parts = parseIpv4(ip);
  if (!parts) return false;
  const [a, b, c] = parts;
  if (a === 0) return false;
  if (a === 10) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 192 && b === 88 && c === 99) return false;
  if (a === 192 && b === 168) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a >= 224) return false;
  return true;
}

function ipv4ToHextets(ip: string): number[] | null {
  const parts = parseIpv4(ip);
  if (!parts) return null;
  return [(parts[0] << 8) | parts[1], (parts[2] << 8) | parts[3]];
}

function parseIpv6(ip: string): number[] | null {
  const normalized = ip.toLowerCase();
  if (normalized.includes('%')) return null;
  const pieces = normalized.split('::');
  if (pieces.length > 2) return null;
  const left = pieces[0] ? pieces[0].split(':') : [];
  const right = pieces.length === 2 && pieces[1] ? pieces[1].split(':') : [];

  const collect = (parts: string[]) => {
    const hextets: number[] = [];
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (!part) return null;
      if (part.includes('.')) {
        if (i !== parts.length - 1) return null;
        const v4 = ipv4ToHextets(part);
        if (!v4) return null;
        hextets.push(...v4);
      } else {
        if (!/^[0-9a-f]{1,4}$/.test(part)) return null;
        hextets.push(parseInt(part, 16));
      }
    }
    return hextets;
  };

  const leftHextets = collect(left);
  if (!leftHextets) return null;
  const rightHextets = collect(right);
  if (!rightHextets) return null;

  const total = leftHextets.length + rightHextets.length;
  if (pieces.length === 1) {
    if (total !== 8) return null;
    return leftHextets;
  }
  if (total > 8) return null;
  return [...leftHextets, ...new Array(8 - total).fill(0), ...rightHextets];
}

function isPublicIpv6(ip: string): boolean {
  const parts = parseIpv6(ip);
  if (!parts) return false;
  const [h0, h1, h2, h3, h4, h5, h6, h7] = parts;
  if (parts.every(part => part === 0)) return false;
  if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0 && h6 === 0 && h7 === 1) {
    return false;
  }
  if ((h0 & 0xfe00) === 0xfc00) return false;
  if ((h0 & 0xffc0) === 0xfe80) return false;
  if ((h0 & 0xff00) === 0xff00) return false;
  if (h0 === 0x2001 && h1 === 0x0db8) return false;
  if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0xffff) {
    const v4 = `${h6 >> 8}.${h6 & 0xff}.${h7 >> 8}.${h7 & 0xff}`;
    return isPublicIpv4(v4);
  }
  return true;
}

function isPublicIp(ip: string): boolean {
  return isPublicIpv4(ip) || isPublicIpv6(ip);
}

function isBlockedHostname(hostname: string): boolean {
  if (!hostname) return true;
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) return true;
  return false;
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

async function fetchDnsRecords(hostname: string, recordType: 'A' | 'AAAA'): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DNS_TIMEOUT_MS);
  try {
    const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=${recordType}`, {
      headers: { accept: 'application/dns-json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { Status?: number; Answer?: { data?: string }[] };
    if (data.Status !== 0 || !Array.isArray(data.Answer)) return [];
    const entries = data.Answer.map(answer => answer.data).filter((value): value is string => typeof value === 'string');
    if (recordType === 'A') {
      return entries.filter(entry => parseIpv4(entry));
    }
    return entries.filter(entry => parseIpv6(entry));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveHostname(hostname: string): Promise<string[]> {
  const now = Date.now();
  const cached = dnsCache.get(hostname);
  if (cached && cached.expiresAt > now) return cached.ips;
  if (cached) dnsCache.delete(hostname);
  const [ipv4Records, ipv6Records] = await Promise.all([
    fetchDnsRecords(hostname, 'A'),
    fetchDnsRecords(hostname, 'AAAA'),
  ]);
  const ips = [...ipv4Records, ...ipv6Records];
  if (ips.length > 0) {
    dnsCache.set(hostname, { expiresAt: now + DNS_CACHE_TTL_MS, ips });
  }
  return ips;
}

async function parsePublicImageUrl(url: string): Promise<URL | null> {
  if (!url) return null;
  if (url.endsWith('…') || url.endsWith('...') || url.length < 20) return null;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (parsed.username || parsed.password) return null;
    if (parsed.port && !['80', '443'].includes(parsed.port)) return null;
    const hostname = normalizeHostname(parsed.hostname);
    if (isBlockedHostname(hostname)) return null;
    if (parseIpv4(hostname)) return isPublicIpv4(hostname) ? parsed : null;
    if (parseIpv6(hostname)) return isPublicIpv6(hostname) ? parsed : null;
    const ips = await resolveHostname(hostname);
    if (!ips.length || !ips.every(isPublicIp)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function handleOgGet(request: NextRequest, routeKey: string): Promise<Response> {
  if (!allowedRouteKeys.has(routeKey)) {
    return createNotFoundResponse();
  }

  const requestUrl = new URL(request.url);
  if (!(await hasValidSignature(requestUrl))) {
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
  let image = searchParams.get('image') || '';

  const isUnsplashImage = (url: string) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.hostname === 'images.unsplash.com';
    } catch {
      return false;
    }
  };

  // Fix truncated Unsplash URLs
  if (isUnsplashImage(image)) {
    const unsplashParams: string[] = [];
    const knownUnsplashParams = ['crop', 'cs', 'fit', 'fm', 'ixid', 'ixlib', 'q', 'w', 'h'];
    for (const param of knownUnsplashParams) {
      const value = searchParams.get(param);
      if (value) {
        unsplashParams.push(`${param}=${value}`);
      }
    }
    if (unsplashParams.length > 0) {
      image = image + '&' + unsplashParams.join('&');
    }
  }

  // Check if image format is supported by @vercel/og
  const isSupportedImageFormat = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('/format/jpeg/') || lowerUrl.includes('/format/png/') || lowerUrl.includes('/format/jpg/')) {
      return true;
    }
    if (lowerUrl.match(/\.(webp|avif)(\?|$)/i)) return false;
    const supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
    const hasExtension = supportedExtensions.some(ext => lowerUrl.includes(ext));
    return hasExtension || !lowerUrl.match(/\.(webp|avif|svg|bmp|tiff?)(\?|$)/i);
  };

  const allowedImageUrl = await parsePublicImageUrl(image);
  const validImageUrl =
    allowedImageUrl && isSupportedImageFormat(allowedImageUrl.toString()) ? allowedImageUrl : null;

  const backgroundImageSrc = validImageUrl?.toString() ?? new URL('/default-bg.jpg', baseUrl).toString();

  // Sanitize text inputs
  const title = sanitizeText(rawTitle);
  const site = sanitizeText(rawSite);
  const excerpt = sanitizeText(rawExcerpt);

  // Load theme fonts
  const fonts = await fontPromise;

  return new ImageResponse(
    themeDefinition.render({ title, site, excerpt, author, date, backgroundImageSrc }, themeContext),
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
