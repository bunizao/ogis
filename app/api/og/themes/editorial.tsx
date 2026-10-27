import { fitFontSize, Img, loadFontsourceFamily } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

async function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  const [serif, mono] = await Promise.all([
    loadFontsourceFamily('instrument-serif', 'Instrument Serif', [
      { weight: 400 },
      { weight: 400, style: 'italic' },
    ]),
    loadFontsourceFamily('geist-mono', 'Geist Mono', [{ weight: 500 }]),
  ]);
  return [...serif, ...mono];
}

const PAPER = '#f4f0e8';
const INK = '#1c1a17';
const MUTED = 'rgba(28, 26, 23, 0.6)';
const RULE = 'rgba(28, 26, 23, 0.9)';
const DEFAULT_ACCENT = '#a8322a';

const label: React.CSSProperties = {
  fontFamily: '"Geist Mono", monospace',
  fontSize: 18,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  lineHeight: 1,
};

function render(props: ThemeProps, _context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, tag, readingTime, imageSrc, iconSrc, avatarSrc } = props;
  const accent = props.accent ?? DEFAULT_ACCENT;

  const titleSize = imageSrc
    ? fitFontSize(title, [
        [14, 100],
        [28, 82],
        [48, 68],
        [Infinity, 58],
      ])
    : fitFontSize(title, [
        [20, 120],
        [36, 100],
        [56, 86],
        [80, 74],
        [Infinity, 64],
      ]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '52px 64px 48px',
        fontFamily: '"Instrument Serif", serif',
        color: INK,
        background: PAPER,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {iconSrc ? <Img src={iconSrc} width={28} height={28} style={{ borderRadius: 4 }} /> : null}
          <span style={label}>{site}</span>
        </div>
        {date ? <span style={{ ...label, color: MUTED }}>{date}</span> : null}
      </div>
      <div style={{ display: 'flex', height: 1, marginTop: 20, background: RULE }} />

      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', gap: 56 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
          {tag ? <span style={{ ...label, color: accent, marginBottom: 24 }}>{tag}</span> : null}
          <div
            style={{
              display: 'block',
              textWrap: 'pretty',
              lineClamp: 3,
              fontSize: titleSize,
              lineHeight: 1,
              letterSpacing: '-0.015em',
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
                marginTop: 24,
                maxWidth: 900,
                fontSize: 32,
                fontStyle: 'italic',
                lineHeight: 1.3,
                color: MUTED,
              }}
            >
              {excerpt}
            </div>
          ) : null}
        </div>

        {imageSrc ? (
          <Img src={imageSrc} width={392} height={360} style={{ boxShadow: '0 0 0 1px rgba(28, 26, 23, 0.1)' }} />
        ) : null}
      </div>

      <div style={{ display: 'flex', height: 1, marginBottom: 18, background: RULE }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 34 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {avatarSrc ? <Img src={avatarSrc} width={34} height={34} style={{ borderRadius: 999 }} /> : null}
          {author ? <span style={{ fontSize: 30, fontStyle: 'italic' }}>{`By ${author}`}</span> : null}
        </div>
        {readingTime ? <span style={{ ...label, color: MUTED }}>{readingTime}</span> : null}
      </div>
    </div>
  );
}

export const editorialTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: '"Instrument Serif", serif',
};
