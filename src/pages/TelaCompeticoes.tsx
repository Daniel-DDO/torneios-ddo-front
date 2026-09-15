import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupCompeticao from '../components/PopupCompeticao';
import PopupVincularCompTitulo from '../components/PopupVincularCompTitulo';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface Competicao {
  id: string;
  nome: string;
  imagem: string;
  divisao: string;
  valor: number;
  descricao: string;
  titulo?: {
    id: string;
    nome: string;
    imagem: string;
  } | null;
}

interface PaginacaoResponse<T> {
  conteudo: T[];
  paginaAtual: number;
  totalPaginas: number;
  totalElementos: number;
  tamanhoPagina: number;
  ultimaPagina: boolean;
}

const PAGE_SIZE = 10;

const fetchCompeticoesPageService = async (
  pageParam: number,
  nomeFiltro: string
): Promise<PaginacaoResponse<Competicao>> => {
  const response = await API.get('/competicao/all', {
    params: {
      page: pageParam,
      size: PAGE_SIZE,
      sortBy: 'nome',
      direction: 'asc',
      nomeFiltro
    }
  });
  const data = (response && (response as any).data) ? (response as any).data : response;
  return data as PaginacaoResponse<Competicao>;
};

export function TelaCompeticoes() {
  const navigate = useNavigate();
  const { currentUser, isAdmin, getAvatarUrl, isMobile } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const {
    data,
    isLoading: loading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['competicoes', debouncedSearchTerm],
    queryFn: ({ pageParam = 0 }) => fetchCompeticoesPageService(pageParam, debouncedSearchTerm),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.ultimaPagina ? undefined : lastPage.paginaAtual + 1,
    staleTime: 1000 * 60 * 5,
  });

  const competicoes = useMemo(
    () => data?.pages.flatMap((page) => page.conteudo) ?? [],
    [data]
  );

  const [showCompeticaoPopup, setShowCompeticaoPopup] = useState(false);
  const [showVincularTituloPopup, setShowVincularTituloPopup] = useState(false);

  // Scroll infinito: observa uma sentinela no fim da grid e busca a próxima página
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '200px',
      threshold: 0,
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <DashboardLayout
      searchPlaceholder="Buscar competição..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      contentStyle={{ padding: isMobile ? '1rem' : '2rem 3rem' }}
    >
      <LoadingSpinner isLoading={loading} />

      <style>{`
        .page-content {
          padding: 2rem 3rem;
        }

        .players-grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
          margin-top: 24px;
        }

        .player-card-item {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          position: relative;
        }

        .player-card-item:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary);
        }

        .card-rank-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          background: var(--hover-bg);
          color: var(--primary);
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          border: 1px solid var(--border-color);
        }

        .card-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--hover-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 16px;
          border: 2px solid var(--border-color);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
        }

        .card-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 4px;
        }

        .card-location {
          font-size: 0.85rem;
          color: var(--text-gray);
          margin-bottom: 16px;
        }

        .card-stats-row {
          display: flex;
          justify-content: space-between;
          width: 100%;
          background: var(--hover-bg);
          padding: 10px 16px;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
        }

        .stat-val { font-weight: 700; color: var(--text-dark); font-size: 0.95rem; }
        .stat-lbl { font-size: 0.7rem; color: var(--text-gray); text-transform: uppercase; }

        .btn-profile {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid var(--primary);
          background: transparent;
          color: var(--primary);
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-profile:hover {
          background: var(--primary);
          color: white;
        }

        .resultado-contagem {
          font-size: 0.85rem;
          color: var(--text-gray);
          margin-top: 4px;
        }

        .scroll-sentinel {
          height: 1px;
          grid-column: 1 / -1;
        }

        .carregando-mais {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 24px;
          color: var(--text-gray);
          font-size: 0.9rem;
        }

        .carregando-mais svg {
          animation: spin-icon 0.8s linear infinite;
        }

        @keyframes spin-icon {
          to { transform: rotate(360deg); }
        }

        .titulo-mini-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          background-color: var(--hover-bg);
          border: 1px solid var(--border-color);
        }

        @media (max-width: 768px) {
          .page-content { padding: 1rem; }
        }
      `}</style>

      <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Competições</h2>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Visualize as competições oficiais</p>
                
            </div>
            {currentUser && isAdmin && currentUser.cargo === 'PROPRIETARIO' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="t-btn" 
                  style={{background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)'}}
                  onClick={() => setShowVincularTituloPopup(true)}
                >
                    Vincular Título
                </button>
                <button 
                  className="t-btn" 
                  style={{background: 'var(--primary)', color: 'white', border: 'none'}}
                  onClick={() => setShowCompeticaoPopup(true)}
                >
                    + Nova Competição
                </button>
              </div>
            )}
            </div>

            {!loading && (
                <div className="players-grid-container">
                {competicoes.map((competicao: Competicao, index: number) => {
                    const avatarUrl = getAvatarUrl(competicao.imagem);
                    const tituloAvatarUrl = getAvatarUrl(competicao.titulo?.imagem);

                    return (
                        <div 
                          key={competicao.id} 
                          className="player-card-item"
                          onClick={() => navigate(`/competicao/${competicao.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                        {tituloAvatarUrl && (
                          <div
                            className="titulo-mini-badge"
                            style={{ backgroundImage: `url(${tituloAvatarUrl})` }}
                            title={competicao.titulo?.nome}
                          />
                        )}
                        <div className="card-rank-badge">#{index + 1}</div>
                        
                        {avatarUrl ? (
                            <div className="card-avatar-large" style={{backgroundImage: `url(${avatarUrl})`}}></div>
                        ) : (
                            <div className="card-avatar-large">
                                {competicao.nome.substring(0,2).toUpperCase()}
                            </div>
                        )}
                        
                        <div className="card-name">{competicao.nome}</div>
                        <div className="card-location" title={competicao.descricao}>
                            {competicao.descricao ? competicao.descricao.substring(0, 40) + '...' : 'Sem descrição'}
                        </div>
                        
                        <div className="card-stats-row">
                            <div className="stat-box">
                            <span className="stat-val">{competicao.divisao}</span>
                            <span className="stat-lbl">Divisão</span>
                            </div>
                            <div style={{width: '1px', background: 'var(--border-color)'}}></div>
                            <div className="stat-box">
                            <span className="stat-val">{competicao.valor}</span>
                            <span className="stat-lbl">Valor</span>
                            </div>
                        </div>

                        <button className="btn-profile">Ver Competição</button>
                        </div>
                    );
                })}

                {competicoes.length === 0 && (
                  <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>
                    Nenhuma competição encontrada
                  </div>
                )}

                {isFetchingNextPage && (
                  <div className="carregando-mais">
                    <Loader2 size={18} /> Carregando mais competições...
                  </div>
                )}

                <div ref={sentinelRef} className="scroll-sentinel" />
                </div>
            )}
        </div>

      {showCompeticaoPopup && (
        <PopupCompeticao 
          onClose={() => setShowCompeticaoPopup(false)}
          onSuccess={() => refetch()}
        />
      )}

      {showVincularTituloPopup && (
        <PopupVincularCompTitulo 
          onClose={() => setShowVincularTituloPopup(false)}
          onSuccess={() => refetch()}
        />
      )}
    </DashboardLayout>
  );
}