import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OGIS - Open Graph Image Service',
  description: 'Open Graph images from a single URL. Four themes, your own images, rendered at the edge.',
  keywords: ['og image', 'open graph', 'social media', 'preview', 'image generation', 'edge runtime', 'next.js', 'vercel', 'zpix'],
  authors: [{ name: 'bunizao', url: 'https://github.com/bunizao' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'OGIS - Open Graph Image Service',
    description: 'Open Graph images from a single URL. Four themes, rendered at the edge.',
    type: 'website',
    url: 'https://og.tutuis.me',
    images: [
      {
        url: 'https://og.tutuis.me/preview.png',
        width: 1200,
        height: 630,
        alt: 'OGIS - Open Graph Image Service',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OGIS - Open Graph Image Service',
    description: 'Open Graph images from a single URL. Four themes, rendered at the edge.',
    images: ['https://og.tutuis.me/preview.png'],
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Sets the hero headline, so fetch it with the page rather than on first use. */}
        <link rel="preload" href="/fonts/geist-pixel/GeistPixel-Square.ttf" as="font" type="font/ttf" crossOrigin="" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
