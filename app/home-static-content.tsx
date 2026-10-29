import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const GITHUB_URL = 'https://github.com/bunizao/ogis';

// "OGIS" in Geist Pixel, traced from its Grid cut: one character per dot.
const WORDMARK = [
  '.....######............#######.......##.......######....',
  '...##########........###########.....##.....##########..',
  '..###......###......###.......###....##.....##......###.',
  '..##........##......##.........##....##....##........##.',
  '.##..........##....##...........##...##....##.........##',
  '.##..........##....##...........##...##....##.........##',
  '##............##..##.................##....##...........',
  '##............##..##.................##....###..........',
  '##............##..##.................##.....######......',
  '##............##..##.................##.......#######...',
  '##............##..##......########...##..........######.',
  '##............##..##......########...##.............###.',
  '##............##..##............##...##...............##',
  '.##..........##....##...........##...##....##.........##',
  '.##..........##....##...........##...##....##.........##',
  '..##........##......##..........##...##....##.........##',
  '..###......###......###........###...##.....##.......##.',
  '...##########........##########.##...##.....###########.',
  '.....######............#######..##...##.......#######...',
];

// The wordmark as a dot-matrix display: every cell holds a faint dot and the
// letters are the lit ones. SVG, so it spans the column at any width.
function Wordmark() {
  const width = WORDMARK[0].length;
  const height = WORDMARK.length;
  // A zero-length segment with a round cap draws one dot.
  const lit = WORDMARK.flatMap((row, y) => [...row].flatMap((cell, x) => (cell === '#' ? `M${x + 0.5} ${y + 0.5}h0` : []))).join('');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} aria-hidden className="mt-12 mb-5 block h-auto w-full sm:mt-16 sm:mb-8">
      <defs>
        <pattern id="wordmark-cell" width={1} height={1} patternUnits="userSpaceOnUse">
          <circle cx={0.5} cy={0.5} r={0.14} fill="currentColor" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#wordmark-cell)" opacity={0.1} />
      <path d={lit} stroke="currentColor" strokeWidth={0.6} strokeLinecap="round" />
    </svg>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-foreground/20 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/50"
    >
      {children}
    </a>
  );
}

type Param = { name: string; description: string; limit?: string };

const PARAM_GROUPS: Array<{ title: string; params: Param[] }> = [
  {
    title: 'Text',
    params: [
      { name: 'title', description: 'Headline. Defaults to “Untitled”.', limit: '200' },
      { name: 'site', description: 'Site or publication name. Defaults to “Blog”.', limit: '80' },
      { name: 'excerpt', description: 'A line or two under the title.', limit: '300' },
      { name: 'author', description: 'Byline.', limit: '80' },
      { name: 'date', description: 'Shown as written, e.g. Jan 5, 2026.', limit: '40' },
      { name: 'reading', description: 'Reading time, e.g. 5 min read.', limit: '40' },
      { name: 'tag', description: 'Category or kicker.', limit: '40' },
    ],
  },
  {
    title: 'Appearance',
    params: [
      {
        name: 'theme',
        description: 'pixel, modern, editorial, swiss, terminal, gallery, postcard, bauhaus, blueprint or oil. Anything else falls back to pixel.',
      },
      {
        name: 'accent',
        description: 'Hex colour, with or without #. Colours the tag, or the wall, ink, sheet or lead colour in the themes built around one.',
      },
      { name: 'pixelFont', description: 'zpix, or geist-square, -circle, -line, -triangle, -grid. Pixel theme only.' },
    ],
  },
  {
    title: 'Images',
    params: [
      {
        name: 'image',
        description: 'Cover image. Every theme uses it its own way, from a full-bleed background to a postcard stamp.',
      },
      { name: 'icon', description: 'Site icon beside the site name.' },
      { name: 'avatar', description: 'Author photo beside the byline.' },
    ],
  },
];

const NOTES = [
  {
    title: 'Images',
    body: 'Fetched by the server from public hosts only: up to 6 MB, PNG, JPEG, GIF or SVG. An image that fails is left out, never an error.',
  },
  {
    title: 'Caching',
    body: 'Fresh at the CDN for a day, then served stale for up to a week while it re-renders.',
  },
  {
    title: 'Self-hosting',
    body: 'Deploys to Vercel with no configuration. Set OG_API_ONLY=true to hide this page.',
  },
];

export default function HomeStaticContent() {
  return (
    <>
      <section id="api" className="scroll-mt-14 border-t">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">API</h2>
            <p className="mt-2 text-pretty text-muted-foreground">
              One GET request that returns a PNG. Every parameter is optional.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-lg border bg-muted/40 px-4 py-3.5 font-mono text-[13px] leading-[1.75] text-muted-foreground">
              <span className="text-foreground">GET</span> /api/og{'\n'}
              {'  '}?title=Interstellar{'\n'}
              {'  '}&amp;site=buxx.me{'\n'}
              {'  '}&amp;theme=editorial
            </pre>
            <a
              href={`${GITHUB_URL}#integration-guide`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block text-sm text-muted-foreground underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/50"
            >
              Integration guides for Ghost, Next.js, Astro and Hugo
            </a>
          </div>

          <div className="grid gap-10">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[112px] pl-4">Parameter</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="pr-4 text-right">Max</TableHead>
                  </TableRow>
                </TableHeader>
                {PARAM_GROUPS.map(group => (
                  <TableBody key={group.title} className="border-b last:border-b-0">
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={3} className="py-1.5 pl-4 text-xs font-medium text-muted-foreground">
                        {group.title}
                      </TableCell>
                    </TableRow>
                    {group.params.map(param => (
                      <TableRow key={param.name}>
                        <TableCell className="py-3 pl-4 align-top font-mono text-[13px]">{param.name}</TableCell>
                        <TableCell className="py-3 align-top whitespace-normal text-pretty text-muted-foreground">
                          {param.description}
                        </TableCell>
                        <TableCell className="py-3 pr-4 text-right align-top font-mono text-[13px] text-muted-foreground tabular-nums">
                          {param.limit ?? null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                ))}
              </Table>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {NOTES.map(note => (
                <div key={note.title}>
                  <h3 className="text-sm font-medium">{note.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{note.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
          <div className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <p>MIT licensed. Built on Next.js and @vercel/og.</p>
              <p className="mt-1.5 text-xs text-pretty">
                Sample photos from <FooterLink href="https://unsplash.com">Unsplash</FooterLink>, paintings by Van Gogh from{' '}
                <FooterLink href="https://www.metmuseum.org/hubs/open-access">The Met</FooterLink>.{' '}
                <FooterLink href={`${GITHUB_URL}#credits`}>Full credits</FooterLink>
              </p>
            </div>
            <nav className="flex gap-5 *:transition-colors *:hover:text-foreground">
              <a href="#playground">Playground</a>
              <a href="#api">API</a>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </nav>
          </div>

          <Wordmark />
        </div>
      </footer>
    </>
  );
}
