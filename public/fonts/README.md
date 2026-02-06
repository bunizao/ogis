# Local Font Assets

This project localizes pixel-theme fonts under `public/fonts` so Edge rendering does not depend on third-party font CDNs at request time.

## Sources

- `zpix.ttf`
  - Source: `https://cdn.jsdelivr.net/gh/SolidZORO/zpix-pixel-font@v3.1.10/dist/zpix.ttf`
  - Upstream project: `https://github.com/SolidZORO/zpix-pixel-font`

- `geist-pixel/*.ttf`
  - Source package: `geist@1.7.0`
  - Upstream project: `https://github.com/vercel/geist-font`
  - Original files are shipped as `woff2` and converted to `ttf` for `@vercel/og` compatibility.
  - License: see `public/fonts/geist-pixel/LICENSE.txt`
