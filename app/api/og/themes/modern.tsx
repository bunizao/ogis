import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

async function loadFont(url: string, weight: 400 | 700): Promise<ThemeFont | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) return null;
    const data = await response.arrayBuffer();
    return { name: 'Inter', data, style: 'normal', weight };
  } catch {
    return null;
  }
}

async function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  const [regular, bold] = await Promise.all([
    loadFont('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf', 400),
    loadFont('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf', 700),
  ]);
  const fonts: ThemeFont[] = [];
  if (regular) fonts.push(regular);
  if (bold) fonts.push(bold);
  return fonts;
}

// Card geometry
const CARD_W = 920;
const CARD_H = 380;
const CARD_R = 28;
const CARD_PX = 64;
const CARD_PY = 56;
const CARD_LEFT = (1200 - CARD_W) / 2;
const CARD_TOP = (630 - CARD_H) / 2 + 40;

function render(props: ThemeProps, _context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, backgroundImageSrc } = props;

  const displayTitle = title.length > 60 ? title.slice(0, 57) + '...' : title;
  const displayExcerpt = excerpt.length > 80 ? excerpt.slice(0, 77) + '...' : excerpt;
  const titleFontSize = displayTitle.length > 40 ? 52 : displayTitle.length > 25 ? 64 : 76;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        fontFamily: '"Inter", sans-serif',
        background: '#0a0a0a',
      }}
    >
      {/* Sharp background */}
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

      {/* ── Liquid Glass Card ── */}
      <div
        style={{
          position: 'absolute',
          left: `${CARD_LEFT}px`,
          top: `${CARD_TOP}px`,
          width: `${CARD_W}px`,
          height: `${CARD_H}px`,
          borderRadius: `${CARD_R}px`,
          overflow: 'hidden',
          display: 'flex',
          boxShadow: '0 16px 64px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Layer 1: Blurred background */}
        <img
          src={backgroundImageSrc}
          style={{
            position: 'absolute',
            top: `-${CARD_TOP}px`,
            left: `-${CARD_LEFT}px`,
            width: '1200px',
            height: '630px',
            objectFit: 'cover',
            objectPosition: 'center',
            filter: 'blur(60px) saturate(1.8) brightness(1.15)',
          }}
        />

        {/* Layer 2: Glass material — visible blue-violet tint, dark-to-light gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            background: 'linear-gradient(160deg, rgba(140, 160, 255, 0.15) 0%, rgba(100, 120, 200, 0.06) 40%, rgba(60, 70, 120, 0.1) 100%)',
          }}
        />

        {/* Layer 3: Specular arc — curved light band across upper portion */}
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            left: '-10%',
            width: '120%',
            height: '100%',
            display: 'flex',
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.06) 40%, transparent 70%)',
          }}
        />

        {/* Layer 4: Top rim highlight — crisp 1px light */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '5%',
            width: '90%',
            height: '1px',
            display: 'flex',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.6), transparent)',
          }}
        />

        {/* Layer 5: Bottom darkening for depth */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '45%',
            display: 'flex',
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.12), transparent)',
          }}
        />
      </div>

      {/* Card text content */}
      <div
        style={{
          position: 'absolute',
          left: `${CARD_LEFT}px`,
          top: `${CARD_TOP}px`,
          width: `${CARD_W}px`,
          display: 'flex',
          flexDirection: 'column',
          padding: `${CARD_PY}px ${CARD_PX}px`,
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.9)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '20px',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
          }}
        >
          {site}
        </span>

        <h1
          style={{
            fontSize: `${titleFontSize}px`,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.15,
            margin: 0,
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            marginBottom: displayExcerpt ? '24px' : (author || date) ? '24px' : '0',
          }}
        >
          {displayTitle}
        </h1>

        {displayExcerpt && (
          <p
            style={{
              fontSize: '20px',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.88)',
              lineHeight: 1.6,
              margin: 0,
              textShadow: '0 1px 6px rgba(0, 0, 0, 0.4)',
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
              gap: '12px',
              fontSize: '14px',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.7)',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
            }}
          >
            {author && <span>{author}</span>}
            {author && date && <span style={{ opacity: 0.5 }}>·</span>}
            {date && <span>{date}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export const modernTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: '"Inter", sans-serif',
};
