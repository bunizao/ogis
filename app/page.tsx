'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [title, setTitle] = useState('Interstellar');
  const [site, setSite] = useState('buxx.me');
  const [excerpt, setExcerpt] = useState('Do not go gentle into that good night.');
  const [author, setAuthor] = useState('bunizao');
  const [date, setDate] = useState('2026-01-05');
  const [image, setImage] = useState('');
  const [theme, setTheme] = useState<'pixel' | 'modern'>('pixel');
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('/preview.png'); // Use static preview by default
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if mobile on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const generateUrl = () => {
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (site) params.set('site', site);
    if (excerpt) params.set('excerpt', excerpt);
    if (author) params.set('author', author);
    if (date) params.set('date', date);
    if (image) params.set('image', image);
    if (theme !== 'pixel') params.set('theme', theme);
    return `/api/og?${params.toString()}`;
  };

  const generateUrlWithTimestamp = () => {
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (site) params.set('site', site);
    if (excerpt) params.set('excerpt', excerpt);
    if (author) params.set('author', author);
    if (date) params.set('date', date);
    if (image) params.set('image', image);
    if (theme !== 'pixel') params.set('theme', theme);
    params.set('t', Date.now().toString());
    return `/api/og?${params.toString()}`;
  };

  const copyUrl = async () => {
    const fullUrl = window.location.origin + generateUrl();
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setPreviewUrl(generateUrlWithTimestamp());
    setTimeout(() => setIsGenerating(false), 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerate();
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');

        :root {
          /* Light mode colors */
          --bg-primary: #fff;
          --bg-secondary: #fafafa;
          --bg-nav: rgba(255, 255, 255, 0.9);
          --bg-api: #000;
          --text-primary: #000;
          --text-secondary: #666;
          --text-muted: #999;
          --border-primary: #000;
          --border-secondary: #eee;
          --border-tertiary: #ddd;
          --accent-color: #667eea;
          --selection-bg: #000;
          --selection-text: #fff;
          --api-text-primary: #fff;
          --api-text-secondary: #999;
          --api-text-muted: #666;
          --api-border: #333;
          --api-card-bg: #000;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            /* Dark mode colors */
            --bg-primary: #0a0a0a;
            --bg-secondary: #141414;
            --bg-nav: rgba(10, 10, 10, 0.9);
            --bg-api: #141414;
            --text-primary: #f5f5f5;
            --text-secondary: #a0a0a0;
            --text-muted: #707070;
            --border-primary: #f5f5f5;
            --border-secondary: #2a2a2a;
            --border-tertiary: #3a3a3a;
            --accent-color: #8b9cf4;
            --selection-bg: #f5f5f5;
            --selection-text: #0a0a0a;
            --api-text-primary: #f5f5f5;
            --api-text-secondary: #a0a0a0;
            --api-text-muted: #707070;
            --api-border: #3a3a3a;
            --api-card-bg: #1a1a1a;
          }
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        ::selection {
          background: var(--selection-bg);
          color: var(--selection-text);
        }

        input::placeholder {
          color: var(--text-muted);
        }

        input:focus {
          outline: none;
          border-color: var(--text-primary) !important;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Mobile responsive utilities */
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-only {
            display: none !important;
          }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: '"Inter", -apple-system, sans-serif',
        fontSize: '15px',
        lineHeight: 1.6,
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}>
        {/* Navigation */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-secondary)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0.05em',
            }}>
              OGIS/
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '12px',
            }}>
              <a href="#preview" className="desktop-only" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Preview</a>
              <a href="#api" className="desktop-only" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>API</a>
              <a
                href="https://github.com/bunizao/ogis"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  border: '1px solid var(--border-primary)',
                  transition: 'all 0.2s',
                }}
              >
                GitHub →
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header style={{
          paddingTop: '120px',
          paddingBottom: '80px',
          paddingLeft: '24px',
          paddingRight: '24px',
          maxWidth: '1400px',
          margin: '0 auto',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: !isMobile ? '1fr 1fr' : '1fr',
            gap: !isMobile ? '80px' : '40px',
            alignItems: 'end',
          }}>
            <div>
              <p style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                marginBottom: '24px',
                textTransform: 'uppercase',
              }}>
                OGIS - Open Graph Image Service
              </p>
              <h1 style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 'clamp(40px, 10vw, 96px)',
                fontWeight: 400,
                lineHeight: 0.95,
                margin: 0,
                letterSpacing: '-0.02em',
              }}>
                Dynamic<br />
                <span style={{ fontStyle: 'italic' }}>Social</span><br />
                Images
              </h1>
            </div>
            <div style={{
              borderLeft: !isMobile ? '1px solid var(--border-secondary)' : 'none',
              paddingLeft: !isMobile ? '40px' : '0',
              paddingTop: !isMobile ? '0' : '20px',
              borderTop: !isMobile ? 'none' : '1px solid var(--border-secondary)',
            }}>
              <p style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                margin: 0,
                maxWidth: '400px',
              }}>
                A dynamic Open Graph image generation service with multiple visual themes.
                Built on Next.js and Vercel Edge Runtime for fast, globally distributed generation.
              </p>
              <div style={{
                marginTop: '24px',
                display: 'flex',
                gap: '12px',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '10px',
                color: 'var(--text-muted)',
                flexWrap: 'wrap',
              }}>
                <span>1200×630px</span>
                <span>·</span>
                <span>Zpix Font</span>
                <span>·</span>
                <span>Edge Runtime</span>
                <span>·</span>
                <span>MIT License</span>
              </div>
            </div>
          </div>
        </header>

        {/* Divider */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
        }}>
          <div style={{ height: '1px', background: 'var(--border-primary)' }} />
        </div>

        {/* Main Content */}
        <main id="preview" style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: !isMobile ? '80px 24px' : '40px 24px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: !isMobile ? '400px 1fr' : '1fr',
            gap: !isMobile ? '80px' : '40px',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
          }}>
            {/* Form Panel */}
            <div>
              <div style={{
                position: !isMobile ? 'sticky' : 'relative',
                top: '100px',
              }}>
                <h2 style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '40px',
                }}>
                  Parameters
                </h2>

                {/* Theme toggle */}
                <div style={{
                  display: 'flex',
                  gap: '0',
                  marginBottom: '32px',
                  border: '1px solid var(--border-tertiary)',
                }}>
                  {(['pixel', 'modern'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: theme === t ? 'var(--bg-primary)' : 'var(--text-muted)',
                        background: theme === t ? 'var(--text-primary)' : 'transparent',
                        border: 'none',
                        borderRight: t === 'pixel' ? '1px solid var(--border-tertiary)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <InputField label="Title" value={title} onChange={setTitle} required onKeyPress={handleKeyPress} />
                  <InputField label="Site" value={site} onChange={setSite} required onKeyPress={handleKeyPress} />
                  <InputField label="Excerpt" value={excerpt} onChange={setExcerpt} onKeyPress={handleKeyPress} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <InputField label="Author" value={author} onChange={setAuthor} onKeyPress={handleKeyPress} />
                    <InputField label="Date" value={date} onChange={setDate} onKeyPress={handleKeyPress} />
                  </div>
                  <InputField label="Image URL" value={image} onChange={setImage} onKeyPress={handleKeyPress} />
                </div>

                {/* URL Output */}
                <div style={{ marginTop: '48px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}>
                    <span style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                    }}>
                      Endpoint
                    </span>
                    <button
                      onClick={copyUrl}
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '11px',
                        color: copied ? 'var(--text-primary)' : 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'color 0.2s',
                      }}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-secondary)',
                    wordBreak: 'break-all',
                    lineHeight: 1.6,
                    transition: 'background-color 0.3s ease, border-color 0.3s ease',
                  }}>
                    {generateUrl()}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div>
              <h2 style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '40px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                Preview
                <span style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  padding: '3px 8px',
                  border: '1px solid var(--border-tertiary)',
                  fontWeight: 400,
                }}>
                  {theme}
                </span>
              </h2>

              <div style={{
                marginBottom: '24px',
                padding: '16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)',
                borderRadius: '4px',
                transition: 'background-color 0.3s ease, border-color 0.3s ease',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  💡 Tip: Modify parameters above, then click "Generate Preview" to see changes
                </p>
              </div>

              <div style={{
                position: 'relative',
                background: '#000',
                aspectRatio: '1200/630',
                overflow: 'hidden',
              }}>
                <img
                  src={previewUrl}
                  alt="OG Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: 'cover',
                  }}
                  loading="lazy"
                />
              </div>

              <div style={{
                marginTop: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}>
                <span style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}>
                  1200 × 630
                </span>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleGenerate}
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '12px',
                      color: isGenerating ? 'var(--text-muted)' : 'var(--text-primary)',
                      background: 'transparent',
                      textDecoration: 'none',
                      padding: '12px 24px',
                      border: '1px solid ' + (isGenerating ? 'var(--border-tertiary)' : 'var(--border-primary)'),
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Preview'}
                  </button>
                  <a
                    href={previewUrl}
                    target="_blank"
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      padding: '12px 24px',
                      border: '1px solid var(--border-primary)',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--text-primary)';
                      e.currentTarget.style.color = 'var(--bg-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                  >
                    Open Full Size
                    <span style={{ fontSize: '14px' }}>↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* API Reference */}
        <section id="api" style={{
          background: 'var(--bg-api)',
          color: 'var(--api-text-primary)',
          padding: !isMobile ? '120px 24px' : '60px 24px',
          transition: 'background-color 0.3s ease',
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: !isMobile ? '1fr 2fr' : '1fr',
              gap: !isMobile ? '80px' : '40px',
            }}>
              <div>
                <h2 style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: !isMobile ? '48px' : '36px',
                  fontWeight: 400,
                  lineHeight: 1.1,
                  margin: 0,
                }}>
                  API<br />
                  <span style={{ fontStyle: 'italic' }}>Reference</span>
                </h2>
                <p style={{
                  marginTop: '24px',
                  color: 'var(--api-text-muted)',
                  fontSize: '15px',
                  lineHeight: 1.7,
                }}>
                  Simple GET request with URL parameters.
                  Returns a PNG image (1200x630px) with customizable visual themes and full CJK character support.
                </p>
                <div style={{
                  marginTop: '32px',
                  padding: '16px',
                  border: '1px solid var(--api-border)',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: !isMobile ? '12px' : '10px',
                  color: 'var(--api-text-secondary)',
                  wordBreak: 'break-all',
                }}>
                  GET /api/og?title=...&site=...
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: !isMobile ? 'repeat(2, 1fr)' : '1fr',
                gap: '1px',
                background: 'var(--api-border)',
              }}>
                <ParamCard name="title" type="string" required description="Article title (max 60 chars)" />
                <ParamCard name="site" type="string" required description="Site name for branding" />
                <ParamCard name="excerpt" type="string" description="Article excerpt (max 80 chars)" />
                <ParamCard name="author" type="string" description="Author name" />
                <ParamCard name="date" type="string" description="Publication date" />
                <ParamCard name="image" type="url" description="Background image (PNG/JPG/GIF)" />
                <ParamCard name="theme" type="string" description="Visual theme: pixel (default) or modern" />
              </div>
            </div>

            {/* Notes */}
            <div style={{
              marginTop: '80px',
              display: 'grid',
              gap: '16px',
            }}>
              {/* Demo Notice */}
              <div style={{
                padding: '24px 32px',
                border: '1px solid var(--api-border)',
                background: 'rgba(102, 126, 234, 0.08)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
              }}>
                <span style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '11px',
                  color: 'var(--accent-color)',
                  flexShrink: 0,
                  fontWeight: 500,
                }}>
                  DEMO
                </span>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--api-text-secondary)',
                  lineHeight: 1.7,
                }}>
                  This is a demo site for demonstration purposes only. Preview images are cached and only regenerated when you click "Generate Preview". For production use, please{' '}
                  <a
                    href="https://github.com/bunizao/ogis#deployment"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--accent-color)',
                      textDecoration: 'underline',
                    }}
                  >
                    deploy your own instance
                  </a>
                  .
                </p>
              </div>

              {/* Technical Note */}
              <div style={{
                padding: '24px 32px',
                border: '1px solid var(--api-border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
              }}>
                <span style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '11px',
                  color: 'var(--api-text-muted)',
                  flexShrink: 0,
                }}>
                  NOTE
                </span>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--api-text-secondary)',
                  lineHeight: 1.7,
                }}>
                  WebP, AVIF, and SVG formats are not supported due to Edge Runtime constraints.
                  Use PNG, JPG, JPEG, or GIF for background images.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          padding: '32px 24px',
          borderTop: '1px solid var(--border-secondary)',
          transition: 'border-color 0.3s ease',
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}>
                Built with Next.js 14 · @vercel/og
              </span>
              <span style={{ color: 'var(--border-tertiary)' }}>·</span>
              <a
                href="https://github.com/bunizao/ogis"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                GitHub
              </a>
              <span style={{ color: 'var(--border-tertiary)' }}>·</span>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}>
                MIT License
              </span>
            </div>
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}>
              © 2026 bunizao
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}

function InputField({
  label,
  value,
  onChange,
  required,
  onKeyPress
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  onKeyPress?: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.05em',
        color: 'var(--text-primary)',
        marginBottom: '8px',
      }}>
        {label}
        {required && (
          <span style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontWeight: 400,
          }}>
            required
          </span>
        )}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        style={{
          width: '100%',
          padding: '14px 0',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--border-tertiary)',
          color: 'var(--text-primary)',
          fontSize: '15px',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s, color 0.3s ease',
        }}
      />
    </div>
  );
}

function ParamCard({
  name,
  type,
  required,
  description
}: {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}) {
  return (
    <div style={{
      padding: '32px',
      background: 'var(--api-card-bg)',
      transition: 'background-color 0.3s ease',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
      }}>
        <code style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--api-text-primary)',
        }}>
          {name}
        </code>
        {required && (
          <span style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '4px 8px',
            border: '1px solid var(--api-border)',
            color: 'var(--api-text-muted)',
          }}>
            Required
          </span>
        )}
      </div>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        color: 'var(--api-text-muted)',
        marginBottom: '12px',
      }}>
        {type}
      </div>
      <p style={{
        margin: 0,
        fontSize: '13px',
        color: 'var(--api-text-secondary)',
        lineHeight: 1.6,
      }}>
        {description}
      </p>
    </div>
  );
}
