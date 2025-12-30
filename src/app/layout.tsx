import '~/styles/globals.css';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import { Suspense } from 'react';
import { LoadingScreen } from '~/components/screens/LoadingScreen';
import { MantineProvider } from '~/utils/mantine/provider';
import { FirebaseInitializer } from './FirebaseInitializer';
import { Providers } from './Providers';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Knowledge Agents',
  description: 'Knowledge Agents Management Application',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  minimumScale: 1,
  initialScale: 1,
  width: 'device-width',
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='ja' {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <FirebaseInitializer />
        <MantineProvider>
          <Providers>
            <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
          </Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
