# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based Open Graph (OG) image generation service designed for the Attegi Ghost theme. It dynamically generates social media preview images (1200x630px) with customizable backgrounds, themes, and metadata.

## Development Commands

```bash
# Install dependencies
bun install

# Start development server (http://localhost:3000)
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

## Architecture

### Core Technology Stack
- **Next.js 14** with App Router
- **Edge Runtime** for fast, globally distributed image generation
- **@vercel/og** (Satori) for React-based image rendering
- **TypeScript** with strict mode enabled

### Key Files
- `app/api/og/route.tsx` - Main OG image generation endpoint (Edge function)
- `app/api/debug/route.ts` - Debug endpoint for testing
- `next.config.js` - Next.js configuration (minimal)
- `tsconfig.json` - TypeScript configuration with path aliases (`@/*`)

### Image Generation Flow

1. **Request Handling**: GET request to `/api/og` with URL parameters
2. **Font Loading**: Fetch Zpix pixel font (TTF format) from jsdelivr CDN
3. **Image Pre-fetching**: Background and icon images are fetched and converted to base64 data URIs to ensure reliable rendering
4. **Text Sanitization**: Special characters (em dashes, smart quotes, etc.) are normalized
5. **Dynamic Rendering**: React JSX is rendered to PNG using Satori with responsive font sizing
6. **Caching**: CDN-friendly cache headers (24h s-maxage, 7d stale-while-revalidate)

### API Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Article title (truncated at 60 chars) |
| `site` | string | Yes | Site name for branding |
| `excerpt` | string | No | Article excerpt/subtitle (truncated at 80 chars) |
| `author` | string | No | Author name |
| `date` | string | No | Publication date |
| `image` | string | No | Background image URL (must be PNG/JPG/JPEG/GIF) |

**Note**: WebP, AVIF, and SVG formats are NOT supported by @vercel/og and will be filtered out.

### Font System

The service uses **Zpix** pixel font for a retro pixel aesthetic:
- **Zpix** - A pixel-style font supporting Latin, Chinese, Japanese, and Korean characters
- Font is loaded from jsdelivr CDN (`cdn.jsdelivr.net/gh/SolidZORO/zpix-pixel-font`)

**Important**: @vercel/og only supports TTF/OTF formats, NOT woff2. The font family stack is: `"Zpix", sans-serif`

### Image Handling

**Critical Implementation Detail**: All external images (background and icon) MUST be pre-fetched and converted to base64 data URIs before rendering. Direct URL references in the JSX will fail in production due to Edge runtime restrictions.

The `fetchImageAsBase64()` function:
- Fetches images with a custom User-Agent
- Converts to base64 data URIs
- Handles errors gracefully (returns empty string)
- Runs in parallel with font loading for performance

### URL Validation

The service includes special handling for:
- **Unsplash URLs**: Reconstructs truncated query parameters from URL search params
- **Format validation**: Checks for supported image formats (PNG, JPG, JPEG, GIF)
- **Protocol validation**: Only allows http/https protocols
- **Truncation detection**: Rejects URLs ending with `…` or `...`

### Design System

The OG card uses a minimalist "subtle frosted glass" aesthetic inspired by modern design:
- **Background**: Full-cover image without heavy overlays
- **Frosted glass**: Very subtle `backdrop-filter: blur(8px)` with near-transparent white gradient at bottom
- **Typography**: Pixel-style font (Zpix) for retro aesthetic, sizes 48-64px based on title length
- **Layout**: Bottom-aligned content with site branding (small square icon + name), large title, and optional metadata
- **Responsive sizing**: Title font size adjusts based on character count (48px for long, 64px for short)

### Edge Runtime Constraints

This service runs on Vercel's Edge Runtime, which has limitations:
- No Node.js APIs (fs, path, etc.)
- No native modules
- Limited to Web APIs and Edge-compatible packages
- All external resources must be fetched at runtime

## Deployment

Designed for Vercel deployment with automatic Edge function detection. The `export const runtime = 'edge'` declaration in `route.tsx` enables Edge Runtime.

## Cache Strategy

```
Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=604800
```

- Browser: No cache (max-age=0)
- CDN: 24 hours (s-maxage=86400)
- Stale content: Serve for 7 days while revalidating (stale-while-revalidate=604800)
