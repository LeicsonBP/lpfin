/**
 * Gera o componente de paths do logo a partir do SVG original e o favicon.
 * Uso: node scripts/build-logo.mjs
 */
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const brandDir = join(root, 'src', 'components', 'brand');
const source = join(brandDir, 'New-LP-Logo-B.svg');
const renamed = join(brandDir, 'lp-logo.svg');

let svg;
try {
  svg = readFileSync(source, 'utf8');
  renameSync(source, renamed);
  console.log('arquivo renomeado para lp-logo.svg');
} catch {
  svg = readFileSync(renamed, 'utf8');
}

const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
const viewBox = viewBoxMatch?.[1] ?? '0 0 2300 2400';
const groupMatch = svg.match(/<g[^>]*transform="([^"]+)"/);
const transform = groupMatch?.[1] ?? '';
const paths = [...svg.matchAll(/<path\s+d="([^"]+)"/g)].map((match) =>
  match[1].replace(/\s+/g, ' ').trim(),
);

if (paths.length === 0) {
  console.error('nenhum path encontrado no SVG');
  process.exit(1);
}

const tsContent = `/**
 * Paths do logotipo LP (fonte: src/components/brand/lp-logo.svg).
 * Gerado por scripts/build-logo.mjs — não editar manualmente.
 */
export const LP_LOGO_VIEWBOX = '${viewBox}';

/** transform aplicado ao grupo que contém os paths (coordenadas originais) */
export const LP_LOGO_TRANSFORM = '${transform}';

export const LP_LOGO_PATHS = [
${paths.map((path) => `  '${path.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',`).join('\n')}
] as const;
`;

writeFileSync(join(brandDir, 'lp-logo-paths.ts'), tsContent, 'utf8');

// Favicon sem fundo e adaptável ao tema do navegador:
// base branca (fallback para navegadores que ignoram a media query) e
// preto quando o sistema está no modo claro.
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="64" height="64">
  <style>
    path { fill: #ffffff; }
    @media (prefers-color-scheme: light) { path { fill: #0f1f19; } }
  </style>
  <g transform="${transform}">
${paths.map((path) => `    <path d="${path}" />`).join('\n')}
  </g>
</svg>
`;

writeFileSync(join(root, 'src', 'app', 'icon.svg'), iconSvg, 'utf8');

console.log(`ok — ${paths.length} path(s) extraídos, viewBox ${viewBox}`);
