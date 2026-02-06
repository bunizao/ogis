'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DEFAULT_PIXEL_FONT,
  PIXEL_FONT_OPTIONS,
  type PixelFontKey,
} from '@/app/lib/pixel-fonts';

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
  const [copied, setCopied] = useState(false);
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stable refs for keyboard handler (avoids stale closures)
  const handleGenerateRef = useRef(handleGenerate);
  handleGenerateRef.current = handleGenerate;
  const copyUrlRef = useRef(copyUrl);
  copyUrlRef.current = copyUrl;

  const selectedPixelFont =
    PIXEL_FONT_OPTIONS.find((o) => o.key === pixelFont) ??
    PIXEL_FONT_OPTIONS[0];

  // Detect platform
  useEffect(() => {
    setIsMac(navigator.platform?.toLowerCase().includes('mac') ?? false);
  }, []);

  // Keyboard shortcuts (stable — no deps needed)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const inInput =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT';

      // Global: works even in inputs
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

      // Only when not in an input
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

  const mod = isMac ? '⌘' : 'Ctrl+';

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="scan-line" aria-hidden="true" />

      {copied && <Toast />}
      {showShortcuts && (
        <ShortcutsOverlay
          isMac={isMac}
          onClose={() => setShowShortcuts(false)}
        />
      )}

      {/* ── Navigation ── */}
      <nav className="nav">
        <div className="nav-inner">
          <span className="nav-logo">OGIS/</span>
          <div className="nav-links">
            <a href="#preview" className="nav-link desktop-only">
              Preview
            </a>
            <a href="#api" className="nav-link desktop-only">
              API
            </a>
            <button
              className="nav-shortcut-btn"
              onClick={() => setShowShortcuts((s) => !s)}
              aria-label="Show keyboard shortcuts"
            >
              ?
            </button>
            <a
              href="https://github.com/bunizao/ogis"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-gh"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="hero">
        <div className="hero-inner">
          <div>
            <p className="hero-label">Open Graph Image Service</p>
            <h1 className="hero-title">
              <span className="hero-title-expand" aria-label="Open Graph">
                <span className="hero-title-short" aria-hidden="true">
                  OGIS
                </span>
                <span className="hero-title-full" aria-hidden="true">
                  Open Graph
                </span>
              </span>
              <br />
              <span className="hero-title-accent hero-title-accent-reveal">
                Image Service
              </span>
            </h1>
          </div>
          <div className="hero-right">
            <p className="hero-desc">
              A dynamic Open Graph image generation service with multiple visual
              themes. Built on Next.js and Vercel Edge Runtime for fast, globally
              distributed generation.
            </p>
            <div className="hero-specs">
              <span className="hero-spec">1200×630px</span>
              <span className="hero-spec">Local Pixel Fonts</span>
              <span className="hero-spec">Edge Runtime</span>
              <span className="hero-spec">MIT License</span>
            </div>
          </div>
        </div>
      </header>

      <div className="divider">
        <div />
      </div>

      {/* ── Workspace ── */}
      <main className="workspace" id="preview">
        <div className="workspace-inner">
          {/* Form Panel */}
          <div className="form-panel">
            <div className="form-sticky">
              <h2 className="section-label">Parameters</h2>

              {/* Theme toggle */}
              <div className="theme-toggle">
                <div
                  className="theme-toggle-slider"
                  style={{
                    transform: `translateX(${theme === 'modern' ? '100%' : '0'})`,
                  }}
                />
                {(['pixel', 'modern'] as const).map((t) => (
                  <button
                    key={t}
                    className={theme === t ? 'active' : ''}
                    onClick={() => setTheme(t)}
                  >
                    {t}
                    <kbd>{t === 'pixel' ? '1' : '2'}</kbd>
                  </button>
                ))}
              </div>

              {/* Pixel font selector */}
              {theme === 'pixel' && (
                <div style={{ marginBottom: '20px' }}>
                  <label className="field-label">Pixel Font</label>
                  <select
                    className="field-select"
                    value={pixelFont}
                    onChange={(e) =>
                      setPixelFont(e.target.value as PixelFontKey)
                    }
                  >
                    {PIXEL_FONT_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="fields">
                <InputField
                  label="Title"
                  value={title}
                  onChange={setTitle}
                  required
                  inputRef={titleRef}
                />
                <InputField
                  label="Site"
                  value={site}
                  onChange={setSite}
                  required
                />
                <InputField
                  label="Excerpt"
                  value={excerpt}
                  onChange={setExcerpt}
                />
                <div className="field-row">
                  <InputField
                    label="Author"
                    value={author}
                    onChange={setAuthor}
                  />
                  <InputField
                    label="Date"
                    value={date}
                    onChange={setDate}
                  />
                </div>
                <InputField
                  label="Image URL"
                  value={image}
                  onChange={setImage}
                />
              </div>

              {/* Endpoint URL */}
              <div className="endpoint-section">
                <div className="endpoint-header">
                  <span className="section-label">Endpoint</span>
                  <button
                    className={`endpoint-copy${copied ? ' copied' : ''}`}
                    onClick={copyUrl}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                    <kbd>{mod}⇧C</kbd>
                  </button>
                </div>
                <div className="endpoint-url">
                  {generateUrl()}
                  <span className="endpoint-cursor" />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="preview-panel">
            <h2 className="section-label preview-header">
              Preview
              <span className="preview-badge">
                {theme === 'pixel'
                  ? `${theme} · ${selectedPixelFont.label}`
                  : theme}
              </span>
            </h2>

            <div className="preview-tip">
              Modify parameters, then press <kbd>{mod}↵</kbd> or click Generate
              to preview
            </div>

            <div
              className={`preview-frame${isGenerating ? ' preview-loading' : ''}`}
            >
              <div className="preview-frame-inner">
                <img
                  className="preview-img"
                  src={previewUrl}
                  alt="OG Preview"
                  onLoad={() => setIsGenerating(false)}
                  onError={() => setIsGenerating(false)}
                />
              </div>
            </div>

            <div className="preview-actions">
              <span className="preview-dim">1200 × 630</span>
              <div className="preview-buttons">
                <button
                  className="btn btn-primary"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating…' : 'Generate Preview'}
                  <kbd>{mod}↵</kbd>
                </button>
                <a
                  className="btn"
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Full Size ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── API Reference ── */}
      <section className="api-section" id="api">
        <div className="api-inner">
          <div className="api-header">
            <div>
              <h2 className="api-title">
                API <em>Reference</em>
              </h2>
              <p className="api-desc">
                Simple GET request with URL parameters. Returns a PNG image
                (1200×630px) with customizable visual themes and full CJK
                character support.
              </p>
              <div className="api-endpoint-block">
                GET /api/og?title=...&site=...
              </div>
            </div>
            <div className="api-grid">
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

          <div className="api-notes">
            <div className="note note-accent">
              <span className="note-label">DEMO</span>
              <p className="note-text">
                This is a demo site for demonstration purposes only. Preview
                images are cached and only regenerated when you click
                &quot;Generate Preview&quot;. For production use, please{' '}
                <a
                  href="https://github.com/bunizao/ogis#deployment"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  deploy your own instance
                </a>
                .
              </p>
            </div>
            <div className="note">
              <span className="note-label">NOTE</span>
              <p className="note-text">
                WebP, AVIF, and SVG formats are not supported due to Edge
                Runtime constraints. Use PNG, JPG, JPEG, or GIF for background
                images.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-links">
            <span>Built with Next.js · @vercel/og</span>
            <span className="footer-sep">·</span>
            <a
              href="https://github.com/bunizao/ogis"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub
            </a>
            <span className="footer-sep">·</span>
            <span>MIT License</span>
          </div>
          <span>© 2026 bunizao</span>
        </div>
      </footer>
    </>
  );
}

/* ── Sub-components ── */

function InputField({
  label,
  value,
  onChange,
  required,
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div>
      <label className="field-label">
        {label}
        {required && <span className="field-required">required</span>}
      </label>
      <input
        ref={inputRef}
        className="field-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
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
    <div className="param-card">
      <div className="param-name">
        <code>{name}</code>
        {required && <span className="param-required-badge">Required</span>}
      </div>
      <div className="param-type">{type}</div>
      <p className="param-desc">{description}</p>
    </div>
  );
}

function Toast() {
  return (
    <div className="toast" role="status" aria-live="polite">
      <span>✓</span>
      Copied to clipboard
    </div>
  );
}

function ShortcutsOverlay({
  isMac,
  onClose,
}: {
  isMac: boolean;
  onClose: () => void;
}) {
  const mod = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="overlay-header">
          <h3>Keyboard Shortcuts</h3>
          <button className="overlay-close" onClick={onClose}>
            Esc
          </button>
        </div>
        <div className="overlay-body">
          <div className="shortcut-row">
            <span className="shortcut-label">Focus title</span>
            <span className="shortcut-keys">
              <kbd>/</kbd>
            </span>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-label">Switch theme</span>
            <span className="shortcut-keys">
              <kbd>1</kbd>
              <span className="key-sep">/</span>
              <kbd>2</kbd>
            </span>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-label">Generate preview</span>
            <span className="shortcut-keys">
              <kbd>{mod}</kbd>
              <kbd>↵</kbd>
            </span>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-label">Copy endpoint URL</span>
            <span className="shortcut-keys">
              <kbd>{mod}</kbd>
              <kbd>⇧</kbd>
              <kbd>C</kbd>
            </span>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-label">Toggle shortcuts</span>
            <span className="shortcut-keys">
              <kbd>?</kbd>
            </span>
          </div>
          <div className="shortcut-row">
            <span className="shortcut-label">Close / unfocus</span>
            <span className="shortcut-keys">
              <kbd>Esc</kbd>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
