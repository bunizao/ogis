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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Get the base URL for fetching default background
  const baseUrl = new URL(request.url).origin;
  const baseHost = new URL(baseUrl).hostname.toLowerCase();
  const allowedImageHosts = new Set<string>([baseHost, 'images.unsplash.com']);
  const extraAllowedHosts = (process.env.OG_ALLOWED_IMAGE_HOSTS ?? '')
    .split(',')
    .map(host => host.trim().toLowerCase())
    .filter(Boolean);
  for (const host of extraAllowedHosts) {
    if (host.includes('://')) {
      try {
        allowedImageHosts.add(new URL(host).hostname.toLowerCase());
      } catch {
        continue;
      }
    } else {
      allowedImageHosts.add(host);
    }
  }

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

  // Validate and restrict image URLs to known hosts
  const parseAllowedImageUrl = (url: string) => {
    if (!url) return null;
    if (url.endsWith('…') || url.endsWith('...') || url.length < 20) return null;
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;
      if (!allowedImageHosts.has(parsed.hostname.toLowerCase())) return null;
      return parsed;
    } catch {
      return null;
    }
  };

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

  const allowedImageUrl = parseAllowedImageUrl(image);
  const validImage =
    allowedImageUrl && isSupportedImageFormat(allowedImageUrl.toString()) ? allowedImageUrl.toString() : '';

  // Helper function to fetch image and convert to base64
  async function fetchImageAsBase64(url: string): Promise<string> {
    const parsedUrl = parseAllowedImageUrl(url);
    if (!parsedUrl) return '';
    const safeUrl = parsedUrl.toString();
    if (!isSupportedImageFormat(safeUrl)) return '';
    try {
      const response = await fetch(safeUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OGImageBot/1.0)' },
      });
      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return `data:${contentType};base64,${base64}`;
      }
    } catch (e) {
      console.error('Failed to fetch image:', url, e);
    }
    return '';
  }

  // Pre-fetch background image (user-provided or default starry sky)
  const imageToFetch = validImage || `${baseUrl}/default-bg.jpg`;
  const backgroundImageSrc = await fetchImageAsBase64(imageToFetch);

  // Sanitize text inputs
  const title = sanitizeText(rawTitle);
  const site = sanitizeText(rawSite);
  const excerpt = sanitizeText(rawExcerpt);

  // Truncate title for display - allow longer titles
  const displayTitle = title.length > 60 ? title.slice(0, 57) + '...' : title;

  // Truncate excerpt for display
  const displayExcerpt = excerpt.length > 80 ? excerpt.slice(0, 77) + '...' : excerpt;

  // Load fonts - Zpix pixel font (single font supports both Latin and CJK)
  const zpixFont = await loadZpixFont();

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
