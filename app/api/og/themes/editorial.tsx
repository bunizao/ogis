import { fitFontSize, Img, loadFontsourceFamily } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

async function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  const [serif, sans] = await Promise.all([
    loadFontsourceFamily('instrument-serif', 'Instrument Serif', [
      { weight: 400 },
      { weight: 400, style: 'italic' },
    ]),
    loadFontsourceFamily('instrument-sans', 'Instrument Sans', [{ weight: 400 }, { weight: 500 }]),
  ]);
  return [...serif, ...sans];
}

// Set like a magazine feature opener: the serif carries the story (headline and
// italic standfirst), a quiet sans carries the furniture (folio and byline).
// With a cover image the card becomes a spread: text page left, photo page right.
const PAPER = '#ffffff';
const INK = '#141414';
const MUTED = '#6f6f6f';
const SERIF = '"Instrument Serif", serif';
const SANS = '"Instrument Sans", sans-serif';
const PAGE = 600;

function render(props: ThemeProps, _context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, tag, readingTime, imageSrc, iconSrc, avatarSrc } = props;
  const spread = Boolean(imageSrc);
  const details = [date, readingTime].filter(Boolean);

  const titleSize = spread
    ? fitFontSize(title, [
        [12, 92],
        [24, 76],
        [44, 62],
        [Infinity, 52],
      ])
    : fitFontSize(title, [
        [14, 152],
        [28, 112],
        [48, 92],
        [80, 76],
        [Infinity, 66],
      ]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        fontFamily: SERIF,
        color: INK,
        background: PAPER,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: spread ? PAGE : 1200,
          height: '100%',
          padding: spread ? '48px 56px 56px' : '48px 64px 56px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: SANS, fontSize: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {iconSrc ? <Img src={iconSrc} width={28} height={28} style={{ borderRadius: 6 }} /> : null}
            <span style={{ fontWeight: 500 }}>{site}</span>
          </div>
          {tag ? <span style={{ color: props.accent ?? MUTED }}>{tag}</span> : null}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'block',
              textWrap: 'pretty',
              lineClamp: spread ? 4 : 3,
              maxWidth: spread ? 488 : 1000,
              fontSize: titleSize,
              lineHeight: 1,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </div>
          {excerpt ? (
            <div
              style={{
                display: 'block',
                textWrap: 'pretty',
                lineClamp: spread ? 3 : 2,
                maxWidth: spread ? 460 : 860,
                marginTop: 28,
                fontSize: spread ? 30 : 34,
                fontStyle: 'italic',
                lineHeight: 1.28,
                color: MUTED,
              }}
            >
              {excerpt}
            </div>
          ) : null}
          {author || details.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 36, fontFamily: SANS, fontSize: 22 }}>
              {author ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {avatarSrc ? <Img src={avatarSrc} width={36} height={36} style={{ borderRadius: 999 }} /> : null}
                  <span style={{ fontWeight: 500 }}>{`By ${author}`}</span>
                </div>
              ) : null}
              {details.map(item => (
                <span key={item} style={{ color: MUTED }}>
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {imageSrc ? <Img src={imageSrc} width={PAGE} height={630} /> : null}
    </div>
  );
}

export const editorialTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: '"Instrument Serif", serif',
};
