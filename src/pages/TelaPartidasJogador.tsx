import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Gamepad2,
  Ban,
  ArrowLeft
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface JogadorClubeResumoDTO {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string | null;
  clubeId: string;
  clubeNome: string;
  clubeImagem: string;
  clubeSigla: string;
}

interface PartidaHistoricoDTO {
  id: string;
  faseId: string;
  rodadaId: string | null;
  numeroRodada: number | null;
  dataHora: string | null;
  estadio: string;
  mandante: JogadorClubeResumoDTO;
  visitante: JogadorClubeResumoDTO;
  golsMandante: number | null;
  golsVisitante: number | null;
  realizada: boolean;
  wo: boolean;
  houvePenaltis: boolean;
  penaltisMandante: number | null;
  penaltisVisitante: number | null;
  anulada: boolean;
  motivoAnulacao: string | null;
}

interface PaginacaoResponse<T> {
  conteudo: T[];
  paginaAtual: number;
  totalPaginas: number;
  totalElementos: number;
  tamanhoPagina: number;
  ultimaPagina: boolean;
}

type AbaPartidas = 'a-fazer' | 'realizadas' | 'anuladas';

export function TelaPartidasJogador() {
  const navigate = useNavigate();
  const { id: jogadorId } = useParams<{ id: string }>();
  const { isMobile } = useAppContext();

  const [activeTab, setActiveTab] = useState<AbaPartidas>('a-fazer');
  const [nomeJogador, setNomeJogador] = useState<string>('');

  const endpointPorAba: Record<AbaPartidas, string> = {
    'a-fazer': 'a-fazer',
    realizadas: 'realizadas',
    anuladas: 'anuladas',
  };

  const {
    data: partidasData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingPartidas
  } = useInfiniteQuery({
    queryKey: ['partidasJogador', jogadorId, activeTab],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await API.get(
        `partida/jogador/${jogadorId}/${endpointPorAba[activeTab]}?pagina=${pageParam}&tamanho=10`
      );
      return (response.data || response) as PaginacaoResponse<PartidaHistoricoDTO>;
    },
    getNextPageParam: (lastPage) => lastPage.ultimaPagina ? undefined : lastPage.paginaAtual + 1,
    initialPageParam: 0,
    enabled: !!jogadorId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const partidas = useMemo(() => partidasData?.pages.flatMap(p => p.conteudo) ?? [], [partidasData]);

  useEffect(() => {
    if (partidas.length > 0 && !nomeJogador) {
      const primeira = partidas[0];
      if (primeira.mandante.jogadorId === jogadorId) {
        setNomeJogador(primeira.mandante.jogadorNome);
      } else if (primeira.visitante.jogadorId === jogadorId) {
        setNomeJogador(primeira.visitante.jogadorNome);
      }
    }
  }, [partidas, jogadorId, nomeJogador]);

  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 1.0 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [loadMore]);

  const formatDataHora = (dataString: string | null) => {
    if (!dataString) return { dia: 'A definir', hora: '--:--' };
    const date = new Date(dataString);
    return {
      dia: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <DashboardLayout esconderBusca contentStyle={{ padding: isMobile ? '1rem' : '0rem 0rem' }}>
      <LoadingSpinner isLoading={isLoadingPartidas} />

      <style>{`
    .tp-match-page-content {
      display: flex;
      justify-content: center;
    }

    .tp-match-container {
      width: 100%;
      max-width: 1000px;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .tp-match-page-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: -0.5rem;
    }

    .tp-match-page-title h2 {
        margin: 0;
        font-size: 1.4rem;
        color: var(--text-dark);
    }

    .tp-match-page-title span {
        font-size: 0.9rem;
        color: var(--text-gray);
    }

    .tp-match-tabs-header {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 1rem;
    }

    .tp-match-tab-btn {
        background: transparent;
        border: none;
        padding: 0.5rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-gray);
        cursor: pointer;
        border-radius: var(--radius);
        transition: all 0.2s;
    }

    .tp-match-tab-btn.active {
        background: var(--primary);
        color: white;
    }

    .tp-match-tab-btn:hover:not(.active) {
        background: var(--bg-card);
        color: var(--text-dark);
    }

    .tp-match-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .tp-match-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s;
        cursor: pointer;
    }

    .tp-match-card.tp-match-anulada-card {
        opacity: 0.75;
    }

    .tp-match-card:hover {
        transform: translateY(-2px);
        border-color: var(--primary);
    }

    .tp-match-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
        color: var(--text-gray);
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 0.8rem;
    }

    .tp-match-info-group {
        display: flex;
        gap: 1.5rem;
    }

    .tp-match-info-tag {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .tp-match-content {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 2rem;
        padding: 0.5rem 0;
    }

    .tp-match-team-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        text-align: center;
        min-width: 0;
        overflow: hidden;
    }

    .tp-match-team-logo {
        width: 70px;
        height: 70px;
        object-fit: contain;
        margin-bottom: 5px;
    }

    .tp-match-team-logo-placeholder {
        width: 70px;
        height: 70px;
        background: var(--bg-main);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: var(--text-gray);
        border: 2px solid var(--border-color);
        font-size: 1.5rem;
    }

    .tp-match-team-name {
        font-weight: 700;
        color: var(--text-dark);
        font-size: 1.1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        padding: 0 5px;
    }

    .tp-match-player-info {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--bg-main);
        padding: 4px 10px;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        margin-top: 4px;
        max-width: 100%;
    }

    .tp-match-player-info.tp-match-player-info-highlight {
        border-color: var(--primary);
        background: rgba(var(--primary-rgb), 0.08);
    }

    .tp-match-player-avatar-small {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: var(--primary);
        background-size: cover;
        background-position: center;
        flex-shrink: 0;
    }

    .tp-match-player-name {
        font-size: 0.8rem;
        color: var(--text-gray);
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .tp-match-score-board {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        min-width: 80px;
    }

    .tp-match-score-main {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--text-dark);
    }

    .tp-match-score-penalties {
        font-size: 0.85rem;
        color: var(--text-gray);
    }

    .tp-match-vs-text {
        font-size: 1.5rem;
        color: var(--text-gray);
        font-weight: 700;
        opacity: 0.5;
    }

    .tp-match-status-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
    }

    .tp-match-status-agendada { background: rgba(var(--primary-rgb), 0.1); color: var(--primary); }
    .tp-match-status-finalizada { background: rgba(var(--success-rgb), 0.1); color: var(--success); }
    .tp-match-status-wo { background: rgba(var(--danger-rgb), 0.1); color: var(--danger); }
    .tp-match-status-anulada { background: rgba(var(--danger-rgb), 0.1); color: var(--danger); }

    .tp-match-motivo-anulacao {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: var(--danger);
        background: rgba(var(--danger-rgb), 0.08);
        border: 1px dashed var(--danger);
        border-radius: var(--radius);
        padding: 0.6rem 1rem;
    }

    .tp-match-empty-state {
        text-align: center;
        padding: 4rem;
        color: var(--text-gray);
        background: var(--bg-card);
        border-radius: var(--radius);
        border: 1px dashed var(--border-color);
    }

    .tp-match-load-more-status {
        text-align: center;
        padding: 1rem;
        color: var(--text-gray);
    }

    @media (max-width: 768px) {
        .tp-match-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }
        .tp-match-score-main {
            justify-content: center;
        }
        .tp-match-vs-text {
            text-align: center;
        }
        .tp-match-info-group {
            flex-direction: column;
            gap: 0.5rem;
        }
    }
  `}</style>

        <div className="tp-match-page-content">
          <div className="tp-match-container">
            <div className="tp-match-page-header">
              <button className="icon-btn" onClick={() => navigate(`/jogador/${jogadorId}`)} title="Voltar ao perfil">
                <ArrowLeft size={18} />
              </button>
              <div className="tp-match-page-title">
                <h2>Partidas{nomeJogador ? ` de ${nomeJogador}` : ''}</h2>
                <span>Histórico completo de confrontos</span>
              </div>
            </div>

            <div className="tp-match-tabs-header">
              <button
                className={`tp-match-tab-btn ${activeTab === 'a-fazer' ? 'active' : ''}`}
                onClick={() => setActiveTab('a-fazer')}
              >
                A Fazer
              </button>
              <button
                className={`tp-match-tab-btn ${activeTab === 'realizadas' ? 'active' : ''}`}
                onClick={() => setActiveTab('realizadas')}
              >
                Realizadas
              </button>
              <button
                className={`tp-match-tab-btn ${activeTab === 'anuladas' ? 'active' : ''}`}
                onClick={() => setActiveTab('anuladas')}
              >
                Anuladas
              </button>
            </div>

            <div className="tp-match-list">
              {partidas.length > 0 ? (
                partidas.map((partida: PartidaHistoricoDTO) => {
                  const { dia, hora } = formatDataHora(partida.dataHora);
                  const mostrarPlacar = partida.realizada && !partida.anulada;
                  return (
                    <div
                      key={partida.id}
                      className={`tp-match-card ${partida.anulada ? 'tp-match-anulada-card' : ''}`}
                      onClick={() => navigate(`/partida/${partida.id}`)}
                    >
                      <div className="tp-match-header">
                        <div className="tp-match-info-group">
                          <div className="tp-match-info-tag">
                            <Calendar size={14} /> {dia}
                            {partida.dataHora && <><Clock size={14} style={{ marginLeft: '8px' }} /> {hora}</>}
                          </div>
                          <div className="tp-match-info-tag">
                            <MapPin size={14} /> {partida.estadio}
                          </div>
                        </div>
                        <div className="tp-match-info-tag">
                          {partida.numeroRodada != null && (
                            <span style={{ fontWeight: 600, marginRight: '10px' }}>Rodada {partida.numeroRodada}</span>
                          )}
                          {partida.anulada ? (
                            <span className="tp-match-status-badge tp-match-status-anulada">ANULADA</span>
                          ) : !partida.realizada ? (
                            <span className="tp-match-status-badge tp-match-status-agendada">AGENDADA</span>
                          ) : partida.wo ? (
                            <span className="tp-match-status-badge tp-match-status-wo">W.O.</span>
                          ) : (
                            <span className="tp-match-status-badge tp-match-status-finalizada">FINALIZADA</span>
                          )}
                        </div>
                      </div>

                      <div className="tp-match-content">
                        <div className="tp-match-team-display">
                          {partida.mandante.clubeImagem ? (
                            <img src={partida.mandante.clubeImagem} alt={partida.mandante.clubeNome} className="tp-match-team-logo" />
                          ) : (
                            <div className="tp-match-team-logo-placeholder">{partida.mandante.clubeSigla}</div>
                          )}
                          <span className="tp-match-team-name" title={partida.mandante.clubeNome}>{partida.mandante.clubeNome}</span>
                          <div className={`tp-match-player-info ${partida.mandante.jogadorId === jogadorId ? 'tp-match-player-info-highlight' : ''}`}>
                            <div
                              className="tp-match-player-avatar-small"
                              style={{ backgroundImage: partida.mandante.jogadorImagem ? `url(${partida.mandante.jogadorImagem})` : 'none' }}
                            ></div>
                            <span className="tp-match-player-name">{partida.mandante.jogadorNome}</span>
                          </div>
                        </div>

                        {mostrarPlacar ? (
                          <div className="tp-match-score-board">
                            <div className="tp-match-score-main">
                              <span>{partida.golsMandante ?? 0}</span>
                              <span style={{ opacity: 0.3, fontSize: '1.5rem' }}>x</span>
                              <span>{partida.golsVisitante ?? 0}</span>
                            </div>
                            {partida.houvePenaltis && (
                              <span className="tp-match-score-penalties">
                                ({partida.penaltisMandante} - {partida.penaltisVisitante} Pen.)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="tp-match-vs-text">VS</div>
                        )}

                        <div className="tp-match-team-display">
                          {partida.visitante.clubeImagem ? (
                            <img src={partida.visitante.clubeImagem} alt={partida.visitante.clubeNome} className="tp-match-team-logo" />
                          ) : (
                            <div className="tp-match-team-logo-placeholder">{partida.visitante.clubeSigla}</div>
                          )}
                          <span className="tp-match-team-name" title={partida.visitante.clubeNome}>{partida.visitante.clubeNome}</span>
                          <div className={`tp-match-player-info ${partida.visitante.jogadorId === jogadorId ? 'tp-match-player-info-highlight' : ''}`}>
                            <div
                              className="tp-match-player-avatar-small"
                              style={{ backgroundImage: partida.visitante.jogadorImagem ? `url(${partida.visitante.jogadorImagem})` : 'none' }}
                            ></div>
                            <span className="tp-match-player-name">{partida.visitante.jogadorNome}</span>
                          </div>
                        </div>
                      </div>

                      {partida.anulada && partida.motivoAnulacao && (
                        <div className="tp-match-motivo-anulacao" onClick={(e) => e.stopPropagation()}>
                          <Ban size={14} /> Motivo: {partida.motivoAnulacao}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="tp-match-empty-state">
                  <Gamepad2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>
                    {activeTab === 'a-fazer' && 'Nenhuma partida pendente encontrada.'}
                    {activeTab === 'realizadas' && 'Nenhuma partida realizada encontrada.'}
                    {activeTab === 'anuladas' && 'Nenhuma partida anulada encontrada.'}
                  </p>
                </div>
              )}

              <div ref={observerTarget} style={{ height: '20px' }} />
              {isFetchingNextPage && (
                <div className="tp-match-load-more-status">Carregando mais partidas...</div>
              )}
            </div>
          </div>
        </div>
    </DashboardLayout>
  );
}