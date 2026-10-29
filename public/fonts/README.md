# Bundled fonts

Every font a theme draws with ships here and is read from disk at render time, so a card never waits on a font CDN, including one a server in mainland China can't reach.

## Theme fonts

`<id>/latin-<weight>-<style>.ttf` are the latin TTF cuts from Fontsource 5.3.0:

```
https://cdn.jsdelivr.net/fontsource/fonts/<id>@5.3.0/latin-<weight>-<style>.ttf
```

All are under the SIL Open Font License 1.1, and each folder carries its `LICENSE`. To add a cut, download it from that URL into the family's folder.

CJK glyphs are not bundled: a full Noto CJK face is around 10 MB per weight. `app/api/og/themes/cjk-fonts.ts` fetches a subset with just the characters on the card instead.

## Pixel fonts

- `zpix.ttf`
  - Source: `https://cdn.jsdelivr.net/gh/SolidZORO/zpix-pixel-font@v3.1.10/dist/zpix.ttf`
  - Upstream project: `https://github.com/SolidZORO/zpix-pixel-font`

- `geist-pixel/*.ttf`
  - Source package: `geist@1.7.0`
  - Upstream project: `https://github.com/vercel/geist-font`
  - Original files are shipped as `woff2` and converted to `ttf` for Satori.
  - License: see `public/fonts/geist-pixel/LICENSE.txt`
