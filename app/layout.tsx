import type { Metadata } from 'next';
import type React from 'react';

import { adelleSans } from '../lib/fonts';
import '../styles/globals.css';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Pyinvest',
  description: 'Pyinvest',
  icons: {
    icon: [
      { url: '/favicons/favicon.ico', sizes: 'any' },
      { url: '/favicons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicons/apple-touch-icon.png',
  },
  manifest: '/favicons/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={adelleSans.variable}>
      <body className={adelleSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
