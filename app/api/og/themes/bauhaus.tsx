import { fitFontSize, Img, loadFontsourceFamily } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  return loadFontsourceFamily('jost', 'Jost', [{ weight: 400 }, { weight: 500 }, { weight: 600 }]);
}

// A text column beside a block of flat geometric tiles. The tiles are drawn
// from a generator seeded by the title, so every post gets its own pattern and
// the same post always gets the same one. The accent replaces the lead colour.
const PAPER = '#ffffff';
const INK = '#000000';
const MUTED = '#5c5c5c';
const PALETTES = [
  ['#e0362c', '#f2b705', '#1f4799', INK],
  ['#ff6b35', '#1b998b', '#f5c2c7', '#1d2b53'],
  ['#2b59c3', '#ffd23f', '#ee4266', INK],
  ['#0f7b5f', '#f28f3b', '#c8d5b9', '#22223b'],
];
// Whole pixels: fractional tiles leave hairline seams. Four rows overshoot the
// card by 2px, which the art column clips.
const TILE = 158;
const COLUMNS = 3;
const ART_WIDTH = TILE * COLUMNS;

// FNV-1a, then mulberry32: tiny, stable across runtimes, good enough for picking shapes.
function seededRandom(text: string): () => number {
  let seed = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) seed = Math.imul(seed ^ text.charCodeAt(i), 0x01000193);
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Shape = 'circle' | 'quarter' | 'half' | 'leaf' | 'stripes' | 'dot' | 'ring' | 'triangle' | 'plain';
const SHAPES: Shape[] = ['circle', 'quarter', 'quarter', 'half', 'half', 'leaf', 'stripes', 'dot', 'ring', 'triangle', 'plain'];

function shapeStyle(shape: Shape, color: string): React.CSSProperties {
  const full: React.CSSProperties = { position: 'absolute', top: 0, left: 0, width: TILE, height: TILE, display: 'flex' };
  switch (shape) {
    case 'circle':
      return { ...full, borderRadius: TILE, background: color };
    case 'quarter':
      return { ...full, borderTopLeftRadius: TILE, background: color };
    case 'half':
      return { ...full, top: TILE / 2, height: TILE / 2, borderTopLeftRadius: TILE / 2, borderTopRightRadius: TILE / 2, background: color };
    case 'leaf':
      return { ...full, borderTopLeftRadius: TILE, borderBottomRightRadius: TILE, background: color };
    case 'stripes':
      return { ...full, backgroundImage: `linear-gradient(to right, ${color} 50%, transparent 50%)`, backgroundSize: `${TILE / 4}px ${TILE}px` };
    case 'dot':
      return { ...full, top: TILE / 4, left: TILE / 4, width: TILE / 2, height: TILE / 2, borderRadius: TILE, background: color };
    case 'ring':
      return { ...full, top: TILE * 0.12, left: TILE * 0.12, width: TILE * 0.76, height: TILE * 0.76, borderRadius: TILE, border: `${TILE * 0.13}px solid ${color}` };
    case 'triangle':
      return { ...full, clipPath: 'polygon(0 0, 100% 100%, 0 100%)', background: color };
    case 'plain':
      return { display: 'none' };
  }
}

function render(props: ThemeProps, _context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, tag, readingTime, imageSrc } = props;
  const random = seededRandom(`${site}\n${title}`);
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];

  const palette = [...pick(PALETTES)];
  if (props.accent) palette[0] = props.accent;
  const colors = [...palette, PAPER];
  const meta = [author, date, readingTime].filter(Boolean);

  const tiles = Array.from({ length: COLUMNS * 4 }, (_, index) => {
    // A white tile against the white text column would read as a missing piece.
    const background = pick(index % COLUMNS ? colors : palette);
    const foreground = pick(colors.filter(color => color !== background));
    return { index, background, foreground, shape: pick(SHAPES), turn: Math.floor(random() * 4) * 90 };
  });
  const photoTile = imageSrc ? Math.floor(random() * tiles.length) : -1;

  const titleSize = fitFontSize(title, [
    [10, 112],
    [18, 92],
    [30, 74],
    [48, 60],
    [Infinity, 50],
  ]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        fontFamily: '"Jost", sans-serif',
        color: INK,
        background: PAPER,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: 1200 - ART_WIDTH, padding: '56px 64px 52px' }}>
        <div style={{ display: 'flex', gap: 20, fontSize: 24, fontWeight: 500 }}>
          <span>{site}</span>
          {tag ? <span style={{ color: palette[0] }}>{tag}</span> : null}
        </div>

        <div
          style={{
            display: 'block',
            textWrap: 'pretty',
            lineClamp: 4,
            marginTop: 'auto',
            fontSize: titleSize,
            fontWeight: 500,
            lineHeight: 1.02,
            letterSpacing: '-0.025em',
          }}
        >
          {title}
        </div>
        {excerpt ? (
          <div style={{ display: 'block', textWrap: 'pretty', lineClamp: 2, marginTop: 20, fontSize: 24, lineHeight: 1.4, color: MUTED }}>
            {excerpt}
          </div>
        ) : null}

        {meta.length ? (
          <div style={{ display: 'flex', gap: 24, marginTop: 40, fontSize: 21, color: MUTED }}>
            {meta.map((item, index) => (
              <span key={item} style={index === 0 && author ? { color: INK, fontWeight: 500 } : undefined}>
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', position: 'relative', width: ART_WIDTH, height: 630, overflow: 'hidden' }}>
        {tiles.map(tile => (
          <div
            key={tile.index}
            style={{
              position: 'absolute',
              top: Math.floor(tile.index / COLUMNS) * TILE,
              left: (tile.index % COLUMNS) * TILE,
              width: TILE,
              height: TILE,
              display: 'flex',
              overflow: 'hidden',
              background: tile.background,
            }}
          >
            {tile.index === photoTile && imageSrc ? (
              <Img src={imageSrc} width={TILE} height={TILE} style={{ borderRadius: TILE, filter: 'grayscale(1) contrast(1.1)' }} />
            ) : (
              <div style={{ display: 'flex', width: TILE, height: TILE, transform: `rotate(${tile.turn}deg)` }}>
                <div style={shapeStyle(tile.shape, tile.foreground)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const bauhausTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: '"Jost", sans-serif',
};
