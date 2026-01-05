import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'OGIS - Open Graph Image Service',
  description: 'A dynamic Open Graph image generation service built with Next.js 14 and deployed on Vercel Edge Runtime. Creates customized social media preview images with Zpix pixel font and frosted glass effects.',
  keywords: ['og image', 'open graph', 'social media', 'preview', 'image generation', 'edge runtime', 'next.js', 'vercel', 'zpix'],
  authors: [{ name: 'bunizao', url: 'https://github.com/bunizao' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'OGIS - Open Graph Image Service',
    description: 'Dynamic OG image generation with pixel-style typography and frosted glass effects',
    type: 'website',
    url: 'https://og.tutuis.me',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
