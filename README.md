# OGIS - OG Image Service

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)

Open Graph images for blogs, from a single URL. Built with Next.js 16 on the Vercel Edge Runtime.

**Demo**: https://og.tuuhub.com

> **⚠️ Important**: The demo site is for **demonstration** purposes **ONLY**. Please deploy your **OWN** instance for production use.

## Features

- **Five themes**: `pixel`, `modern`, `editorial`, `swiss` and `terminal`, each built on typography and layout rather than decoration
- **Your images**: cover image, site icon and author avatar, fetched and checked server-side
- **Six pixel fonts**: Zpix plus five Geist Pixel cuts, bundled in `public/fonts`
- **Fitted titles**: font size steps down with title length, and CJK counts as wide
- **Edge rendering** with CDN caching (one day fresh, one week stale-while-revalidate)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bunizao/ogis)

No configuration is required. The endpoint is `https://<your-domain>/api/og`.

If you only need the API (no landing page), set:

```
OG_API_ONLY=true
```

This returns `404` for non-API pages and keeps `/api/*`, `/default-bg.jpg`, `/fonts/*` and `/_next/*` available.

## Themes

| Theme | Look | Uses |
|-------|------|------|
| `pixel` (default) | Bitmap type over your cover image | `image`, `pixelFont`, `icon`, `avatar`, `tag`, `accent` |
| `modern` | Headline set straight on your cover image, like a magazine cover | `image`, `icon`, `avatar`, `tag`, `accent` |
| `editorial` | A centred serif opener, like a magazine feature; with `image` it becomes a two-page spread | `image`, `icon`, `avatar`, `tag`, `accent` |
| `swiss` | Heavy grotesk on a strict four-column grid | `image` (one column), `tag`, `accent` |
| `terminal` | A shell session with a tmux-style status line | `tag`, `accent` |

`pixel` and `modern` fall back to a bundled starfield when no `image` is given. `editorial` and `swiss` are purely typographic without one, and `terminal` never shows images.

## Parameters

| Param | Max length | Notes |
|-------|-----------|-------|
| `title` | 200 | Defaults to `Untitled` |
| `site` | 80 | Defaults to `Blog` |
| `excerpt` | 300 | Clamped to two lines |
| `author` | 80 | |
| `date` | 40 | Free text, shown as given |
| `reading` | 40 | Reading time, e.g. `5 min read` |
| `tag` | 40 | Category or kicker |
| `accent` | | Hex colour (`#e4002b` or `e4002b`); invalid values use the theme default |
| `theme` | | `pixel`, `modern`, `editorial`, `swiss` or `terminal`; anything else uses `pixel` |
| `pixelFont` | | `zpix`, `geist-square`, `geist-circle`, `geist-line`, `geist-triangle`, `geist-grid` |
| `image` | | Cover image URL |
| `icon` | | Site icon URL |
| `avatar` | | Author avatar URL |

Typographic quotes, dashes and odd Unicode spaces are normalized before rendering.

Example:

```
https://your-domain.com/api/og?title=Hello&site=Blog&theme=editorial&tag=Essay&author=Jane
```

### Images

`image`, `icon` and `avatar` are downloaded by the server, never by the renderer directly:

- `http`/`https` only, on the default port, with no credentials in the URL
- The host must resolve to a public IP address. This is checked again on every redirect, with at most 3 redirects
- 4 second timeout, 6 MB limit
- PNG, JPEG, GIF or SVG, detected from the bytes rather than the extension. WebP and AVIF are not supported by Satori

An image that fails any check is dropped and the card renders without it. Set `OG_ENABLE_DEBUG=true` and call `/api/debug` with the same query to see why an image was rejected.

Unsplash URLs pasted without encoding (`?image=https://images.unsplash.com/photo-1?w=1600&q=80`) are reassembled automatically.

---
<details>
<summary>Developer Docs (Advanced)</summary>

## Local Development

```bash
bun install
bun run dev      # http://localhost:3000
bun run build
bun test
```

Try `http://localhost:3000/api/og?title=Hello&site=Blog`.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `OG_API_ONLY` | `true` disables non-API frontend routes |
| `OG_API_PATH` | Also serve the endpoint at `/api/<OG_API_PATH>` (one segment: letters, digits, `_`, `-`) |
| `OG_SECRET` | Legacy only. Older versions derived an `/api/og_xxxxxxxxxxxx` path from it; setting it keeps that path working |
| `OG_ENABLE_DEBUG` | `true` enables `/api/debug` |

`/api/og` is always available. Earlier versions supported HMAC-signed URLs (`sig`, `exp`). They have been removed because the public `/api/og` endpoint made signing pointless. Old signed URLs still render, and the extra parameters are ignored.

## Integration Guide

### Ghost (with Attegi Theme)

If you're using the [Attegi theme](https://github.com/bunizao/attegi) for Ghost, OG image generation is built-in. Simply configure your OG service URL in the theme settings.

### Next.js

For App Router pages (supports dynamic params), use `generateMetadata`:

```tsx
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const params = new URLSearchParams({ title: 'Hello World', site: 'My Blog', theme: 'swiss' });
  const ogUrl = `https://your-domain.com/api/og?${params}`;

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
const params = new URLSearchParams({ title, site: siteName });
const ogImage = `https://your-domain.com/api/og?${params}`;
---

<meta property="og:image" content={ogImage} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### Hugo

Add to your template:

```html
{{ $ogImage := printf "https://your-domain.com/api/og?title=%s&site=%s" (urlquery .Title) (urlquery .Site.Title) }}

<meta property="og:image" content="{{ $ogImage }}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### Other Frameworks

For other frameworks and platforms, set `og:image` meta tags to the generated URL (see the [Open Graph protocol](https://ogp.me/)).

## Customization

- **Default background**: replace `public/default-bg.jpg` with your own 1200×630 image.
- **Pixel fonts**: edit `app/lib/pixel-fonts.ts` and put the TTF files under `public/fonts`.
- **Themes**: each theme is one file in `app/api/og/themes/` that exports `loadFonts` and `render`. Register new ones in `themes/index.ts` and `app/lib/og-themes.ts`.

</details>

## License

MIT

## Credits

- Default background: [Cluster of Stars](https://unsplash.com/photos/cluster-of-stars-in-the-sky-qVotvbsuM_c) by [Paul Lichtblau](https://unsplash.com/@paullichtblau) on Unsplash
- Zpix pixel font by [SolidZORO](https://github.com/SolidZORO/zpix-pixel-font)
- Geist Pixel by [Vercel](https://vercel.com/font)
- Geist, Geist Mono, Inter Tight, Instrument Serif and Instrument Sans via [Fontsource](https://fontsource.org)
