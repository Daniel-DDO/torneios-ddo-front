import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  Menu,
  LayoutDashboard,
  Users,
  Trophy,
  Shield,
  Wallet,
  Settings,
  Search,
  Gamepad2,
  Star,
  Lightbulb,
  CalendarSync,
  Loader2
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupCompeticao from '../components/PopupCompeticao';
import PopupVincularCompTitulo from '../components/PopupVincularCompTitulo';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

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

interface UserData {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  cargo: string;
  saldoVirtual: number;
  titulos: number;
  finais: number;
  partidasJogadas: number;
  golsMarcados: number;
}

interface Avatar {
  id: string;
  url: string;
  nome?: string;
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

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

export function TelaCompeticoes() {
  const navigate = useNavigate();

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

  const totalElementos = data?.pages[0]?.totalElementos ?? 0;

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: Avatar) => {
      map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showCompeticaoPopup, setShowCompeticaoPopup] = useState(false);
  const [showVincularTituloPopup, setShowVincularTituloPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLoginSuccess = (userData: UserData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      setCurrentUser(null);
      setShowUserPopup(false);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

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
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>

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

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="logo-area">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
               <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/>
            </svg>
          </div>
          <span className="logo-text">Torneios <span>DDO</span></span>
        </div>

        <nav className="nav-menu">
          <a onClick={() => navigate('/')} className="nav-item" style={{cursor: 'pointer'}}>
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a onClick={() => navigate('/jogadores')} className="nav-item" style={{cursor: 'pointer'}}>
            <Users size={20} /> Jogadores
          </a>
          <a onClick={() => navigate('/clubes')} className="nav-item" style={{cursor: 'pointer'}}>
            <Shield size={20} /> Clubes
          </a>
          <a onClick={() => navigate('/competicoes')} className="nav-item active" style={{cursor: 'pointer'}}>
            <Trophy size={20} /> Competições
          </a>
          <a onClick={() => navigate('/titulos')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Star size={20} /> Títulos
          </a>
          <a onClick={() => navigate('/temporadas')} className="nav-item" style={{cursor: 'pointer'}}>
            <CalendarSync size={20} /> Temporadas
          </a>
          <div className="nav-separator"></div>
          <a onClick={() => navigate('/partidas')} className="nav-item" style={{cursor: 'pointer'}}>
            <Gamepad2 size={20} /> Partidas
          </a>
           <a onClick={() => navigate('/minha-conta')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Wallet size={20} /> Minha conta
          </a>
          <a onClick={() => navigate('/suporte')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Settings size={20} /> Suporte
          </a>
        </nav>
      </aside>

      <main className="main-content">
        
        <header className="top-header compact">
          <div className="left-header">
            <button 
              className="toggle-btn menu-toggle" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Alternar Menu"
            >
              <Menu size={24} />
            </button>
            <div className="search-bar">
              <Search size={20} />
              <input 
                type="text" 
                placeholder="Buscar competição..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
              <Lightbulb size={20} />
            </button>
            <BotaoNotificacao user={currentUser} />
            
            {currentUser ? (
              <div 
                className="user-avatar-mini" 
                onClick={() => setShowUserPopup(true)}
                style={{
                  backgroundImage: getCurrentUserAvatar() ? `url(${getCurrentUserAvatar()})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: getCurrentUserAvatar() ? 'transparent' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {!getCurrentUserAvatar() && currentUser.nome.charAt(0)}
              </div>
            ) : (
              <button 
                className="login-btn-header" 
                onClick={() => setShowLoginPopup(true)}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginLeft: '10px'
                }}
              >
                Login
              </button>
            )}
          </div>
        </header>

        <div className="page-content">
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Competições</h2>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Visualize as competições oficiais</p>
                
            </div>
            {currentUser && currentUser.cargo === 'PROPRIETARIO' && (
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
                    const avatarUrl = competicao.imagem ? (avatarMap[competicao.imagem] || competicao.imagem) : null;
                    const tituloAvatarUrl = competicao.titulo?.imagem
                      ? (avatarMap[competicao.titulo.imagem] || competicao.titulo.imagem)
                      : null;

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

      </main>

      {showLoginPopup && (
        <PopupLogin 
          onClose={() => setShowLoginPopup(false)} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}

      {showUserPopup && currentUser && (
        <PopupUser 
          user={{
            ...currentUser,
            imagem: getCurrentUserAvatar()
          }}
          onClose={() => setShowUserPopup(false)}
          onLogout={handleLogout}
        />
      )}

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
    </div>
  );
}