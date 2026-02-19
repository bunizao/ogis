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

- `app/api/og/handler.tsx` — Main OG image handler (Edge function logic, SSRF protection, URL validation, text sanitization, and Satori JSX rendering).
- `app/api/og/route.tsx` — Legacy/default route wrapper (`/api/og`) that delegates to the shared handler.
- `app/api/[ogKey]/route.tsx` — Configurable API-path route wrapper (`/api/<OG_API_PATH>`).
- `app/api/og-config/route.ts` — Runtime endpoint metadata (`endpoint`, `signatureRequired`) for UI/tooling.
- `app/api/debug/route.ts` — Debug endpoint returning JSON diagnostics for URL reconstruction/validation.
- `app/page.tsx` — Interactive landing page with live preview form, dark/light mode support, and API reference section.
- `app/layout.tsx` — Root layout with metadata and OpenGraph tags.
- `public/default-bg.jpg` — Default starry sky background when no image URL is provided.

### Image Generation Flow

1. **GET `/api/<OG_API_PATH>`** receives URL parameters (`title`, `site`, `excerpt`, `author`, `date`, `image`)
2. **SSRF validation** — Image URLs go through `parsePublicImageUrl()`: protocol check, hostname blocking, DNS resolution via Google DNS (`dns.google/resolve`), IPv4/IPv6 public IP validation
3. **Unsplash URL reconstruction** — Truncated Unsplash query params are recovered from the top-level search params
4. **Format filtering** — Only PNG/JPG/JPEG/GIF allowed; WebP/AVIF/SVG rejected (Satori limitation)
5. **Font loading** — Zpix TTF fetched from jsdelivr CDN (must be TTF/OTF, not woff2)
6. **Text sanitization** — Em dashes, smart quotes, Unicode whitespace normalized
7. **Satori rendering** — React JSX rendered to PNG with responsive font sizing (88px short titles, 72px medium, 56px long 40+ chars)
8. **Caching** — `s-maxage=86400, stale-while-revalidate=604800`

### SSRF Protection Layer

The largest portion of `route.tsx` (~lines 31–208) implements defense against Server-Side Request Forgery:

- **DNS resolution** via `dns.google/resolve` API with 2s timeout and 10-minute cache (`dnsCache` Map)
- **IPv4 validation** — Blocks RFC 1918, loopback, link-local, and all non-routable ranges
- **IPv6 validation** — Blocks `::1`, ULA (`fc00::/7`), link-local (`fe80::/10`), multicast, documentation ranges, and IPv4-mapped addresses (delegates to IPv4 check)
- **Hostname blocking** — Rejects `localhost`, `.localhost`, `.local`
- **URL sanitization** — Rejects non-http(s) protocols, URLs with credentials, non-standard ports, truncated URLs (`…`/`...`), and URLs shorter than 20 chars

### Design System

- **Frosted glass**: Bottom gradient overlay with `backdrop-filter: blur(16px)`
- **Layout**: Bottom-aligned content — site name, title (responsive sizing), optional excerpt, author/date metadata
- **Font**: Zpix pixel font (single font covers Latin + CJK characters)

### Edge Runtime Constraints

No Node.js APIs (fs, path, etc.), no native modules. All external resources (fonts, images) must be fetched at runtime via `fetch()`. Images are passed as URLs directly to `<img src>` in the JSX — Satori/`@vercel/og` handles fetching them during rendering.

### API-Only Mode

Set `OG_API_ONLY=true` to disable non-API frontend routes. Middleware returns `404` for frontend pages while keeping API routes and OG-required static assets available.
