import { Cover, FILL, fitFontSize, Img, loadFontsourceFamily, metaItems } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

function loadFonts(_context: ThemeContext): Promise<ThemeFont[]> {
  return loadFontsourceFamily('inter', 'Inter', [{ weight: 400 }, { weight: 500 }, { weight: 700 }]);
}

// The card hugs its content and grows upward from a fixed bottom edge. Because
// that edge is known, the blurred copy of the backdrop inside the card can be
// pinned to it and stay aligned with the sharp backdrop at any card height.
const CARD_LEFT = 120;
const CARD_BOTTOM = 64;
const CARD_WIDTH = 1200 - CARD_LEFT * 2;
const CARD_RADIUS = 32;

function render(props: ThemeProps, _context: ThemeContext): React.ReactElement {
  const { title, site, excerpt, author, tag, imageSrc, fallbackImageSrc, iconSrc, avatarSrc } = props;
  const backdrop = imageSrc ?? fallbackImageSrc;
  const details = metaItems(props).filter(item => item !== author);

  const titleSize = fitFontSize(title, [
    [18, 68],
    [30, 60],
    [48, 52],
    [72, 46],
    [Infinity, 40],
  ]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        fontFamily: '"Inter", sans-serif',
        color: '#ffffff',
        background: '#0a0a0f',
      }}
    >
      <Cover src={backdrop} />
      <div style={{ ...FILL, backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0) 55%)' }} />

      <div
        style={{
          position: 'absolute',
          left: CARD_LEFT,
          bottom: CARD_BOTTOM,
          width: CARD_WIDTH,
          display: 'flex',
          flexDirection: 'column',
          padding: '40px 52px 44px',
          borderRadius: CARD_RADIUS,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.32), 0 2px 8px rgba(0, 0, 0, 0.16)',
        }}
      >
        {/* Glass: the backdrop blurred in place, a dark tint, a faint top sheen and a hairline rim. */}
        <Img
          src={backdrop}
          width={1200}
          height={630}
          style={{ position: 'absolute', left: -CARD_LEFT, bottom: -CARD_BOTTOM, filter: 'blur(32px) saturate(1.5)' }}
        />
        <div
          style={{
            ...FILL,
            width: CARD_WIDTH,
            height: '100%',
            backgroundColor: 'rgba(14, 16, 24, 0.4)',
            backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 45%)',
            borderRadius: CARD_RADIUS,
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.32), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 22, fontWeight: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {iconSrc ? (
              <Img
                src={iconSrc}
                width={30}
                height={30}
                style={{ borderRadius: 8, boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.16)' }}
              />
            ) : null}
            <span style={{ color: 'rgba(255, 255, 255, 0.88)' }}>{site}</span>
          </div>
          {tag ? <span style={{ color: props.accent ?? 'rgba(255, 255, 255, 0.56)' }}>{tag}</span> : null}
        </div>

        <div
          style={{
            display: 'block',
            textWrap: 'pretty',
            lineClamp: 3,
            marginTop: 24,
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
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
              marginTop: 16,
              fontSize: 24,
              lineHeight: 1.45,
              color: 'rgba(255, 255, 255, 0.72)',
            }}
          >
            {excerpt}
          </div>
        ) : null}

        {author || details.length > 0 || avatarSrc ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, fontSize: 20 }}>
            {avatarSrc ? (
              <Img
                src={avatarSrc}
                width={34}
                height={34}
                style={{ borderRadius: 999, boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.16)' }}
              />
            ) : null}
            {author ? <span style={{ fontWeight: 500, color: 'rgba(255, 255, 255, 0.92)' }}>{author}</span> : null}
            {author && details.length > 0 ? <span style={{ color: 'rgba(255, 255, 255, 0.32)' }}>·</span> : null}
            {details.length > 0 ? (
              <span style={{ color: 'rgba(255, 255, 255, 0.56)' }}>{details.join('  ·  ')}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const modernTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: '"Inter", sans-serif',
};
