import { Fragment } from 'react';
import { COVER_PHOTOS } from '@/app/lib/cover-photos';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const GITHUB_URL = 'https://github.com/bunizao/ogis';

// The bundled starfield first, then the playground's sample covers.
const PHOTOS = [
  { label: 'Starfield', author: 'Paul Lichtblau', page: 'https://unsplash.com/photos/cluster-of-stars-in-the-sky-qVotvbsuM_c' },
  ...COVER_PHOTOS,
];

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
        description: 'pixel, modern, editorial, swiss, terminal, gallery, postcard, bauhaus or blueprint. Anything else falls back to pixel.',
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
        description:
          'Cover image. Pixel and modern sit on it, editorial and swiss lay it out beside the text, gallery hangs it beside the label, postcard makes it the stamp, bauhaus cuts it into a quarter circle, blueprint prints it as a cyanotype. Terminal leaves it out.',
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
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-3">
            <span className="font-pixel text-base leading-none text-foreground">OGIS</span>
            <span>MIT licensed. Built on Next.js and @vercel/og.</span>
          </p>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
            GitHub
          </a>
        </div>
        <p className="mx-auto max-w-6xl px-4 pt-4 pb-10 text-xs leading-relaxed text-pretty text-muted-foreground sm:px-6">
          Photos from Unsplash:{' '}
          {PHOTOS.map((photo, index) => (
            <Fragment key={photo.page}>
              {index ? ', ' : null}
              <a href={photo.page} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
                {photo.label} by {photo.author}
              </a>
            </Fragment>
          ))}
          .
        </p>
      </footer>
    </>
  );
}
