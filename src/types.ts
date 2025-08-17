export interface TeamSeasonStats {
  teamId: string;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference?: number;
  points: number;
  position: number;
  form?: string | null; // cadena tipo W,W,D,L...
  placeholder?: boolean; // true si los datos son sintéticos
}

export interface MatchScore {
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
  winner: string | null; // HOME_TEAM, AWAY_TEAM, DRAW, null
}

export interface Match {
  id: string;
  season: string; // e.g. 2025-2026
  utcDate: string; // ISO date
  matchday: number;
  status?: string; // SCHEDULED, FINISHED, etc
  stage?: string; // REGULAR_SEASON
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: string;
  awayTeam: string;
  score: MatchScore | { home: number; away: number } | null; // admitir forma antigua
  venue?: string;
  lastUpdated?: string;
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
  competition?: {
    id?: number;
    code?: string;
    name?: string;
    emblem?: string;
  };
  table: TeamSeasonStats[];
  matches: Match[];
  injuries: Injury[];
  generatedAt: string; // ISO
  source: string; // placeholder or api name
}
