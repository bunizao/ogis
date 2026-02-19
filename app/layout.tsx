import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

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
    description: 'Dynamic OG image generation with pixel-style typography and frosted glass effects',
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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
      <body>
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
