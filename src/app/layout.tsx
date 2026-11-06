import type { Metadata, Viewport } from 'next';
import './globals.css';

import { getTheme } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'LPFIN — Controle Financeiro Pessoal',
  description:
    'Controle financeiro pessoal com visão mensal, parcelamentos e projeção de cenários futuros.',
  applicationName: 'LPFIN',
  appleWebApp: {
    capable: true,
    title: 'LPFIN',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0e6855' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1014' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const theme = await getTheme();
  const isDark = theme === 'dark';

  return (
    <html lang="pt-BR" className={isDark ? 'dark' : undefined} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}


