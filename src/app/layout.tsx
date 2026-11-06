import type { Metadata, Viewport } from 'next';
import './globals.css';

import { AccentStyle } from '@/components/theme/accent-style';
import { getUserSettings } from '@/lib/data/settings';

export const metadata: Metadata = {
  title: 'LPFIN — Controle Financeiro Pessoal',
  description:
    'Controle financeiro pessoal com visão mensal, parcelamentos e projeção de cenários futuros.',
  applicationName: 'LPFIN',
  appleWebApp: {
    capable: true,
    title: 'LPFIN',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
  themeColor: '#0a1014',
};

/** Tema escuro é o único tema do app (sem seletor claro/sistema). */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { accent, surface } = await getUserSettings();

  return (
    <html lang="pt-BR" className="dark" data-surface={surface} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <AccentStyle accent={accent} />
        {children}
      </body>
    </html>
  );
}


