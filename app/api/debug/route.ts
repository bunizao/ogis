import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  let image = searchParams.get('image') || '';

  const isUnsplashImage = (url: string) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.hostname === 'images.unsplash.com';
    } catch {
      return false;
    }
  };

  // Reconstruct Unsplash URL
  if (isUnsplashImage(image)) {
    const unsplashParams: string[] = [];
    const knownUnsplashParams = ['crop', 'cs', 'fit', 'fm', 'ixid', 'ixlib', 'q', 'w', 'h'];

    for (const param of knownUnsplashParams) {
      const value = searchParams.get(param);
      if (value) {
        unsplashParams.push(`${param}=${value}`);
      }
    }

    if (unsplashParams.length > 0) {
      image = image + '&' + unsplashParams.join('&');
    }
  }

  // Validation functions
  const isValidUrl = (url: string) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      if (url.endsWith('…') || url.endsWith('...') || url.length < 20) return false;
      return true;
    } catch {
      return false;
    }
  };

  const isSupportedImageFormat = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('/format/jpeg/') || lowerUrl.includes('/format/png/') || lowerUrl.includes('/format/jpg/')) {
      return true;
    }
    if (lowerUrl.match(/\.(webp|avif)(\?|$)/i)) return false;
    const supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
    const hasExtension = supportedExtensions.some(ext => lowerUrl.includes(ext));
    return hasExtension || !lowerUrl.match(/\.(webp|avif|svg|bmp|tiff?)(\?|$)/i);
  };

  return NextResponse.json({
    rawImage: searchParams.get('image'),
    reconstructedImage: image,
    isValidUrl: isValidUrl(image),
    isSupportedFormat: isSupportedImageFormat(image),
    allParams: Object.fromEntries(searchParams.entries()),
  });
}
