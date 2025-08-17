import React from 'react';
import { useSeasonStore } from '../store/useSeasonStore';

export const SeasonSelector: React.FC = () => {
  const seasons = useSeasonStore(s => s.seasons);
  const current = useSeasonStore(s => s.currentSeason);
  const setSeason = useSeasonStore(s => s.setSeason);
  return (
    <select value={current} onChange={e => setSeason(e.target.value)} aria-label="Seleccionar temporada">
      {seasons.map(season => <option key={season} value={season}>{season}</option>)}
    </select>
  );
};
