import { Cover, FILL, fitFontSize, Img, loadFontsourceFamily, seededRandom } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  return loadFontsourceFamily('young-serif', 'Young Serif', [{ weight: 400 }]);
}

// The title lettered on real oil paint. Without a cover the canvas is a close-up
// of Van Gogh's brushwork, picked by the title, from paintings in the Met's
// open-access collection (CC0). A cover image is laid under the impasto of the
// Irises background instead, so it reads as paint on canvas. The assets live
// in public/oil; README lists where each one was cropped from.
// `glaze` is each detail's own average tone, lightened a little. It is washed
// thinly over the lower half so the lettering doesn't fight the brushwork.
const DETAILS = [
  { file: 'irises', painting: 'Irises', year: 1890, glaze: '222, 217, 213' },
  { file: 'oleanders', painting: 'Oleanders', year: 1888, glaze: '167, 179, 119' },
  { file: 'olive-trees-sky', painting: 'Olive Trees', year: 1889, glaze: '183, 187, 177' },
  { file: 'olive-pickers-sky', painting: 'Women Picking Olives', year: 1889, glaze: '209, 193, 175' },
  { file: 'roses', painting: 'Roses', year: 1890, glaze: '166, 185, 158' },
  { file: 'wheat-field-sky', painting: 'Wheat Field with Cypresses', year: 1889, glaze: '189, 192, 186' },
];
const UMBER = '#241b14';
const LINEN = '#f5efe2';

function render(props: ThemeProps, context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, date, tag, readingTime, imageSrc, iconSrc } = props;
  const detail = DETAILS[Math.floor(seededRandom(`${site}\n${title}`)() * DETAILS.length)];
  const asset = (path: string) => new URL(`/oil/${path}`, context.baseUrl).toString();
  // Covers are mostly darker than the paintings, so they get a shadow along
  // the bottom and light lettering.
  const ink = imageSrc ? LINEN : UMBER;
  const meta = [author, date, readingTime, tag].filter(Boolean);

  const titleSize = fitFontSize(title, [
    [14, 92],
    [26, 76],
    [44, 62],
    [Infinity, 52],
  ]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        fontFamily: '"Young Serif", serif',
        color: ink,
        background: '#e9e2d3',
      }}
    >
      {imageSrc ? (
        <>
          <Cover src={imageSrc} style={{ filter: 'saturate(1.2) blur(0.8px)' }} />
          <Img src={asset('impasto.png')} width={1200} height={630} style={{ position: 'absolute', top: 0, left: 0 }} />
          <div
            style={{
              ...FILL,
              backgroundImage: 'linear-gradient(to top, rgba(22, 17, 12, 0.82), rgba(22, 17, 12, 0.4) 45%, rgba(22, 17, 12, 0) 75%)',
            }}
          />
        </>
      ) : (
        <>
          <Cover src={asset(`${detail.file}.jpg`)} />
          <div
            style={{
              ...FILL,
              backgroundImage: `linear-gradient(to top, rgba(${detail.glaze}, 0.8), rgba(${detail.glaze}, 0.45) 45%, rgba(${detail.glaze}, 0) 72%)`,
            }}
          />
        </>
      )}

      <div style={{ ...FILL, flexDirection: 'column', padding: '52px 64px 50px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24 }}>
          {iconSrc ? <Img src={iconSrc} width={30} height={30} style={{ borderRadius: 7 }} /> : null}
          <span style={{ color: props.accent ?? ink }}>{site}</span>
          {imageSrc ? null : (
            <span style={{ marginLeft: 'auto', fontSize: 18, textShadow: `0 0 8px rgb(${detail.glaze})` }}>
              {`Van Gogh, ${detail.painting}, ${detail.year} (detail)`}
            </span>
          )}
        </div>

        <div
          style={{
            display: 'block',
            textWrap: 'pretty',
            lineClamp: 3,
            marginTop: 'auto',
            maxWidth: 1000,
            fontSize: titleSize,
            lineHeight: 1.05,
            letterSpacing: '-0.015em',
          }}
        >
          {title}
        </div>
        {excerpt ? (
          <div style={{ display: 'block', textWrap: 'pretty', lineClamp: 2, marginTop: 18, maxWidth: 860, fontSize: 25, lineHeight: 1.4 }}>
            {excerpt}
          </div>
        ) : null}
        {meta.length ? (
          <div style={{ display: 'flex', gap: 24, marginTop: 22, fontSize: 21, opacity: 0.75 }}>
            {meta.map(item => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const oilTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: '"Young Serif", serif',
};
