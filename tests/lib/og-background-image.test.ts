import { describe, expect, test } from 'bun:test';
import { resolveOgBackgroundImage } from '../../app/lib/og-background-image';

describe('resolveOgBackgroundImage', () => {
  test('rejects a private image host and returns the default background', async () => {
    const requestUrl = new URL(
      'https://example.com/api/og?image=http://192.168.1.5/private.png'
    );

    const result = await resolveOgBackgroundImage(requestUrl);

    expect(result).toEqual({
      rawImage: 'http://192.168.1.5/private.png',
      reconstructedImage: 'http://192.168.1.5/private.png',
      isValidUrl: false,
      isSupportedFormat: true,
      imageAccepted: false,
      imageHost: '',
      backgroundImageSrc: 'https://example.com/default-bg.jpg',
    });
  });
});
