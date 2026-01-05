'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [title, setTitle] = useState('雨季將不再來');
  const [site, setSite] = useState('buxx.me');
  const [excerpt, setExcerpt] = useState('从東京的早樱到南洋的暴雨，2025 见证了一场接一场的重构。');
  const [author, setAuthor] = useState('Murray');
  const [date, setDate] = useState('2025-12-31');
  const [image, setImage] = useState('');
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const generateUrl = () => {
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (site) params.set('site', site);
    if (excerpt) params.set('excerpt', excerpt);
    if (author) params.set('author', author);
    if (date) params.set('date', date);
    if (image) params.set('image', image);
    return `/api/og?${params.toString()}`;
  };

  const copyUrl = async () => {
    const fullUrl = window.location.origin + generateUrl();
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');

        * {
          box-sizing: border-box;
        }

        ::selection {
          background: #000;
          color: #fff;
        }

        input::placeholder {
          color: #999;
        }

        input:focus {
          outline: none;
          border-color: #000 !important;
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
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#fff',
        color: '#000',
        fontFamily: '"Inter", -apple-system, sans-serif',
        fontSize: '15px',
        lineHeight: 1.6,
      }}>
        {/* Navigation */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #eee',
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '20px 48px',
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
              OG/
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '12px',
            }}>
              <a href="#preview" style={{ color: '#666', textDecoration: 'none', transition: 'color 0.2s' }}>Preview</a>
              <a href="#api" style={{ color: '#666', textDecoration: 'none', transition: 'color 0.2s' }}>API</a>
              <a
                href="https://github.com"
                target="_blank"
                style={{
                  color: '#000',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  border: '1px solid #000',
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
          paddingTop: '180px',
          paddingBottom: '120px',
          paddingLeft: '48px',
          paddingRight: '48px',
          maxWidth: '1400px',
          margin: '0 auto',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '80px',
            alignItems: 'end',
          }}>
            <div>
              <p style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '12px',
                letterSpacing: '0.1em',
                color: '#999',
                marginBottom: '24px',
                textTransform: 'uppercase',
              }}>
                Open Graph Image Service
              </p>
              <h1 style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 'clamp(48px, 8vw, 96px)',
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
              borderLeft: '1px solid #eee',
              paddingLeft: '40px',
            }}>
              <p style={{
                fontSize: '18px',
                color: '#666',
                lineHeight: 1.7,
                margin: 0,
                maxWidth: '400px',
              }}>
                Generate beautiful Open Graph images with pixel-style typography.
                Built on Edge Runtime for global performance.
              </p>
              <div style={{
                marginTop: '32px',
                display: 'flex',
                gap: '16px',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                color: '#999',
              }}>
                <span>1200×630px</span>
                <span>·</span>
                <span>PNG</span>
                <span>·</span>
                <span>Edge Runtime</span>
              </div>
            </div>
          </div>
        </header>

        {/* Divider */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 48px',
        }}>
          <div style={{ height: '1px', background: '#000' }} />
        </div>

        {/* Main Content */}
        <main id="preview" style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '80px 48px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '400px 1fr',
            gap: '80px',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
          }}>
            {/* Form Panel */}
            <div>
              <div style={{
                position: 'sticky',
                top: '100px',
              }}>
                <h2 style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#999',
                  marginBottom: '40px',
                }}>
                  Parameters
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <InputField label="Title" value={title} onChange={setTitle} required />
                  <InputField label="Site" value={site} onChange={setSite} required />
                  <InputField label="Excerpt" value={excerpt} onChange={setExcerpt} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <InputField label="Author" value={author} onChange={setAuthor} />
                    <InputField label="Date" value={date} onChange={setDate} />
                  </div>
                  <InputField label="Image URL" value={image} onChange={setImage} />
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
                      color: '#999',
                    }}>
                      Endpoint
                    </span>
                    <button
                      onClick={copyUrl}
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '11px',
                        color: copied ? '#000' : '#999',
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
                    color: '#666',
                    padding: '16px',
                    background: '#fafafa',
                    border: '1px solid #eee',
                    wordBreak: 'break-all',
                    lineHeight: 1.6,
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
                color: '#999',
                marginBottom: '40px',
              }}>
                Preview
              </h2>

              <div style={{
                position: 'relative',
                background: '#000',
                padding: '32px',
              }}>
                <img
                  src={generateUrl()}
                  alt="OG Preview"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
              </div>

              <div style={{
                marginTop: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '11px',
                  color: '#999',
                }}>
                  1200 × 630
                </span>
                <a
                  href={generateUrl()}
                  target="_blank"
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '12px',
                    color: '#000',
                    textDecoration: 'none',
                    padding: '12px 24px',
                    border: '1px solid #000',
                    transition: 'all 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#000';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#000';
                  }}
                >
                  Open Full Size
                  <span style={{ fontSize: '14px' }}>↗</span>
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* API Reference */}
        <section id="api" style={{
          background: '#000',
          color: '#fff',
          padding: '120px 48px',
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr',
              gap: '80px',
            }}>
              <div>
                <h2 style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: '48px',
                  fontWeight: 400,
                  lineHeight: 1.1,
                  margin: 0,
                }}>
                  API<br />
                  <span style={{ fontStyle: 'italic' }}>Reference</span>
                </h2>
                <p style={{
                  marginTop: '24px',
                  color: '#666',
                  fontSize: '15px',
                  lineHeight: 1.7,
                }}>
                  Simple GET request with URL parameters.
                  Returns a PNG image optimized for social sharing.
                </p>
                <div style={{
                  marginTop: '32px',
                  padding: '16px',
                  border: '1px solid #333',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '12px',
                  color: '#999',
                }}>
                  GET /api/og?title=...&site=...
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1px',
                background: '#333',
              }}>
                <ParamCard name="title" type="string" required description="Article title (max 60 chars)" />
                <ParamCard name="site" type="string" required description="Site name for branding" />
                <ParamCard name="excerpt" type="string" description="Article excerpt (max 80 chars)" />
                <ParamCard name="author" type="string" description="Author name" />
                <ParamCard name="date" type="string" description="Publication date" />
                <ParamCard name="image" type="url" description="Background image (PNG/JPG/GIF)" />
              </div>
            </div>

            {/* Note */}
            <div style={{
              marginTop: '80px',
              padding: '24px 32px',
              border: '1px solid #333',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
            }}>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                color: '#666',
                flexShrink: 0,
              }}>
                NOTE
              </span>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#999',
                lineHeight: 1.7,
              }}>
                WebP, AVIF, and SVG formats are not supported due to Edge Runtime constraints.
                Use PNG, JPG, JPEG, or GIF for background images.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          padding: '48px',
          borderTop: '1px solid #eee',
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '12px',
              color: '#999',
            }}>
              Built with Next.js Edge Runtime
            </span>
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '12px',
              color: '#999',
            }}>
              @vercel/og
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
  required
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
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
        color: '#000',
        marginBottom: '8px',
      }}>
        {label}
        {required && (
          <span style={{
            fontSize: '10px',
            color: '#999',
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
        style={{
          width: '100%',
          padding: '14px 0',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid #ddd',
          color: '#000',
          fontSize: '15px',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s',
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
      background: '#000',
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
          color: '#fff',
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
            border: '1px solid #444',
            color: '#666',
          }}>
            Required
          </span>
        )}
      </div>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        color: '#666',
        marginBottom: '12px',
      }}>
        {type}
      </div>
      <p style={{
        margin: 0,
        fontSize: '13px',
        color: '#999',
        lineHeight: 1.6,
      }}>
        {description}
      </p>
    </div>
  );
}
