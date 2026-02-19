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

# Run all tests
bun test
```

Visit `http://localhost:3000/api/og?title=Hello&site=Blog` to test (default path).

## API Usage

### 1) Find Your Endpoint

Base pattern:

```
GET /api/<OG_API_PATH>
```

- Default mode (no `OG_SECRET`): endpoint is usually `/api/og`
- `OG_SECRET` mode: endpoint is auto-derived (for example `/api/og_xxxxxxxx`) and signature check is enabled

Check the current runtime endpoint and whether signature is required:

```bash
GET /api/og-config
```

### 2) Build Query Parameters

Required:
- `title`: article title
- `site`: site name

Common optional:
- `excerpt`, `author`, `date`, `image`
- `theme` (`pixel` or `modern`)
- `pixelFont` (used when `theme=pixel`)

Security:
- `sig`: required when `OG_SECRET` or `OG_SIGNATURE_SECRET` is set
- `exp`: optional Unix timestamp for expiring signatures

Unsigned example:

```
https://your-domain.com/api/og?title=Hello&site=Blog
```

Signed example:

```
https://your-domain.com/api/your-random-key?title=Hello&site=Blog&sig=<signature>
```

Full example:

```
https://your-domain.com/api/your-random-key?title=Getting%20Started&site=Tech%20Blog&author=Jane&date=2025-01-05&theme=pixel&pixelFont=geist-square&sig=<signature>
```

Background image example:

```
https://your-domain.com/api/your-random-key?title=Summer%20Post&site=Tech%20Blog&image=https://images.unsplash.com/photo-123456&sig=<signature>
```

### 3) Generate Signature (Recommended)

```bash
bun scripts/sign-og-url.mjs \
  --url "https://your-domain.com/api/your-random-key?title=Hello&site=Blog" \
  --exp-seconds 604800
```

Secret priority:
`--secret` > `OG_SIGNATURE_SECRET` > `OG_SECRET`

### 4) Minimal Production Config

```bash
OG_SECRET=replace-with-long-random-secret
OG_API_ONLY=true
OG_ENABLE_DEBUG=false
```

### Environment Variables

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `OG_SECRET` | Recommended | Single-variable mode: auto-derive API path and enable signature validation | `OG_SECRET=replace-with-long-random-secret` |
| `OG_API_PATH` | No | Manually set API path (advanced) | `OG_API_PATH=og_myblog` |
| `OG_API_ALLOW_LEGACY_PATH` | No | Set `true` to allow legacy `/api/og` in advanced setups | `OG_API_ALLOW_LEGACY_PATH=true` |
| `OG_SIGNATURE_SECRET` | No | Explicit signature secret (defaults to `OG_SECRET`) | `OG_SIGNATURE_SECRET=another-long-secret` |
| `OG_API_ONLY` | No | Set `true` to disable non-API frontend routes | `OG_API_ONLY=true` |
| `OG_ENABLE_DEBUG` | No | Set `true` to enable `/api/debug` in production | `OG_ENABLE_DEBUG=false` |

If neither `OG_SECRET` nor `OG_SIGNATURE_SECRET` is set, unsigned URLs work.

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
