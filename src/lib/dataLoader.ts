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

const cache = new Map<string, Promise<SeasonData>>();

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

export function loadSeason(season: string): Promise<SeasonData> {
  if (!cache.has(season)) {
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
        table: normalizeTable(raw.table)
      };
    })();
    cache.set(season, p);
  }
  return cache.get(season)!;
}

export const SEASONS = [
  '2016-2017','2017-2018','2018-2019','2019-2020','2020-2021','2021-2022','2022-2023','2023-2024','2024-2025','2025-2026'
];
export const CURRENT_SEASON = '2025-2026';
