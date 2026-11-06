/**
 * Aplica as migrations SQL no projeto Supabase via Management API.
 *
 * Uso:
 *   $env:SUPABASE_ACCESS_TOKEN = 'sbp_...'      # Account → Access Tokens
 *   npm run db:migrate
 *
 * Opcional:
 *   $env:SUPABASE_PROJECT_REF = 'xxxx'          # senão, deriva do .env.local
 *
 * Os arquivos de `supabase/migrations` são aplicados em ordem alfabética
 * (o prefixo de data garante a ordem) e são idempotentes.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = join(root, 'supabase', 'migrations');

const token = process.env.SUPABASE_ACCESS_TOKEN ?? process.env.SUPABASE_PAT;
if (!token) {
  console.error(
    'Defina SUPABASE_ACCESS_TOKEN (Personal Access Token do Supabase) antes de rodar.',
  );
  process.exit(1);
}

function resolveProjectRef() {
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF;

  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) return null;

  const content = readFileSync(envPath, 'utf8');
  const match = content.match(/NEXT_PUBLIC_SUPABASE_URL=https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

const projectRef = resolveProjectRef();
if (!projectRef) {
  console.error('Projeto Supabase não identificado. Defina SUPABASE_PROJECT_REF.');
  process.exit(1);
}

const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

async function runQuery(sql) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} :: ${text.slice(0, 400)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const files = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

console.log(`Projeto ${projectRef} — ${files.length} migration(s)`);

let failures = 0;
for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), 'utf8');
  try {
    await runQuery(sql);
    console.log(`  ok   ${file}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL ${file} :: ${error.message}`);
  }
}

const tables = await runQuery(
  "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1",
);
const policies = await runQuery(
  "select count(*)::int as total from pg_policies where schemaname = 'public'",
);

console.log(`Tabelas: ${tables.map((row) => row.table_name).join(', ')}`);
console.log(`Policies RLS: ${policies[0]?.total ?? 0}`);

if (failures > 0) {
  console.error(`${failures} migration(s) falharam.`);
  process.exit(1);
}
