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
  const byId = new Map(table.map(t => [t.teamId, t] as const));
  const completed: TeamSeasonStats[] = TEAM_TEMPLATE.map((tpl, idx) => {
    const existing = byId.get(tpl.teamId);
    if (existing) return existing;
    return {
      teamId: tpl.teamId,
      name: tpl.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      position: table.length + idx + 1, // provisional
      placeholder: true
    };
  });
  // Recalcular posiciones por puntos (desc) y diff de goles
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

export function loadSeason(season: string): Promise<SeasonData> {
  if (!cache.has(season)) {
    // Usar BASE_URL de Vite para que funcione en subcarpetas (GitHub Pages)
    const base = (import.meta as any).env?.BASE_URL || '/';
    const url = `${base}data/${season}.json`;
    const p = fetch(url).then(r => {
      if (!r.ok) throw new Error(`No se pudo cargar temporada ${season}`);
      return r.json();
    }).then((raw: SeasonData) => ({
      ...raw,
      table: normalizeTable(raw.table)
    }));
    cache.set(season, p);
  }
  return cache.get(season)!;
}

export const SEASONS = [
  '2016-2017','2017-2018','2018-2019','2019-2020','2020-2021','2021-2022','2022-2023','2023-2024','2024-2025','2025-2026'
];
export const CURRENT_SEASON = '2025-2026';
