'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
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
import { ShortcutKeys } from '@/components/shortcut-keys';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const ShortcutsDialog = dynamic(() => import('@/components/shortcuts-dialog'), {
  ssr: false,
});

function preloadShortcutsDialog() {
  void import('@/components/shortcuts-dialog');
}

export default function HomeClient({ children }: { children: React.ReactNode }) {
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
  const [isNavOnDark, setIsNavOnDark] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

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
    setCopyMessage('Copied to clipboard');
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

  useEffect(() => {
    const navProbeY = 28;
    const darkSections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-nav-theme="dark"]')
    );
    const intersectingSections = new Set<Element>();
    let observer: IntersectionObserver | null = null;

    const observeDarkSections = () => {
      observer?.disconnect();
      intersectingSections.clear();

      const bottomMargin = Math.max(window.innerHeight - navProbeY - 1, 0);
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              intersectingSections.add(entry.target);
            } else {
              intersectingSections.delete(entry.target);
            }
          }
          setIsNavOnDark(intersectingSections.size > 0);
        },
        {
          rootMargin: `-${navProbeY}px 0px -${bottomMargin}px 0px`,
        }
      );

      for (const section of darkSections) {
        observer.observe(section);
      }
    };

    observeDarkSections();
    window.addEventListener('resize', observeDarkSections);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', observeDarkSections);
    };
  }, []);

  const modKey = isMac ? 'Cmd' : 'Ctrl';
  const generateKeys = [modKey, 'Enter'];
  const copyKeys = [modKey, 'Shift', 'C'];

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="scan-line" aria-hidden="true" />

      {showShortcuts ? (
        <ShortcutsDialog modKey={modKey} onOpenChange={setShowShortcuts} />
      ) : null}

      {/* ── Navigation ── */}
      <TooltipProvider delayDuration={300}>
        <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 backdrop-blur-xl backdrop-saturate-150 animate-[fade-up_0.5s_var(--ease)_both]',
          isNavOnDark
            ? 'border-b border-white/10 bg-[#07070a]/92 supports-[backdrop-filter]:bg-[#07070a]/80'
            : 'border-b border-[var(--border-0)] bg-[color-mix(in_srgb,var(--bg-0)_88%,transparent)]',
        )}
      >
        <div className="max-w-[var(--max-w)] mx-auto px-6 h-14 flex items-center justify-between">
          <span
            className={cn(
              'font-[var(--font-pixel)] text-xs font-semibold tracking-wide cursor-default',
              isNavOnDark ? 'text-[#eef0f8]' : 'text-[var(--text-0)]',
            )}
          >
            OGIS/
          </span>
          <div className="flex items-center gap-1.5">
            <a
              href="#preview"
              className={cn(
                'hidden md:inline-flex text-[13px] px-3 py-2 rounded-md transition-colors',
                isNavOnDark
                  ? 'text-[#9396ab] hover:text-[#f2f3fa] hover:bg-white/[0.08]'
                  : 'text-[var(--text-2)] hover:text-[var(--text-0)] hover:bg-[var(--border-0)]',
              )}
            >
              Preview
            </a>
            <a
              href="#api"
              className={cn(
                'hidden md:inline-flex text-[13px] px-3 py-2 rounded-md transition-colors',
                isNavOnDark
                  ? 'text-[#9396ab] hover:text-[#f2f3fa] hover:bg-white/[0.08]'
                  : 'text-[var(--text-2)] hover:text-[var(--text-0)] hover:bg-[var(--border-0)]',
              )}
            >
              API
            </a>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className={cn(
                    'text-sm hidden sm:inline-flex',
                    isNavOnDark
                      ? 'text-[#a4a7bb] border-white/16 bg-white/[0.02] hover:text-[#f2f3fa] hover:border-white/28 hover:bg-white/[0.08]'
                      : 'text-[var(--text-2)] border-[var(--border-1)] bg-transparent hover:text-[var(--text-0)] hover:border-[var(--border-2)] hover:bg-[var(--border-0)]',
                  )}
                  onClick={() => setShowShortcuts((s) => !s)}
                  onFocus={preloadShortcutsDialog}
                  onMouseEnter={preloadShortcutsDialog}
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
              className={cn(
                'text-[13px]',
                isNavOnDark
                  ? 'text-[#edf0fa] border-white/20 bg-white/[0.03] hover:bg-white/[0.12] hover:text-white hover:border-white/32'
                  : 'text-[var(--text-0)] border-[var(--border-2)] bg-transparent hover:bg-[var(--text-0)] hover:text-[var(--bg-0)] hover:border-[var(--text-0)]',
              )}
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
      </TooltipProvider>

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
                <TabsList className="grid h-10 w-full grid-cols-2 gap-2 bg-transparent p-0">
                  <TabsTrigger
                    value="pixel"
                    className="h-full rounded-lg border border-[var(--border-1)] bg-[var(--bg-1)] font-mono text-[11px] tracking-[0.12em] uppercase gap-2 text-[var(--text-2)] transition-[color,background-color,border-color] hover:text-[var(--text-1)] data-[state=active]:bg-[var(--bg-0)] data-[state=active]:text-[var(--text-0)] data-[state=active]:border-[var(--border-2)] data-[state=active]:shadow-none group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none"
                  >
                    pixel
                    <span className="text-[9px] text-current/55">1</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="modern"
                    className="h-full rounded-lg border border-[var(--border-1)] bg-[var(--bg-1)] font-mono text-[11px] tracking-[0.12em] uppercase gap-2 text-[var(--text-2)] transition-[color,background-color,border-color] hover:text-[var(--text-1)] data-[state=active]:bg-[var(--bg-0)] data-[state=active]:text-[var(--text-0)] data-[state=active]:border-[var(--border-2)] data-[state=active]:shadow-none group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none"
                  >
                    modern
                    <span className="text-[9px] text-current/55">2</span>
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
                onFocus={preloadShortcutsDialog}
                onMouseEnter={preloadShortcutsDialog}
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
              <span className="sr-only" role="status" aria-live="polite">
                {copyMessage}
              </span>
            </div>
          </div>
        </div>
      </main>

      {children}
    </>
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
          <span className="inline-flex items-center rounded-sm border border-[var(--border-1)] bg-[var(--bg-1)] px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-[0.03em] text-[var(--text-1)] leading-none">
            required
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
