/**
 * Gera os assets da marca a partir do SVG original:
 *  - src/components/brand/lp-logo-paths.ts (componente React, currentColor)
 *  - src/app/icon.svg                      (favicon da aba, preto, 512px)
 *  - public/icons/*.png                    (PWA: 192/512 + maskable)
 *  - src/app/apple-icon.png                (iOS, 180px)
 *
 * Uso: npm run logo
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brandDir = join(root, 'src', 'components', 'brand');
const iconsDir = join(root, 'public', 'icons');
mkdirSync(iconsDir, { recursive: true });

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

// 1) paths para o componente React --------------------------------------------
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

// 2) favicon da aba: preto, sem fundo, 512px ---------------------------------
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="512" height="512">
  <g transform="${transform}" fill="#000000">
${paths.map((path) => `    <path d="${path}" />`).join('\n')}
  </g>
</svg>
`;

writeFileSync(join(root, 'src', 'app', 'icon.svg'), faviconSvg, 'utf8');

// 3) ícones instalados: gradiente verde escuro -> claro + logo branco --------
const GRADIENT = `<linearGradient id="lp-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b3b30" />
      <stop offset="55%" stop-color="#0e6855" />
      <stop offset="100%" stop-color="#7ed1ae" />
    </linearGradient>`;

const CANVAS = 2400;
const LOGO_W = 2300;
const LOGO_H = 2400;

function iconSvg(scale) {
  const offsetX = (CANVAS - LOGO_W * scale) / 2;
  const offsetY = (CANVAS - LOGO_H * scale) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}">
    <defs>${GRADIENT}</defs>
    <rect width="${CANVAS}" height="${CANVAS}" fill="url(#lp-bg)" />
    <g transform="translate(${offsetX} ${offsetY}) scale(${scale})">
      <g transform="${transform}" fill="#ffffff">
${paths.map((path) => `        <path d="${path}" />`).join('\n')}
      </g>
    </g>
  </svg>`;
}

const targets = [
  { file: join(iconsDir, 'icon-192.png'), size: 192, scale: 0.82 },
  { file: join(iconsDir, 'icon-512.png'), size: 512, scale: 0.82 },
  { file: join(iconsDir, 'maskable-192.png'), size: 192, scale: 0.58 },
  { file: join(iconsDir, 'maskable-512.png'), size: 512, scale: 0.58 },
  { file: join(root, 'src', 'app', 'apple-icon.png'), size: 180, scale: 0.82 },
];

for (const target of targets) {
  await sharp(Buffer.from(iconSvg(target.scale)))
    .resize(target.size, target.size)
    .png({ compressionLevel: 9 })
    .toFile(target.file);
  console.log(`ok — ${target.file.replace(root, '.')} (${target.size}px)`);
}

console.log(`paths: ${paths.length} · viewBox ${viewBox}`);

