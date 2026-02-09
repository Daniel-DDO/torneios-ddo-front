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
  Search, 
  Gamepad2, 
  Star,
  Lightbulb,
  Settings,
  CalendarSync,
  TrendingUp,
  ArrowRight,
  Swords,
  X
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupCadastrarJogador from '../components/PopupCadastrarJogador';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

interface Player {
  id: string;
  nome: string;
  discord: string;
  finais: number;
  titulos: number;
  golsMarcados: number;
  golsSofridos: number;
  partidasJogadas: number;
  statusJogador: string;
  imagem: string | null;
  saldoVirtual: number;
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

const fetchPlayersService = async ({ pageParam = 0 }) => {
  const response = await API.get(`/jogador/todos?page=${pageParam}&size=12`);
  return (response && (response as any).data) ? (response as any).data : response;
};

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

export function TelaJogadores() {
  const navigate = useNavigate();
  const observerTarget = useRef(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingPlayers,
    refetch
  } = useInfiniteQuery({
    queryKey: ['jogadores-infinite'],
    queryFn: fetchPlayersService,
    getNextPageParam: (lastPage) => lastPage.ultimaPagina ? undefined : lastPage.paginaAtual + 1,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const allPlayers = useMemo((): Player[] => {
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

  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showCadastrarJogadorPopup, setShowCadastrarJogadorPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isComparing, setIsComparing] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

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

  const filteredPlayers = allPlayers.filter(player =>
    player.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const togglePlayerSelection = (player: Player) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else {
      if (selectedPlayers.length < 2) {
        setSelectedPlayers([...selectedPlayers, player]);
      }
    }
  };

  const handleCompare = () => {
    if (selectedPlayers.length === 2) {
      navigate(`/jogadores/comparando/${selectedPlayers[0].id}/${selectedPlayers[1].id}`);
    }
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      <LoadingSpinner isLoading={loadingPlayers && !isFetchingNextPage} />

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
          cursor: pointer;
        }

        .player-card-item:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary);
        }

        .player-card-item.selected {
          border: 2px solid var(--primary);
          background-color: var(--hover-bg);
          transform: translateY(-5px);
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
          background-size: cover;
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
        
        .compare-bar {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--bg-card);
          padding: 16px 24px;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 24px;
          border: 1px solid var(--border-color);
          z-index: 999;
          width: 90%;
          max-width: 600px;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        .selected-player-mini {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-body);
          padding: 8px 16px;
          border-radius: 12px;
          flex: 1;
        }

        .mini-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          background-color: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.8rem;
        }

        .compare-btn-action {
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.1s;
        }
        
        .compare-btn-action:hover {
          transform: scale(1.02);
        }
        
        .compare-btn-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .close-compare-btn {
          background: transparent;
          border: none;
          color: var(--text-gray);
          cursor: pointer;
          padding: 4px;
        }

        @media (max-width: 768px) {
          .page-content { padding: 1rem; }
          .compare-bar {
            flex-direction: column;
            width: 95%;
            padding: 16px;
            gap: 12px;
          }
          .selected-player-mini {
            width: 100%;
          }
          .compare-btn-action {
            width: 100%;
            justify-content: center;
          }
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
          <a onClick={() => navigate('/jogadores')} className="nav-item active" style={{cursor: 'pointer'}}>
            <Users size={20} /> Jogadores
          </a>
          <a onClick={() => navigate('/clubes')} className="nav-item" style={{cursor: 'pointer'}}>
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
                placeholder="Buscar jogador..." 
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
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Jogadores Cadastrados</h2>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Visualize todos os jogadores</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                {!isComparing ? (
                  <button 
                    className="t-btn"
                    onClick={() => {
                      setIsComparing(true);
                      setSelectedPlayers([]);
                    }}
                    style={{
                        background: 'var(--card-bg)', 
                        color: 'var(--text-dark)', 
                        border: '1px solid var(--border-color)', 
                        cursor: 'pointer', 
                        padding: '10px 20px', 
                        borderRadius: '8px', 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                  >
                    <Swords size={18} />
                    Comparar Jogadores
                  </button>
                ) : (
                  <button 
                    className="t-btn"
                    onClick={() => {
                      setIsComparing(false);
                      setSelectedPlayers([]);
                    }}
                    style={{
                        background: '#ef4444', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer', 
                        padding: '10px 20px', 
                        borderRadius: '8px', 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                  >
                    <X size={18} />
                    Cancelar Comparação
                  </button>
                )}

                <button 
                    className="t-btn"
                    onClick={() => navigate('/jogadores/ranking-financeiro')}
                    style={{
                        background: 'var(--card-bg)', 
                        color: 'var(--text-dark)', 
                        border: '1px solid var(--border-color)', 
                        cursor: 'pointer', 
                        padding: '10px 20px', 
                        borderRadius: '8px', 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <TrendingUp size={18} />
                    Ranking Financeiro
                </button>

                {currentUser && ['ADMINISTRADOR', 'DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo) && (
                    <button 
                      className="t-btn" 
                      onClick={() => setShowCadastrarJogadorPopup(true)}
                      style={{background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold'}}
                    >
                        + Novo Jogador
                    </button>
                )}
            </div>
            </div>

            {isComparing && (
              <div style={{ 
                background: 'rgba(var(--primary-rgb), 0.1)', 
                color: 'var(--primary)', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '20px', 
                textAlign: 'center',
                border: '1px dashed var(--primary)',
                fontWeight: '600'
              }}>
                Selecione 2 jogadores abaixo para comparar suas estatísticas.
              </div>
            )}

            <div className="players-grid-container">
            {filteredPlayers.map((player, index) => {
                const avatarUrl = player.imagem ? (avatarMap[player.imagem] || player.imagem) : null;
                const isSelected = selectedPlayers.some(p => p.id === player.id);
                
                return (
                    <div 
                      key={player.id} 
                      className={`player-card-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (isComparing) togglePlayerSelection(player);
                      }}
                      style={{ opacity: (isComparing && selectedPlayers.length === 2 && !isSelected) ? 0.5 : 1 }}
                    >
                    <div className="card-rank-badge">#{index + 1}</div>
                    
                    {avatarUrl ? (
                        <div className="card-avatar-large" style={{backgroundImage: `url(${avatarUrl})`}}></div>
                    ) : (
                        <div className="card-avatar-large">
                            {player.nome.charAt(0)}
                        </div>
                    )}
                    
                    <div className="card-name">{player.nome}</div>
                    <div className="card-location">{player.discord || 'Jogador DDO'}</div>
                    
                    <div className="card-stats-row">
                        <div className="stat-box">
                        <span className="stat-val">{player.partidasJogadas}</span>
                        <span className="stat-lbl">Partidas</span>
                        </div>
                        <div style={{width: '1px', background: 'var(--border-color)'}}></div>
                        <div className="stat-box">
                        <span className="stat-val">{player.titulos}</span>
                        <span className="stat-lbl">Títulos</span>
                        </div>
                    </div>

                    {!isComparing && (
                      <button 
                          className="btn-profile" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/jogador/${player.id}`);
                          }}
                      >
                          Ver Perfil
                      </button>
                    )}
                    
                    {isComparing && (
                      <div style={{ 
                        marginTop: '10px', 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        border: '2px solid var(--primary)',
                        background: isSelected ? 'var(--primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isSelected && <span style={{color: 'white', fontSize: '12px'}}>✓</span>}
                      </div>
                    )}

                    </div>
                );
            })}
            </div>

            <div ref={observerTarget} className="infinite-scroll-loader">
              {isFetchingNextPage ? 'Carregando mais...' : ''}
            </div>

            {!loadingPlayers && filteredPlayers.length === 0 && (
              <div style={{textAlign: 'center', marginTop: '50px', color: 'var(--text-gray)'}}>
                Nenhum resultado encontrado.
              </div>
            )}
        </div>

      </main>

      {isComparing && selectedPlayers.length > 0 && (
        <div className="compare-bar">
          <div className="selected-player-mini">
             <div className="mini-avatar" style={{ backgroundImage: selectedPlayers[0].imagem ? `url(${avatarMap[selectedPlayers[0].imagem] || selectedPlayers[0].imagem})` : 'none' }}>
               {!selectedPlayers[0].imagem && selectedPlayers[0].nome.charAt(0)}
             </div>
             <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedPlayers[0].nome}</span>
             <button className="close-compare-btn" onClick={() => togglePlayerSelection(selectedPlayers[0])}><X size={14}/></button>
          </div>
          
          <div style={{ fontWeight: 'bold', color: 'var(--text-gray)' }}>VS</div>
          
          <div className="selected-player-mini">
             {selectedPlayers[1] ? (
               <>
                 <div className="mini-avatar" style={{ backgroundImage: selectedPlayers[1].imagem ? `url(${avatarMap[selectedPlayers[1].imagem] || selectedPlayers[1].imagem})` : 'none' }}>
                    {!selectedPlayers[1].imagem && selectedPlayers[1].nome.charAt(0)}
                 </div>
                 <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedPlayers[1].nome}</span>
                 <button className="close-compare-btn" onClick={() => togglePlayerSelection(selectedPlayers[1])}><X size={14}/></button>
               </>
             ) : (
               <span style={{ color: 'var(--text-gray)', fontSize: '0.9rem', fontStyle: 'italic' }}>Selecione o 2º jogador...</span>
             )}
          </div>

          <button 
            className="compare-btn-action" 
            disabled={selectedPlayers.length !== 2}
            onClick={handleCompare}
          >
            Comparar Agora <ArrowRight size={18} />
          </button>
        </div>
      )}

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

      {showCadastrarJogadorPopup && (
        <PopupCadastrarJogador
          onClose={() => setShowCadastrarJogadorPopup(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}