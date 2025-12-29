import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Load Noto Sans SC with full Unicode support (Regular weight)
async function loadNotoSansRegular(): Promise<ArrayBuffer | null> {
  try {
    const fontUrl = 'https://fonts.gstatic.com/s/notosanssc/v37/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.woff2';
    const response = await fetch(fontUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

// Load Noto Sans SC Bold
async function loadNotoSansBold(): Promise<ArrayBuffer | null> {
  try {
    const fontUrl = 'https://fonts.gstatic.com/s/notosanssc/v37/k3kXo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_EnYxNbPzS5HE.woff2';
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

  // Required parameters
  const rawTitle = searchParams.get('title') || 'Untitled';
  const rawSite = searchParams.get('site') || 'Blog';

  // Optional parameters
  const rawExcerpt = searchParams.get('excerpt') || '';
  const author = searchParams.get('author') || '';
  const tag = searchParams.get('tag') || '';
  const date = searchParams.get('date') || '';
  const reading = searchParams.get('reading') || '';
  const theme = searchParams.get('theme') || 'dark';
  let image = searchParams.get('image') || '';
  const icon = searchParams.get('icon') || '';
  const avatar = searchParams.get('avatar') || '';

  // Fix truncated Unsplash URLs
  if (image.includes('images.unsplash.com')) {
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

  // Validate image URLs
  const isValidUrl = (url: string) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      if (url.endsWith('…') || url.endsWith('...') || url.length < 20) return false;
      return true;
    } catch {
      return false;
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

  const validIcon = isValidUrl(icon) && isSupportedImageFormat(icon) ? icon : '';
  const validAvatar = isValidUrl(avatar) && isSupportedImageFormat(avatar) ? avatar : '';
  const validImage = isValidUrl(image) && isSupportedImageFormat(image) ? image : '';

  // Helper function to fetch image and convert to base64
  async function fetchImageAsBase64(url: string): Promise<string> {
    if (!url) return '';
    try {
      const response = await fetch(url, {
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

  // Pre-fetch all images in parallel
  const [backgroundImageSrc, iconSrc, avatarSrc] = await Promise.all([
    fetchImageAsBase64(validImage),
    fetchImageAsBase64(validIcon),
    fetchImageAsBase64(validAvatar),
  ]);

  // Sanitize text inputs
  const title = sanitizeText(rawTitle);
  const site = sanitizeText(rawSite);
  const excerpt = sanitizeText(rawExcerpt);

  // Truncate text for display
  const displayTitle = title.length > 50 ? title.slice(0, 47) + '...' : title;
  const displayExcerpt = excerpt.length > 80 ? excerpt.slice(0, 77) + '...' : excerpt;

  // Load fonts
  const [fontRegular, fontBold] = await Promise.all([
    loadNotoSansRegular(),
    loadNotoSansBold(),
  ]);

  // Calculate font size based on title length (larger for better readability)
  const titleFontSize = displayTitle.length > 35 ? 64 : displayTitle.length > 20 ? 76 : 88;

  // Build fonts array
  const fonts: { name: string; data: ArrayBuffer; style: 'normal'; weight: 400 | 700 }[] = [];
  if (fontRegular) {
    fonts.push({ name: 'Noto Sans SC', data: fontRegular, style: 'normal', weight: 400 });
  }
  if (fontBold) {
    fonts.push({ name: 'Noto Sans SC', data: fontBold, style: 'normal', weight: 700 });
  }

  // Default gradient background when no image
  const defaultBg = theme === 'light'
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
    : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          fontFamily: '"Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background: '#000',
        }}
      >
        {/* Background image - full cover */}
        {backgroundImageSrc ? (
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
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              background: defaultBg,
            }}
          />
        )}

        {/* Subtle gradient overlay for better text readability */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)',
          }}
        />

        {/* Top left: Site branding with glass effect */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '48px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 10,
          }}
        >
          {/* Icon with glass background */}
          {iconSrc ? (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src={iconSrc}
                width={56}
                height={56}
                style={{
                  borderRadius: '12px',
                  objectFit: 'cover',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 700,
                color: '#1a1a2e',
              }}
            >
              {site.charAt(0).toUpperCase()}
            </div>
          )}
          <span
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#fff',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            }}
          >
            {site}
          </span>
        </div>

        {/* Top right: Tag chip */}
        {tag && (
          <div
            style={{
              position: 'absolute',
              top: '48px',
              right: '48px',
              display: 'flex',
              padding: '12px 24px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.15)',
              boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.4)',
              color: '#fff',
              fontSize: '22px',
              fontWeight: 500,
              zIndex: 10,
            }}
          >
            {tag}
          </div>
        )}

        {/* Bottom: Liquid glass panel with content */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(0, 0, 0, 0.25)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            zIndex: 10,
          }}
        >
          {/* Main content area */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '40px 48px 32px',
              gap: '16px',
            }}
          >
            {/* Title */}
            <h1
              style={{
                fontSize: `${titleFontSize}px`,
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              {displayTitle}
            </h1>

            {/* Excerpt */}
            {displayExcerpt && (
              <p
                style={{
                  fontSize: '28px',
                  color: 'rgba(255, 255, 255, 0.85)',
                  lineHeight: 1.5,
                  margin: 0,
                  fontWeight: 400,
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
                }}
              >
                {displayExcerpt}
              </p>
            )}
          </div>

          {/* Meta bar - separated by subtle line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 48px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Author */}
            {author ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    width={48}
                    height={48}
                    style={{
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#fff',
                    }}
                  >
                    {author.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 500,
                    color: '#fff',
                  }}
                >
                  {author}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex' }} />
            )}

            {/* Date and reading time */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
              }}
            >
              {date && (
                <span
                  style={{
                    fontSize: '22px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: 400,
                  }}
                >
                  {date}
                </span>
              )}
              {reading && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '22px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: 400,
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.8)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{reading}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1600,
      height: 840,
      fonts: fonts.length > 0 ? fonts : undefined,
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
