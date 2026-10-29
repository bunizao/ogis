import { fitFontSize, Img, loadFontsourceFamily } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  return loadFontsourceFamily('inter-tight', 'Inter Tight', [{ weight: 500 }, { weight: 600 }, { weight: 800 }]);
}

const PAPER = '#ffffff';
const INK = '#000000';
const GREY = '#6e6e6e';
const DEFAULT_ACCENT = '#e4002b';

// Four columns, 64px margins, 24px gutters. Two zones only: the headline hangs
// from the top margin, and everything else is gathered into three blocks that
// hang from a single rule (who/what, the excerpt, by whom and when).
const MARGIN = 64;
const GUTTER = 24;
const COLUMN = (1200 - MARGIN * 2 - GUTTER * 3) / 4;
const span = (columns: number) => COLUMN * columns + GUTTER * (columns - 1);

const small: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: COLUMN,
  fontSize: 24,
  lineHeight: 1.3,
  letterSpacing: '-0.01em',
};

function render(props: ThemeProps, _context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, tag, readingTime, imageSrc } = props;
  const accent = props.accent ?? DEFAULT_ACCENT;
  const byline = [author, date, readingTime].filter(Boolean);

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
        padding: `56px ${MARGIN}px 52px`,
        fontFamily: '"Inter Tight", sans-serif',
        color: INK,
        background: PAPER,
      }}
    >
      <div style={{ display: 'flex', flexGrow: 1, gap: GUTTER, paddingBottom: 40 }}>
        <div
          style={{
            display: 'block',
            textWrap: 'pretty',
            lineClamp: 3,
            width: imageSrc ? span(3) : span(4),
            fontSize: titleSize,
            fontWeight: 800,
            lineHeight: 0.96,
            letterSpacing: '-0.04em',
          }}
        >
          {title}
        </div>
        {/* Stretches down to the rule, whatever height the title leaves. */}
        {imageSrc ? <Img src={imageSrc} width={COLUMN} height={400} style={{ height: '100%' }} /> : null}
      </div>

      <div style={{ display: 'flex', height: 3, background: INK }} />
      <div style={{ display: 'flex', gap: GUTTER, paddingTop: 16 }}>
        <div style={{ ...small, fontWeight: 600 }}>
          <span>{site}</span>
          {tag ? <span style={{ color: accent }}>{tag}</span> : null}
        </div>
        <div style={{ ...small, width: span(2), fontWeight: 500 }}>
          {excerpt ? (
            <div style={{ display: 'block', textWrap: 'pretty', lineClamp: 3 }}>{excerpt}</div>
          ) : null}
        </div>
        <div style={{ ...small, fontWeight: 500 }}>
          {byline.map((item, index) => (
            <span key={item} style={index === 0 && author ? { fontWeight: 600 } : { color: GREY }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export const swissTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: '"Inter Tight", sans-serif',
};
