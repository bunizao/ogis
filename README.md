# OGIS - OG Image Service

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)

Dynamic Open Graph (OG) image generation service for blogs and websites. Built with Next.js 16 and deployed on Vercel Edge Runtime for fast, globally distributed image generation.

**Demo**: https://og.tutuis.me

> **⚠️ Important**: The demo site is for **demonstration** purposes **ONLY**. Please deploy your **OWN** instance for production use.

## Features

- **Beautiful Default Background** - Stunning starry sky image when no background is provided
- **Custom Background Support** - Use your own images (PNG, JPG, JPEG, GIF)
- **Pixel Font Aesthetic** - Zpix pixel font for retro, distinctive look
- **Frosted Glass Effect** - Enhanced readability with backdrop blur overlay
- **Responsive Typography** - Dynamic font sizing based on title length
- **Edge Runtime** - Fast generation with global CDN caching
- **CJK Support** - Full support for Chinese, Japanese, and Korean characters

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bunizao/ogis)



## Local Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

Visit http://localhost:3000/api/og?title=Hello&site=Blog to test.

## API Usage

### Endpoint

```
GET /api/og
```

### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `title` | string | Yes | Article title (max 60 chars) | `Hello World` |
| `site` | string | Yes | Site name for branding | `My Blog` |
| `excerpt` | string | No | Article excerpt (max 80 chars) | `A brief description...` |
| `author` | string | No | Author name | `John Doe` |
| `date` | string | No | Publication date | `2025-01-05` |
| `image` | string | No | Background image URL | `https://...` |

### Example Request

```
https://og.tutuis.me/api/og?title=Getting%20Started&site=Tech%20Blog&author=Jane&date=2025-01-05
```

### With Custom Background

```
https://og.tutuis.me/api/og?title=My%20Article&site=Blog&image=https://images.unsplash.com/photo-123456
```

## Integration Guide

### Ghost (with Attegi Theme)

If you're using the [Attegi theme](https://github.com/bunizao/attegi) for Ghost, OG image generation is built-in. Simply configure your OG service URL in the theme settings.

### Next.js

For App Router pages (supports dynamic params), use `generateMetadata`:

```tsx
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Hello World';
  const siteName = 'My Blog';
  const ogUrl = `https://your-domain.com/api/og?title=${encodeURIComponent(title)}&site=${encodeURIComponent(siteName)}`;

  return {
    openGraph: {
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
  };
}
```

### Astro

Add to your page frontmatter or layout:

```astro
---
const ogImage = `https://your-domain.com/api/og?title=${encodeURIComponent(title)}&site=${encodeURIComponent(siteName)}`;
---

<meta property="og:image" content={ogImage} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### Hugo

Add to your template:

```html
{{ $title := .Title }}
{{ $site := .Site.Title }}
{{ $ogImage := printf "https://your-domain.com/api/og?title=%s&site=%s" (urlquery $title) (urlquery $site) }}

<meta property="og:image" content="{{ $ogImage }}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### Other Frameworks

For other frameworks and platforms, set `og:image` meta tags to the generated URL (see the [Open Graph protocol](https://ogp.me/)).

## Design Details

- **Image Size**: 1200×630px
- **Font**: Zpix pixel font

## Technical Stack

- **Framework**: Next.js 16 with App Router
- **Runtime**: Vercel Edge Runtime
- **Image Generation**: @vercel/og (Satori)
- **Language**: TypeScript
- **Deployment**: Vercel

## Notes

- **Supported Image Formats**: PNG, JPG, JPEG, GIF
- **Unsupported Formats**: WebP, AVIF, SVG (limitation of @vercel/og)
- **Image Loading**: Remote images are fetched by @vercel/og at render time

## Customization

### Change Default Background

Replace `/public/default-bg.jpg` with your own 1200×630px image.

### Adjust Glass Effect

Edit `app/api/og/route.tsx` around line 162:

```tsx
background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.15) 70%, transparent 100%)',
backdropFilter: 'blur(16px)',
```

### Change Font

Replace the Zpix font URL in `loadZpixFont()` function with your preferred TTF/OTF font.

## License

MIT

## Credits

- Default background: [Cluster of Stars](https://unsplash.com/photos/cluster-of-stars-in-the-sky-qVotvbsuM_c) by [Paul Lichtblau](https://unsplash.com/@paullichtblau) on Unsplash
- Zpix pixel font by [SolidZORO](https://github.com/SolidZORO/zpix-pixel-font)
