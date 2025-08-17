import React from 'react';
import { useSeasonStore } from '../store/useSeasonStore';

export const TableFilters: React.FC = () => {
  const search = useSeasonStore(s => s.search);
  const setSearch = useSeasonStore(s => s.setSearch);
  const hidePh = useSeasonStore(s => s.hidePlaceholders);
  const toggleHide = useSeasonStore(s => s.toggleHidePlaceholders);
  return (
    <div className="table-filters">
      <input
        type="text"
        placeholder="Buscar equipo..."
        value={search}
        onChange={e=>setSearch(e.target.value)}
      />
      <label style={{display:'flex', gap:4, alignItems:'center'}}>
        <input type="checkbox" checked={hidePh} onChange={toggleHide} /> Ocultar placeholders
      </label>
    </div>
  );
};
