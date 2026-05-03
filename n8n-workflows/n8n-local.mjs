#!/usr/bin/env node
/**
 * Pasos automatizados para n8n en local (sin Docker):
 * - Carga backend/.env y .env en la raíz del repo (sin machacar variables ya definidas en la consola).
 * - Crea n8n-local-data/ y fija N8N_USER_FOLDER + defaults de desarrollo.
 * - Muestra qué datos usar en la credencial Postgres (sin imprimir la contraseña).
 *
 * Uso:
 *   node n8n-local.mjs          → arranca n8n (npx n8n)
 *   node n8n-local.mjs import   → importa los JSON (cerrar n8n antes)
 */

import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKFLOWS_DIR = __dirname;
const REPO_ROOT = path.resolve(WORKFLOWS_DIR, '..');
const N8N_DATA = path.join(WORKFLOWS_DIR, 'n8n-local-data');

/** Solo estas claves se leen del .env raíz con prioridad (no pisar DATABASE_URL local con valores de Compose). */
const ROOT_ENV_KEYS = new Set([
  'OPENWEATHER_API_KEY',
  'N8N_ENCRYPTION_KEY',
  'N8N_BASIC_AUTH_ACTIVE',
  'N8N_BASIC_AUTH_USER',
  'N8N_BASIC_AUTH_PASSWORD',
  'WEBHOOK_URL',
  'N8N_WEBHOOK_URL',
  'N8N_SECURE_COOKIE',
]);

/**
 * @param {string} filePath
 * @param {{ override?: boolean, onlyKeys?: Set<string> }} opts
 */
function loadEnvFile(filePath, opts = {}) {
  const override = !!opts.override;
  const onlyKeys = opts.onlyKeys;
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (onlyKeys && !onlyKeys.has(key)) continue;
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    val = val.replace(/\\n/g, '\n');
    const cur = process.env[key];
    const empty = cur === undefined || cur === '';
    if (override || empty) process.env[key] = val;
  }
}

function printPostgresCredentialHint() {
  const dbUrl = process.env.DATABASE_URL;
  console.log('');
  if (!dbUrl) {
    console.log(
      '[n8n-local] No hay DATABASE_URL (ponla en backend/.env o .env en la raíz).',
    );
    console.log(
      '            Crea la credencial Postgres en n8n con los mismos datos que usa el backend.',
    );
    return;
  }
  try {
    const normalized = dbUrl.startsWith('postgresql:')
      ? dbUrl
      : dbUrl.replace(/^postgres:/, 'postgresql:');
    const u = new URL(normalized);
    const database = (u.pathname || '/').replace(/^\//, '').split('?')[0];
    const port = u.port || '5432';
    console.log('[n8n-local] Credencial Postgres en n8n (mismo origen que DATABASE_URL):');
    console.log(`  Host:    ${u.hostname}`);
    console.log(`  Puerto:  ${port}`);
    console.log(`  Usuario: ${decodeURIComponent(u.username || '')}`);
    console.log(`  Base:    ${database || '(vacía)'}`);
    console.log('  Contraseña: la de tu DATABASE_URL (no se muestra aquí).');
  } catch {
    console.warn('[n8n-local] DATABASE_URL no se pudo interpretar para el resumen.');
  }
  console.log('');
}

function prepareEnv() {
  loadEnvFile(path.join(REPO_ROOT, 'backend', '.env'));
  loadEnvFile(path.join(REPO_ROOT, '.env'), {
    override: true,
    onlyKeys: ROOT_ENV_KEYS,
  });

  fs.mkdirSync(N8N_DATA, { recursive: true });
  process.env.N8N_USER_FOLDER = N8N_DATA;

  if (!process.env.N8N_ENCRYPTION_KEY) {
    process.env.N8N_ENCRYPTION_KEY =
      'local-n8n-agriprecision-key-min-32-chars-change-me-ok';
  }
  process.env.N8N_BASIC_AUTH_ACTIVE ??= 'true';
  process.env.N8N_BASIC_AUTH_USER ??= 'admin';
  process.env.N8N_BASIC_AUTH_PASSWORD ??= 'admin123';
  process.env.WEBHOOK_URL ??= 'http://localhost:5678/';
  process.env.N8N_SECURE_COOKIE ??= 'false';
}

function runImport() {
  prepareEnv();
  const files = [
    path.join(WORKFLOWS_DIR, 'workflow-heartbeat.json'),
    path.join(WORKFLOWS_DIR, 'workflow-climate-ingest.json'),
  ];
  for (const fp of files) {
    if (!fs.existsSync(fp)) {
      console.warn(`[n8n-local] No existe ${path.basename(fp)}, se omite.`);
      continue;
    }
    console.log(`[n8n-local] Importando ${path.basename(fp)}...`);
    execSync(`npx --yes n8n import:workflow --input="${fp}"`, {
      stdio: 'inherit',
      env: process.env,
      shell: true,
      cwd: WORKFLOWS_DIR,
    });
  }
  console.log('[n8n-local] Import terminado. Abre n8n y asigna la credencial Postgres en cada nodo.');
}

function runStart() {
  prepareEnv();

  console.log('');
  console.log('[n8n-local] Servicio → http://localhost:5678');
  console.log('[n8n-local] Basic auth usuario: admin  contraseña: admin123 (solo desarrollo)');
  if (process.env.OPENWEATHER_API_KEY) {
    console.log('[n8n-local] OPENWEATHER_API_KEY detectada (.env cargado).');
  } else {
    console.log('[n8n-local] OPENWEATHER_API_KEY no definida → workflow clima sin clave hasta que la pongas.');
  }

  printPostgresCredentialHint();
  console.log('[n8n-local] Mantén esta ventana abierta. Ctrl+C para detener.');
  console.log('');

  const child = spawn('npx', ['--yes', 'n8n'], {
    stdio: 'inherit',
    env: process.env,
    shell: true,
    cwd: WORKFLOWS_DIR,
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}

const cmd = process.argv[2];
if (cmd === 'import' || cmd === 'i') {
  runImport();
} else {
  runStart();
}
