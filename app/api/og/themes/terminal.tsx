import { brightness, fitFontSize, loadFontsourceFamily } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  return loadFontsourceFamily('geist-mono', 'Geist Mono', [{ weight: 400 }, { weight: 600 }]);
}

// The whole card is the screen: a command, its output, and a tmux-style status
// line along the bottom. Monochrome unless an accent is given.
const MARGIN = 64;
const SCREEN = '#0c0c0c';
const BAR = '#1c1c1c';
const TEXT = '#ededed';
const DIM = '#8f8f8f';
const FAINT = '#555555';

// "How we rebuilt our image pipeline" -> "how-we-rebuilt-our-image.md". Whole words only, so
// the name never ends mid-word; CJK runs count as one word.
export function fileName(title: string): string {
  const words = title.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  let slug = '';
  for (const word of words) {
    const next = slug ? `${slug}-${word}` : word;
    if (slug && next.length > 24) break;
    slug = next;
  }
  return `${slug.slice(0, 32) || 'post'}.md`;
}

// Dark or light text, whichever reads on the tag block (accent is `#rrggbb`).
function inkOn(background: string): string {
  return brightness(background) > 140 ? SCREEN : '#ffffff';
}

function render(props: ThemeProps, _context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, tag, readingTime } = props;
  const meta = [author, date, readingTime].filter(Boolean);
  const accent = props.accent ?? TEXT;

  const titleSize = fitFontSize(title, [
    [16, 88],
    [28, 68],
    [48, 56],
    [Infinity, 48],
  ]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Geist Mono", monospace',
        color: TEXT,
        background: SCREEN,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: `56px ${MARGIN}px 0` }}>
        <div style={{ display: 'flex', gap: 16, fontSize: 24, color: DIM }}>
          <span>{`~/${site}`}</span>
          <span style={{ color: FAINT }}>$</span>
          <span style={{ color: TEXT }}>{`cat ${fileName(title)}`}</span>
        </div>

        <div
          style={{
            display: 'block',
            textWrap: 'pretty',
            lineClamp: 3,
            marginTop: 48,
            fontSize: titleSize,
            fontWeight: 600,
            lineHeight: 1.14,
            letterSpacing: '-0.035em',
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
              maxWidth: 960,
              marginTop: 28,
              fontSize: 26,
              lineHeight: 1.5,
              color: DIM,
            }}
          >
            {excerpt}
          </div>
        ) : null}

        {/* The next prompt, waiting: closes the output and anchors the bottom of the screen. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 'auto', marginBottom: 36, fontSize: 24, color: DIM }}>
          <span>{`~/${site}`}</span>
          <span style={{ color: FAINT }}>$</span>
          <div style={{ display: 'flex', width: 14, height: 30, background: accent }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', height: 60, fontSize: 22, background: BAR }}>
        {tag ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              paddingLeft: MARGIN,
              paddingRight: 24,
              fontWeight: 600,
              color: inkOn(accent),
              background: accent,
            }}
          >
            {tag}
          </div>
        ) : null}
        <span style={{ paddingLeft: tag ? 24 : MARGIN, color: TEXT }}>{site}</span>
        <div style={{ display: 'flex', flexGrow: 1, justifyContent: 'flex-end', gap: 32, paddingRight: MARGIN, color: DIM }}>
          {meta.map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export const terminalTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: '"Geist Mono", monospace',
};
