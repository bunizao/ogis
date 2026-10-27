const GITHUB_URL = 'https://github.com/bunizao/ogis';

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
      { name: 'theme', description: 'pixel, modern, editorial or swiss. Anything else falls back to pixel.' },
      { name: 'accent', description: 'Hex colour for the tag, with or without #.' },
      { name: 'pixelFont', description: 'zpix, or geist-square, -circle, -line, -triangle, -grid. Pixel theme only.' },
    ],
  },
  {
    title: 'Images',
    params: [
      { name: 'image', description: 'Cover image. Pixel and modern sit on it; editorial and swiss inset it.' },
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
      <section id="api" className="scroll-mt-14 border-t border-[var(--border-0)]">
        <div className="mx-auto grid max-w-[var(--max-w)] gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-20">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.02em]">API</h2>
            <p className="mt-3 text-[15px] leading-[1.6] text-pretty text-[var(--text-1)]">
              One GET request that returns a PNG. Every parameter is optional.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-xl border border-[var(--border-1)] bg-[var(--bg-1)] px-4 py-3.5 font-mono text-[12.5px] leading-[1.75] text-[var(--text-1)]">
              <span className="text-[var(--text-0)]">GET</span> /api/og{'\n'}
              {'  '}?title=Interstellar{'\n'}
              {'  '}&amp;site=buxx.me{'\n'}
              {'  '}&amp;theme=editorial
            </pre>
            <a
              href={`${GITHUB_URL}#integration-guide`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block text-[14px] text-[var(--text-1)] underline decoration-[var(--border-2)] underline-offset-4 transition-colors hover:text-[var(--text-0)]"
            >
              Integration guides for Ghost, Next.js, Astro and Hugo
            </a>
          </div>

          <div className="grid gap-12">
            {PARAM_GROUPS.map(group => (
              <div key={group.title}>
                <h3 className="text-[13px] font-medium text-[var(--text-2)]">{group.title}</h3>
                <dl className="mt-3 border-t border-[var(--border-0)]">
                  {group.params.map(param => (
                    <div
                      key={param.name}
                      className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-6 gap-y-1 border-b border-[var(--border-0)] py-3.5 sm:grid-cols-[140px_minmax(0,1fr)_auto]"
                    >
                      <dt className="font-mono text-[13px] leading-[1.6] text-[var(--text-0)]">{param.name}</dt>
                      <dd className="text-[14px] leading-[1.55] text-pretty text-[var(--text-1)]">{param.description}</dd>
                      <dd className="col-start-2 font-mono text-[12px] leading-[1.6] text-[var(--text-2)] tabular-nums sm:col-start-3">
                        {param.limit ? `≤ ${param.limit}` : null}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}

            <div className="grid gap-8 sm:grid-cols-3">
              {NOTES.map(note => (
                <div key={note.title}>
                  <h3 className="text-[13px] font-medium text-[var(--text-0)]">{note.title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.55] text-pretty text-[var(--text-2)]">{note.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border-0)]">
        <div className="mx-auto flex max-w-[var(--max-w)] flex-col gap-4 px-4 py-10 text-[13px] text-[var(--text-2)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-3">
            <span className="font-pixel text-[14px] text-[var(--text-0)]">OGIS</span>
            <span>MIT licensed. Built on Next.js and @vercel/og.</span>
          </p>
          <p className="flex gap-5">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--text-0)]">
              GitHub
            </a>
            <a
              href="https://unsplash.com/photos/cluster-of-stars-in-the-sky-qVotvbsuM_c"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--text-0)]"
            >
              Starfield by Paul Lichtblau
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
