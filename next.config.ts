import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Rotas tipadas do Next 16 exigem que todos os hrefs existam no build;
  // desativamos para permitir URLs dinâmicas (?ano=&mes=) sem fricção.
  typedRoutes: false,
};

export default nextConfig;

