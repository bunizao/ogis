'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Check, Copy, ExternalLink, Keyboard, RotateCw } from 'lucide-react';
import { DEFAULT_OG_THEME, OG_THEMES, type OgThemeKey } from '@/app/lib/og-themes';
import { DEFAULT_PIXEL_FONT, PIXEL_FONT_OPTIONS, type PixelFontKey } from '@/app/lib/pixel-fonts';
import { ChatUnfurl, FeedPost, MessageBubble } from '@/app/link-previews';
import { ShortcutKeys } from '@/components/shortcut-keys';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

const CONTEXTS = [
  { key: 'image', label: 'Image' },
  { key: 'feed', label: 'X' },
  { key: 'chat', label: 'Slack' },
  { key: 'message', label: 'iMessage' },
] as const;

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

// Link previews show a domain; use the site name when it looks like one.
function previewDomain(site: string): string {
  const value = site.trim().toLowerCase();
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(value) ? value : 'example.com';
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
  const [copied, setCopied] = useState(false);

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
    setCopied(true);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
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
    { label: 'Close or unfocus', keys: ['Esc'] },
  ];

  const accentHex = parseHex(fields.accent);
  const themeOption = OG_THEMES.find(option => option.key === theme) ?? OG_THEMES[0];
  const status = previewFailed && !isRendering ? 'Render failed. Try refreshing.' : isRendering ? 'Rendering…' : '1200 × 630 PNG';

  const previewImage = (className?: string) => (
    // eslint-disable-next-line @next/next/no-img-element
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
      className={cn('block aspect-[1200/630] w-full object-cover transition-opacity duration-200', isRendering && 'opacity-50', className)}
    />
  );

  const linkPreview = {
    image: previewImage(),
    title: fields.title.trim() || 'Untitled',
    site: fields.site.trim() || 'Blog',
    excerpt: fields.excerpt.trim(),
    author: fields.author.trim(),
    domain: previewDomain(fields.site),
  };

  return (
    <TooltipProvider delayDuration={300}>
      {showShortcuts ? <ShortcutsDialog shortcuts={shortcuts} onOpenChange={setShowShortcuts} /> : null}

      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="font-pixel text-xl leading-none">
            OGIS
          </a>
          <nav className="flex items-center gap-1">
            {[
              ['#playground', 'Playground'],
              ['#api', 'API'],
            ].map(([href, label]) => (
              <Button key={href} asChild variant="ghost" size="sm" className="hidden text-muted-foreground hover:text-foreground sm:inline-flex">
                <a href={href}>{label}</a>
              </Button>
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowShortcuts(open => !open)}
                  onFocus={preloadShortcutsDialog}
                  onMouseEnter={preloadShortcutsDialog}
                  aria-label="Show keyboard shortcuts"
                  className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
                >
                  <Keyboard />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Keyboard shortcuts <Kbd>?</Kbd>
              </TooltipContent>
            </Tooltip>
            <Button asChild variant="outline" size="sm" className="ml-1">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section
          id="top"
          className="mx-auto grid max-w-6xl gap-12 px-4 pt-16 pb-20 sm:px-6 md:pt-24 md:pb-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-16"
        >
          <div>
            <h1 className="font-pixel text-[clamp(44px,6.4vw,76px)] leading-[0.95] text-balance">
              Social cards from a URL.
            </h1>
            <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-pretty text-muted-foreground">
              Put a title and a few details in the query string. OGIS renders a 1200{' × '}630 card at the
              edge, and your CDN keeps it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#playground">Try the playground</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={DEPLOY_URL} target="_blank" rel="noopener noreferrer">
                  Deploy to Vercel
                </a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {OG_THEMES.map((option, index) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={theme === option.key}
                onClick={() => {
                  selectTheme(option.key);
                  document.getElementById('playground')?.scrollIntoView({ block: 'start' });
                }}
                className="group rounded-lg text-left outline-none"
              >
                <span
                  className={cn(
                    'block overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10 transition-shadow',
                    'group-hover:ring-foreground/25 group-focus-visible:ring-2 group-focus-visible:ring-ring',
                    theme === option.key && 'ring-2 ring-foreground group-hover:ring-foreground'
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
                <span className="mt-2.5 flex items-center justify-between gap-2 text-sm">
                  <span className={cn('font-medium', theme !== option.key && 'text-muted-foreground group-hover:text-foreground')}>
                    {option.label}
                  </span>
                  <Kbd className="pointer-coarse:hidden">{index + 1}</Kbd>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section id="playground" className="scroll-mt-14 border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
            <h2 className="text-2xl font-semibold tracking-tight">Playground</h2>
            <p className="mt-2 text-muted-foreground">Edit any field. The preview follows as you type.</p>

            {/* overflow-clip, not hidden: hidden would make this the scroll container and break the sticky preview. */}
            <div className="mt-8 grid overflow-clip rounded-xl border bg-card shadow-sm lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0 border-b lg:sticky lg:top-14 lg:self-start lg:border-b-0">
                <Tabs defaultValue="image" className="gap-0">
                  <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-4">
                    <TabsList aria-label="Preview as">
                      {CONTEXTS.map(context => (
                        <TabsTrigger key={context.key} value={context.key} className="px-2.5">
                          {context.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <div className="flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-sm" onClick={refresh} aria-label="Refresh preview">
                            <RotateCw />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Refresh <ShortcutKeys keys={refreshKeys} />
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="ghost" size="icon-sm">
                            <a href={previewUrl} target="_blank" rel="noopener noreferrer" aria-label="Open image in a new tab">
                              <ExternalLink />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open image</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="flex min-h-[300px] items-center p-4 sm:min-h-[420px] sm:p-8">
                    <TabsContent value="image">
                      <div className="overflow-hidden rounded-lg ring-1 ring-foreground/10">{previewImage()}</div>
                    </TabsContent>
                    <TabsContent value="feed">
                      <FeedPost {...linkPreview} />
                    </TabsContent>
                    <TabsContent value="chat">
                      <ChatUnfurl {...linkPreview} />
                    </TabsContent>
                    <TabsContent value="message">
                      <MessageBubble {...linkPreview} />
                    </TabsContent>
                  </div>
                </Tabs>

                <div className="border-t p-3 sm:p-4">
                  <InputGroup>
                    <InputGroupTextarea
                      readOnly
                      aria-label="Image URL"
                      value={origin + endpointPath}
                      rows={2}
                      className="min-h-0 font-mono text-[13px] leading-relaxed break-all md:text-[13px]"
                    />
                    <InputGroupAddon align="block-end" className="justify-between border-t py-2">
                      <span className="flex items-center gap-2 text-xs font-normal" aria-live="polite">
                        {/* The text beside it already announces the state. */}
                        {isRendering ? <Spinner role="presentation" aria-hidden="true" aria-label={undefined} className="size-3.5" /> : null}
                        {status}
                      </span>
                      <span className="flex items-center gap-2">
                        <span role="status" className="sr-only">
                          {copied ? 'Copied' : ''}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InputGroupButton variant="secondary" size="sm" onClick={copyUrl}>
                              {copied ? <Check /> : <Copy />}
                              {copied ? 'Copied' : 'Copy'}
                            </InputGroupButton>
                          </TooltipTrigger>
                          <TooltipContent>
                            Copy image URL <ShortcutKeys keys={copyKeys} />
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </div>

              <form className="p-5 sm:p-6 lg:border-l" onSubmit={event => event.preventDefault()}>
                <FieldGroup className="gap-6">
                  <FieldSet className="gap-3">
                    <FieldLegend variant="label" className="mb-3 text-muted-foreground">
                      Theme
                    </FieldLegend>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={theme}
                      onValueChange={value => value && selectTheme(value as OgThemeKey)}
                      aria-label="Theme"
                      className="w-full"
                    >
                      {OG_THEMES.map(option => (
                        <ToggleGroupItem key={option.key} value={option.key} className="flex-1 px-2">
                          {option.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                    <FieldDescription>{themeOption.description}</FieldDescription>
                    {theme === 'pixel' ? (
                      <Field className="gap-2">
                        <FieldLabel htmlFor="pixel-font">Pixel font</FieldLabel>
                        <Select value={pixelFont} onValueChange={value => selectPixelFont(value as PixelFontKey)}>
                          <SelectTrigger id="pixel-font" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PIXEL_FONT_OPTIONS.map(option => (
                              <SelectItem key={option.key} value={option.key} style={{ fontFamily: `'${option.fontName}', monospace` }}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    ) : null}
                  </FieldSet>

                  <FieldSeparator />

                  <FieldSet className="gap-4">
                    <FieldLegend variant="label" className="mb-3 text-muted-foreground">
                      Text
                    </FieldLegend>
                    <TextField id="title" label="Title" value={fields.title} onChange={value => setField('title', value)} inputRef={titleRef} />
                    <TextField id="site" label="Site" value={fields.site} onChange={value => setField('site', value)} />
                    <Field className="gap-2">
                      <FieldLabel htmlFor="excerpt">Excerpt</FieldLabel>
                      <Textarea
                        id="excerpt"
                        rows={2}
                        value={fields.excerpt}
                        onChange={event => setField('excerpt', event.target.value)}
                        spellCheck={false}
                        className="min-h-0 resize-none"
                      />
                    </Field>
                  </FieldSet>

                  <FieldSeparator />

                  <FieldSet className="gap-4">
                    <FieldLegend variant="label" className="mb-3 text-muted-foreground">
                      Details
                    </FieldLegend>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                      <TextField id="author" label="Author" value={fields.author} onChange={value => setField('author', value)} />
                      <TextField id="date" label="Date" value={fields.date} onChange={value => setField('date', value)} />
                      <TextField id="tag" label="Tag" value={fields.tag} onChange={value => setField('tag', value)} />
                      <TextField id="reading" label="Reading time" value={fields.reading} onChange={value => setField('reading', value)} />
                    </div>
                  </FieldSet>

                  <FieldSeparator />

                  <FieldSet className="gap-4">
                    <FieldLegend variant="label" className="mb-3 text-muted-foreground">
                      Images
                    </FieldLegend>
                    <TextField id="image" label="Cover image" type="url" placeholder="https://" value={fields.image} onChange={value => setField('image', value)} />
                    <TextField id="icon" label="Site icon" type="url" placeholder="https://" value={fields.icon} onChange={value => setField('icon', value)} />
                    <TextField id="avatar" label="Author avatar" type="url" placeholder="https://" value={fields.avatar} onChange={value => setField('avatar', value)} />
                    <FieldDescription>PNG, JPEG, GIF or SVG from a public host. Anything else is left out.</FieldDescription>
                  </FieldSet>

                  <FieldSeparator />

                  <Field className="gap-2">
                    <FieldLabel htmlFor="accent">Accent</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <label
                          className="relative size-5 cursor-pointer overflow-hidden rounded-sm ring-1 ring-foreground/15"
                          style={{
                            background:
                              accentHex ??
                              'linear-gradient(to top right, transparent calc(50% - 0.5px), var(--muted-foreground) 50%, transparent calc(50% + 0.5px))',
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
                      </InputGroupAddon>
                      <InputGroupInput
                        id="accent"
                        aria-label="Accent hex"
                        placeholder="Theme default"
                        value={fields.accent}
                        onChange={event => setField('accent', event.target.value)}
                        spellCheck={false}
                        className="font-mono"
                      />
                    </InputGroup>
                    <FieldDescription>Colours the tag. Leave empty for the theme default.</FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </div>
          </div>
        </section>

        {children}
      </main>
    </TooltipProvider>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  inputRef,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'url';
  placeholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <Field className="gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        ref={inputRef}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        spellCheck={false}
        autoComplete="off"
      />
    </Field>
  );
}
