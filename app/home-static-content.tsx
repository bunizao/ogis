import Image from 'next/image';
import { GitFork } from 'lucide-react';

export default function HomeStaticContent() {
  return (
    <>
      <section
        className="relative z-[1] bg-[#0a0a0c] text-[#e4e4ea] py-20 md:py-24 px-6 border-t border-[var(--border-1)]"
        id="api"
        data-nav-theme="dark"
      >
        <div className="max-w-[var(--max-w)] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10 lg:gap-20">
            <div>
              <h2 className="font-[var(--font-display)] text-[clamp(36px,5vw,52px)] font-bold leading-tight">
                API <em className="font-normal italic">Reference</em>
              </h2>
              <p className="mt-5 text-[#5a5a68] text-[15px] leading-relaxed">
                Simple GET request with URL parameters. Returns a PNG image
                (1200x630px) with customizable visual themes and full CJK
                character support.
              </p>
              <div className="mt-7 p-3.5 border border-white/8 rounded font-mono text-xs text-[#7a7a8a] break-all bg-white/[0.02]">
                GET /api/og?title=...&amp;site=...
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/8 rounded-lg overflow-hidden border border-white/6">
              <ParamCard
                name="title"
                type="string"
                required
                description="Article title (max 60 chars)"
              />
              <ParamCard
                name="site"
                type="string"
                required
                description="Site name for branding"
              />
              <ParamCard
                name="excerpt"
                type="string"
                description="Article excerpt (max 80 chars)"
              />
              <ParamCard name="author" type="string" description="Author name" />
              <ParamCard name="date" type="string" description="Publication date" />
              <ParamCard
                name="image"
                type="url"
                description="Background image (PNG/JPG/GIF)"
              />
              <ParamCard
                name="theme"
                type="string"
                description="Visual theme: pixel (default) or modern"
              />
              <ParamCard
                name="pixelFont"
                type="string"
                description="Pixel font for pixel theme (zpix/geist-*)"
              />
            </div>
          </div>

          <div className="mt-14 grid gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <StaticLabel className="border-white/22 bg-white/[0.05] text-[#eef0f8]">
                  Demo
                </StaticLabel>
                <p className="text-sm leading-relaxed text-[#87899c]">
                  Preview responses may be cached. Click{' '}
                  <span className="text-[#d5d7e6]">&quot;Generate&quot;</span> to refresh.
                  <span className="hidden sm:inline text-[#5f6171]"> · </span>
                  <a
                    href="https://github.com/bunizao/ogis#deployment"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#e8e9f3] underline underline-offset-2 hover:opacity-75"
                  >
                    Deploy your own instance
                  </a>
                  <span className="text-[#5f6171]"> · </span>
                  <a
                    href="https://github.com/bunizao/ogis#integration-guide"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#e8e9f3] underline underline-offset-2 hover:opacity-75"
                  >
                    Integration guide
                  </a>
                  .
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <StaticLabel className="border-white/15 bg-white/[0.03] text-[#9a9db0]">
                  Formats
                </StaticLabel>
                <p className="text-sm leading-relaxed text-[#87899c]">
                  Supported: <span className="text-[#d5d7e6]">PNG, JPG, JPEG, GIF</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer
        className="relative z-[1] py-10 px-6 bg-[linear-gradient(180deg,#0a0a0c_0%,#0d0d11_100%)] border-t border-white/8"
        data-nav-theme="dark"
      >
        <div className="max-w-[var(--max-w)] mx-auto flex flex-col items-center md:items-start md:flex-row md:justify-between gap-5">
          <div className="flex flex-col items-center gap-3 text-[13px] text-[#9899ad] text-center md:flex-row md:items-center md:gap-3 md:text-left md:flex-nowrap">
            <span className="inline-flex items-center gap-2 text-[#cfd0dd]">
              <Image
                src="/favicon.svg"
                alt="OGIS logo"
                width={16}
                height={16}
                className="size-4"
              />
              <span className="font-[var(--font-pixel)] text-xs tracking-[0.08em]">
                OGIS
              </span>
            </span>
            <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-2 md:flex-nowrap">
              <span className="text-[#6f7083] text-xs">Built with</span>
              <div className="flex flex-wrap items-center justify-center gap-2 md:flex-nowrap md:justify-start">
                <FooterBadgeLink
                  href="https://nextjs.org"
                  ariaLabel="Next.js website"
                  marker="N"
                  label="Next.js"
                  meta="App Router"
                />
                <FooterBadgeLink
                  href="https://vercel.com/docs/og-image-generation/og-image-api"
                  ariaLabel="Vercel OG documentation"
                  marker="▲"
                  label="@vercel/og"
                  meta="Edge OG"
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-2 md:flex-nowrap">
              <span className="text-[#6f7083] text-xs">Open source on</span>
              <div className="flex flex-wrap items-center justify-center gap-2 md:flex-nowrap md:justify-start">
                <FooterBadgeLink
                  href="https://github.com/bunizao/ogis"
                  ariaLabel="OGIS GitHub repository"
                  marker={<GitFork className="size-3" />}
                  label="bunizao/ogis"
                  meta="MIT"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-5 text-[13px] text-[#9899ad]">
            <span className="text-[#6f7083]">© 2026 bunizao</span>
          </div>
        </div>
      </footer>
    </>
  );
}

function StaticLabel({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] ${className}`}
    >
      {children}
    </span>
  );
}

function FooterBadgeLink({
  href,
  ariaLabel,
  marker,
  label,
  meta,
}: {
  href: string;
  ariaLabel: string;
  marker: React.ReactNode;
  label: string;
  meta: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/14 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#e7e8f1] whitespace-nowrap transition-[background-color,border-color,color] hover:bg-white/[0.08] hover:border-white/22 sm:gap-2.5 sm:px-3 sm:py-1.5 sm:text-[12px]"
    >
      <span className="inline-flex size-5 items-center justify-center rounded-full border border-white/20 bg-black/25 text-[9px] font-semibold text-white/90">
        {marker}
      </span>
      <span className="leading-none">{label}</span>
      <span className="hidden sm:inline text-[10px] text-[#8a8c9f] group-hover:text-[#b5b7cb] transition-colors">
        {meta}
      </span>
      <span className="text-[#76788b] group-hover:text-[#b7b9ce] transition-colors">↗</span>
    </a>
  );
}

function ParamCard({
  name,
  type,
  required,
  description,
}: {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}) {
  return (
    <div className="p-7 bg-[#101012] cursor-default">
      <div className="flex items-center gap-2.5 mb-2">
        <code className="font-mono text-sm font-medium text-[#ececf2]">{name}</code>
        {required ? (
          <span className="font-mono text-[10px] font-semibold tracking-[0.11em] uppercase px-2 py-0.5 border border-white/30 rounded text-[#eff0f8] bg-white/[0.06]">
            REQUIRED
          </span>
        ) : null}
      </div>
      <div className="font-mono text-[11px] text-[#b8bbcf] mb-2.5">{type}</div>
      <p className="text-[13px] text-[#999caf] leading-relaxed">{description}</p>
    </div>
  );
}
