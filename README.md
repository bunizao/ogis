# OGIS - OG Image Service

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)

Dynamic Open Graph (OG) image generation service for blogs and websites, built with Next.js 16 on Vercel Edge Runtime.

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

## Recommended Setup

For most users, use a random custom API path:

```
OG_API_PATH=og_a9f4k2m8x7p1

# Use a random path (8-16 chars, letters/numbers/_/-).
```

> Use `https://example.com/api/<OG_API_PATH>` as the API endpoint.


If you only need OG image APIs (no landing page), enable API-only mode:

```
OG_API_ONLY=true
```

Behavior when enabled:
- Returns `404` for non-API pages (for example `/`).
- Keeps all API routes available (`/api/*`).
- Keeps OG-required static assets available: `/default-bg.jpg`, `/fonts/*`, `/_next/*`.

  
## Technical Stack

- **Framework**: Next.js 16 with App Router
- **Runtime**: Vercel Edge Runtime
- **Image Generation**: @vercel/og (Satori)
- **Language**: TypeScript
- **Deployment**: Vercel

## Notes

- **Supported Image Formats**: PNG, JPG, JPEG, GIF
- **Unsupported Formats**: WebP, AVIF, SVG (@vercel/og limitation)
- **Config Endpoint**: `/api/og-config` is disabled by default; enable with `OG_ENABLE_CONFIG_ENDPOINT=true` only when needed
- **Debug Endpoint**: keep `/api/debug` disabled in production

---
<details>
<summary>Developer Docs (Advanced)</summary>

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

- No `OG_SECRET`: endpoint is usually `/api/og`
- With `OG_SECRET`: endpoint is auto-derived (for example `/api/og_xxxxxxxx`) and signature check is enabled (advanced mode)
- Optional: set `OG_API_PATH` to pin a stable path

To inspect current endpoint and signature requirement temporarily:

```bash
OG_ENABLE_CONFIG_ENDPOINT=true
GET /api/og-config
```

### 2) Build Query Parameters

Required:
- `title`: article title
- `site`: site name

Optional:
- `excerpt`, `author`, `date`, `image`
- `theme` (`pixel` or `modern`)
- `pixelFont` (used when `theme=pixel`)
- `sig`: optional; required only when `OG_SECRET` or `OG_SIGNATURE_SECRET` is set
- `exp`: optional Unix timestamp for expiring signatures

Unsigned example:

```
https://your-domain.com/api/og?title=Hello&site=Blog
```

Signed example:

```
https://your-domain.com/api/your-random-key?title=Hello&site=Blog&sig=<signature>
```

### 3) Generate Signature

```bash
bun scripts/sign-og-url.mjs \
  --url "https://your-domain.com/api/your-random-key?title=Hello&site=Blog" \
  --exp-seconds 604800
```

Secret priority:
`--secret` > `OG_SIGNATURE_SECRET` > `OG_SECRET`

### Environment Variables

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `OG_SECRET` | No | Advanced mode: auto-derive API path and enable signature validation | `OG_SECRET=replace-with-long-random-secret` |
| `OG_API_PATH` | Recommended | Set custom API path (random string recommended) | `OG_API_PATH=og_myblog` |
| `OG_API_ALLOW_LEGACY_PATH` | No | Set `true` to allow legacy `/api/og` in advanced setups | `OG_API_ALLOW_LEGACY_PATH=true` |
| `OG_SIGNATURE_SECRET` | No | Explicit signature secret (defaults to `OG_SECRET`) | `OG_SIGNATURE_SECRET=another-long-secret` |
| `OG_API_ONLY` | No | Set `true` to disable non-API frontend routes | `OG_API_ONLY=true` |
| `OG_ENABLE_DEBUG` | No | Set `true` to enable `/api/debug` in production | `OG_ENABLE_DEBUG=false` |
| `OG_ENABLE_CONFIG_ENDPOINT` | No | Set `true` to expose `/api/og-config` (disabled by default) | `OG_ENABLE_CONFIG_ENDPOINT=true` |

If neither `OG_SECRET` nor `OG_SIGNATURE_SECRET` is set, unsigned URLs work.

## Integration Guide

Use `OG_API_PATH` direct URLs by default. If signature mode is enabled, generate signatures on the server side and avoid short-lived signatures for published pages.

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
  const ogUrl = `${ogEndpoint}?title=${encodeURIComponent(title)}&site=${encodeURIComponent(siteName)}`;

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
const ogImage = `${ogEndpoint}?title=${encodeURIComponent(title)}&site=${encodeURIComponent(siteName)}`;
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
{{ $ogImage := printf "https://your-domain.com/api/%s?title=%s&site=%s" $ogPath (urlquery $title) (urlquery $site) }}

<meta property="og:image" content="{{ $ogImage }}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### Other Frameworks

For other frameworks and platforms, set `og:image` meta tags to the generated URL (see the [Open Graph protocol](https://ogp.me/)).

## Design Details

- **Image Size**: 1200×630px
- **Font**: Zpix + Geist Pixel (`geist-square`, `geist-circle`, `geist-line`, `geist-triangle`, `geist-grid`)

## Customization

### Change Default Background

Replace `/public/default-bg.jpg` with your own 1200×630px image.

### Change Font

Edit `app/lib/pixel-fonts.ts` to add/remove local font options, then place corresponding TTF files under `public/fonts`.

</details>

## License

MIT

## Credits

- Default background: [Cluster of Stars](https://unsplash.com/photos/cluster-of-stars-in-the-sky-qVotvbsuM_c) by [Paul Lichtblau](https://unsplash.com/@paullichtblau) on Unsplash
- Zpix pixel font by [SolidZORO](https://github.com/SolidZORO/zpix-pixel-font)
- Geist Pixel by [Vercel](https://vercel.com/font)
