import React, { useEffect } from 'react';
import { useSeasonStore } from '../store/useSeasonStore';
import { SeasonSelector } from '../components/SeasonSelector';
import { LeagueTable } from '../components/LeagueTable';
import { useSearchParams } from 'react-router-dom';
import { TableFilters } from '../components/TableFilters';

export const HomePage: React.FC = () => {
  const ensureLoaded = useSeasonStore(s => s.ensureLoaded);
  const setSeason = useSeasonStore(s => s.setSeason);
  const [params] = useSearchParams();
  const selectedSeason = params.get('season');
  useEffect(() => {
    if (selectedSeason) setSeason(selectedSeason);
    void ensureLoaded(selectedSeason || undefined);
  }, [selectedSeason, setSeason, ensureLoaded]);
  return (
    <>
      <header className="app-header">
        <h1>LaLiga – Temporadas</h1>
        <div className="controls-bar" style={{margin:0}}>
          <SeasonSelector />
        </div>
      </header>
      <main className="page">
        <section className="panel" style={{padding:"1rem 1.1rem 1.2rem", marginBottom:"1.15rem"}}>
          <div className="controls-bar">
            <div className="group" style={{flex:1}}>
              <TableFilters />
            </div>
          </div>
          <div className="table-wrapper" style={{marginTop:'.35rem'}}>
            <LeagueTable />
          </div>
        </section>
        <footer className="site">Datos históricos placeholder / API football-data.org. Interfaz mejorada.</footer>
      </main>
    </>
  );
};
