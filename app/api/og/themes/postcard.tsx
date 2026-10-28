import { fitFontSize, Img, loadFontsourceFamily } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

async function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  const [serif, hand] = await Promise.all([
    loadFontsourceFamily('libre-caslon-text', 'Libre Caslon Text', [{ weight: 400 }, { weight: 400, style: 'italic' }]),
    loadFontsourceFamily('nanum-pen-script', 'Nanum Pen Script', [{ weight: 400 }]),
  ]);
  return [...serif, ...hand];
}

// The back of a picture postcard. Left of the divider is what the printer set:
// the caption (the headline) and the publisher's imprint. Right of it is what
// the sender added: a stamp (the cover image), a postmark (site, date, reading
// time) and a note in pen (the excerpt, signed). The accent is the pen's ink.
const CARD = '#fbfaf6';
const INK = '#1f1f1f';
const MUTED = '#77736b';
const PEN = '#23408e';
const POSTMARK = 'rgba(28, 28, 36, 0.72)';
const STAMP_RED = '#c4472d';
const SERIF = '"Libre Caslon Text", serif';
const HAND = '"Nanum Pen Script", cursive';

const DIVIDER = 640;
const STAMP_WIDTH = 200;
const STAMP_HEIGHT = 240;
const HOLE = 10;

// Five wavy cancellation lines, the machine kind that runs beside a postmark.
function cancellation(color: string): string {
  const waves = [12, 26, 40, 54, 68]
    .map(y => `<path d="M0 ${y} q15 -9 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0"/>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><g fill="none" stroke="${color}" stroke-width="2.4">${waves}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Perforations: card-coloured holes punched along each edge of the stamp.
function holes(count: number, style: React.CSSProperties) {
  return (
    <div style={{ position: 'absolute', display: 'flex', justifyContent: 'space-around', ...style }}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} style={{ display: 'flex', width: HOLE, height: HOLE, borderRadius: HOLE, background: CARD }} />
      ))}
    </div>
  );
}

function render(props: ThemeProps, _context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, tag, readingTime, imageSrc, iconSrc } = props;
  const pen = props.accent ?? PEN;
  const postmark = [site, date, readingTime].filter(Boolean);

  const titleSize = fitFontSize(title, [
    [12, 96],
    [20, 80],
    [32, 66],
    [50, 56],
    [Infinity, 48],
  ]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        fontFamily: SERIF,
        color: INK,
        background: CARD,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: DIVIDER, padding: '64px 56px 56px 64px' }}>
        {tag ? <span style={{ fontSize: 24, fontStyle: 'italic', color: MUTED }}>{tag}</span> : null}
        <div
          style={{
            display: 'block',
            textWrap: 'pretty',
            lineClamp: 4,
            marginTop: tag ? 20 : 0,
            fontSize: titleSize,
            lineHeight: 1.12,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto', fontSize: 20, color: MUTED }}>
          {iconSrc ? <Img src={iconSrc} width={28} height={28} style={{ borderRadius: 6 }} /> : null}
          <span>{`Published by ${site}`}</span>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 64, left: DIVIDER, width: 1.5, height: 630 - 128, background: 'rgba(31, 31, 31, 0.28)' }} />

      {/* Fixed width: Yoga places absolute children against their parent, so a long
          note must wrap here rather than widen the column and push the stamp away. */}
      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', width: 1200 - DIVIDER, padding: '64px 64px 56px 56px' }}>
        {/* The stamp sits slightly askew, as stamps do. */}
        <div
          style={{
            position: 'absolute',
            top: 52,
            right: 64,
            display: 'flex',
            width: STAMP_WIDTH,
            height: STAMP_HEIGHT,
            padding: 10,
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.18)',
            transform: 'rotate(2deg)',
          }}
        >
          {imageSrc ? (
            <Img src={imageSrc} width={STAMP_WIDTH - 20} height={STAMP_HEIGHT - 20} />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: STAMP_WIDTH - 20,
                height: STAMP_HEIGHT - 20,
                fontSize: 104,
                color: '#ffffff',
                background: STAMP_RED,
              }}
            >
              {Array.from(site)[0]?.toUpperCase()}
            </div>
          )}
          {holes(12, { top: -HOLE / 2, left: 0, width: STAMP_WIDTH, height: HOLE })}
          {holes(12, { top: STAMP_HEIGHT - HOLE / 2, left: 0, width: STAMP_WIDTH, height: HOLE })}
          {holes(14, { top: 0, left: -HOLE / 2, width: HOLE, height: STAMP_HEIGHT, flexDirection: 'column' })}
          {holes(14, { top: 0, left: STAMP_WIDTH - HOLE / 2, width: HOLE, height: STAMP_HEIGHT, flexDirection: 'column' })}
        </div>

        {/* The postmark clips the stamp's edge, cancelling it without covering the picture. */}
        <div style={{ position: 'absolute', top: 160, right: 236, display: 'flex', alignItems: 'center', transform: 'rotate(-8deg)' }}>
          <Img src={cancellation(POSTMARK)} width={120} height={80} style={{ marginRight: -6 }} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 150,
              height: 150,
              borderRadius: 150,
              border: `2.5px solid ${POSTMARK}`,
              fontFamily: SERIF,
              color: POSTMARK,
            }}
          >
            {postmark.map((line, index) => (
              <span key={line} style={{ display: 'block', lineClamp: 1, maxWidth: 124, fontSize: index === 1 ? 21 : 15, lineHeight: 1.45 }}>
                {line}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', fontFamily: HAND, color: pen }}>
          {excerpt ? (
            <div style={{ display: 'block', textWrap: 'pretty', lineClamp: 3, fontSize: 48, lineHeight: 1.02 }}>{excerpt}</div>
          ) : null}
          {author ? <span style={{ marginTop: excerpt ? 10 : 0, fontSize: 54 }}>{`— ${author}`}</span> : null}
        </div>
      </div>
    </div>
  );
}

export const postcardTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: SERIF,
};
