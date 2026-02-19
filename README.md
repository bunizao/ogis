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
- **Switchable Pixel Fonts** - Zpix + Geist Pixel variants (all localized in `public/fonts`)
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

Visit `http://localhost:3000/api/og?title=Hello&site=Blog` to test (default path).

## API Usage

### Endpoint

```
GET /api/<OG_API_PATH>
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
| `theme` | string | No | Visual theme: `pixel` (default) or `modern` | `modern` |
| `pixelFont` | string | No | Pixel font (only for `theme=pixel`) | `geist-square` |
| `exp` | number | No | Expiry unix timestamp (required only if you choose expiring signatures) | `1767225599` |
| `sig` | string | Depends | HMAC-SHA256 signature (required when `OG_SIGNATURE_SECRET` or `OG_SECRET` is set) | `7dc12f...` |

If neither `OG_SIGNATURE_SECRET` nor `OG_SECRET` is configured, `sig`/`exp` are optional and unsigned URLs continue to work.

### Security Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OG_SECRET` | Recommended | Single-variable mode: auto-derives API path and enables signature validation |
| `OG_API_PATH` | No | Optional explicit API path override (advanced mode) |
| `OG_API_ALLOW_LEGACY_PATH` | No | `true/false`. If omitted, defaults to strict `false` in `OG_SECRET` mode, otherwise legacy `/api/og` is allowed only when `OG_API_PATH=og` |
| `OG_SIGNATURE_SECRET` | No | Optional explicit signature secret override (defaults to `OG_SECRET`) |
| `OG_ENABLE_DEBUG` | No | `true` to enable `/api/debug` in production (disabled by default) |

Recommended minimal production config:

```bash
OG_SECRET=replace-with-long-random-secret
OG_ENABLE_DEBUG=false
```

`OG_SECRET` mode behavior:
- API path is auto-derived as `/api/og_<hash>`
- Signature validation is enabled automatically
- Legacy `/api/og` is disabled by default

You can inspect current runtime endpoint via:

```bash
GET /api/og-config
```

### Signature Generation

Use the built-in script to generate signed URLs:

```bash
bun scripts/sign-og-url.mjs \
  --url "https://your-domain.com/api/your-random-key?title=Hello&site=Blog"
```

The generated `sig` is an HMAC-SHA256 hex digest over canonicalized query parameters (excluding `sig`).

With expiration (recommended):

```bash
bun scripts/sign-og-url.mjs \
  --url "https://your-domain.com/api/your-random-key?title=Hello&site=Blog" \
  --exp-seconds 604800
```

The script reads secret in this order: `--secret` > `OG_SIGNATURE_SECRET` > `OG_SECRET`.

### Example Request

```
https://og.tutuis.me/api/your-random-key?title=Getting%20Started&site=Tech%20Blog&author=Jane&date=2025-01-05&sig=<signature>
```

### With Custom Background

```
https://og.tutuis.me/api/your-random-key?title=My%20Article&site=Blog&image=https://images.unsplash.com/photo-123456&sig=<signature>
```

### With Geist Pixel Font

```
https://og.tutuis.me/api/your-random-key?title=Pixel%20Type&site=Blog&theme=pixel&pixelFont=geist-square&sig=<signature>
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
  const ogEndpoint = 'https://your-domain.com/api/your-random-key';
  const signature = '<signed-on-server>';
  const ogUrl = `${ogEndpoint}?title=${encodeURIComponent(title)}&site=${encodeURIComponent(siteName)}&sig=${signature}`;

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
const ogEndpoint = 'https://your-domain.com/api/your-random-key';
const signature = '<signed-on-server>';
const ogImage = `${ogEndpoint}?title=${encodeURIComponent(title)}&site=${encodeURIComponent(siteName)}&sig=${signature}`;
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
{{ $ogPath := "your-random-key" }}
{{ $signature := "<signed-on-server>" }}
{{ $ogImage := printf "https://your-domain.com/api/%s?title=%s&site=%s&sig=%s" $ogPath (urlquery $title) (urlquery $site) $signature }}

<meta property="og:image" content="{{ $ogImage }}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### Other Frameworks

For other frameworks and platforms, set `og:image` meta tags to the generated URL (see the [Open Graph protocol](https://ogp.me/)).

## Design Details

- **Image Size**: 1200×630px
- **Font**: Zpix + Geist Pixel (`geist-square`, `geist-circle`, `geist-line`, `geist-triangle`, `geist-grid`)

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

Edit `app/api/og/handler.tsx` in the theme rendering block:

```tsx
background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.15) 70%, transparent 100%)',
backdropFilter: 'blur(16px)',
```

### Change Font

Edit `app/lib/pixel-fonts.ts` to add/remove local font options, then place corresponding TTF files under `public/fonts`.

## License

MIT

## Credits

- Default background: [Cluster of Stars](https://unsplash.com/photos/cluster-of-stars-in-the-sky-qVotvbsuM_c) by [Paul Lichtblau](https://unsplash.com/@paullichtblau) on Unsplash
- Zpix pixel font by [SolidZORO](https://github.com/SolidZORO/zpix-pixel-font)
- Geist Pixel by [Vercel](https://vercel.com/font)
