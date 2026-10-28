import { brightness, fitFontSize, Img, loadFontsourceFamily } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  return loadFontsourceFamily('b612', 'B612', [{ weight: 400 }, { weight: 700 }]);
}

// One sheet from a drawing set: a zone-marked border, the headline as the
// drawing, its reading time as a dimension line, and the metadata where an
// engineer looks for it, in the title block. A cover image becomes a circular
// detail callout. The accent sets the sheet; the ink flips dark on light sheets.
const SHEET = '#1d4f91';
const OUTER = 20;
const INNER = 44;
const AREA_WIDTH = 1200 - INNER * 2;
const AREA_HEIGHT = 630 - INNER * 2;
const COLUMNS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const ROWS = ['A', 'B', 'C', 'D'];
const DETAIL = 280;

function render(props: ThemeProps, _context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, tag, readingTime, imageSrc, iconSrc } = props;
  const details = [
    ['Drawn', author],
    ['Date', date],
    ['Type', tag],
  ].filter(([, value]) => value);
  const sheet = props.accent ?? SHEET;
  const light = brightness(sheet) > 150;
  const ink = light ? '#0e2a4f' : '#ffffff';
  const tint = (alpha: number) => (light ? `rgba(14, 42, 79, ${alpha})` : `rgba(255, 255, 255, ${alpha})`);

  const titleSize = imageSrc
    ? fitFontSize(title, [
        [12, 88],
        [22, 70],
        [40, 56],
        [Infinity, 48],
      ])
    : fitFontSize(title, [
        [14, 108],
        [26, 84],
        [44, 68],
        [Infinity, 56],
      ]);

  const gridLines = (step: number, alpha: number, direction: string): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: AREA_WIDTH,
    height: AREA_HEIGHT,
    backgroundImage: `linear-gradient(${direction}, ${tint(alpha)} 1px, transparent 1px)`,
    backgroundSize: `${step}px ${step}px`,
  });

  const zoneStrip = (labels: string[], style: React.CSSProperties) => (
    <div style={{ position: 'absolute', display: 'flex', fontSize: 13, color: tint(0.7), ...style }}>
      {labels.map((label, index) => (
        <div
          key={label}
          style={{
            display: 'flex',
            flexGrow: 1,
            flexBasis: 0,
            alignItems: 'center',
            justifyContent: 'center',
            ...(index && style.flexDirection === 'column'
              ? { borderTop: `1px solid ${tint(0.4)}` }
              : index
                ? { borderLeft: `1px solid ${tint(0.4)}` }
                : {}),
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );

  const cell = (label: string, value: string, style?: React.CSSProperties) => (
    <div key={label} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, flexBasis: 0, gap: 4, padding: '10px 14px', ...style }}>
      <span style={{ fontSize: 13, color: tint(0.65) }}>{label}</span>
      <span style={{ display: 'block', lineClamp: 1, fontSize: 20 }}>{value}</span>
    </div>
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        fontFamily: '"B612", sans-serif',
        color: ink,
        background: sheet,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: OUTER,
          left: OUTER,
          width: 1200 - OUTER * 2,
          height: 630 - OUTER * 2,
          border: `1px solid ${tint(0.5)}`,
        }}
      />
      {zoneStrip(COLUMNS, { top: OUTER, left: INNER, width: AREA_WIDTH, height: INNER - OUTER })}
      {zoneStrip(COLUMNS, { top: 630 - INNER, left: INNER, width: AREA_WIDTH, height: INNER - OUTER })}
      {zoneStrip(ROWS, { top: INNER, left: OUTER, width: INNER - OUTER, height: AREA_HEIGHT, flexDirection: 'column' })}
      {zoneStrip(ROWS, { top: INNER, left: 1200 - INNER, width: INNER - OUTER, height: AREA_HEIGHT, flexDirection: 'column' })}

      <div
        style={{
          position: 'absolute',
          top: INNER,
          left: INNER,
          width: AREA_WIDTH,
          height: AREA_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          padding: 48,
          border: `2px solid ${ink}`,
          overflow: 'hidden',
        }}
      >
        <div style={gridLines(24, 0.07, 'to right')} />
        <div style={gridLines(24, 0.07, 'to bottom')} />
        <div style={gridLines(120, 0.12, 'to right')} />
        <div style={gridLines(120, 0.12, 'to bottom')} />

        {/* Shrinks to the headline so the dimension line measures exactly its width. */}
        <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', maxWidth: imageSrc ? 640 : 1000 }}>
          <div
            style={{
              display: 'block',
              textWrap: 'pretty',
              lineClamp: 3,
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
          {readingTime ? (
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative', height: 28, marginTop: 20, color: tint(0.85) }}>
              <div style={{ display: 'flex', width: 1.5, height: 28, background: tint(0.85) }} />
              <div style={{ display: 'flex', flexGrow: 1, height: 1.5, background: tint(0.85) }} />
              <span style={{ padding: '0 14px', fontSize: 18 }}>{readingTime}</span>
              <div style={{ display: 'flex', flexGrow: 1, height: 1.5, background: tint(0.85) }} />
              <div style={{ display: 'flex', width: 1.5, height: 28, background: tint(0.85) }} />
              {/* Architectural ticks where the dimension meets the extension lines. */}
              <div style={{ position: 'absolute', left: -7, top: 13, width: 16, height: 2, background: ink, transform: 'rotate(-45deg)' }} />
              <div style={{ position: 'absolute', right: -7, top: 13, width: 16, height: 2, background: ink, transform: 'rotate(-45deg)' }} />
            </div>
          ) : null}
        </div>

        {excerpt ? (
          <div
            style={{
              display: 'block',
              textWrap: 'pretty',
              lineClamp: 2,
              maxWidth: 540,
              marginTop: 28,
              fontSize: 22,
              lineHeight: 1.5,
              color: tint(0.78),
            }}
          >
            {excerpt}
          </div>
        ) : null}

        {imageSrc ? (
          <div style={{ position: 'absolute', top: 40, right: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                position: 'relative',
                width: DETAIL,
                height: DETAIL,
                borderRadius: DETAIL,
                border: `2px solid ${ink}`,
                overflow: 'hidden',
              }}
            >
              <Img src={imageSrc} width={DETAIL} height={DETAIL} style={{ filter: 'grayscale(1) contrast(1.15)' }} />
              {/* Washing the grey photo with the sheet colour gives a cyanotype print. */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: DETAIL, height: DETAIL, background: sheet, opacity: 0.5 }} />
            </div>
            <span style={{ fontSize: 15, color: tint(0.75) }}>Detail A</span>
          </div>
        ) : null}

        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            width: 500,
            borderTop: `2px solid ${ink}`,
            borderLeft: `2px solid ${ink}`,
            background: sheet,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {cell('Project', site)}
            {iconSrc ? <Img src={iconSrc} width={36} height={36} style={{ marginRight: 14 }} /> : null}
          </div>
          {details.length ? (
            <div style={{ display: 'flex', borderTop: `1px solid ${tint(0.5)}` }}>
              {details.map(([label, value], index) =>
                cell(label, value, index ? { borderLeft: `1px solid ${tint(0.5)}` } : undefined)
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const blueprintTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: '"B612", sans-serif',
};
