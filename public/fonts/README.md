# Local Font Assets

This project localizes pixel-theme fonts under `public/fonts` so Edge rendering does not depend on third-party font CDNs at request time.

## Sources

- `zpix.ttf`
  - Source: `https://cdn.jsdelivr.net/gh/SolidZORO/zpix-pixel-font@v3.1.10/dist/zpix.ttf`
  - Upstream project: `https://github.com/SolidZORO/zpix-pixel-font`
  - Full font (7 MB), used by the landing page CSS.

- `zpix/zpix-NN.ttf`
  - `zpix.ttf` split into on-demand chunks for OG rendering; glyphs are unchanged.
  - `00` Latin (always loaded), `01` other non-CJK, `02` CJK punctuation, kana and the
    1000 most common Han characters, `03+` remaining Han characters by frequency.
  - The OG renderer picks chunks from the query text via `app/lib/zpix-chunks.ts`.
  - Regenerate both after changing `zpix.ttf`: `uv run --with fonttools scripts/split-zpix.py`

- `geist-pixel/*.ttf`
  - Source package: `geist@1.7.0`
  - Upstream project: `https://github.com/vercel/geist-font`
  - Original files are shipped as `woff2` and converted to `ttf` for `@vercel/og` compatibility.
  - License: see `public/fonts/geist-pixel/LICENSE.txt`
