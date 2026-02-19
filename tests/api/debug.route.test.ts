import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/debug/route';

const originalNodeEnv = process.env.NODE_ENV;
const originalDebugFlag = process.env.OG_ENABLE_DEBUG;

beforeEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  process.env.OG_ENABLE_DEBUG = originalDebugFlag;
});

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  process.env.OG_ENABLE_DEBUG = originalDebugFlag;
});

describe('/api/debug', () => {
  test('returns 404 in production when debug flag is disabled', async () => {
    process.env.NODE_ENV = 'production';
    process.env.OG_ENABLE_DEBUG = 'false';

    const request = new NextRequest('https://example.com/api/debug?image=https://example.com/a.png');
    const response = await GET(request);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not Found');
  });

  test('is enabled in production when OG_ENABLE_DEBUG=true', async () => {
    process.env.NODE_ENV = 'production';
    process.env.OG_ENABLE_DEBUG = 'true';

    const request = new NextRequest(
      'https://example.com/api/debug?image=https://images.unsplash.com/photo-1?auto=format&crop=entropy&q=80&w=1200'
    );
    const response = await GET(request);
    const body = (await response.json()) as {
      reconstructedImage: string;
      isValidUrl: boolean;
      isSupportedFormat: boolean;
      allParams: Record<string, string>;
    };

    expect(response.status).toBe(200);
    expect(body.reconstructedImage.includes('crop=entropy')).toBeTrue();
    expect(body.reconstructedImage.includes('q=80')).toBeTrue();
    expect(body.reconstructedImage.includes('w=1200')).toBeTrue();
    expect(body.isValidUrl).toBeTrue();
    expect(body.isSupportedFormat).toBeTrue();
    expect(body.allParams.image).toBe('https://images.unsplash.com/photo-1?auto=format');
  });

  test('detects invalid protocol and unsupported format', async () => {
    process.env.OG_ENABLE_DEBUG = 'true';

    const request = new NextRequest('https://example.com/api/debug?image=ftp://example.com/image.webp');
    const response = await GET(request);
    const body = (await response.json()) as {
      isValidUrl: boolean;
      isSupportedFormat: boolean;
    };

    expect(body.isValidUrl).toBeFalse();
    expect(body.isSupportedFormat).toBeFalse();
  });

  test('treats short/truncated urls as invalid', async () => {
    process.env.OG_ENABLE_DEBUG = 'true';

    const request = new NextRequest('https://example.com/api/debug?image=https://a.co/…');
    const response = await GET(request);
    const body = (await response.json()) as {
      isValidUrl: boolean;
    };

    expect(body.isValidUrl).toBeFalse();
  });
});
