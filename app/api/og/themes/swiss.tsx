import { fitFontSize, Img, loadFontsourceFamily } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  return loadFontsourceFamily('inter-tight', 'Inter Tight', [{ weight: 500 }, { weight: 600 }, { weight: 800 }]);
}

const PAPER = '#ffffff';
const INK = '#000000';
const GREY = '#6e6e6e';
const DEFAULT_ACCENT = '#e4002b';

// Four columns, 64px margins, 24px gutters. Every text block starts on one of
// the four column lines, and the rules mark the only three rows.
const MARGIN = 64;
const GUTTER = 24;
const COLUMN = (1200 - MARGIN * 2 - GUTTER * 3) / 4;
const span = (columns: number) => COLUMN * columns + GUTTER * (columns - 1);

function render(props: ThemeProps, _context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, tag, readingTime, imageSrc } = props;
  const accent = props.accent ?? DEFAULT_ACCENT;

  // The top row fills columns left to right, so a missing field never leaves a hole.
  const header = [
    { text: site, color: INK, weight: 600 },
    { text: tag, color: accent, weight: 600 },
    { text: date, color: INK, weight: 500 },
    { text: readingTime, color: INK, weight: 500 },
  ].filter(cell => cell.text);

  const titleSize = imageSrc
    ? fitFontSize(title, [
        [10, 128],
        [16, 104],
        [28, 84],
        [48, 68],
        [Infinity, 56],
      ])
    : fitFontSize(title, [
        [12, 156],
        [20, 128],
        [32, 100],
        [52, 80],
        [Infinity, 64],
      ]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: `52px ${MARGIN}px 56px`,
        fontFamily: '"Inter Tight", sans-serif',
        color: INK,
        background: PAPER,
      }}
    >
      <div style={{ display: 'flex', gap: GUTTER, fontSize: 24, letterSpacing: '-0.01em' }}>
        {header.map(cell => (
          <span key={cell.text} style={{ width: COLUMN, color: cell.color, fontWeight: cell.weight }}>
            {cell.text}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', height: 4, marginTop: 18, background: INK }} />

      <div style={{ display: 'flex', flexGrow: 1, gap: GUTTER, paddingTop: 28, paddingBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            width: imageSrc ? span(3) : span(4),
          }}
        >
          <div
            style={{
              display: 'block',
              textWrap: 'pretty',
              lineClamp: 3,
              fontSize: titleSize,
              fontWeight: 800,
              lineHeight: 0.96,
              letterSpacing: '-0.035em',
            }}
          >
            {title}
          </div>
        </div>
        {/* Stretches to whatever height the rows above and below leave free. */}
        {imageSrc ? <Img src={imageSrc} width={COLUMN} height={400} style={{ height: '100%' }} /> : null}
      </div>

      {author || excerpt ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', height: 1, background: INK }} />
          <div style={{ display: 'flex', gap: GUTTER, paddingTop: 16, fontSize: 24, letterSpacing: '-0.01em' }}>
            <span style={{ width: COLUMN, fontWeight: 600 }}>{author}</span>
            {excerpt ? (
              <div
                style={{
                  display: 'block',
                  textWrap: 'pretty',
                  lineClamp: 2,
                  width: span(3),
                  fontWeight: 500,
                  lineHeight: 1.3,
                  color: GREY,
                }}
              >
                {excerpt}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export const swissTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: '"Inter Tight", sans-serif',
};
