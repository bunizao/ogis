import { brightness, fitFontSize, Img, loadFontsourceFamily } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  return loadFontsourceFamily('hanken-grotesk', 'Hanken Grotesk', [
    { weight: 400 },
    { weight: 400, style: 'italic' },
    { weight: 600 },
  ]);
}

// The cover hangs framed and matted on a lit wall; the post is its wall label:
// artist (author), title in italic, date, a line of description (excerpt), and
// the collection it belongs to (site). The accent repaints the wall, and the
// label lettering flips to light on a dark wall.
const WALL = '#e7e6e2';
const FRAME = '#1c1a17';
const MAT = '#f8f7f3';
const FRAME_WIDTH = 600;
const FRAME_HEIGHT = 470;
const MOULDING = 12;
const MAT_WIDTH = 44;
const PHOTO_WIDTH = FRAME_WIDTH - (MOULDING + MAT_WIDTH) * 2;
const PHOTO_HEIGHT = FRAME_HEIGHT - (MOULDING + MAT_WIDTH) * 2;
const LEFT = 80;
const TOP = (630 - FRAME_HEIGHT) / 2;

function render(props: ThemeProps, _context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, tag, readingTime, imageSrc, fallbackImageSrc, iconSrc } = props;
  const wall = props.accent ?? WALL;
  const dark = brightness(wall) < 120;
  const ink = dark ? '#f4f3ef' : '#1a1a1a';
  const muted = dark ? 'rgba(244, 243, 239, 0.66)' : '#6b6a66';
  const notes = [tag, readingTime].filter(Boolean);

  const titleSize = fitFontSize(title, [
    [12, 64],
    [22, 52],
    [40, 42],
    [Infinity, 36],
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
      {/* Track lighting: a soft pool of light above the work. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          backgroundImage: `radial-gradient(circle at 32% -20%, rgba(255, 255, 255, ${dark ? 0.16 : 0.55}), rgba(255, 255, 255, 0) 62%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: TOP,
          left: LEFT,
          display: 'flex',
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          padding: MOULDING,
          background: FRAME,
          boxShadow: '0 28px 44px -18px rgba(0, 0, 0, 0.45), 0 3px 8px rgba(0, 0, 0, 0.18)',
        }}
      >
        <div style={{ display: 'flex', flexGrow: 1, padding: MAT_WIDTH, background: MAT, boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.18)' }}>
          <Img src={imageSrc ?? fallbackImageSrc} width={PHOTO_WIDTH} height={PHOTO_HEIGHT} />
        </div>
      </div>

      {/* The label hangs beside the work, its last line level with the frame's bottom edge. */}
      <div
        style={{
          position: 'absolute',
          left: LEFT + FRAME_WIDTH + 72,
          bottom: TOP,
          width: 1200 - (LEFT + FRAME_WIDTH + 72) - 72,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {author ? <span style={{ marginBottom: 14, fontSize: 26, fontWeight: 600 }}>{author}</span> : null}
        <div
          style={{
            display: 'block',
            textWrap: 'pretty',
            lineClamp: 4,
            fontSize: titleSize,
            fontStyle: 'italic',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </div>
        {date ? <span style={{ marginTop: 12, fontSize: 24 }}>{date}</span> : null}
        {excerpt ? (
          <div style={{ display: 'block', textWrap: 'pretty', lineClamp: 3, marginTop: 24, fontSize: 21, lineHeight: 1.45, color: muted }}>
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
