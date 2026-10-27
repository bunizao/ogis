'use client';

import { useEffect, useId, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { DEFAULT_OG_THEME, OG_THEMES, type OgThemeKey } from '@/app/lib/og-themes';
import { DEFAULT_PIXEL_FONT, PIXEL_FONT_OPTIONS, type PixelFontKey } from '@/app/lib/pixel-fonts';
import { ShortcutKeys } from '@/components/shortcut-keys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ShortcutsDialog = dynamic(() => import('@/components/shortcuts-dialog'), { ssr: false });

function preloadShortcutsDialog() {
  void import('@/components/shortcuts-dialog');
}

// Every render is a round trip to the edge, so wait for typing to pause.
const PREVIEW_DEBOUNCE_MS = 450;

const GITHUB_URL = 'https://github.com/bunizao/ogis';
const DEPLOY_URL = 'https://vercel.com/new/clone?repository-url=https://github.com/bunizao/ogis';

type Fields = {
  title: string;
  site: string;
  excerpt: string;
  author: string;
  date: string;
  reading: string;
  tag: string;
  image: string;
  icon: string;
  avatar: string;
  accent: string;
};

const SAMPLE: Fields = {
  title: 'Interstellar',
  site: 'buxx.me',
  excerpt: 'Do not go gentle into that good night.',
  author: 'bunizao',
  date: 'Jan 5, 2026',
  reading: '5 min read',
  tag: 'Essay',
  image: '',
  icon: '',
  avatar: '',
  accent: '',
};

// Keys follow the Fields order so generated URLs read naturally.
function buildQuery(fields: Fields, theme: OgThemeKey, pixelFont: PixelFontKey): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    const trimmed = value.trim();
    if (trimmed) params.set(key, key === 'accent' ? trimmed.replace(/^#/, '') : trimmed);
  }
  if (theme !== DEFAULT_OG_THEME) params.set('theme', theme);
  if (theme === 'pixel' && pixelFont !== DEFAULT_PIXEL_FONT) params.set('pixelFont', pixelFont);
  return params;
}

// Mirrors the handler: 3- or 6-digit hex, with or without `#`.
function parseHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{6}$/i.test(hex)) return `#${hex}`;
  if (/^[0-9a-f]{3}$/i.test(hex)) return `#${hex.replace(/./g, digit => digit + digit)}`;
  return null;
}

export default function HomeClient({ children }: { children: React.ReactNode }) {
  const [fields, setFields] = useState<Fields>(SAMPLE);
  const [theme, setTheme] = useState<OgThemeKey>(DEFAULT_OG_THEME);
  const [pixelFont, setPixelFont] = useState<PixelFontKey>(DEFAULT_PIXEL_FONT);
  const endpointPath = `/api/og?${buildQuery(fields, theme, pixelFont)}`;

  const [previewUrl, setPreviewUrl] = useState(endpointPath);
  const [settledUrl, setSettledUrl] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const isRendering = settledUrl !== previewUrl;

  const [origin, setOrigin] = useState('');
  const [isMac, setIsMac] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setPreviewUrl(endpointPath), PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [endpointPath]);

  const setField = (key: keyof Fields, value: string) => {
    setFields(current => ({ ...current, [key]: value }));
  };

  // Discrete choices re-render at once; only typing is debounced.
  const showNow = (nextTheme: OgThemeKey, nextFont: PixelFontKey) => {
    clearTimeout(debounceRef.current);
    setPreviewUrl(`/api/og?${buildQuery(fields, nextTheme, nextFont)}`);
  };

  const selectTheme = (next: OgThemeKey) => {
    setTheme(next);
    showNow(next, pixelFont);
  };

  const selectPixelFont = (next: PixelFontKey) => {
    setPixelFont(next);
    showNow(theme, next);
  };

  // The timestamp skips the browser and CDN caches.
  const refresh = () => {
    clearTimeout(debounceRef.current);
    const params = buildQuery(fields, theme, pixelFont);
    params.set('t', Date.now().toString());
    setPreviewUrl(`/api/og?${params}`);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(window.location.origin + endpointPath);
    setCopyMessage('Copied');
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyMessage(''), 2000);
  };

  // The global key handler is bound once; read the latest closures through a ref.
  const actionsRef = useRef({ refresh, copyUrl, selectTheme });
  actionsRef.current = { refresh, copyUrl, selectTheme };

  useEffect(() => {
    setOrigin(window.location.origin);
    setIsMac(navigator.platform?.toLowerCase().includes('mac') ?? false);

    // The server-rendered preview can finish loading before React attaches onLoad.
    const image = previewRef.current;
    if (image?.complete && image.naturalWidth > 0) setSettledUrl(image.getAttribute('src'));

    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const tag = document.activeElement?.tagName;
      const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (mod && event.key === 'Enter') {
        event.preventDefault();
        actionsRef.current.refresh();
        return;
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        void actionsRef.current.copyUrl();
        return;
      }
      if (event.key === 'Escape') {
        setShowShortcuts(false);
        (document.activeElement as HTMLElement | null)?.blur();
        return;
      }
      if (inField || mod) return;

      if (event.key === '/') {
        event.preventDefault();
        titleRef.current?.focus();
      } else if (event.key === '?') {
        event.preventDefault();
        setShowShortcuts(open => !open);
      } else {
        const option = OG_THEMES[Number(event.key) - 1];
        if (option) actionsRef.current.selectTheme(option.key);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(copyTimerRef.current);
    };
  }, []);

  const modKey = isMac ? 'Cmd' : 'Ctrl';
  const refreshKeys = [modKey, 'Enter'];
  const copyKeys = [modKey, 'Shift', 'C'];
  const shortcuts = [
    { label: 'Focus title', keys: ['/'] },
    { label: 'Switch theme', keys: OG_THEMES.flatMap((_, index) => (index ? ['/', `${index + 1}`] : ['1'])) },
    { label: 'Refresh preview', keys: refreshKeys },
    { label: 'Copy image URL', keys: copyKeys },
    { label: 'Toggle shortcuts', keys: ['?'] },
    { label: 'Close / unfocus', keys: ['Esc'] },
  ];

  const accentHex = parseHex(fields.accent);
  const kbdClassName = 'min-w-[18px] h-[18px] px-1 rounded-[4px] border-[var(--border-1)] bg-[var(--bg-2)] text-[10px] text-[var(--text-1)]';

  return (
    <>
      {showShortcuts ? <ShortcutsDialog shortcuts={shortcuts} onOpenChange={setShowShortcuts} /> : null}

      <header className="sticky top-0 z-40 border-b border-[var(--border-0)] bg-[color-mix(in_srgb,var(--bg-0)_86%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[var(--max-w)] items-center justify-between px-4 sm:px-6">
          <a href="#top" className="font-pixel text-[15px] tracking-[0.02em] text-[var(--text-0)]">
            OGIS
          </a>
          <nav className="flex items-center gap-1 text-[14px]">
            {[
              ['#themes', 'Themes'],
              ['#playground', 'Playground'],
              ['#api', 'API'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="hidden rounded-md px-3 py-2 text-[var(--text-1)] transition-colors hover:text-[var(--text-0)] sm:inline-flex"
              >
                {label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => setShowShortcuts(open => !open)}
              onFocus={preloadShortcutsDialog}
              onMouseEnter={preloadShortcutsDialog}
              aria-label="Show keyboard shortcuts"
              className="hidden size-9 items-center justify-center rounded-md font-mono text-[13px] text-[var(--text-1)] transition-colors hover:text-[var(--text-0)] md:inline-flex"
            >
              ?
            </button>
            <Button asChild variant="outline" size="sm" className="ml-2 border-[var(--border-1)] bg-transparent shadow-none">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section id="top" className="mx-auto max-w-[var(--max-w)] px-4 pt-20 pb-16 sm:px-6 md:pt-28 md:pb-20">
          <h1 className="max-w-[15ch] text-[clamp(40px,6vw,68px)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
            Open Graph images from a single URL.
          </h1>
          <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.6] text-pretty text-[var(--text-1)]">
            Put a title and a few details in the query string. OGIS renders a 1200{' × '}630 card at the
            edge, and your CDN keeps it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="active:scale-[0.97] transition-[background-color,scale]">
              <a href="#playground">Open the playground</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-[var(--border-1)] bg-transparent shadow-none active:scale-[0.97] transition-[background-color,scale]"
            >
              <a href={DEPLOY_URL} target="_blank" rel="noopener noreferrer">
                Deploy your own
              </a>
            </Button>
          </div>
        </section>

        <section id="themes" className="mx-auto max-w-[var(--max-w)] scroll-mt-14 px-4 pb-20 sm:px-6 md:pb-28">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Four themes</h2>
            <p className="text-[14px] text-[var(--text-2)]">The same post, set four ways. Pick one to try it.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {OG_THEMES.map((option, index) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={theme === option.key}
                onClick={() => {
                  selectTheme(option.key);
                  document.getElementById('playground')?.scrollIntoView({ block: 'start' });
                }}
                className="group rounded-xl text-left outline-none"
              >
                <span
                  className={cn(
                    'block overflow-hidden rounded-xl bg-[var(--bg-2)] shadow-[0_0_0_1px_var(--image-outline)] transition-shadow',
                    'group-hover:shadow-[0_0_0_1px_var(--border-2)] group-focus-visible:shadow-[0_0_0_2px_var(--text-0)]',
                    theme === option.key && 'shadow-[0_0_0_2px_var(--text-0)] group-hover:shadow-[0_0_0_2px_var(--text-0)]'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/og?${buildQuery(SAMPLE, option.key, DEFAULT_PIXEL_FONT)}`}
                    alt={`${option.label} theme example`}
                    width={1200}
                    height={630}
                    className="block aspect-[1200/630] w-full object-cover"
                  />
                </span>
                <span className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-[15px] font-medium">{option.label}</span>
                  <kbd className={cn('inline-flex items-center justify-center border font-mono pointer-coarse:hidden', kbdClassName)}>
                    {index + 1}
                  </kbd>
                </span>
                <span className="mt-1.5 block text-[14px] leading-[1.5] text-pretty text-[var(--text-2)]">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section id="playground" className="scroll-mt-14 border-t border-[var(--border-0)]">
          <div className="mx-auto max-w-[var(--max-w)] px-4 py-20 sm:px-6 md:py-28">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Playground</h2>
              <p className="text-[14px] text-[var(--text-2)]">Edit any field. The preview follows as you type.</p>
            </div>

            <div className="mt-8 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-16">
              <div className="lg:sticky lg:top-20">
                <div className="overflow-hidden rounded-xl bg-[var(--bg-2)] shadow-[0_0_0_1px_var(--image-outline),0_12px_40px_-12px_rgba(0,0,0,0.35)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={previewRef}
                    src={previewUrl}
                    alt="OG Preview"
                    width={1200}
                    height={630}
                    onLoad={() => {
                      setSettledUrl(previewUrl);
                      setPreviewFailed(false);
                    }}
                    onError={() => {
                      setSettledUrl(previewUrl);
                      setPreviewFailed(true);
                    }}
                    className={cn(
                      'block aspect-[1200/630] w-full object-cover transition-opacity duration-200',
                      isRendering && 'opacity-60'
                    )}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[13px] text-[var(--text-2)]" aria-live="polite">
                    {previewFailed && !isRendering ? 'Render failed. Try refreshing.' : isRendering ? 'Rendering…' : '1200 × 630 PNG'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refresh}
                      className="border-[var(--border-1)] bg-transparent shadow-none"
                    >
                      Refresh
                      <ShortcutKeys keys={refreshKeys} className="gap-0.5 pointer-coarse:hidden" kbdClassName={kbdClassName} separatorClassName="hidden" iconClassName="size-2.5" />
                    </Button>
                    <Button asChild variant="outline" size="sm" className="border-[var(--border-1)] bg-transparent shadow-none">
                      <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                        Open image
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-[var(--border-1)] bg-[var(--bg-1)]">
                  <div className="flex h-11 items-center justify-between gap-3 border-b border-[var(--border-0)] pr-1.5 pl-4">
                    <span className="text-[13px] font-medium text-[var(--text-1)]">Image URL</span>
                    <div className="flex items-center gap-2">
                      <span role="status" aria-live="polite" className="text-[13px] text-[var(--text-2)]">
                        {copyMessage}
                      </span>
                      <Button variant="ghost" size="sm" onClick={copyUrl} className="text-[13px]">
                        Copy
                        <ShortcutKeys keys={copyKeys} className="gap-0.5 pointer-coarse:hidden" kbdClassName={kbdClassName} separatorClassName="hidden" iconClassName="size-2.5" />
                      </Button>
                    </div>
                  </div>
                  <code className="block px-4 py-3.5 font-mono text-[12.5px] leading-[1.65] break-all text-[var(--text-1)]">
                    {origin}
                    {endpointPath}
                  </code>
                </div>
              </div>

              <form className="grid gap-9" onSubmit={event => event.preventDefault()}>
                <Group title="Theme">
                  <div role="radiogroup" aria-label="Theme" className="grid grid-cols-4 gap-1 rounded-[10px] bg-[var(--bg-2)] p-1">
                    {OG_THEMES.map(option => (
                      <button
                        key={option.key}
                        type="button"
                        role="radio"
                        aria-checked={theme === option.key}
                        onClick={() => selectTheme(option.key)}
                        className={cn(
                          'h-8 rounded-[6px] text-[13px] font-medium transition-[color,background-color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-2)]',
                          theme === option.key
                            ? 'bg-[var(--bg-0)] text-[var(--text-0)] shadow-[0_0_0_1px_var(--border-1),0_1px_2px_rgba(0,0,0,0.12)]'
                            : 'text-[var(--text-2)] hover:text-[var(--text-0)]'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {theme === 'pixel' ? (
                    <Field label="Pixel font">
                      {id => (
                        <Select value={pixelFont} onValueChange={value => selectPixelFont(value as PixelFontKey)}>
                          <SelectTrigger id={id} className={cn(inputClassName, 'w-full')}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-[var(--border-1)] bg-[var(--bg-1)]">
                            {PIXEL_FONT_OPTIONS.map(option => (
                              <SelectItem
                                key={option.key}
                                value={option.key}
                                style={{ fontFamily: `'${option.fontName}', monospace` }}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                  ) : null}
                </Group>

                <Group title="Text">
                  <TextField label="Title" value={fields.title} onChange={value => setField('title', value)} inputRef={titleRef} />
                  <TextField label="Site" value={fields.site} onChange={value => setField('site', value)} />
                  <TextField label="Excerpt" value={fields.excerpt} onChange={value => setField('excerpt', value)} />
                </Group>

                <Group title="Details">
                  <div className="grid grid-cols-2 gap-3">
                    <TextField label="Author" value={fields.author} onChange={value => setField('author', value)} />
                    <TextField label="Date" value={fields.date} onChange={value => setField('date', value)} />
                    <TextField label="Tag" value={fields.tag} onChange={value => setField('tag', value)} />
                    <TextField label="Reading time" value={fields.reading} onChange={value => setField('reading', value)} />
                  </div>
                </Group>

                <Group title="Images" hint="PNG, JPEG, GIF or SVG from a public host. Anything else is left out.">
                  <TextField label="Cover image" type="url" placeholder="https://" value={fields.image} onChange={value => setField('image', value)} />
                  <TextField label="Site icon" type="url" placeholder="https://" value={fields.icon} onChange={value => setField('icon', value)} />
                  <TextField label="Author avatar" type="url" placeholder="https://" value={fields.avatar} onChange={value => setField('avatar', value)} />
                </Group>

                <Group title="Accent" hint="Colours the tag. Empty uses the theme default.">
                  <div className="flex gap-2">
                    <label
                      className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md shadow-[inset_0_0_0_1px_var(--border-1)]"
                      style={{
                        background:
                          accentHex ??
                          'linear-gradient(to top right, transparent calc(50% - 0.5px), var(--border-2) 50%, transparent calc(50% + 0.5px)), var(--bg-1)',
                      }}
                    >
                      <span className="sr-only">Pick accent colour</span>
                      <input
                        type="color"
                        value={accentHex ?? '#888888'}
                        onChange={event => setField('accent', event.target.value)}
                        className="absolute inset-0 size-full cursor-pointer opacity-0"
                      />
                    </label>
                    <Input
                      aria-label="Accent hex"
                      placeholder="Theme default"
                      value={fields.accent}
                      onChange={event => setField('accent', event.target.value)}
                      spellCheck={false}
                      className={cn(inputClassName, 'font-mono')}
                    />
                  </div>
                </Group>
              </form>
            </div>
          </div>
        </section>

        {children}
      </main>
    </>
  );
}

const inputClassName =
  'h-9 border-[var(--border-1)] bg-[var(--bg-1)] text-base shadow-none placeholder:text-[var(--text-2)] focus-visible:border-[var(--border-2)] focus-visible:ring-[3px] focus-visible:ring-[var(--border-0)] md:text-[14px]';

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-3 text-[13px] font-medium text-[var(--text-0)]">{title}</legend>
      {children}
      {hint ? <p className="text-[13px] leading-[1.5] text-pretty text-[var(--text-2)]">{hint}</p> : null}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: (id: string) => React.ReactNode }) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[13px] text-[var(--text-1)]">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'url';
  placeholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <Field label={label}>
      {id => (
        <Input
          id={id}
          ref={inputRef}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={event => onChange(event.target.value)}
          spellCheck={false}
          autoComplete="off"
          className={inputClassName}
        />
      )}
    </Field>
  );
}
