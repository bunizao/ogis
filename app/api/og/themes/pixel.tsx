import { getPixelFontOption } from '@/app/lib/pixel-fonts';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

const fontDataCache = new Map<string, Promise<ArrayBuffer | null>>();

async function fetchFontData(url: string): Promise<ArrayBuffer | null> {
  let pending = fontDataCache.get(url);
  if (!pending) {
    pending = (async () => {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (!response.ok) return null;
        return await response.arrayBuffer();
      } catch {
        return null;
      }
    })();
    fontDataCache.set(url, pending);
  }

  const data = await pending;
  if (!data) {
    fontDataCache.delete(url);
  }
  return data;
}

async function loadFonts(context: ThemeContext): Promise<ThemeFont[]> {
  const selectedFont = getPixelFontOption(context.searchParams.get('pixelFont'));
  const fontUrl = new URL(selectedFont.filePath, context.baseUrl).toString();
  const data = await fetchFontData(fontUrl);
  if (!data) return [];
  return [{ name: selectedFont.fontName, data, style: 'normal', weight: 400 }];
}

function render(props: ThemeProps, context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, backgroundImageSrc } = props;
  const selectedFont = getPixelFontOption(context.searchParams.get('pixelFont'));

  const displayTitle = title.length > 60 ? title.slice(0, 57) + '...' : title;
  const displayExcerpt = excerpt.length > 80 ? excerpt.slice(0, 77) + '...' : excerpt;
  const titleFontSize = displayTitle.length > 40 ? 56 : displayTitle.length > 25 ? 72 : 88;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        fontFamily: `"${selectedFont.fontName}", "Noto Sans", sans-serif`,
        background: '#0a0a0a',
      }}
    >
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
  );
}

export const pixelTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: '"Zpix", sans-serif',
};
