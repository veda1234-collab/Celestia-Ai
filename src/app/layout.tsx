import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Celestia — AI Astrology Written in the Stars',
    template: '%s · Celestia',
  },
  description:
    'Personalized AI astrology powered by your birth chart. Discover the story written in the stars with a luxury, cosmic experience.',
  keywords: ['astrology', 'birth chart', 'AI astrologer', 'horoscope', 'kundli', 'vedic astrology', 'natal chart'],
  authors: [{ name: 'Celestia' }],
  openGraph: {
    title: 'Celestia — AI Astrology Written in the Stars',
    description: 'Personalized AI astrology powered by your birth chart.',
    type: 'website',
    url: APP_URL,
  },
  twitter: { card: 'summary_large_image' },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#070512' },
    { media: '(prefers-color-scheme: light)', color: '#faf8ff' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
