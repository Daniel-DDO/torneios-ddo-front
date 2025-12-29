import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Menu, 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Shield, 
  Calendar, 
  Wallet, 
  Search, 
  Bell, 
  ArrowLeft, 
  Medal, 
  Star, 
  Gamepad2,
  Lightbulb, 
  Settings,
  CalendarSync
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';

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
  cargo: string;
  descricao: string | null;
  insignias: any[];
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

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

export function TelaPerfilJogador() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    if (id) {
        fetchPlayerDetails(id);
    }
  }, [id]);

  const fetchPlayerDetails = async (playerId: string) => {
    try {
      setLoading(true);
      const data = await API.get(`/jogador/${playerId}`);
      
      const playerData = (data && (data as any).data) ? (data as any).data : data;

      setPlayer(playerData as Player);
    } catch (error) {
      console.error("Erro ao buscar detalhes do jogador", error);
      alert("Jogador não encontrado ou erro de conexão.");
      navigate('/jogadores');
    } finally {
      setLoading(false);
    }
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

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const getPlayerAvatar = () => {
    if (!player?.imagem) return null;
    return avatarMap[player.imagem] || player.imagem;
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      <LoadingSpinner isLoading={loading} />

      <style>{`
        .page-content {
          padding: 2rem 3rem;
        }

        .profile-header-card {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 2rem;
            display: flex;
            align-items: center;
            gap: 2rem;
            margin-bottom: 2rem;
            position: relative;
            overflow: hidden;
        }

        .profile-avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: var(--hover-bg);
            border: 4px solid var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            font-weight: 800;
            color: var(--primary);
            background-size: cover;
            background-position: center;
            flex-shrink: 0;
        }

        .profile-info {
            flex: 1;
        }

        .profile-name {
            font-size: 2rem;
            font-weight: 800;
            color: var(--text-dark);
            margin-bottom: 0.5rem;
        }

        .profile-discord {
            color: var(--text-gray);
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }

        .profile-tags {
            display: flex;
            gap: 1rem;
        }

        .tag-badge {
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            background: var(--hover-bg);
            color: var(--text-dark);
            border: 1px solid var(--border-color);
        }

        .tag-status-active {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border-color: rgba(16, 185, 129, 0.2);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            transition: 0.2s;
        }

        .stat-card:hover {
            transform: translateY(-3px);
            border-color: var(--primary);
        }

        .stat-icon-wrapper {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--hover-bg);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
            color: var(--primary);
        }

        .stat-value-big {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--text-dark);
        }

        .stat-label-small {
            font-size: 0.85rem;
            color: var(--text-gray);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 0.5rem;
        }

        @media (max-width: 768px) {
            .page-content { padding: 1rem; }
            .profile-header-card { flex-direction: column; text-align: center; padding: 1.5rem; }
            .profile-tags { justify-content: center; }
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
          <a href="#" className="nav-item">
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
          <a href="#" className="nav-item">
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
              <input type="text" placeholder="Buscar..." disabled />
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
            <div style={{ marginBottom: '1.5rem' }}>
                <button 
                    onClick={() => navigate('/jogadores')} 
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--text-gray)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    <ArrowLeft size={20} /> Voltar para lista
                </button>
            </div>

            {!loading && player && (
                <>
                    <div className="profile-header-card">
                        {getPlayerAvatar() ? (
                            <div className="profile-avatar" style={{backgroundImage: `url(${getPlayerAvatar()})`}}></div>
                        ) : (
                            <div className="profile-avatar">
                                {player.nome.charAt(0)}
                            </div>
                        )}
                        
                        <div className="profile-info">
                            <h1 className="profile-name">{player.nome}</h1>
                            <div className="profile-discord">
                                <span style={{opacity: 0.7}}>Discord:</span> {player.discord}
                            </div>
                            <div className="profile-tags">
                                <span className={`tag-badge ${player.statusJogador === 'ATIVO' ? 'tag-status-active' : ''}`}>
                                    {player.statusJogador}
                                </span>
                                <span className="tag-badge">Saldo: $ {player.saldoVirtual.toLocaleString()}</span>
                            </div>
                             {player.descricao && (
                                <p style={{marginTop: '0.5rem', color: 'var(--text-gray)'}}>{player.descricao}</p>
                             )}
                        </div>

                        <div style={{ textAlign: 'right', padding: '1rem' }}>
                             <Medal size={32} />
                        </div>
                    </div>

                    <h3 style={{marginBottom: '1rem', color: 'var(--text-gray)'}}>Estatísticas da Carreira</h3>
                    
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon-wrapper"><Trophy size={20} /></div>
                            <div className="stat-value-big">{player.titulos}</div>
                            <div className="stat-label-small">Títulos Conquistados</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper"><Medal size={20} /></div>
                            <div className="stat-value-big">{player.finais}</div>
                            <div className="stat-label-small">Finais Disputadas</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper"><Calendar size={20} /></div>
                            <div className="stat-value-big">{player.partidasJogadas}</div>
                            <div className="stat-label-small">Partidas Jogadas</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper">⚽</div>
                            <div className="stat-value-big">{player.golsMarcados}</div>
                            <div className="stat-label-small">Gols Marcados</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper">🥅</div>
                            <div className="stat-value-big">{player.golsSofridos}</div>
                            <div className="stat-label-small">Gols Sofridos</div>
                        </div>

                         <div className="stat-card">
                            <div className="stat-icon-wrapper">📊</div>
                            <div className="stat-value-big">
                                {player.partidasJogadas > 0 
                                    ? ((player.golsMarcados / player.partidasJogadas).toFixed(2)) 
                                    : '0.00'}
                            </div>
                            <div className="stat-label-small">Média de Gols</div>
                        </div>
                    </div>
                </>
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
    </div>
  );
}