import React from 'react';
import { useSeasonStore } from '../store/useSeasonStore';
import { Link } from 'react-router-dom';

export const LeagueTable: React.FC = () => {
  // Obtener TODO lo que necesitamos en una sola suscripción para mantener orden de hooks estable
  const {
    data, loading, error,
    search, hidePlaceholders: hidePh,
    sort, setSort
  } = useSeasonStore(s => ({
    data: s.data,
    loading: s.loading,
    error: s.error,
    search: s.search.toLowerCase(),
    hidePlaceholders: s.hidePlaceholders,
    sort: s.sort,
    setSort: s.setSort
  }));

  if (loading) return <p>Cargando tabla...</p>;
  if (error) return <p style={{color:'tomato'}}>{error}</p>;
  if (!data) return null;
  const headers: { key: string; label: string; calc?: (r:any)=>any }[] = [
    { key: 'position', label: '#' },
    { key: 'name', label: 'Equipo' },
    { key: 'played', label: 'PJ' },
    { key: 'wins', label: 'G' },
    { key: 'draws', label: 'E' },
    { key: 'losses', label: 'P' },
    { key: 'goalsFor', label: 'GF' },
    { key: 'goalsAgainst', label: 'GC' },
    { key: 'dg', label: 'DG', calc: (r:any)=> r.goalDifference ?? (r.goalsFor - r.goalsAgainst) },
    { key: 'points', label: 'Pts' }
  ];
  const rows = data.table
    .filter(r => !search || r.name.toLowerCase().includes(search))
    .filter(r => !(hidePh && r.placeholder));
  const sorted = [...rows].sort((a,b)=>{
    let av:any; let bv:any;
  if (sort.key === 'dg') { av = (a.goalDifference ?? (a.goalsFor - a.goalsAgainst)); bv = (b.goalDifference ?? (b.goalsFor - b.goalsAgainst)); }
    else { av = (a as any)[sort.key]; bv = (b as any)[sort.key]; }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1;
    if (av > bv) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });
  const sortIndicator = (key:string) => sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : '';
  const crestPlaceholder = `${import.meta.env.BASE_URL}data/crest-placeholder.svg`;
  const handleCrestError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const img = e.currentTarget;
    const src = img.src || '';
    if (src.includes('crests.football-data.org') && src.endsWith('.png')) {
      img.src = src.replace(/\.png$/, '.svg');
      return;
    }
    img.src = crestPlaceholder;
  };
  return (
    <table className="league-table">
      <thead>
        <tr>
          {headers.map(h => (
            <th key={h.key} onClick={()=>setSort(h.key)} className="sortable">
              {h.label} {sortIndicator(h.key) && <span className="sort-ind">{sortIndicator(h.key)}</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map(row => (
          <tr key={row.teamId} className={row.placeholder ? 'placeholder-row' : ''}>
            <td>{row.position}</td>
            <td>
              <Link to={`team/${row.teamId}?season=${data.season}`}> 
                {(
                  <img 
                    src={row.crest || crestPlaceholder} 
                    alt="" 
                    style={{height:16,verticalAlign:'text-bottom',marginRight:6}} 
                    onError={handleCrestError}
                  />
                )}
                {row.name}
              </Link>
            </td>
            <td>{row.played}</td>
            <td>{row.wins}</td>
            <td>{row.draws}</td>
            <td>{row.losses}</td>
            <td>{row.goalsFor}</td>
            <td>{row.goalsAgainst}</td>
            <td>{row.goalDifference ?? (row.goalsFor - row.goalsAgainst)}</td>
            <td>{row.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
