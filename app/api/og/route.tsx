import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Load Zpix pixel font (TTF format - required by @vercel/og)
async function loadZpixFont(): Promise<ArrayBuffer | null> {
  try {
    const fontUrl = 'https://cdn.jsdelivr.net/gh/SolidZORO/zpix-pixel-font@v3.1.10/dist/zpix.ttf';
    const response = await fetch(fontUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

// Sanitize text - replace unsupported characters with safe alternatives
function sanitizeText(text: string): string {
  return text
    .replace(/[⸺⸻—–-]+/g, ' — ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/…/g, '...')
    .replace(/[\u2000-\u200F\u2028-\u202F]/g, ' ')
    .trim();
}

const DNS_TIMEOUT_MS = 2000;
const DNS_CACHE_TTL_MS = 10 * 60 * 1000;

type DnsCacheEntry = { expiresAt: number; ips: string[] };
const dnsCache = new Map<string, DnsCacheEntry>();

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Get the base URL for fetching default background
  const baseUrl = new URL(request.url).origin;
  const fontPromise = loadZpixFont();

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

  // Background image (user-provided or default starry sky)
  const backgroundImageSrc = validImageUrl?.toString() ?? new URL('/default-bg.jpg', baseUrl).toString();

  // Sanitize text inputs
  const title = sanitizeText(rawTitle);
  const site = sanitizeText(rawSite);
  const excerpt = sanitizeText(rawExcerpt);

  // Truncate title for display - allow longer titles
  const displayTitle = title.length > 60 ? title.slice(0, 57) + '...' : title;

  // Truncate excerpt for display
  const displayExcerpt = excerpt.length > 80 ? excerpt.slice(0, 77) + '...' : excerpt;

  // Load fonts - Zpix pixel font (single font supports both Latin and CJK)
  const zpixFont = await fontPromise;

  // Calculate font size based on title length - larger sizes for impact
  const titleFontSize = displayTitle.length > 40 ? 56 : displayTitle.length > 25 ? 72 : 88;

  // Build fonts array - Zpix for pixel style
  const fonts: { name: string; data: ArrayBuffer; style: 'normal'; weight: 400 | 700 }[] = [];
  if (zpixFont) {
    fonts.push({ name: 'Zpix', data: zpixFont, style: 'normal', weight: 400 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          fontFamily: '"Zpix", sans-serif',
          background: '#0a0a0a',
        }}
      >
        {/* Background image - full cover (always present: user image or default starry sky) */}
        <img
          src={backgroundImageSrc}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />

        {/* Enhanced frosted glass overlay - covers lower portion */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '420px',
            display: 'flex',
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.15) 70%, transparent 100%)',
            backdropFilter: 'blur(16px)',
          }}
        />

        {/* Content container - positioned at bottom left */}
        <div
          style={{
            position: 'absolute',
            left: '64px',
            bottom: '64px',
            right: '64px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 2,
          }}
        >
          {/* Site name - top of content block */}
          <span
            style={{
              fontSize: '24px',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.9)',
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.6)',
              marginBottom: '28px',
            }}
          >
            {site}
          </span>

          {/* Title - prominent, large */}
          <h1
            style={{
              fontSize: `${titleFontSize}px`,
              fontWeight: 400,
              color: '#fff',
              lineHeight: 1.15,
              margin: 0,
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
              marginBottom: displayExcerpt ? '32px' : (author || date) ? '28px' : '0',
            }}
          >
            {displayTitle}
          </h1>

          {/* Excerpt - secondary text */}
          {displayExcerpt && (
            <p
              style={{
                fontSize: '26px',
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.75)',
                lineHeight: 1.5,
                margin: 0,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                marginBottom: (author || date) ? '28px' : '0',
              }}
            >
              {displayExcerpt}
            </p>
          )}

          {/* Meta info - author and date, subtle */}
          {(author || date) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.55)',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              }}
            >
              {author && <span>{author}</span>}
              {author && date && <span style={{ opacity: 0.6 }}>·</span>}
              {date && <span>{date}</span>}
            </div>
          )}
        </div>
      </div>
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
