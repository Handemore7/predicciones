export interface TeamSeasonStats {
  teamId: string;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  position: number;
  placeholder?: boolean; // true si los datos son sintéticos
}

export interface Match {
  id: string;
  season: string; // e.g. 2025-2026
  utcDate: string; // ISO date
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: string;
  awayTeam: string;
  score: { home: number; away: number } | null; // null if not played yet
  venue?: string;
}

export interface Injury {
  id: string;
  teamId: string;
  player: string;
  type: string;
  expectedReturn?: string;
  season: string;
}

export interface SeasonData {
  season: string;
  table: TeamSeasonStats[];
  matches: Match[];
  injuries: Injury[];
  generatedAt: string; // ISO
  source: string; // placeholder or api name
}
