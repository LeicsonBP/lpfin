import type { MetadataRoute } from 'next';

/**
 * Manifest do PWA: é o que permite "Instalar / criar atalho" com ícone
 * em alta resolução no Android e o comportamento de app no iOS.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LPFIN — Controle Financeiro Pessoal',
    short_name: 'LPFIN',
    description:
      'Controle financeiro pessoal com visão mensal, parcelamentos e projeção de cenários futuros.',
    id: '/',
    start_url: '/mes',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'pt-BR',
    dir: 'ltr',
    categories: ['finance', 'productivity'],
    background_color: '#e7f3ec',
    theme_color: '#0e6855',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
