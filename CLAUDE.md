# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js-based Open Graph image generation service, originally for the Attegi Ghost theme. Renders 1200x630 social preview images in ten themes (`pixel`, `modern`, `editorial`, `swiss`, `terminal`, `gallery`, `postcard`, `bauhaus`, `blueprint`, `oil`). Deploys to Vercel or self-hosts from the `Dockerfile`.

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

**Runtime**: Next.js 16, App Router, Node.js runtime (Next 16.4 deprecated the Edge Runtime), `next/og` (Satori), TypeScript strict mode.

### Key Files

- `app/api/og/handler.tsx` — Main OG handler: route-key check, text sanitization and caps, accent parsing, image prefetch, theme dispatch.
- `app/api/og/themes/` — One file per theme, each exporting `loadFonts` + `render`. `index.ts` is the registry, `shared.tsx` holds `Img`, `Cover`, `FILL`, `fitFontSize`, `brightness`, `seededRandom` and the Fontsource loader, `font-data.ts` the per-instance font fetch cache, `public-files.ts` the disk reads for bundled fonts and images.
- `app/api/og/route.tsx` — `/api/og` wrapper around the shared handler.
- `app/api/[ogKey]/route.tsx` — `/api/<key>` wrapper for the `OG_API_PATH` alias and the legacy `OG_SECRET` path.
- `app/api/debug/route.ts` — `OG_ENABLE_DEBUG=true` only: reports why `image`/`icon`/`avatar` were accepted or rejected.
- `app/lib/og-remote-image.ts` — Server-side image loader with SSRF checks, size/time limits and format sniffing.
- `app/lib/og-route-keys.ts` — Which `/api/<key>` segments are served. `og` is always public.
- `app/lib/og-themes.ts` — Theme keys, labels and descriptions shared by the handler and the landing page.
- `app/lib/cover-photos.ts` — Unsplash sample covers for the playground picker, with credits (also listed in the README, which the footer links to).
- `app/lib/pixel-fonts.ts` — Pixel font registry shared by the landing page and the pixel theme.
- `app/page.tsx` — Interactive landing page with live preview form and API reference.
- `app/link-previews.tsx` — X, Slack and iMessage stand-ins that the playground shows the card inside.
- `components/ui/` — shadcn components (new-york, `radix-ui` package). Add more with `bunx shadcn@latest add <name>`, then point their `cn` import at `@/lib/utils`.
- `proxy.ts` — API-only mode gate (returns 404 for frontend routes when `OG_API_ONLY=true`).
- `public/default-bg.jpg` — Starfield used by `pixel`/`modern`/`gallery` when no image is given.
- `public/fonts/` — Pixel font TTFs (Zpix, Geist Pixel variants).
- `public/oil/` — Van Gogh brushwork details (The Met, CC0) and `impasto.png`, the light and shade of the Irises background, for the `oil` theme.
- `Dockerfile` — Standalone image; `.github/workflows/docker.yml` builds it on PRs and publishes it to GHCR from `main` and `v*` tags.

### Image Generation Flow

1. **GET `/api/og` or `/api/<alias>`** with `title`, `site`, `excerpt`, `author`, `date`, `reading`, `tag`, `accent`, `image`, `icon`, `avatar`, `theme`, `pixelFont`
2. **Route key** — unknown keys return 404. No signatures: they were removed because `/api/og` is public anyway; stale `sig`/`exp` params are ignored
3. **Images** — `loadRemoteImage()` fetches each URL server-side and inlines it as a data URL, so Satori never fetches user URLs itself. Rejected images become `null` and the theme lays out without them
4. **Fonts** — Pixel fonts read from `public/fonts/`; other themes load pinned Fontsource TTFs from jsdelivr (`https://cdn.jsdelivr.net/fontsource/fonts/<id>@5.3.0/latin-<weight>-<style>.ttf`). Satori needs TTF/OTF, not woff2
5. **Text** — Typographic dashes, smart quotes and Unicode spaces normalized; fields capped by code point
6. **Render** — Satori → PNG, cached with `s-maxage=86400, stale-while-revalidate=604800`

### Remote Image Rules (`og-remote-image.ts`)

- http(s) only, default ports, no credentials; rejects `localhost`, `.localhost`, `.local` and truncated URLs (`…`, `...`, under 20 chars)
- Hostnames resolved over DoH JSON: `dns.google`, then Cloudflare, AliDNS and DNSPod (`doh.pub`) for hosts in mainland China. Each provider gets 300ms before the next joins, failures hand over at once, first answer wins; 2s timeout, 10-minute bounded cache. Every resolved IP must be public (IPv4 and IPv6, IPv4-mapped delegated to IPv4)
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
- `next/og` defaults `cache-control` to revalidate on every request; the handler replaces it.

### Self-hosting Constraints

- Never fetch our own origin. Behind a proxy or a Docker port mapping the server often can't reach its public URL, so bundled fonts and images go through `readPublicFile`/`publicImage` (`public-files.ts`). Next's tracing follows that `path.join` and ships `public/` with the server build.
- Themes that draw bundled images load them in an async `render`.
- `output: 'standalone'` is only set when `NEXT_OUTPUT=standalone` (the Dockerfile does); `next start` warns about it otherwise.
- No native modules: the Dockerfile builds once on the build platform and copies the output into each target arch.

### Testing

- Bun's `mock.module` is process-wide and outlives `mock.restore()`, so it leaks into later test files. Prefer `spyOn` on real objects (see `tests/api/og.handler.test.ts`).
- `resolveOgRouteKeys()` runs at module load; tests that change env re-import the handler with a `?case=` query.

### API-Only Mode

Set `OG_API_ONLY=true` to disable non-API frontend routes. The proxy (`proxy.ts`) returns `404` for everything outside `/api/*` and `/_next/*`.
