import { fitFontSize, Img, loadFontsourceFamily } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  return loadFontsourceFamily('inter-tight', 'Inter Tight', [{ weight: 500 }, { weight: 600 }, { weight: 800 }]);
}

const PAPER = '#f3f2ee';
const INK = '#111111';
const GREY = '#7a7873';
const DEFAULT_ACCENT = '#e4002b';

// Three-column grid: 64px margins, 32px gutters. Every element starts on a column edge.
const MARGIN = 64;
const GUTTER = 32;
const COLUMN = (1200 - MARGIN * 2 - GUTTER * 2) / 3;
const SPAN_2 = COLUMN * 2 + GUTTER;

function render(props: ThemeProps, _context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, tag, readingTime, imageSrc } = props;
  const accent = props.accent ?? DEFAULT_ACCENT;
  const columns = [
    ['Author', author],
    ['Published', date],
    ['Reading', readingTime],
  ].filter(([, value]) => value);

  const titleSize = imageSrc
    ? fitFontSize(title, [
        [12, 96],
        [24, 80],
        [44, 64],
        [90, 52],
        [Infinity, 44],
      ])
    : fitFontSize(title, [
        [12, 144],
        [22, 112],
        [36, 92],
        [56, 76],
        [Infinity, 62],
      ]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: `48px ${MARGIN}px 52px`,
        fontFamily: '"Inter Tight", sans-serif',
        color: INK,
        background: PAPER,
      }}
    >
      <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
        <span style={{ width: COLUMN + GUTTER }}>{site}</span>
        {tag ? <span style={{ color: accent }}>{tag}</span> : null}
      </div>
      <div style={{ display: 'flex', height: 2, marginTop: 16, background: INK }} />

      <div style={{ display: 'flex', flexGrow: 1, gap: GUTTER, paddingTop: 36, paddingBottom: 36 }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: imageSrc ? SPAN_2 : 1200 - MARGIN * 2 }}>
          <div
            style={{
              display: 'block',
              textWrap: 'pretty',
              lineClamp: 3,
              fontSize: titleSize,
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: '-0.045em',
            }}
          >
            {title}
          </div>
          {excerpt ? (
            <div
              style={{
                display: 'block',
                textWrap: 'pretty',
                lineClamp: 2,
                marginTop: 28,
                maxWidth: SPAN_2,
                fontSize: 26,
                fontWeight: 500,
                lineHeight: 1.35,
                letterSpacing: '-0.01em',
                color: '#3b3a36',
              }}
            >
              {excerpt}
            </div>
          ) : null}
        </div>
        {imageSrc ? <Img src={imageSrc} width={COLUMN} height={290} /> : null}
      </div>

      {columns.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', height: 1, marginBottom: 16, background: INK }} />
          <div style={{ display: 'flex', gap: GUTTER }}>
            {columns.map(([label, value]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: COLUMN }}>
                <span style={{ fontSize: 18, fontWeight: 500, color: GREY }}>{label}</span>
                <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em' }}>{value}</span>
              </div>
            ))}
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
