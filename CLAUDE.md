# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js-based Open Graph image generation service for the Attegi Ghost theme. Generates 1200x630px social media preview images with Zpix pixel font, frosted glass effects, and customizable backgrounds. Deployed on Vercel Edge Runtime.

## Development Commands

```bash
bun install          # Install dependencies (bun is the configured package manager)
bun run dev          # Start dev server at http://localhost:3000
bun run build        # Production build
bun run start        # Start production server
bun test             # Run full Bun test suite
```

**Test URL**: `http://localhost:3000/api/og?title=Hello&site=Blog` (default path; in single-secret mode the primary path is derived from `OG_SECRET`)

## Architecture

**Runtime**: Next.js 16, App Router, Edge Runtime (`export const runtime = 'edge'`), @vercel/og (Satori), TypeScript strict mode.

### Key Files

- `app/api/og/handler.tsx` — Main OG image handler (route-key allow-list, HMAC signature validation, text sanitization, theme dispatch).
- `app/api/og/themes/` — Theme definitions (`pixel.tsx`, `modern.tsx`, shared `font-data.ts` fetch cache, `types.ts`).
- `app/api/og/route.tsx` — Legacy/default route wrapper (`/api/og`) that delegates to the shared handler.
- `app/api/[ogKey]/route.tsx` — Configurable API-path route wrapper (`/api/<OG_API_PATH>`).
- `app/api/og-config/route.ts` — Runtime endpoint metadata (`endpoint`, `signatureRequired`) for UI/tooling.
- `app/api/debug/route.ts` — Debug endpoint returning JSON diagnostics for URL reconstruction/validation.
- `app/lib/og-background-image.ts` — SSRF protection and background image admission (URL validation, DNS resolution, public-IP checks, format filtering).
- `app/lib/og-security.ts` — Security config from env (`OG_SECRET`, `OG_API_PATH`, `OG_SIGNATURE_SECRET`); derives the primary route key.
- `app/lib/pixel-fonts.ts` — Pixel font registry shared by the landing page and the pixel theme.
- `app/page.tsx` — Interactive landing page with live preview form, dark/light mode support, and API reference section.
- `app/layout.tsx` — Root layout with metadata and OpenGraph tags.
- `proxy.ts` — API-only mode gate (returns 404 for frontend routes when `OG_API_ONLY=true`).
- `public/default-bg.jpg` — Default starry sky background when no image URL is provided.
- `public/fonts/` — Pixel font TTFs (Zpix, Geist Pixel variants) served locally.

### Image Generation Flow

1. **GET `/api/og` or `/api/<derived-path>`** receives URL parameters (`title`, `site`, `excerpt`, `author`, `date`, `image`, `theme`, `pixelFont`, optional `sig`/`exp`)
2. **Route-key + signature check** — Non-default paths require a valid HMAC-SHA256 `sig` over the canonicalized query when a signature secret is configured
3. **SSRF validation** — Image URLs go through `resolveOgBackgroundImage()` in `app/lib/og-background-image.ts`: protocol check, hostname blocking, DNS resolution via Google DNS (`dns.google/resolve`), IPv4/IPv6 public IP validation
4. **Unsplash URL reconstruction** — Truncated Unsplash query params are recovered from the top-level search params
5. **Format filtering** — Only PNG/JPG/JPEG/GIF allowed; WebP/AVIF/SVG rejected (Satori limitation)
6. **Font loading** — Pixel fonts served from `public/fonts/`; the modern theme fetches pinned Inter TTFs from jsdelivr (must be TTF/OTF, not woff2). Fetches are cached per edge isolate in `themes/font-data.ts`
7. **Text sanitization** — Typographic dashes, smart quotes, Unicode whitespace normalized
8. **Satori rendering** — Theme JSX rendered to PNG with responsive font sizing based on title length
9. **Caching** — `s-maxage=86400, stale-while-revalidate=604800`

### SSRF Protection Layer

`app/lib/og-background-image.ts` implements defense against Server-Side Request Forgery:

- **DNS resolution** via `dns.google/resolve` API with 2s timeout and a bounded 10-minute LRU cache
- **IPv4 validation** — Blocks RFC 1918, loopback, link-local, and all non-routable ranges
- **IPv6 validation** — Blocks `::1`, ULA (`fc00::/7`), link-local (`fe80::/10`), multicast, documentation ranges, and IPv4-mapped addresses (delegates to IPv4 check)
- **Hostname blocking** — Rejects `localhost`, `.localhost`, `.local`
- **URL sanitization** — Rejects non-http(s) protocols, URLs with credentials, non-standard ports, truncated URLs (`…`/`...`), and URLs shorter than 20 chars

### Design System

- **Themes**: `pixel` (default; frosted-glass bottom gradient, selectable pixel fonts) and `modern` (liquid-glass centered card, Inter)
- **Layout**: 1200x630 with bottom- or center-aligned content — site name, title (responsive sizing), optional excerpt, author/date metadata

### Edge Runtime Constraints

No Node.js APIs (fs, path, etc.), no native modules. All external resources (fonts, images) must be fetched at runtime via `fetch()`. Images are passed as URLs directly to `<img src>` in the JSX — Satori/`@vercel/og` handles fetching them during rendering.

### API-Only Mode

Set `OG_API_ONLY=true` to disable non-API frontend routes. The proxy (`proxy.ts`) returns `404` for frontend pages while keeping API routes and OG-required static assets available.
