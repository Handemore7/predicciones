import React, { useMemo } from 'react';
import { useSeasonStore } from '../store/useSeasonStore';
import { useParams, useSearchParams, Link } from 'react-router-dom';

export const TeamSeasonDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [query] = useSearchParams();
  const season = query.get('season') || useSeasonStore(s => s.currentSeason);
  const data = useSeasonStore(s => s.data);
  const loading = useSeasonStore(s => s.loading);
  const ensureLoaded = useSeasonStore(s => s.ensureLoaded);

  React.useEffect(() => { void ensureLoaded(season); }, [season, ensureLoaded]);

  if (loading || !data || data.season !== season) return <p>Cargando...</p>;
  const teamRow = data.table.find(t => t.teamId === teamId);
  if (!teamRow) return <p>No encontrado <Link to="/">Volver</Link></p>;

  const matches = data.matches.filter(m => m.homeTeamId === teamId || m.awayTeamId === teamId);

  const form = matches.slice(-5).map(m => {
    if (!m.score) return '•';
    const isHome = m.homeTeamId === teamId;
    const gf = isHome ? m.score.home : m.score.away;
    const ga = isHome ? m.score.away : m.score.home;
    if (gf > ga) return 'V';
    if (gf === ga) return 'E';
    return 'D';
  }).join(' ');

  const goalsTrend = useMemo(() => matches.filter(m=>m.score).map(m => ({
    matchday: m.matchday,
    goalsFor: m.homeTeamId === teamId ? (m.score?.home||0) : (m.score?.away||0),
    goalsAgainst: m.homeTeamId === teamId ? (m.score?.away||0) : (m.score?.home||0)
  })), [matches, teamId]);

  return (
    <>
      <header className="app-header">
        <h1>{teamRow.name} – {season}</h1>
        <div><Link to={`/?season=${season}`}>Volver</Link></div>
      </header>
      <main className="page">
        <div className="team-detail">
          <section className="panel" style={{padding:'1.1rem 1.2rem 1rem'}}>
            <h2 style={{margin:'0 0 .6rem'}}>Resumen</h2>
            <div className="stat-grid">
              <div className="stat"><h4>Puntos</h4><p>{teamRow.points}</p></div>
              <div className="stat"><h4>PJ</h4><p>{teamRow.played}</p></div>
              <div className="stat"><h4>G/E/P</h4><p>{teamRow.wins}/{teamRow.draws}/{teamRow.losses}</p></div>
              <div className="stat"><h4>Goles</h4><p>{teamRow.goalsFor}-{teamRow.goalsAgainst}</p></div>
              <div className="stat"><h4>DG</h4><p>{teamRow.goalsFor - teamRow.goalsAgainst}</p></div>
              <div className="stat"><h4>Posición</h4><p>{teamRow.position}</p></div>
              <div className="stat"><h4>Forma (5)</h4><p>{form}</p></div>
            </div>
          </section>
          <section className="panel" style={{padding:'1rem 1rem 1.1rem'}}>
            <h3 style={{margin:'0 0 .7rem'}}>Partidos</h3>
            <div className="table-wrapper" style={{maxHeight:400}}>
              <table className="matches">
                <thead><tr><th>J</th><th>Local</th><th>Resultado</th><th>Visitante</th></tr></thead>
                <tbody>
                  {matches.sort((a,b)=>a.matchday-b.matchday).map(m => (
                    <tr key={m.id}>
                      <td>{m.matchday}</td>
                      <td className={m.homeTeamId===teamId? 'focus-team': ''}>{m.homeTeam}</td>
                      <td>{m.score ? `${m.score.home} - ${m.score.away}` : '—'}</td>
                      <td className={m.awayTeamId===teamId? 'focus-team': ''}>{m.awayTeam}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel trend-block" style={{padding:'1rem 1rem 1.1rem'}}>
            <h3 style={{margin:'0 0 .7rem'}}>Tendencia de Goles (preview)</h3>
            <pre>{JSON.stringify(goalsTrend.slice(-15), null, 2)}</pre>
          </section>
        </div>
        <footer className="site">Datos sujetos a disponibilidad de la API. Próximamente gráficos.</footer>
      </main>
    </>
  );
};
