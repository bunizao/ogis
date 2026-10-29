import { getPixelFontOption } from '@/app/lib/pixel-fonts';
import { publicImage, readPublicFile } from './public-files';
import { Cover, FILL, fitFontSize, Img, metaItems } from './shared';
import type { ThemeProps, ThemeFont, ThemeDefinition, ThemeContext } from './types';

async function loadFonts(context: ThemeContext): Promise<ThemeFont[]> {
  const selectedFont = getPixelFontOption(context.searchParams.get('pixelFont'));
  const data = await readPublicFile(selectedFont.filePath);
  return [{ name: selectedFont.fontName, data, style: 'normal', weight: 400 }];
}

const MARGIN_X = 72;
const MARGIN_Y = 64;

async function render(props: ThemeProps, context: ThemeContext): Promise<React.ReactElement> {
  const { title, site, excerpt, tag, imageSrc, iconSrc, avatarSrc } = props;
  const selectedFont = getPixelFontOption(context.searchParams.get('pixelFont'));
  const meta = metaItems(props);

  // Pixel faces are drawn on a 12px grid; sizes that are multiples of 12 stay crisp.
  const titleSize = fitFontSize(title, [
    [12, 108],
    [20, 96],
    [30, 84],
    [44, 72],
    [64, 60],
    [Infinity, 48],
  ]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        fontFamily: `"${selectedFont.fontName}", "Zpix", sans-serif`,
        fontSize: 24,
        lineHeight: 1,
        color: '#ffffff',
        background: '#05060a',
      }}
    >
      <Cover src={imageSrc ?? (await publicImage('default-bg.jpg'))} />
      <div
        style={{
          ...FILL,
          backgroundImage:
            'linear-gradient(to top, rgba(5, 6, 10, 0.92) 0%, rgba(5, 6, 10, 0.78) 32%, rgba(5, 6, 10, 0.3) 62%, rgba(5, 6, 10, 0.1) 100%), linear-gradient(to bottom, rgba(5, 6, 10, 0.5) 0%, rgba(5, 6, 10, 0) 24%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: MARGIN_Y,
          left: MARGIN_X,
          right: MARGIN_X,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {iconSrc ? <Img src={iconSrc} width={36} height={36} /> : null}
          <span style={{ color: 'rgba(255, 255, 255, 0.88)' }}>{site}</span>
        </div>
        {tag ? <span style={{ color: props.accent ?? 'rgba(255, 255, 255, 0.56)' }}>{tag}</span> : null}
      </div>

      <div
        style={{
          position: 'absolute',
          left: MARGIN_X,
          right: MARGIN_X,
          bottom: MARGIN_Y,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'block',
            textWrap: 'pretty',
            lineClamp: 3,
            fontSize: titleSize,
            lineHeight: 1.2,
            textShadow: '0 2px 16px rgba(0, 0, 0, 0.4)',
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
              maxWidth: 936,
              lineHeight: 1.5,
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            {excerpt}
          </div>
        ) : null}

        {meta.length > 0 || avatarSrc ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 40, color: 'rgba(255, 255, 255, 0.5)' }}>
            {avatarSrc ? <Img src={avatarSrc} width={36} height={36} /> : null}
            <span>{meta.join('  ·  ')}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const pixelTheme: ThemeDefinition = {
  loadFonts,
  render,
  fontFamily: '"Zpix", sans-serif',
  coversCjk: context => getPixelFontOption(context.searchParams.get('pixelFont')).key === 'zpix',
};
