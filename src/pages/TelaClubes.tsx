import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupNovoClube from '../components/PopupNovoClube';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface Clube {
  id: string;
  nome: string;
  estadio: string;
  imagem: string;
  ligaClube: string;
  sigla: string;
  corPrimaria: string;
  corSecundaria: string;
  ativo: boolean;
  estrelas: number;
}

const LIGA_NAMES: { [key: string]: string } = {
  LALIGA: "LaLiga",
  PREMIER_LEAGUE: "Premier League",
  SERIEA: "Serie A",
  BUNDESLIGA: "Bundesliga",
  LIGUEONE: "Ligue One",
  BRASILEIRAO: "Brasileirão",
  ARGENTINA: "Liga Argentina",
  MLS: "Major League Soccer",
  SAUDI_PRO_LEAGUE: "Saudi Pro League",
  SELECAO: "Seleção",
  OUTROS: "Outros"
};

const fetchClubesService = async ({ pageParam = 0, queryKey }: any) => {
  const endpoint = queryKey[1];
  const response = await API.get(`${endpoint}?page=${pageParam}&size=12`);
  return (response && (response as any).data) ? (response as any).data : response;
};

// Autocomplete do back — usado quando a listagem local (paginada) ainda
// está incompleta, para não esconder clubes que ainda não foram carregados.
const fetchBuscaAutocompleteService = async (termo: string): Promise<Clube[]> => {
  const response = await API.get('/clube/buscar-autocomplete', {
    params: { termo }
  });
  return Array.isArray(response.data) ? response.data : (Array.isArray(response) ? (response as any) : []);
};

const MIN_CARACTERES_BUSCA_BACK = 3;

export function TelaClubes() {
  const navigate = useNavigate();
  const { currentUser, isAdmin, getAvatarUrl, isMobile } = useAppContext();
  const observerTarget = useRef(null);
  const [activeTab, setActiveTab] = useState<'clubes' | 'selecoes'>('clubes');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loading,
    refetch
  } = useInfiniteQuery({
    queryKey: ['clubes', activeTab === 'clubes' ? '/clube/clubes' : '/clube/selecoes'],
    queryFn: fetchClubesService,
    getNextPageParam: (lastPage) => lastPage.ultimaPagina ? undefined : lastPage.paginaAtual + 1,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });

  const allClubes = useMemo((): Clube[] => {
    return data?.pages.flatMap(page => page.conteudo) || [];
  }, [data]);

  // Enquanto ainda houver páginas para carregar, a listagem local está
  // incompleta — a busca precisa ir direto no back para não esconder
  // clubes que ainda não foram paginados até aqui.
  const listagemCompleta = !hasNextPage;

  const [showNovoClubePopup, setShowNovoClubePopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && !debouncedSearchTerm) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage, debouncedSearchTerm]);

  // Debounce da busca — só dispara a query de autocomplete 350ms após o
  // usuário parar de digitar.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Reseta a busca ao trocar de aba (clubes/seleções), já que os resultados
  // do autocomplete não distinguem clube de seleção.
  useEffect(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  }, [activeTab]);

  const buscaBackHabilitada = !listagemCompleta && debouncedSearchTerm.length >= MIN_CARACTERES_BUSCA_BACK;

  const { data: resultadosBusca = [], isFetching: buscandoNoBack } = useQuery<Clube[]>({
    queryKey: ['clubes-busca-autocomplete', debouncedSearchTerm],
    queryFn: () => fetchBuscaAutocompleteService(debouncedSearchTerm),
    enabled: buscaBackHabilitada,
    staleTime: 1000 * 30,
  });

  const handleVerClube = (id: string) => {
    navigate(`/clube/${id}`);
  };

  const handleNovoClubeSuccess = () => {
    refetch();
  };

  // Fonte da lista exibida:
  // - sem termo -> lista local (paginada normalmente)
  // - com termo e listagem local já completa -> filtra localmente (sem custo de rede)
  // - com termo (3+ caracteres) e listagem local incompleta -> usa o autocomplete do back
  // - com termo curto (<3) e listagem incompleta -> mantém o filtro local do que já carregou,
  //   já que ainda não vale a pena chamar o back
  const filteredClubes = useMemo(() => {
    if (!debouncedSearchTerm) return allClubes;

    if (listagemCompleta || debouncedSearchTerm.length < MIN_CARACTERES_BUSCA_BACK) {
      return allClubes.filter(clube =>
        clube.nome.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    return resultadosBusca;
  }, [allClubes, debouncedSearchTerm, listagemCompleta, resultadosBusca]);

  const mostrandoLoaderBusca = buscaBackHabilitada && buscandoNoBack;

  return (
    <DashboardLayout
      searchPlaceholder="Buscar clube..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      contentStyle={{ padding: isMobile ? '1rem' : '2rem 3rem' }}
    >
      <LoadingSpinner isLoading={loading && !isFetchingNextPage} />

      <style>{`
        .page-content {
          padding: 2rem 3rem;
        }

        .tabs-wrapper {
          display: flex;
          gap: 20px;
          margin-top: 20px;
          border-bottom: 1px solid var(--border-color);
        }

        .tab-button {
          padding: 10px 20px;
          background: none;
          border: none;
          color: var(--text-gray);
          font-weight: 600;
          cursor: pointer;
          position: relative;
          transition: 0.2s;
        }

        .tab-button.active {
          color: var(--primary);
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--primary);
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
          min-width: 80px;
          min-height: 80px;
          flex-shrink: 0;
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

        .infinite-scroll-loader {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 2rem;
          color: var(--text-gray);
        }

        .search-loading-icon {
          color: var(--text-gray);
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .page-content { padding: 1rem; }
        }
      `}</style>

      <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Lista de Equipes</h2>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Gerencie os clubes e seleções do sistema</p>
            </div>
            {currentUser && isAdmin && ['DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo) && (
              <button 
                className="t-btn" 
                style={{background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold'}}
                onClick={() => setShowNovoClubePopup(true)}
              >
                  + Novo Clube
              </button>
            )}
            </div>

            <div className="tabs-wrapper">
              <button 
                className={`tab-button ${activeTab === 'clubes' ? 'active' : ''}`}
                onClick={() => setActiveTab('clubes')}
              >
                Clubes
              </button>
              <button 
                className={`tab-button ${activeTab === 'selecoes' ? 'active' : ''}`}
                onClick={() => setActiveTab('selecoes')}
              >
                Seleções
              </button>
            </div>

            <div className="players-grid-container">
            {filteredClubes.map((clube: Clube, index: number) => {
                const avatarUrl = getAvatarUrl(clube.imagem);

                return (
                    <div key={clube.id} className="player-card-item">
                    <div className="card-rank-badge">#{index + 1}</div>
                    
                    {avatarUrl ? (
                        <div className="card-avatar-large" style={{backgroundImage: `url(${avatarUrl})`}}></div>
                    ) : (
                        <div className="card-avatar-large" style={{backgroundColor: clube.corPrimaria || 'var(--hover-bg)'}}>
                            {clube.sigla || clube.nome.substring(0,2).toUpperCase()}
                        </div>
                    )}
                    
                    <div className="card-name">{clube.nome}</div>
                    <div className="card-location">{clube.estadio || 'Sem estádio'}</div>
                    
                    <div className="card-stats-row">
                        <div className="stat-box">
                        <span className="stat-val">{clube.estrelas} ★</span>
                        <span className="stat-lbl">Estrelas</span>
                        </div>
                        <div style={{width: '1px', background: 'var(--border-color)'}}></div>
                        <div className="stat-box">
                        <span className="stat-val">{LIGA_NAMES[clube.ligaClube] || clube.ligaClube || '-'}</span>
                        <span className="stat-lbl">Liga</span>
                        </div>
                    </div>

                    <button className="btn-profile" onClick={() => handleVerClube(clube.id)}>Ver Clube</button>
                    </div>
                );
            })}
            </div>

            <div ref={observerTarget} className="infinite-scroll-loader">
              {isFetchingNextPage && !debouncedSearchTerm ? 'Carregando mais...' : ''}
            </div>

            {!loading && !mostrandoLoaderBusca && filteredClubes.length === 0 && (
              <div style={{textAlign: 'center', marginTop: '50px', color: 'var(--text-gray)'}}>
                Nenhum resultado encontrado para esta categoria.
              </div>
            )}
        </div>

      {showNovoClubePopup && (
        <PopupNovoClube 
          onClose={() => setShowNovoClubePopup(false)} 
          onSuccess={handleNovoClubeSuccess}
        />
      )}
    </DashboardLayout>
  );
}