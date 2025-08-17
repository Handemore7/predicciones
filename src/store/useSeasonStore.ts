import { create } from 'zustand';
import { loadSeason, CURRENT_SEASON, SEASONS } from '../lib/dataLoader';
import type { SeasonData } from '../types';

interface SeasonState {
  seasons: string[];
  currentSeason: string;
  data?: SeasonData;
  loading: boolean;
  error?: string;
  setSeason: (season: string) => void;
  ensureLoaded: (season?: string) => Promise<void>;
  // filtros
  search: string;
  hidePlaceholders: boolean;
  sort: { key: string; dir: 'asc' | 'desc' };
  setSearch: (v: string) => void;
  toggleHidePlaceholders: () => void;
  setSort: (key: string) => void;
}

export const useSeasonStore = create<SeasonState>((set, get) => ({
  seasons: SEASONS,
  currentSeason: CURRENT_SEASON,
  loading: false,
  search: '',
  hidePlaceholders: false,
  sort: { key: 'position', dir: 'asc' },
  setSeason: (season) => {
    set({ currentSeason: season });
    void get().ensureLoaded(season);
  },
  ensureLoaded: async (season = get().currentSeason) => {
    if (get().data?.season === season) return;
    set({ loading: true, error: undefined });
    try {
      const data = await loadSeason(season);
      set({ data, loading: false });
    } catch (e: any) {
      set({ error: e.message || 'Error cargando datos', loading: false });
    }
  },
  setSearch: (v) => set({ search: v }),
  toggleHidePlaceholders: () => set(s => ({ hidePlaceholders: !s.hidePlaceholders })),
  setSort: (key) => set(s => {
    if (s.sort.key === key) {
      return { sort: { key, dir: s.sort.dir === 'asc' ? 'desc' : 'asc' } };
    }
    return { sort: { key, dir: 'asc' } };
  })
}));
