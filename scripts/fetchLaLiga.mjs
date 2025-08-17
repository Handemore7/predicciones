#!/usr/bin/env node
/**
 * Descarga standings y partidos de LaLiga (competición PD) para las últimas 10 temporadas
 * usando football-data.org.
 * Requiere variable de entorno FOOTBALL_DATA_TOKEN.
 * Si falta token, no sobreescribe archivos existentes (mantiene placeholders).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
// Carga variables desde .env si existe
try { await import('dotenv/config'); } catch { /* opcional */ }

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const COMP = 'PD';

// Permitir limitar temporadas mediante variable FETCH_SEASONS:
//  - Lista explícita: "2019,2020,2024"
//  - Rango relativo: "recent:2" (últimas 2 comenzadas)
//  - Por defecto las 10 configuradas originalmente
function resolveSeasons() {
  const raw = process.env.FETCH_SEASONS?.trim();
  const baseList = Array.from({ length: 10 }, (_, i) => 2016 + i); // 2016..2025
  if (!raw) return baseList;
  if (raw.startsWith('recent:')) {
    const n = parseInt(raw.split(':')[1] || '1', 10) || 1;
    // Año de inicio de la temporada activa (si estamos después de julio -> año actual, si no año-1)
    const now = new Date();
    const activeStart = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    const list = [];
    for (let y = activeStart; y > activeStart - n; y--) list.push(y);
    return list.sort((a,b)=>a-b);
  }
  return raw.split(',').map(s=>parseInt(s.trim(),10)).filter(Boolean).sort((a,b)=>a-b);
}
const seasons = resolveSeasons();
console.log('[fetchLaLiga] Temporadas objetivo:', seasons.map(y=>`${y}-${y+1}`).join(', '));
if (!TOKEN) console.log('[fetchLaLiga] FOOTBALL_DATA_TOKEN no presente: solo placeholders / archivos existentes.');
else console.log('[fetchLaLiga] Token detectado (longitud:', TOKEN.length, ').');
const outDir = path.resolve('public', 'data');
await fs.mkdir(outDir, { recursive: true });

async function fetchJSON(url) {
  const headers = TOKEN ? { 'X-Auth-Token': TOKEN } : {};
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching ${url}`);
  return res.json();
}

// Determinar temporada activa (la que potencialmente cambia día a día) para decidir recarga
function getActiveSeasonStart() {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}
const activeSeasonStart = getActiveSeasonStart();

async function processSeason(startYear) {
  const label = `${startYear}-${startYear + 1}`;
  const file = path.join(outDir, `${label}.json`);
  const fileExists = await fs.access(file).then(()=>true).catch(()=>false);
  if (!TOKEN) {
    if (fileExists) console.log(`(skip) ${label} existente (sin token).`);
    else console.log(`(placeholder) sin token para ${label}`);
    return;
  }
  // Si la temporada NO es la activa y ya tenemos archivo, evitamos gastar cuota.
  if (fileExists && startYear < activeSeasonStart && !process.env.FORCE_REFRESH) {
    // Revisar si es placeholder (muy pocos equipos o todos puntos = 0) para decidir refrescar igualmente
    try {
      const raw = JSON.parse(await fs.readFile(file,'utf8'));
      const tbl = raw.table || [];
      const sumPts = tbl.reduce((a,b)=>a+(b.points||0),0);
      if (tbl.length >= 18 && sumPts > 0) {
        console.log(`(cache) ${label} ya con datos reales (puntos totales ${sumPts}), salto.`);
        return;
      } else {
        console.log(`(refresh) ${label} parece placeholder (equipos:${tbl.length} ptsTot:${sumPts}) → re-descarga.`);
      }
    } catch {
      console.log(`(refresh) ${label} archivo ilegible → re-descarga.`);
    }
  }
  console.log(`Descargando ${label} ...${startYear === activeSeasonStart ? ' (temporada activa)' : ''}`);
  const standingsUrl = `https://api.football-data.org/v4/competitions/${COMP}/standings?season=${startYear}`;
  const matchesUrl = `https://api.football-data.org/v4/competitions/${COMP}/matches?season=${startYear}`;
  const [standingsRaw, matchesRaw] = await Promise.all([
    fetchJSON(standingsUrl),
    fetchJSON(matchesUrl)
  ]);
  const table = (standingsRaw.standings || [])
    .find(s => s.type === 'TOTAL')?.table?.map(r => ({
      teamId: r.team.id?.toString() || r.team.tla || r.team.shortName || r.team.name,
      name: r.team.name,
      shortName: r.team.shortName,
      tla: r.team.tla,
      crest: r.team.crest,
      played: r.playedGames,
      wins: r.won,
      draws: r.draw,
      losses: r.lost,
      goalsFor: r.goalsFor,
      goalsAgainst: r.goalsAgainst,
      goalDifference: r.goalDifference,
      points: r.points,
      form: r.form || null,
      position: r.position
    })) || [];
  const matches = (matchesRaw.matches || []).map(m => ({
    id: m.id.toString(),
    season: label,
    utcDate: m.utcDate,
    matchday: m.matchday || 0,
    status: m.status,
    stage: m.stage,
    homeTeamId: m.homeTeam.id?.toString(),
    awayTeamId: m.awayTeam.id?.toString(),
    homeTeam: m.homeTeam.name,
    awayTeam: m.awayTeam.name,
    score: {
      fullTime: m.score.fullTime || { home: null, away: null },
      halfTime: m.score.halfTime || { home: null, away: null },
      winner: m.score.winner || null
    },
    venue: m.venue,
    lastUpdated: m.lastUpdated
  }));
  const injuries = []; // Fuente externa requerida; dejar vacío por ahora.
  const seasonData = {
    season: label,
    competition: standingsRaw.competition ? {
      id: standingsRaw.competition.id,
      code: standingsRaw.competition.code,
      name: standingsRaw.competition.name,
      emblem: standingsRaw.competition.emblem
    } : { code: COMP },
    generatedAt: new Date().toISOString(),
    source: 'football-data.org',
    table,
    matches,
    injuries
  };
  await fs.writeFile(file, JSON.stringify(seasonData, null, 2), 'utf8');
  console.log(`OK ${label} -> ${file}`);
}

for (const y of seasons) {
  try {
    await processSeason(y);
  } catch (e) {
    console.error('Error temporada', y, e.message);
  }
}

// Construir manifest con generatedAt y hash de cada archivo de temporada
async function buildManifest() {
  const files = await fs.readdir(outDir);
  const seasonFiles = files.filter(f => /\d{4}-\d{4}\.json$/.test(f));
  const entries = {};
  for (const fname of seasonFiles) {
    try {
      const full = path.join(outDir, fname);
      const raw = await fs.readFile(full, 'utf8');
      const json = JSON.parse(raw);
      const hash = crypto.createHash('sha1').update(raw).digest('hex').slice(0,12);
      entries[json.season] = { generatedAt: json.generatedAt, hash };
    } catch (e) {
      console.warn('[manifest] no se pudo procesar', fname, e.message);
    }
  }
  const manifestPath = path.join(outDir, 'manifest.json');
  const newContent = JSON.stringify({ seasons: entries }, null, 2);
  let prev = '';
  try { prev = await fs.readFile(manifestPath,'utf8'); } catch {}
  if (prev !== newContent) {
    await fs.writeFile(manifestPath, newContent, 'utf8');
    console.log('[manifest] actualizado.');
  } else {
    console.log('[manifest] sin cambios.');
  }
}

await buildManifest();

if (!TOKEN) {
  console.log('\nSin FOOTBALL_DATA_TOKEN: se conservaron/crearon placeholders. Exporta un token y vuelve a ejecutar para datos reales.');
} else {
  console.log('\nCompletado. Puedes forzar refresco histórico con FORCE_REFRESH=1.');
}
