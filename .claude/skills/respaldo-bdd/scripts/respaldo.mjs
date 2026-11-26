#!/usr/bin/env node
// Respaldo .bak de la base `project` (SQL Server en el contenedor Docker `sqlserver`).
//
// Uso:
//   node respaldo.mjs [motivo]            → genera, verifica y copia el .bak a Rymel/backups/
//   node respaldo.mjs --listar            → lista los respaldos locales
//
// Variables opcionales: RYMEL_ROOT, RESPALDO_CONTENEDOR, RESPALDO_DESTINO.
// La conexión se lee de project-back/.env (DATABASE_HOST, _PORT, _USER, _PASSWORD, _NAME);
// la contraseña nunca se imprime.

import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = process.env.RYMEL_ROOT ?? '/Users/alex.pinaida/Resplados/Code/Rymel';
const BACK = join(RAIZ, 'project-back');
const CONTENEDOR = process.env.RESPALDO_CONTENEDOR ?? 'sqlserver';
const DESTINO = resolve(process.env.RESPALDO_DESTINO ?? join(RAIZ, 'backups'));
const DIR_CONTENEDOR = '/var/opt/mssql/data';

const falla = (msg) => { console.error(`✗ ${msg}`); process.exit(1); };
const ok = (msg) => console.log(`✓ ${msg}`);

function listar() {
  if (!existsSync(DESTINO)) return console.log(`(no existe ${DESTINO})`);
  const filas = readdirSync(DESTINO).filter((f) => f.endsWith('.bak')).sort();
  if (!filas.length) return console.log('(sin respaldos)');
  for (const f of filas) {
    const s = statSync(join(DESTINO, f));
    console.log(`${(s.size / 1048576).toFixed(1).padStart(8)} MB  ${s.mtime.toISOString().slice(0, 16)}  ${f}`);
  }
}

function leerEnv(ruta) {
  if (!existsSync(ruta)) falla(`No encuentro ${ruta}`);
  const env = {};
  for (const linea of readFileSync(ruta, 'utf8').split('\n')) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function docker(...args) {
  return execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--listar')) return listar();

  const motivo = (args.join('_') || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

  // 1. Docker y contenedor arriba
  try { docker('info', '--format', '{{.ServerVersion}}'); }
  catch { falla('Docker no está corriendo. Abre Docker Desktop (open -a Docker) y reintenta.'); }
  let estado;
  try { estado = docker('inspect', '-f', '{{.State.Running}}', CONTENEDOR); }
  catch { falla(`No existe el contenedor «${CONTENEDOR}». Revisa con: docker ps -a`); }
  if (estado !== 'true') falla(`El contenedor «${CONTENEDOR}» está detenido. Arráncalo con: docker start ${CONTENEDOR}`);
  ok(`Contenedor ${CONTENEDOR} en marcha`);

  // 2. Conexión con el driver que ya trae project-back
  const env = leerEnv(join(BACK, '.env'));
  const base = env.DATABASE_NAME ?? 'project';
  if (!/^[A-Za-z0-9_]+$/.test(base)) falla(`Nombre de base inesperado: ${base}`);
  const require = createRequire(join(BACK, 'package.json'));
  let sql;
  try { sql = require('mssql'); } catch { falla(`No encuentro el paquete mssql en ${BACK}/node_modules (¿npm install?)`); }

  const pool = await sql.connect({
    server: env.DATABASE_HOST ?? 'localhost',
    port: Number(env.DATABASE_PORT ?? 1433),
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: 'master',
    options: { encrypt: false, trustServerCertificate: true },
    requestTimeout: 15 * 60 * 1000,
  }).catch((e) => falla(`No pude conectar a SQL Server: ${e.message}`));

  // 3. BACKUP (COPY_ONLY para no alterar ninguna cadena de respaldos)
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const sello = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  const nombre = `${base}_${sello}${motivo ? `_${motivo}` : ''}.bak`;
  const rutaContenedor = `${DIR_CONTENEDOR}/${nombre}`;
  const descripcion = `${base} ${sello}${motivo ? ` — ${motivo}` : ''}`;

  const info = await pool.request().query(
    `SELECT CAST(SUM(size) * 8.0 / 1024 AS decimal(10,1)) mb FROM sys.master_files WHERE database_id = DB_ID('${base}')`,
  );
  console.log(`… Respaldando [${base}] (${info.recordset[0].mb ?? '?'} MB en disco) → ${nombre}`);

  await pool.request().query(
    `BACKUP DATABASE [${base}] TO DISK = N'${rutaContenedor}' WITH COPY_ONLY, INIT, FORMAT, CHECKSUM, NAME = N'${descripcion.replace(/'/g, "''")}'`,
  ).catch((e) => falla(`BACKUP falló: ${e.message}`));
  ok('BACKUP DATABASE terminado');

  await pool.request().query(`RESTORE VERIFYONLY FROM DISK = N'${rutaContenedor}' WITH CHECKSUM`)
    .catch((e) => falla(`El .bak no pasó RESTORE VERIFYONLY: ${e.message}`));
  ok('RESTORE VERIFYONLY: el archivo es legible y los checksums cuadran');
  await pool.close();

  // 4. Copiar al host y limpiar el contenedor
  mkdirSync(DESTINO, { recursive: true });
  const rutaLocal = join(DESTINO, nombre);
  try { docker('cp', `${CONTENEDOR}:${rutaContenedor}`, rutaLocal); }
  catch (e) { falla(`docker cp falló (el .bak sigue en el contenedor: ${rutaContenedor}): ${e.message}`); }
  if (!existsSync(rutaLocal) || statSync(rutaLocal).size === 0) falla('La copia local quedó vacía; el .bak sigue en el contenedor.');
  try { docker('exec', CONTENEDOR, 'rm', '-f', rutaContenedor); } catch { /* no crítico */ }

  ok(`Respaldo listo: ${rutaLocal} (${(statSync(rutaLocal).size / 1048576).toFixed(1)} MB)`);
}

main().catch((e) => falla(e.message));
