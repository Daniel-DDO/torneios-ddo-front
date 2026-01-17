import { useEffect, useState, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Trophy, Moon, Sun, Shield } from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import '../styles/TelaBracket.css';

interface TeamData {
  id: string;
  jogadorNome: string;
  clubeNome: string;
  clubeImagem: string;
}

type TipoPartidaEnum = 'FASE_DE_GRUPOS' | 'MATA_MATA_IDA' | 'MATA_MATA_VOLTA' | 'MATA_MATA_UNICO' | 'FINAL_UNICA' | 'FINAL_IDA' | 'FINAL_VOLTA' | 'DISPUTA_TERCEIRO_LUGAR';

interface MatchDetail {
  id: string;
  tipoPartida: TipoPartidaEnum;
  realizada: boolean;
  dataHora: string | null;
  estadio: string | null;
  mandante: TeamData | null;
  visitante: TeamData | null;
  golsMandante: number | null;
  golsVisitante: number | null;
  penaltisMandante?: number | null;
  penaltisVisitante?: number | null;
  houvePenaltis: boolean;
}

const MATCH_ORDER: Record<string, number> = {
  'MATA_MATA_IDA': 1, 'FINAL_IDA': 1,
  'MATA_MATA_VOLTA': 2, 'FINAL_VOLTA': 2,
  'MATA_MATA_UNICO': 3, 'FINAL_UNICA': 3,
  'DISPUTA_TERCEIRO_LUGAR': 4
};

const SkeletonCard = () => (
  <div className="tbk-card tbk-skeleton-anim" style={{ padding: '24px', minHeight: '180px' }}>
    <div className="tbk-card-header">
      <div className="tbk-sk-badge"></div>
      <div className="tbk-sk-date"></div>
    </div>
    <div className="tbk-card-body">
      <div className="tbk-team-col">
        <div className="tbk-sk-logo" style={{ width: '70px', height: '70px' }}></div>
        <div className="tbk-sk-line width-80"></div>
        <div className="tbk-sk-line width-50"></div>
      </div>
      <div className="tbk-score-col">
        <div className="tbk-sk-score-box" style={{ width: '100px', height: '50px' }}></div>
        <div className="tbk-sk-line width-50" style={{ marginTop: '10px' }}></div>
      </div>
      <div className="tbk-team-col">
        <div className="tbk-sk-logo" style={{ width: '70px', height: '70px' }}></div>
        <div className="tbk-sk-line width-80"></div>
        <div className="tbk-sk-line width-50"></div>
      </div>
    </div>
  </div>
);

export function TelaBracketJogos() {
  const { temporadaId, torneioId, faseId, etapa, chaveIndex } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useLayoutEffect(() => {
    if (isDarkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    let isMounted = true;
    if (faseId && etapa && chaveIndex) {
      const loadMatches = async () => {
        try {
          setLoading(true);
          const response = await API.get(`/api/bracket/${faseId}/chave/${etapa}/${chaveIndex}`);
          if (isMounted && response.data) {
            const sorted = (response.data as MatchDetail[]).sort((a, b) => {
              const orderA = MATCH_ORDER[a.tipoPartida] || 99;
              const orderB = MATCH_ORDER[b.tipoPartida] || 99;
              return orderA - orderB;
            });
            setMatches(sorted);
          }
        } catch (error) {
          console.error(error);
        } finally {
          if (isMounted) setTimeout(() => setLoading(false), 500);
        }
      };
      loadMatches();
    }
    return () => { isMounted = false; };
  }, [faseId, etapa, chaveIndex]);

  const handlePartidaClick = (id: string) => {
    navigate(`/${temporadaId}/torneio/${torneioId}/fase/${faseId}/bracket/${etapa}/${chaveIndex}/partida/${id}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data a definir';
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getLabel = (tipo: TipoPartidaEnum) => {
    if (tipo?.includes('IDA')) return 'JOGO DE IDA';
    if (tipo?.includes('VOLTA')) return 'JOGO DE VOLTA';
    if (tipo?.includes('TERCEIRO')) return 'DISPUTA DE 3º LUGAR';
    if (tipo?.includes('FINAL')) return 'GRANDE FINAL';
    return 'JOGO ÚNICO';
  };

  return (
    <div className="tb-screen">
      <header className="tb-header">
        <button onClick={() => navigate(-1)} className="tb-btn-icon-back">
          <ArrowLeft size={20} />
        </button>
        
        <div className="tb-header-center">
          <div className="tb-road-badge"><Trophy size={10} /> CHAVE #{chaveIndex}</div>
          <h1 className="tb-stadium-title" style={{ fontSize: '1.2rem' }}>
            {etapa?.replace(/_/g, ' ')}
          </h1>
        </div>
        
        <button className="tb-btn-icon-back" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="tb-scroll-area">
        <div className="tbk-list-container">
          
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : matches.length === 0 ? (
            <div className="tbk-empty">
              <Shield size={48} />
              <p>Nenhum confronto definido.</p>
            </div>
          ) : (
            matches.map((match, idx) => (
              <div 
                key={match.id} 
                className="tbk-card tbk-animate-enter"
                style={{ 
                    animationDelay: `${idx * 100}ms`,
                    padding: '24px',
                    minHeight: '180px'
                }}
                onClick={() => handlePartidaClick(match.id)}
              >
                <div className="tbk-card-header" style={{ marginBottom: '24px' }}>
                  <div className="tbk-header-left">
                    <span className="tbk-badge-type" style={{ fontSize: '0.75rem', padding: '6px 10px' }}>
                        {getLabel(match.tipoPartida)}
                    </span>
                    {match.realizada && (
                        <span className="tbk-badge-finished" style={{ fontSize: '0.7rem' }}>FINALIZADO</span>
                    )}
                  </div>
                  <div className="tbk-header-date" style={{ fontSize: '0.85rem' }}>
                    <Calendar size={14} style={{marginRight: 6}}/>
                    {match.dataHora ? formatDate(match.dataHora) : 'Data a definir'}
                  </div>
                </div>

                <div className="tbk-card-body" style={{ gap: '20px' }}>
                  <div className="tbk-team-col">
                    {match.mandante ? (
                      <>
                        <img 
                            src={match.mandante.clubeImagem} 
                            alt="" 
                            className="tbk-team-logo" 
                            style={{ width: '72px', height: '72px' }}
                        />
                        <span className="tbk-player-name" style={{ fontSize: '1rem', marginTop: '8px' }}>
                            {match.mandante.jogadorNome}
                        </span>
                        <span className="tbk-club-name" style={{ fontSize: '0.85rem' }}>
                            {match.mandante.clubeNome}
                        </span>
                      </>
                    ) : (
                      <div className="tbk-team-placeholder">A definir</div>
                    )}
                  </div>

                  <div className="tbk-score-col">
                    <div className="tbk-score-display" style={{ padding: '12px 24px', marginBottom: '12px' }}>
                      <span className={`tbk-score-num ${match.realizada ? 'active' : ''}`} style={{ fontSize: '2rem' }}>
                        {match.realizada && match.golsMandante !== null ? match.golsMandante : '-'}
                      </span>
                      <span className="tbk-score-x" style={{ fontSize: '1.2rem', margin: '0 8px' }}>×</span>
                      <span className={`tbk-score-num ${match.realizada ? 'active' : ''}`} style={{ fontSize: '2rem' }}>
                        {match.realizada && match.golsVisitante !== null ? match.golsVisitante : '-'}
                      </span>
                    </div>

                    {match.houvePenaltis && (
                        <div style={{ 
                            fontSize: '0.8rem', 
                            color: 'var(--tb-text-dark)', 
                            fontWeight: 700,
                            marginBottom: '8px',
                            background: 'rgba(0,0,0,0.05)',
                            padding: '4px 10px',
                            borderRadius: '10px'
                        }}>
                            ({match.penaltisMandante} Pênaltis {match.penaltisVisitante})
                        </div>
                    )}

                    {match.estadio && (
                        <span className="tbk-stadium" style={{ fontSize: '0.8rem' }}>
                            <MapPin size={12}/> {match.estadio}
                        </span>
                    )}
                  </div>

                  <div className="tbk-team-col">
                    {match.visitante ? (
                      <>
                        <img 
                            src={match.visitante.clubeImagem} 
                            alt="" 
                            className="tbk-team-logo" 
                            style={{ width: '72px', height: '72px' }}
                        />
                        <span className="tbk-player-name" style={{ fontSize: '1rem', marginTop: '8px' }}>
                            {match.visitante.jogadorNome}
                        </span>
                        <span className="tbk-club-name" style={{ fontSize: '0.85rem' }}>
                            {match.visitante.clubeNome}
                        </span>
                      </>
                    ) : (
                      <div className="tbk-team-placeholder">A definir</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}