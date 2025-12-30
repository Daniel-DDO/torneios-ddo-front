import { useState, useEffect, useMemo, useRef } from 'react';
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
  Bell, 
  Gamepad2, 
  Star,
  Lightbulb,
  CalendarSync
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupClubes from '../components/PopupClubes';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupNovoClube from '../components/PopupNovoClube';

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

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

export function TelaClubes() {
  const navigate = useNavigate();
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

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const allClubes = useMemo((): Clube[] => {
    return data?.pages.flatMap(page => page.conteudo) || [];
  }, [data]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: Avatar) => {
      map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showNovoClubePopup, setShowNovoClubePopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleVerClube = (id: string) => {
    setSelectedClubId(id);
  };

  const handleClosePopup = () => {
    setSelectedClubId(null);
  };

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

  const handleNovoClubeSuccess = () => {
    refetch();
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const filteredClubes = allClubes.filter(clube =>
    clube.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      <LoadingSpinner isLoading={loading && !isFetchingNextPage} />

      {selectedClubId && (
        <PopupClubes clubId={selectedClubId} onClose={handleClosePopup} />
      )}

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
          <a onClick={() => navigate('/clubes')} className="nav-item active" style={{cursor: 'pointer'}}>
            <Shield size={20} /> Clubes
          </a>
          <a onClick={() => navigate('/competicoes')} className="nav-item" style={{cursor: 'pointer'}}>
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
                placeholder="Buscar clube..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
              <Lightbulb size={20} />
            </button>
            <button className="icon-btn"><Bell size={20} /></button>
            
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
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Lista de Equipes</h2>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Gerencie os clubes e seleções do sistema</p>
            </div>
            {currentUser && ['DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo) && (
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
                const avatarUrl = clube.imagem ? (avatarMap[clube.imagem] || clube.imagem) : null;

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
              {isFetchingNextPage ? 'Carregando mais...' : ''}
            </div>

            {!loading && filteredClubes.length === 0 && (
              <div style={{textAlign: 'center', marginTop: '50px', color: 'var(--text-gray)'}}>
                Nenhum resultado encontrado para esta categoria.
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

      {showNovoClubePopup && (
        <PopupNovoClube 
          onClose={() => setShowNovoClubePopup(false)} 
          onSuccess={handleNovoClubeSuccess}
        />
      )}
    </div>
  );
}