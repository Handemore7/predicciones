import type { SeasonData, TeamSeasonStats } from '../types';

// Plantilla de equipos para completar temporadas cuando los datos json están incompletos
const TEAM_TEMPLATE: { teamId: string; name: string }[] = [
  { teamId: 'rm', name: 'Real Madrid' },
  { teamId: 'fcb', name: 'FC Barcelona' },
  { teamId: 'atm', name: 'Atlético Madrid' },
  { teamId: 'sev', name: 'Sevilla' },
  { teamId: 'rsoc', name: 'Real Sociedad' },
  { teamId: 'vil', name: 'Villarreal' },
  { teamId: 'ath', name: 'Athletic Club' },
  { teamId: 'bet', name: 'Real Betis' },
  { teamId: 'val', name: 'Valencia' },
  { teamId: 'cel', name: 'Celta Vigo' },
  { teamId: 'get', name: 'Getafe' },
  { teamId: 'osa', name: 'Osasuna' },
  { teamId: 'ray', name: 'Rayo Vallecano' },
  { teamId: 'mai', name: 'Mallorca' },
  { teamId: 'gir', name: 'Girona' },
  { teamId: 'ala', name: 'Alavés' },
  { teamId: 'udlp', name: 'Las Palmas' },
  { teamId: 'gra', name: 'Granada' },
  { teamId: 'cad', name: 'Cádiz' },
  { teamId: 'alm', name: 'Almería' }
];

// Map para teamId de plantilla -> id numérico football-data
const TEMPLATE_ID_TO_NUMERIC: Record<string, string> = {
  rm: '86', fcb: '81', atm: '78', sev: '559', rsoc: '92', vil: '94', ath: '77', bet: '90', val: '95',
  cel: '558', get: '82', osa: '79', ray: '87', mai: '89', gir: '298', ala: '263', udlp: '102', gra: '83', cad: '264', alm: '267'
};

// Versionar cache en memoria para invalidar resultados con cambios de lógica
const CACHE_VERSION = '2025-08-23-crest-v3';
const cache = new Map<string, Promise<SeasonData>>();
const cacheKey = (season: string) => `${CACHE_VERSION}:${season}`;

function normalizeTable(table: TeamSeasonStats[]): TeamSeasonStats[] {
  // Caso normal: si ya vienen (casi) todos los equipos reales (>=18) NO sustituimos nada.
  if (table.length >= 18) {
    // Asegurar posiciones coherentes (si faltan o hay desorden)
    const sorted = [...table].sort((a,b) => a.position - b.position);
    // Si no hay position fiable, recalculamos por puntos/gol diff
    const needRecalc = sorted.some((r,i) => r.position !== i+1);
    if (needRecalc) {
      sorted.sort((a,b)=>{
        if (b.points !== a.points) return b.points - a.points;
        const gdA = (a.goalsFor - a.goalsAgainst);
        const gdB = (b.goalsFor - b.goalsAgainst);
        if (gdB !== gdA) return gdB - gdA;
        return a.name.localeCompare(b.name);
      }).forEach((r,i)=>{ r.position = i+1; });
    }
    return sorted;
  }

  // Escenario placeholder: completar con plantilla interna.
  const byId = new Map(table.map(t => [t.teamId, t] as const));
  const completed: TeamSeasonStats[] = [...table];
  for (const tpl of TEAM_TEMPLATE) {
    if (completed.length >= 20) break;
    if (!byId.has(tpl.teamId)) {
      completed.push({
        teamId: tpl.teamId,
        name: tpl.name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        position: completed.length + 1,
        placeholder: true
      });
    }
  }
  completed.sort((a,b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return a.name.localeCompare(b.name);
  }).forEach((t,i)=>{ t.position = i+1; });
  return completed;
}

const cacheManifest = new Map<string, Promise<SeasonData>>();

interface ManifestEntry { generatedAt: string; hash: string; }
interface Manifest { seasons: Record<string, ManifestEntry>; }

let manifestPromise: Promise<Manifest | null> | null = null;
function loadManifest(base: string): Promise<Manifest | null> {
  if (!manifestPromise) {
    manifestPromise = fetch(`${base}data/manifest.json?_=${Date.now()}`)
      .then(r => r.ok ? r.json() : null)
      .catch(()=>null);
  }
  return manifestPromise;
}

let crestByName: Map<string, string> = new Map();
(function initCrestCache(){
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('crestMap.v1');
      if (raw) crestByName = new Map<string, string>(Object.entries(JSON.parse(raw)));
    }
  } catch { /* noop */ }
})();
function saveCrestCache(){
  try {
    if (typeof window !== 'undefined') {
      const obj = Object.fromEntries(crestByName.entries());
      localStorage.setItem('crestMap.v1', JSON.stringify(obj));
    }
  } catch { /* noop */ }
}

function normalizeStr(s: string) {
  const n = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return n.replace(/[^a-z0-9]+/g,' ').trim();
}
function simplifyStr(s: string) {
  const n = normalizeStr(s);
  return n.replace(/\b(cf|fc|cd|rcd|ud|sad|club|de|futbol|futbol)\b/g, ' ').replace(/\s+/g,' ').trim();
}

// Mapeo estático (football-data.org IDs) para equipos comunes de LaLiga
const STATIC_NAME_TO_ID: Record<string, string> = {
  // Grandes
  'fc barcelona': '81', 'barcelona': '81',
  'real madrid cf': '86', 'real madrid': '86',
  'club atletico de madrid': '78', 'atletico madrid': '78', 'atlético madrid': '78', 'atlético de madrid': '78',
  // Históricos
  'sevilla fc': '559', 'sevilla': '559',
  'real sociedad de futbol': '92', 'real sociedad': '92',
  'villarreal cf': '94', 'villarreal': '94',
  'athletic club': '77', 'athletic bilbao': '77',
  'real betis balompie': '90', 'real betis': '90',
  'valencia cf': '95', 'valencia': '95',
  'rc celta de vigo': '558', 'celta vigo': '558', 'celta': '558',
  'getafe cf': '82', 'getafe': '82',
  'ca osasuna': '79', 'osasuna': '79',
  'rayo vallecano de madrid': '87', 'rayo vallecano': '87', 'rayo': '87',
  'rcd mallorca': '89', 'mallorca': '89',
  'girona fc': '298', 'girona': '298',
  'deportivo alaves': '263', 'alaves': '263', 'alavés': '263',
  'ud las palmas': '102', 'las palmas': '102',
  'granada cf': '83', 'granada': '83',
  'cadiz cf': '264', 'cadiz': '264', 'cádiz': '264',
  'ud almeria': '267', 'almeria': '267', 'almería': '267',
  // Otros que pueden aparecer
  'rcd espanyol de barcelona': '80', 'espanyol': '80', 'rcd espanyol': '80',
  'levante ud': '88', 'levante': '88',
  'elche cf': '285', 'elche': '285'
};

function withCrests(base: string, table: TeamSeasonStats[], matches: SeasonData['matches']): TeamSeasonStats[] {
  const placeholder = `${base}data/crest-placeholder.svg`;
  // Índice: nombre normalizado -> id numérico usando partidos
  const nameToNumericId = new Map<string, string>();
  for (const m of matches || []) {
    const hId = m.homeTeamId?.toString();
    const aId = m.awayTeamId?.toString();
    const hName = m.homeTeam || '';
    const aName = m.awayTeam || '';
    if (hId && /^\d+$/.test(hId)) {
      nameToNumericId.set(normalizeStr(hName), hId);
      nameToNumericId.set(simplifyStr(hName), hId);
    }
    if (aId && /^\d+$/.test(aId)) {
      nameToNumericId.set(normalizeStr(aName), aId);
      nameToNumericId.set(simplifyStr(aName), aId);
    }
  }

  const resolved = table.map(row => {
    const nName = normalizeStr(row.name);
    const sName = simplifyStr(row.name);

    const isPlaceholder = !row.crest || /crest-placeholder\.svg$/.test(row.crest) || row.crest.includes('crest-placeholder.svg');
    if (row.crest && !isPlaceholder) {
      crestByName.set(nName, row.crest);
      crestByName.set(sName, row.crest);
      return row;
    }

    // 0) si el teamId coincide con la plantilla, usar ese id
    const tId = TEMPLATE_ID_TO_NUMERIC[row.teamId as keyof typeof TEMPLATE_ID_TO_NUMERIC as any];
    if (tId) {
      const crest = `https://crests.football-data.org/${tId}.png`;
      crestByName.set(nName, crest); crestByName.set(sName, crest);
      return { ...row, crest };
    }

    // 1) cache por nombre
    let cached = crestByName.get(nName) || crestByName.get(sName);
    if (cached) return { ...row, crest: cached };

    // 2) si el teamId es numérico
    if (/^\d+$/.test(row.teamId)) {
      const crest = `https://crests.football-data.org/${row.teamId}.png`;
      crestByName.set(nName, crest); crestByName.set(sName, crest);
      return { ...row, crest };
    }

    // 3) partidos o mapa estático
    let derivedId = nameToNumericId.get(nName) || nameToNumericId.get(sName);
    if (!derivedId) {
      derivedId = STATIC_NAME_TO_ID[nName] || STATIC_NAME_TO_ID[sName] || undefined;
    }

    // 4) coincidencia difusa (contains)
    if (!derivedId) {
      for (const [k, v] of Object.entries(STATIC_NAME_TO_ID)) {
        if (k.includes(sName) || sName.includes(k)) { derivedId = v; break; }
      }
      if (!derivedId) {
        for (const [k, v] of nameToNumericId.entries()) {
          if (k && (k.includes(sName) || sName.includes(k))) { derivedId = v; break; }
        }
      }
    }

    if (derivedId) {
      const crest = `https://crests.football-data.org/${derivedId}.png`;
      crestByName.set(nName, crest); crestByName.set(sName, crest);
      return { ...row, crest };
    }

    return { ...row, crest: placeholder };
  });

  // Persistir para futuras temporadas
  saveCrestCache();
  return resolved;
}

export function loadSeason(season: string): Promise<SeasonData> {
  const key = cacheKey(season);
  if (!cache.has(key)) {
    // Usar BASE_URL de Vite para que funcione en subcarpetas (GitHub Pages)
    const base = (import.meta as any).env?.BASE_URL || '/';
    const url = `${base}data/${season}.json`;
    const p = (async () => {
      // Intentar cache localStorage (solo en navegador)
      const lsKey = `season:${season}`;
      let cached: SeasonData | null = null;
      try {
        if (typeof window !== 'undefined') {
          const txt = localStorage.getItem(lsKey);
          if (txt) cached = JSON.parse(txt);
        }
      } catch {}

      const manifest = await loadManifest(base).catch(()=>null);
      const remoteMeta = manifest?.seasons?.[season];
      const needFetch = !cached || !remoteMeta || cached.generatedAt !== remoteMeta.generatedAt;
      let raw: SeasonData;
      if (needFetch) {
        const resp = await fetch(url + (remoteMeta ? `?v=${remoteMeta.hash}` : ''));
        if (!resp.ok) throw new Error(`No se pudo cargar temporada ${season}`);
        raw = await resp.json();
        // Guardar en localStorage
        try { if (typeof window !== 'undefined') localStorage.setItem(lsKey, JSON.stringify(raw)); } catch {}
      } else {
        raw = cached!;
      }
      return {
        ...raw,
        table: withCrests(base, normalizeTable(raw.table), raw.matches)
      };
    })();
    cache.set(key, p);
  }
  return cache.get(key)!;
}

export const SEASONS = [
  '2025-2026','2024-2025','2023-2024','2022-2023','2021-2022','2020-2021','2019-2020','2018-2019','2017-2018','2016-2017'
];
export const CURRENT_SEASON = '2025-2026';
