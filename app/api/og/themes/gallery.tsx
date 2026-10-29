import { brightness, fitFontSize, Img, loadFontsourceFamily } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  return loadFontsourceFamily('hanken-grotesk', 'Hanken Grotesk', [
    { weight: 400 },
    { weight: 400, style: 'italic' },
    { weight: 600 },
  ]);
}

// The cover printed edge to edge on the gallery wall, with no frame, and the
// post as its wall label: artist (author), title in italic, date, a line of
// description (excerpt) and the collection it belongs to (site). The accent
// repaints the wall, and the lettering flips to light on a dark wall.
const WALL = '#e7e6e2';
const PRINT_WIDTH = 640;
const LABEL_LEFT = PRINT_WIDTH + 64;
const LABEL_WIDTH = 1200 - LABEL_LEFT - 64;

function render(props: ThemeProps, _context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, tag, readingTime, imageSrc, fallbackImageSrc, iconSrc } = props;
  const wall = props.accent ?? WALL;
  const dark = brightness(wall) < 120;
  const ink = dark ? '#f4f3ef' : '#1a1a1a';
  const muted = dark ? 'rgba(244, 243, 239, 0.66)' : '#6b6a66';
  const notes = [tag, readingTime].filter(Boolean);

  const titleSize = fitFontSize(title, [
    [10, 80],
    [16, 68],
    [30, 54],
    [48, 44],
    [Infinity, 38],
  ]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        fontFamily: '"Hanken Grotesk", sans-serif',
        color: ink,
        background: wall,
      }}
    >
      {/* Track lighting: a soft pool of light on the wall above the label. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: PRINT_WIDTH,
          width: 1200 - PRINT_WIDTH,
          height: 630,
          backgroundImage: `radial-gradient(circle at 50% -30%, rgba(255, 255, 255, ${dark ? 0.14 : 0.6}), rgba(255, 255, 255, 0) 70%)`,
        }}
      />

      <Img src={imageSrc ?? fallbackImageSrc} width={PRINT_WIDTH} height={630} />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: LABEL_LEFT,
          width: LABEL_WIDTH,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {author ? <span style={{ marginBottom: 16, fontSize: 26, fontWeight: 600 }}>{author}</span> : null}
        <div
          style={{
            display: 'block',
            textWrap: 'pretty',
            lineClamp: 4,
            fontSize: titleSize,
            fontStyle: 'italic',
            lineHeight: 1.06,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </div>
        {date ? <span style={{ marginTop: 14, fontSize: 24 }}>{date}</span> : null}
        {excerpt ? (
          <div style={{ display: 'block', textWrap: 'pretty', lineClamp: 3, marginTop: 28, fontSize: 21, lineHeight: 1.45, color: muted }}>
            {excerpt}
          </div>
        ) : null}
        {notes.length ? (
          <div style={{ display: 'flex', gap: 18, marginTop: 24, fontSize: 19, color: muted }}>
            {notes.map(note => (
              <span key={note}>{note}</span>
            ))}
          </div>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, fontSize: 19, color: muted }}>
          {iconSrc ? <Img src={iconSrc} width={24} height={24} style={{ borderRadius: 5 }} /> : null}
          <span>{`Collection of ${site}`}</span>
        </div>
      </div>
    </div>
  );
}

export const galleryTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: '"Hanken Grotesk", sans-serif',
};
