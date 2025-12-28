import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Theme configurations - lighter overlays to show more of the background image
const themes: Record<string, {
  overlay: string;
  textColor: string;
  subtextColor: string;
  accentColor: string;
  tagBg: string;
}> = {
  dark: {
    overlay: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.75) 100%)',
    textColor: '#ffffff',
    subtextColor: 'rgba(255,255,255,0.85)',
    accentColor: 'rgba(255,255,255,0.7)',
    tagBg: 'rgba(255,255,255,0.2)',
  },
  light: {
    overlay: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.9) 100%)',
    textColor: '#1a1a1a',
    subtextColor: 'rgba(0,0,0,0.75)',
    accentColor: 'rgba(0,0,0,0.6)',
    tagBg: 'rgba(0,0,0,0.1)',
  },
  sunset: {
    overlay: 'linear-gradient(135deg, rgba(255,100,50,0.4) 0%, rgba(150,50,150,0.5) 50%, rgba(50,50,100,0.7) 100%)',
    textColor: '#ffffff',
    subtextColor: 'rgba(255,255,255,0.9)',
    accentColor: 'rgba(255,200,150,0.95)',
    tagBg: 'rgba(255,255,255,0.25)',
  },
  ocean: {
    overlay: 'linear-gradient(135deg, rgba(0,50,100,0.4) 0%, rgba(0,100,150,0.5) 50%, rgba(0,50,80,0.7) 100%)',
    textColor: '#ffffff',
    subtextColor: 'rgba(255,255,255,0.9)',
    accentColor: 'rgba(100,200,255,0.95)',
    tagBg: 'rgba(255,255,255,0.2)',
  },
  aurora: {
    overlay: 'linear-gradient(135deg, rgba(0,100,100,0.4) 0%, rgba(50,0,100,0.5) 50%, rgba(20,20,60,0.7) 100%)',
    textColor: '#ffffff',
    subtextColor: 'rgba(255,255,255,0.9)',
    accentColor: 'rgba(0,255,200,0.95)',
    tagBg: 'rgba(255,255,255,0.2)',
  },
  minimal: {
    overlay: 'linear-gradient(to bottom, rgba(20,20,25,0.2) 0%, rgba(20,20,25,0.5) 40%, rgba(20,20,25,0.85) 100%)',
    textColor: '#ffffff',
    subtextColor: 'rgba(255,255,255,0.8)',
    accentColor: 'rgba(255,255,255,0.6)',
    tagBg: 'rgba(255,255,255,0.15)',
  },
};

// Default background when no image provided
const defaultBackgrounds: Record<string, string> = {
  dark: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
  light: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 50%, #d1d5db 100%)',
  sunset: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #ff4757 50%, #c44569 75%, #574b90 100%)',
  ocean: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 25%, #0096c7 50%, #023e8a 75%, #03045e 100%)',
  aurora: 'linear-gradient(135deg, #00d9ff 0%, #00ff87 25%, #7b2cbf 50%, #3a0ca3 75%, #0a0a1a 100%)',
  minimal: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #0d0d0d 100%)',
};

// Load Noto Sans SC with full Unicode support (Regular weight)
// Using Google Fonts subset which is smaller and faster
async function loadNotoSansRegular(): Promise<ArrayBuffer | null> {
  try {
    // Google Fonts API - smaller subset
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
    // Replace various dashes with standard em-dash
    .replace(/[⸺⸻—–-]+/g, ' — ')
    // Replace other problematic Unicode punctuation
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/…/g, '...')
    .replace(/[\u2000-\u200F\u2028-\u202F]/g, ' ') // Various Unicode spaces
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

  // Fix truncated Unsplash URLs - Ghost's encode doesn't encode & in URLs
  // So &cs=tinysrgb becomes a separate parameter instead of part of the image URL
  // Reconstruct the full Unsplash URL from scattered parameters
  if (image.includes('images.unsplash.com') && !image.includes('&')) {
    // Unsplash URLs always have multiple parameters, if we only see the base, it was truncated
    const unsplashParams: string[] = [];
    const knownUnsplashParams = ['crop', 'cs', 'fit', 'fm', 'ixid', 'ixlib', 'q', 'w', 'h'];

    for (const param of knownUnsplashParams) {
      const value = searchParams.get(param);
      if (value) {
        unsplashParams.push(`${param}=${value}`);
      }
    }

    if (unsplashParams.length > 0) {
      // Reconstruct the URL
      const separator = image.includes('?') ? '&' : '?';
      image = image + separator + unsplashParams.join('&');
    }
  }

  // Validate image URLs - check if they look valid and are supported formats
  const isValidUrl = (url: string) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      // Must be http/https
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      // URL must not be truncated (check for common truncation patterns)
      if (url.endsWith('…') || url.endsWith('...') || url.length < 20) return false;
      return true;
    } catch {
      return false;
    }
  };

  // Check if image format is supported by @vercel/og (WebP is NOT supported)
  // Ghost uses /format/jpeg/ in path to convert images, so check for that too
  const isSupportedImageFormat = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();

    // Ghost image processing: /format/jpeg/ or /format/png/ in path means it's converted
    // Even if the original file was .webp, Ghost will serve it as jpeg/png
    if (lowerUrl.includes('/format/jpeg/') || lowerUrl.includes('/format/png/') || lowerUrl.includes('/format/jpg/')) {
      return true;
    }

    // For non-Ghost URLs, check file extension
    // WebP/AVIF are not supported by @vercel/og
    if (lowerUrl.match(/\.(webp|avif)(\?|$)/i)) return false;

    // Check for supported formats
    const supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
    const hasExtension = supportedExtensions.some(ext => lowerUrl.includes(ext));

    // For URLs without clear extensions (like Unsplash with query params), assume okay
    return hasExtension || !lowerUrl.match(/\.(webp|avif|svg|bmp|tiff?)(\?|$)/i);
  };

  const validIcon = isValidUrl(icon) && isSupportedImageFormat(icon) ? icon : '';
  const validAvatar = isValidUrl(avatar) && isSupportedImageFormat(avatar) ? avatar : '';
  const validImage = isValidUrl(image) && isSupportedImageFormat(image) ? image : '';

  // Sanitize text inputs
  const title = sanitizeText(rawTitle);
  const site = sanitizeText(rawSite);
  const excerpt = sanitizeText(rawExcerpt);

  const selectedTheme = themes[theme] || themes.dark;
  const defaultBg = defaultBackgrounds[theme] || defaultBackgrounds.dark;

  // Truncate text for display
  const displayTitle = title.length > 50 ? title.slice(0, 47) + '...' : title;
  const displayExcerpt = excerpt.length > 100 ? excerpt.slice(0, 97) + '...' : excerpt;

  // Load fonts
  const [fontRegular, fontBold] = await Promise.all([
    loadNotoSansRegular(),
    loadNotoSansBold(),
  ]);

  // Calculate font size based on title length (scaled for 1600x840)
  const titleFontSize = displayTitle.length > 35 ? 56 : displayTitle.length > 20 ? 68 : 80;

  // Build fonts array
  const fonts: { name: string; data: ArrayBuffer; style: 'normal'; weight: 400 | 700 }[] = [];
  if (fontRegular) {
    fonts.push({ name: 'Noto Sans SC', data: fontRegular, style: 'normal', weight: 400 });
  }
  if (fontBold) {
    fonts.push({ name: 'Noto Sans SC', data: fontBold, style: 'normal', weight: 700 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        {/* Background layer */}
        {validImage ? (
          <img
            src={validImage}
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

        {/* Overlay gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            background: selectedTheme.overlay,
          }}
        />

        {/* Content container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '64px 72px',
            position: 'relative',
          }}
        >
          {/* Top section: Site branding + Tag */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* Site branding */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              {validIcon ? (
                <img
                  src={validIcon}
                  width={52}
                  height={52}
                  style={{
                    borderRadius: '12px',
                    objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.2)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: selectedTheme.tagBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    fontWeight: 700,
                    color: selectedTheme.textColor,
                  }}
                >
                  {site.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 600,
                  color: selectedTheme.textColor,
                  letterSpacing: '-0.3px',
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              >
                {site}
              </span>
            </div>

            {/* Tag badge */}
            {tag && (
              <div
                style={{
                  display: 'flex',
                  padding: '12px 24px',
                  borderRadius: '28px',
                  background: selectedTheme.tagBg,
                  color: selectedTheme.subtextColor,
                  fontSize: '18px',
                  fontWeight: 500,
                  backdropFilter: 'blur(10px)',
                }}
              >
                {tag}
              </div>
            )}
          </div>

          {/* Middle section: Title and excerpt */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              flex: 1,
              justifyContent: 'center',
              paddingTop: '16px',
              paddingBottom: '16px',
            }}
          >
            <h1
              style={{
                fontSize: `${titleFontSize}px`,
                fontWeight: 700,
                color: selectedTheme.textColor,
                lineHeight: 1.2,
                margin: 0,
                letterSpacing: '-0.5px',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              {displayTitle}
            </h1>

            {displayExcerpt && (
              <p
                style={{
                  fontSize: '24px',
                  color: selectedTheme.subtextColor,
                  lineHeight: 1.6,
                  margin: 0,
                  maxWidth: '85%',
                  fontWeight: 400,
                  textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                {displayExcerpt}
              </p>
            )}
          </div>

          {/* Bottom section: Meta info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Author */}
            {author && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                {validAvatar ? (
                  <img
                    src={validAvatar}
                    width={48}
                    height={48}
                    style={{
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255,255,255,0.3)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: selectedTheme.tagBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 600,
                      color: selectedTheme.textColor,
                    }}
                  >
                    {author.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 500,
                    color: selectedTheme.textColor,
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                >
                  {author}
                </span>
              </div>
            )}

            {/* Date and reading time */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                marginLeft: 'auto',
              }}
            >
              {date && (
                <span
                  style={{
                    fontSize: '18px',
                    color: selectedTheme.accentColor,
                    fontWeight: 500,
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
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
                    fontSize: '18px',
                    color: selectedTheme.accentColor,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
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
    }
  );
}
