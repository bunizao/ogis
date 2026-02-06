import type { ThemeProps, ThemeFont, ThemeDefinition } from './types';

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

async function loadFonts(): Promise<ThemeFont[]> {
  const [regular, bold] = await Promise.all([
    loadFont('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf', 400),
    loadFont('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf', 700),
  ]);
  const fonts: ThemeFont[] = [];
  if (regular) fonts.push(regular);
  if (bold) fonts.push(bold);
  return fonts;
}

function render(props: ThemeProps): React.ReactElement {
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
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        fontFamily: '"Inter", sans-serif',
        background: '#0a0a0a',
      }}
    >
      {/* Full-bleed background */}
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

      {/* Dim overlay for contrast */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.25)',
        }}
      />

      {/* Floating glassmorphism card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '920px',
          padding: '56px 64px',
          marginTop: '40px',
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          zIndex: 2,
        }}
      >
        {/* Site name */}
        <span
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.55)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '20px',
          }}
        >
          {site}
        </span>

        {/* Title */}
        <h1
          style={{
            fontSize: `${titleFontSize}px`,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.15,
            margin: 0,
            marginBottom: displayExcerpt ? '24px' : (author || date) ? '24px' : '0',
          }}
        >
          {displayTitle}
        </h1>

        {/* Excerpt */}
        {displayExcerpt && (
          <p
            style={{
              fontSize: '20px',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.6,
              margin: 0,
              marginBottom: (author || date) ? '28px' : '0',
            }}
          >
            {displayExcerpt}
          </p>
        )}

        {/* Meta row */}
        {(author || date) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.4)',
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
