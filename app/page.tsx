'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  DEFAULT_PIXEL_FONT,
  PIXEL_FONT_OPTIONS,
  type PixelFontKey,
} from '@/app/lib/pixel-fonts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowUp, Command, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [title, setTitle] = useState('Interstellar');
  const [site, setSite] = useState('buxx.me');
  const [excerpt, setExcerpt] = useState(
    'Do not go gentle into that good night.',
  );
  const [author, setAuthor] = useState('bunizao');
  const [date, setDate] = useState('2026-01-05');
  const [image, setImage] = useState('');
  const [theme, setTheme] = useState<'pixel' | 'modern'>('pixel');
  const [pixelFont, setPixelFont] = useState<PixelFontKey>(DEFAULT_PIXEL_FONT);
  const [previewUrl, setPreviewUrl] = useState('/preview.png');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  const buildParams = (withTimestamp = false) => {
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (site) params.set('site', site);
    if (excerpt) params.set('excerpt', excerpt);
    if (author) params.set('author', author);
    if (date) params.set('date', date);
    if (image) params.set('image', image);
    if (theme !== 'pixel') params.set('theme', theme);
    if (theme === 'pixel' && pixelFont !== DEFAULT_PIXEL_FONT)
      params.set('pixelFont', pixelFont);
    if (withTimestamp) params.set('t', Date.now().toString());
    return params;
  };

  const generateUrl = () => `/api/og?${buildParams().toString()}`;

  const handleGenerate = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setPreviewUrl(`/api/og?${buildParams(true).toString()}`);
  };

  const copyUrl = async () => {
    const fullUrl = window.location.origin + generateUrl();
    await navigator.clipboard.writeText(fullUrl);
    toast.success('Copied to clipboard');
  };

  const handleGenerateRef = useRef(handleGenerate);
  handleGenerateRef.current = handleGenerate;
  const copyUrlRef = useRef(copyUrl);
  copyUrlRef.current = copyUrl;

  const selectedPixelFont =
    PIXEL_FONT_OPTIONS.find((o) => o.key === pixelFont) ??
    PIXEL_FONT_OPTIONS[0];

  useEffect(() => {
    setIsMac(navigator.platform?.toLowerCase().includes('mac') ?? false);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const inInput =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT';

      if (mod && e.key === 'Enter') {
        e.preventDefault();
        handleGenerateRef.current();
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyUrlRef.current();
        return;
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        (document.activeElement as HTMLElement)?.blur();
        return;
      }

      if (inInput) return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          titleRef.current?.focus();
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts((s) => !s);
          break;
        case '1':
          setTheme('pixel');
          break;
        case '2':
          setTheme('modern');
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const modKey = isMac ? 'Cmd' : 'Ctrl';
  const generateKeys = [modKey, 'Enter'];
  const copyKeys = [modKey, 'Shift', 'C'];

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="scan-line" aria-hidden="true" />

      {/* Shortcuts Dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-md bg-[var(--bg-2)] border-[var(--border-1)]">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm tracking-wide">
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1 -mx-6 px-0">
            {[
              { label: 'Focus title', keys: ['/'] },
              { label: 'Switch theme', keys: ['1', '/', '2'] },
              { label: 'Generate preview', keys: [modKey, 'Enter'] },
              { label: 'Copy endpoint URL', keys: [modKey, 'Shift', 'C'] },
              { label: 'Toggle shortcuts', keys: ['?'] },
              { label: 'Close / unfocus', keys: ['Esc'] },
            ].map((shortcut) => (
              <div
                key={shortcut.label}
                className="flex items-center justify-between px-6 py-2.5"
              >
                <span className="text-sm text-[var(--text-1)]">
                  {shortcut.label}
                </span>
                <ShortcutKeys
                  keys={shortcut.keys}
                  kbdClassName="min-w-[28px] px-2 py-1 bg-[var(--bg-1)] border border-[var(--border-2)] rounded-md text-[10px] leading-none text-[var(--text-0)]"
                  separatorClassName="text-[10px] opacity-45"
                  dividerClassName="text-[10px] opacity-30 mx-0.5"
                  iconClassName="size-3.5"
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[color-mix(in_srgb,var(--bg-0)_85%,transparent)] backdrop-blur-xl backdrop-saturate-150 border-b border-[var(--border-0)] animate-[fade-up_0.5s_var(--ease)_both]">
        <div className="max-w-[var(--max-w)] mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-[var(--font-pixel)] text-xs font-semibold tracking-wide cursor-default">
            OGIS/
          </span>
          <div className="flex items-center gap-1.5">
            <a
              href="#preview"
              className="hidden md:inline-flex text-[13px] text-[var(--text-2)] px-3 py-2 rounded hover:text-[var(--text-0)] hover:bg-[var(--border-0)] transition-colors"
            >
              Preview
            </a>
            <a
              href="#api"
              className="hidden md:inline-flex text-[13px] text-[var(--text-2)] px-3 py-2 rounded hover:text-[var(--text-0)] hover:bg-[var(--border-0)] transition-colors"
            >
              API
            </a>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="text-[var(--text-2)] border-[var(--border-1)] bg-transparent hover:text-[var(--text-0)] hover:border-[var(--border-2)] text-sm hidden sm:inline-flex"
                  onClick={() => setShowShortcuts((s) => !s)}
                  aria-label="Show keyboard shortcuts"
                >
                  ?
                </Button>
              </TooltipTrigger>
              <TooltipContent>Keyboard shortcuts</TooltipContent>
            </Tooltip>
            <Button
              variant="outline"
              size="sm"
              className="text-[13px] border-[var(--border-2)] bg-transparent hover:bg-[var(--text-0)] hover:text-[var(--bg-0)] hover:border-[var(--text-0)]"
              asChild
            >
              <a
                href="https://github.com/bunizao/ogis"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub ↗
              </a>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="relative z-[1] max-w-[var(--max-w)] mx-auto pt-24 md:pt-28 pb-12 md:pb-14 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-16 items-end">
          <div>
            <p className="font-[var(--font-pixel)] text-[11px] tracking-[0.12em] uppercase text-[var(--text-2)] mb-4 animate-[fade-up_0.6s_var(--ease)_0.1s_both]">
              Open Graph Image Service
            </p>
            <h1 className="font-[var(--font-pixel)] text-[clamp(32px,6vw,56px)] font-normal leading-[1.1] tracking-[0.01em] animate-[fade-up_0.6s_var(--ease)_0.2s_both]">
              <span className="hero-title-expand" aria-label="Dynamic">
                <span className="hero-title-short" aria-hidden="true">
                  OGIS
                </span>
                <span className="hero-title-full" aria-hidden="true">
                  Dynamic
                </span>
              </span>
              <br />
              <span className="hero-title-accent-reveal">Social</span>
              <br />
              <span className="italic font-normal hero-title-accent-reveal" style={{ animationDelay: '1.1s' }}>
                Images
              </span>
            </h1>
          </div>
          <div className="lg:border-l lg:border-[var(--border-1)] lg:pl-10 border-t lg:border-t-0 border-[var(--border-1)] pt-7 lg:pt-0 animate-[fade-up_0.6s_var(--ease)_0.4s_both]">
            <p className="text-base text-[var(--text-1)] leading-relaxed max-w-[400px]">
              A dynamic Open Graph image generation service with multiple visual
              themes. Built on Next.js and Vercel Edge Runtime for fast, globally
              distributed generation.
            </p>
          </div>
        </div>
      </header>

      {/* ── Workspace ── */}
      <main className="relative z-[1] max-w-[var(--max-w)] mx-auto py-16 md:py-20 px-6" id="preview">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-12 lg:gap-20 animate-[fade-up_0.6s_var(--ease)_0.3s_both]">
          {/* Form Panel */}
          <div>
            <div className="form-card lg:sticky lg:top-20">
              <h2 className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--text-2)] mb-8">
                Parameters
              </h2>

              {/* Theme Toggle */}
              <Tabs
                value={theme}
                onValueChange={(v) => setTheme(v as 'pixel' | 'modern')}
                className="mb-7"
              >
                <TabsList className="w-full bg-[var(--bg-1)] border border-[var(--border-1)]">
                  <TabsTrigger value="pixel" className="flex-1 font-mono text-[11px] tracking-wider uppercase gap-2">
                    pixel
                    <kbd className="opacity-40 text-[9px]">1</kbd>
                  </TabsTrigger>
                  <TabsTrigger value="modern" className="flex-1 font-mono text-[11px] tracking-wider uppercase gap-2">
                    modern
                    <kbd className="opacity-40 text-[9px]">2</kbd>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Pixel Font Selector */}
              {theme === 'pixel' && (
                <div className="mb-5">
                  <label className="flex items-center gap-2 text-[12px] font-medium tracking-wide uppercase text-[var(--text-1)] mb-2">
                    Pixel Font
                  </label>
                  <Select
                    value={pixelFont}
                    onValueChange={(v) => setPixelFont(v as PixelFontKey)}
                  >
                    <SelectTrigger
                      className="w-full text-sm bg-[var(--bg-1)] border-[var(--border-1)]"
                      style={{ fontFamily: `'${selectedPixelFont.fontName}', monospace` }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--bg-2)] border-[var(--border-1)]">
                      {PIXEL_FONT_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.key}
                          value={option.key}
                          className="text-sm"
                          style={{ fontFamily: `'${option.fontName}', monospace` }}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-5">
                <FormField label="Title" required>
                  <Input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-transparent border-0 border-b border-[var(--border-1)] rounded-none px-0 py-3 text-[15px] font-[var(--font-body)] focus-visible:ring-0 focus-visible:border-[var(--text-0)] shadow-none"
                  />
                </FormField>
                <FormField label="Site" required>
                  <Input
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    className="bg-transparent border-0 border-b border-[var(--border-1)] rounded-none px-0 py-3 text-[15px] font-[var(--font-body)] focus-visible:ring-0 focus-visible:border-[var(--text-0)] shadow-none"
                  />
                </FormField>
                <FormField label="Excerpt">
                  <Input
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="bg-transparent border-0 border-b border-[var(--border-1)] rounded-none px-0 py-3 text-[15px] font-[var(--font-body)] focus-visible:ring-0 focus-visible:border-[var(--text-0)] shadow-none"
                  />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Author">
                    <Input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="bg-transparent border-0 border-b border-[var(--border-1)] rounded-none px-0 py-3 text-[15px] font-[var(--font-body)] focus-visible:ring-0 focus-visible:border-[var(--text-0)] shadow-none"
                    />
                  </FormField>
                  <FormField label="Date">
                    <Input
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-transparent border-0 border-b border-[var(--border-1)] rounded-none px-0 py-3 text-[15px] font-[var(--font-body)] focus-visible:ring-0 focus-visible:border-[var(--text-0)] shadow-none"
                    />
                  </FormField>
                </div>
                <FormField label="Image URL">
                  <Input
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="bg-transparent border-0 border-b border-[var(--border-1)] rounded-none px-0 py-3 text-[15px] font-[var(--font-body)] focus-visible:ring-0 focus-visible:border-[var(--text-0)] shadow-none"
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="animate-[fade-up_0.6s_var(--ease)_0.45s_both]">
            <h2 className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--text-2)] mb-6">
              Preview
            </h2>

            <p className="mb-5 text-[13px] text-[var(--text-2)] leading-relaxed">
              Fill in the form, then hit{' '}
              <ShortcutKeys
                keys={generateKeys}
                className="text-[10px] font-mono text-[var(--text-1)]"
                kbdClassName="min-w-[24px] px-1.5 py-0.5 bg-[var(--bg-2)] border border-[var(--border-2)] rounded-md text-[11px] text-[var(--text-0)]"
                separatorClassName="text-[var(--text-2)]"
              />{' '}
              to generate.{' '}
              <button
                onClick={() => setShowShortcuts(true)}
                className="text-[var(--text-1)] underline underline-offset-2 decoration-[var(--border-2)] hover:text-[var(--text-0)] transition-colors cursor-pointer"
              >
                More shortcuts
              </button>
            </p>

            {/* Preview Frame */}
            <div
              className={`preview-frame relative rounded-lg overflow-hidden${isGenerating ? ' preview-loading' : ''}`}
            >
              <div className="preview-frame-inner relative rounded-[7px] overflow-hidden bg-[var(--bg-0)] aspect-[1200/630] border border-[var(--border-2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full block object-cover"
                  src={previewUrl}
                  alt="OG Preview"
                  onLoad={() => setIsGenerating(false)}
                  onError={() => setIsGenerating(false)}
                />
              </div>
            </div>

            {/* Actions below preview */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <span className="font-mono text-[11px] text-[var(--text-2)]">
                1200 × 630
              </span>
              <div className="flex gap-2.5 flex-wrap">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="font-mono text-xs gap-2 bg-[var(--text-0)] text-[var(--bg-0)] hover:bg-[var(--text-1)] border-0 shadow-[0_0_0_1px_var(--border-2)]"
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-pulse">generating</span>
                      <span className="animate-[blink_1.2s_step-end_infinite]">_</span>
                    </>
                  ) : (
                    <>
                      Generate
                      <ShortcutKeys
                        keys={generateKeys}
                        className="text-[9px] font-mono text-current/70"
                        kbdClassName="min-w-[18px] px-1 py-0.5 border border-current/45 bg-current/10 rounded-sm text-current"
                        separatorClassName="text-current/50"
                        iconClassName="size-3"
                      />
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="font-mono text-xs border-[var(--border-2)] bg-transparent hover:bg-[var(--accent-muted)] hover:border-[var(--text-1)]"
                  asChild
                >
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Full Size ↗
                  </a>
                </Button>
              </div>
            </div>

            {/* Endpoint URL */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--text-2)]">
                  Endpoint
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-[11px] text-[var(--text-1)] h-auto py-1 px-2 gap-1.5 hover:text-[var(--text-0)]"
                  onClick={copyUrl}
                >
                  Copy
                  <ShortcutKeys
                    keys={copyKeys}
                    className="text-[10px] font-mono text-current"
                    kbdClassName="min-w-[18px] px-1 py-0.5 border border-[var(--border-2)] bg-[var(--bg-1)] rounded-sm text-current"
                    separatorClassName="text-current/55"
                    iconClassName="size-3"
                  />
                </Button>
              </div>
              <div className="endpoint-box font-mono text-xs text-[var(--text-1)] p-4 bg-[var(--bg-1)] border border-[var(--border-1)] rounded break-all leading-relaxed">
                {generateUrl()}
                <span className="endpoint-cursor" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── API Reference ── */}
      <section
        className="relative z-[1] bg-[#0a0a0c] text-[#e4e4ea] py-20 md:py-24 px-6 border-t border-[var(--border-1)]"
        id="api"
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
              <ParamCard
                name="author"
                type="string"
                description="Author name"
              />
              <ParamCard
                name="date"
                type="string"
                description="Publication date"
              />
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

          {/* Notes */}
          <div className="mt-16 grid gap-3">
            <div className="flex items-start gap-4 p-5 border border-white/8 rounded bg-white/[0.02]">
              <span className="font-mono text-[10px] font-semibold tracking-[0.1em] shrink-0 mt-0.5 text-[#e4e4ea]">
                DEMO
              </span>
              <p className="text-sm text-[#7a7a8a] leading-relaxed">
                This is a demo site for demonstration purposes only. Preview
                images are cached and only regenerated when you click
                &quot;Generate Preview&quot;. For production use, please{' '}
                <a
                  href="https://github.com/bunizao/ogis#deployment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#e4e4ea] underline underline-offset-2 hover:opacity-70"
                >
                  deploy your own instance
                </a>
                .
              </p>
            </div>
            <div className="flex items-start gap-4 p-5 border border-white/8 rounded">
              <span className="font-mono text-[10px] font-semibold tracking-[0.1em] shrink-0 mt-0.5 text-[#52525e]">
                NOTE
              </span>
              <p className="text-sm text-[#7a7a8a] leading-relaxed">
                WebP, AVIF, and SVG formats are not supported due to Edge
                Runtime constraints. Use PNG, JPG, JPEG, or GIF for background
                images.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-[1] py-8 px-6 bg-[#0a0a0c] border-t border-white/6">
        <div className="max-w-[var(--max-w)] mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6 text-[13px] text-[#5a5a68]">
            <span className="font-[var(--font-pixel)] text-xs text-[#7a7a8a]">OGIS</span>
            <span>Built with Next.js and @vercel/og</span>
          </div>
          <div className="flex items-center gap-5 text-[13px] text-[#5a5a68]">
            <a
              href="https://github.com/bunizao/ogis"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#e4e4ea] transition-colors"
            >
              GitHub
            </a>
            <span>MIT License</span>
            <span className="text-[#3a3a46]">© 2026 bunizao</span>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ── Sub-components ── */

function ShortcutKeys({
  keys,
  className,
  kbdClassName,
  separatorClassName,
  dividerClassName,
  iconClassName,
}: {
  keys: string[];
  className?: string;
  kbdClassName?: string;
  separatorClassName?: string;
  dividerClassName?: string;
  iconClassName?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {keys.map((key, index) => {
        const prev = keys[index - 1];
        const showPlus = index > 0 && key !== '/' && prev !== '/';

        return (
          <span key={`${key}-${index}`} className="inline-flex items-center gap-1">
            {showPlus && (
              <span className={cn('text-current/55', separatorClassName)}>
                +
              </span>
            )}
            {key === '/' ? (
              <span className={cn('mx-0.5 text-[10px] opacity-30', dividerClassName)}>
                /
              </span>
            ) : (
              <ShortcutKeycap
                value={key}
                className={kbdClassName}
                iconClassName={iconClassName}
              />
            )}
          </span>
        );
      })}
    </span>
  );
}

function ShortcutKeycap({
  value,
  className,
  iconClassName,
}: {
  value: string;
  className?: string;
  iconClassName?: string;
}) {
  const iconMap = {
    Cmd: Command,
    Enter: CornerDownLeft,
    Shift: ArrowUp,
  } as const;
  const Icon = iconMap[value as keyof typeof iconMap];
  const symbolClassName = cn('text-[0.95em] leading-none', iconClassName);
  const keySymbol = value === 'Ctrl' ? '⌃' : null;

  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 border rounded-md font-mono leading-none',
        className,
      )}
    >
      {Icon ? (
        <>
          <Icon className={cn('size-3.5', iconClassName)} aria-hidden="true" />
          <span className="sr-only">{value}</span>
        </>
      ) : keySymbol ? (
        <>
          <span className={symbolClassName} aria-hidden="true">
            {keySymbol}
          </span>
          <span className="sr-only">{value}</span>
        </>
      ) : (
        value
      )}
    </kbd>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-[12px] font-medium tracking-wide text-[var(--text-1)] mb-1.5 uppercase">
        {label}
        {required && (
          <span className="inline-flex items-center text-[11px] text-[var(--text-0)] font-bold tracking-[0.08em] px-2.5 py-0.5 border border-[var(--text-1)] bg-[var(--bg-2)] rounded-sm leading-none">
            REQUIRED
          </span>
        )}
      </label>
      {children}
    </div>
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
        <code className="font-mono text-sm font-medium text-[#ececf2]">
          {name}
        </code>
        {required && (
          <span className="font-mono text-[10px] font-semibold tracking-[0.11em] uppercase px-2 py-0.5 border border-white/30 rounded text-[#eff0f8] bg-white/[0.06]">
            REQUIRED
          </span>
        )}
      </div>
      <div className="font-mono text-[11px] text-[#b8bbcf] mb-2.5">{type}</div>
      <p className="text-[13px] text-[#999caf] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
