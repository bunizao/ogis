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
      rejectionReason: 'non-public-host',
    });
  });

  test('reconstructs Unsplash parameters when the image URL has no query', async () => {
    const requestUrl = new URL(
      'https://example.com/api/og?image=https://images.unsplash.com/photo-1&crop=entropy&q=80'
    );
    const resolveHostname = async (hostname: string) => {
      expect(hostname).toBe('images.unsplash.com');
      return ['1.1.1.1'];
    };

    const result = await resolveOgBackgroundImage(requestUrl, resolveHostname);

    expect(result.reconstructedImage).toBe(
      'https://images.unsplash.com/photo-1?crop=entropy&q=80'
    );
    expect(result.imageAccepted).toBeTrue();
    expect(result.backgroundImageSrc).toBe(result.reconstructedImage);
  });

  test('reports credential and format rejection reasons', async () => {
    const credentials = await resolveOgBackgroundImage(
      new URL('https://example.com/api/og?image=https://user:pass@8.8.8.8/image.jpg')
    );
    const unsupportedFormat = await resolveOgBackgroundImage(
      new URL('https://example.com/api/og?image=https://8.8.8.8/image.webp')
    );

    expect(credentials.rejectionReason).toBe('credentials');
    expect(credentials.imageAccepted).toBeFalse();
    expect(unsupportedFormat.isValidUrl).toBeTrue();
    expect(unsupportedFormat.rejectionReason).toBe('unsupported-format');
    expect(unsupportedFormat.imageAccepted).toBeFalse();
  });
});
