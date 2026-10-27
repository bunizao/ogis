# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js-based Open Graph image generation service, originally for the Attegi Ghost theme. Renders 1200x630 social preview images in four themes (`pixel`, `modern`, `editorial`, `swiss`) on the Vercel Edge Runtime.

## Development Commands

```bash
bun install          # Install dependencies (bun is the configured package manager)
bun run dev          # Start dev server at http://localhost:3000
bun run build        # Production build
bun run start        # Start production server
bun test             # Run full Bun test suite
```

**Test URL**: `http://localhost:3000/api/og?title=Hello&site=Blog`

## Architecture

**Runtime**: Next.js 16, App Router, Edge Runtime (`export const runtime = 'edge'`), @vercel/og (Satori), TypeScript strict mode.

### Key Files

- `app/api/og/handler.tsx` — Main OG handler: route-key check, text sanitization and caps, accent parsing, image prefetch, theme dispatch.
- `app/api/og/themes/` — One file per theme (`pixel`, `modern`, `editorial`, `swiss`), each exporting `loadFonts` + `render`. `index.ts` is the registry, `shared.tsx` holds `Img`, `Cover`, `FILL`, `fitFontSize` and the Fontsource loader, `font-data.ts` the per-isolate font fetch cache.
- `app/api/og/route.tsx` — `/api/og` wrapper around the shared handler.
- `app/api/[ogKey]/route.tsx` — `/api/<key>` wrapper for the `OG_API_PATH` alias and the legacy `OG_SECRET` path.
- `app/api/debug/route.ts` — `OG_ENABLE_DEBUG=true` only: reports why `image`/`icon`/`avatar` were accepted or rejected.
- `app/lib/og-remote-image.ts` — Server-side image loader with SSRF checks, size/time limits and format sniffing.
- `app/lib/og-route-keys.ts` — Which `/api/<key>` segments are served. `og` is always public.
- `app/lib/og-themes.ts` — Theme keys, labels and descriptions shared by the handler and the landing page.
- `app/lib/pixel-fonts.ts` — Pixel font registry shared by the landing page and the pixel theme.
- `app/page.tsx` — Interactive landing page with live preview form and API reference.
- `proxy.ts` — API-only mode gate (returns 404 for frontend routes when `OG_API_ONLY=true`).
- `public/default-bg.jpg` — Starfield used by `pixel`/`modern` when no image is given.
- `public/fonts/` — Pixel font TTFs (Zpix, Geist Pixel variants) served locally.

### Image Generation Flow

1. **GET `/api/og` or `/api/<alias>`** with `title`, `site`, `excerpt`, `author`, `date`, `reading`, `tag`, `accent`, `image`, `icon`, `avatar`, `theme`, `pixelFont`
2. **Route key** — unknown keys return 404. No signatures: they were removed because `/api/og` is public anyway; stale `sig`/`exp` params are ignored
3. **Images** — `loadRemoteImage()` fetches each URL server-side and inlines it as a data URL, so Satori never fetches user URLs itself. Rejected images become `null` and the theme lays out without them
4. **Fonts** — Pixel fonts from `public/fonts/`; other themes load pinned Fontsource TTFs from jsdelivr (`https://cdn.jsdelivr.net/fontsource/fonts/<id>@5.3.0/latin-<weight>-<style>.ttf`). Satori needs TTF/OTF, not woff2
5. **Text** — Typographic dashes, smart quotes and Unicode spaces normalized; fields capped by code point
6. **Render** — Satori → PNG, cached with `s-maxage=86400, stale-while-revalidate=604800`

### Remote Image Rules (`og-remote-image.ts`)

- http(s) only, default ports, no credentials; rejects `localhost`, `.localhost`, `.local` and truncated URLs (`…`, `...`, under 20 chars)
- Hostnames resolved via `dns.google/resolve` (2s timeout, 10-minute bounded cache); every resolved IP must be public (IPv4 and IPv6, IPv4-mapped delegated to IPv4)
- Redirects followed manually, at most 3, re-checking every hop
- 4s timeout, 6 MB cap, format sniffed from bytes: PNG/JPEG/GIF/SVG pass, WebP/AVIF are rejected (Satori can't decode them)

### Satori Gotchas

These cost real debugging time; the theme render tests in `tests/themes/` catch most of them.

- A `div` with more than one child needs `display: flex` (or `none`/`contents`). There is no inline text flow: text plus a `<span>` become flex items.
- `inset` is ignored. Use explicit `top/left/width/height` (`FILL` in `shared.tsx`). `top: 'auto'` logs a warning and `top: undefined` crashes, so omit the key entirely when anchoring to `bottom`.
- `lineClamp` needs `display: 'block'` and a single string child.
- `textWrap: 'balance'` combined with `lineClamp` ellipsizes too early. Use `textWrap: 'pretty'`.
- `<img>` needs `width`/`height` props (use `Img`/`Cover`).
- CJK falls back to dynamically loaded Noto at weight 400, so bold CJK titles render regular in non-pixel themes.
- `@vercel/og` sets its own lowercase `cache-control`; pass ours lowercase too or the two get comma-joined.

### Edge Runtime Constraints

No Node.js APIs (fs, path, etc.), no native modules. Fonts and images are fetched at runtime via `fetch()`.

### Testing

- Bun's `mock.module` is process-wide and outlives `mock.restore()`, so it leaks into later test files. Prefer `spyOn` on real objects (see `tests/api/og.handler.test.ts`).
- `resolveOgRouteKeys()` runs at module load; tests that change env re-import the handler with a `?case=` query.

### API-Only Mode

Set `OG_API_ONLY=true` to disable non-API frontend routes. The proxy (`proxy.ts`) returns `404` for frontend pages while keeping API routes and OG-required static assets available.
