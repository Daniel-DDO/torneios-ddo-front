import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Menu,
  LayoutDashboard,
  Users,
  Trophy,
  Shield,
  Wallet,
  Search,
  Bell,
  Gamepad2,
  Star,
  Lightbulb,
  Settings,
  CalendarSync,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';

interface TimePartidaDTO {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string | null;
  clubeId: string;
  clubeNome: string;
  clubeImagem: string;
  clubeSigla: string;
}

interface PartidaDTO {
  id: string;
  faseId: string;
  rodadaId: string;
  numeroRodada: number;
  dataHora: string | null;
  estadio: string | null;
  linkPartida: string | null;
  mandante: TimePartidaDTO;
  visitante: TimePartidaDTO;
  golsMandante: number | null;
  golsVisitante: number | null;
  realizada: boolean;
  wo: boolean;
  houveProrrogacao: boolean;
  houvePenaltis: boolean;
  penaltisMandante: number | null;
  penaltisVisitante: number | null;
}

interface RodadaDTO {
  id: string;
  numero: number;
  nome: string | null;
  faseId: string;
  status: string;
  completa: boolean;
  partidas: PartidaDTO[];
}

interface RodadaResponse {
  content: RodadaDTO[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
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
}

export function TelaRodadas() {
  const navigate = useNavigate();
  const { temporadaId, torneioId, faseId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  
  const [currentRodadaIndex, setCurrentRodadaIndex] = useState(0);

  const { data: avatars = [] } = useQuery<Avatar[]>({
    queryKey: ['avatares'],
    queryFn: async () => {
      const response = await API.get('/api/avatares');
      const data = response.data || response;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: rodadasData, isLoading } = useQuery<RodadaResponse>({
    queryKey: ['rodadas-fase', faseId],
    queryFn: async () => {
      const response = await API.get(`/rodada/fase/${faseId}?size=50&sort=numero,asc`);
      return response.data;
    },
    enabled: !!faseId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  });

  const rodadas = rodadasData?.content || [];
  const currentRodada = rodadas[currentRodadaIndex];

  useEffect(() => {
    if (rodadas.length > 0) {
      const activeIndex = rodadas.findIndex(r => !r.completa);
      if (activeIndex !== -1) {
        setCurrentRodadaIndex(activeIndex);
      } else {
        setCurrentRodadaIndex(rodadas.length - 1);
      }
    }
  }, [rodadasData]);

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: Avatar) => {
      map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

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

  const handlePrevRodada = () => {
    if (currentRodadaIndex > 0) {
      setCurrentRodadaIndex(prev => prev - 1);
    }
  };

  const handleNextRodada = () => {
    if (currentRodadaIndex < rodadas.length - 1) {
      setCurrentRodadaIndex(prev => prev + 1);
    }
  };

  const filteredPartidas = useMemo(() => {
    if (!currentRodada) return [];
    if (!searchTerm) return currentRodada.partidas;

    const lowerSearch = searchTerm.toLowerCase();
    return currentRodada.partidas.filter(p => 
      p.mandante.clubeNome.toLowerCase().includes(lowerSearch) ||
      p.mandante.jogadorNome.toLowerCase().includes(lowerSearch) ||
      p.visitante.clubeNome.toLowerCase().includes(lowerSearch) ||
      p.visitante.jogadorNome.toLowerCase().includes(lowerSearch)
    );
  }, [currentRodada, searchTerm]);

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>

      <style>{`
        .rodada-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
            background: var(--bg-card);
            padding: 15px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-sm);
        }
        
        .nav-rodada-btn {
            background: var(--hover-bg);
            border: 1px solid var(--border-color);
            color: var(--text-dark);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        .nav-rodada-btn:hover:not(:disabled) {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }
        .nav-rodada-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .rodada-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--text-dark);
            min-width: 150px;
            text-align: center;
        }

        .matches-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }

        .match-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }
        .match-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
            border-color: var(--primary);
        }

        .match-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
            color: var(--text-gray);
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 10px;
        }

        .teams-container {
            display: grid;
            grid-template-columns: 1fr min-content 1fr;
            align-items: center;
            gap: 10px;
            width: 100%;
        }

        .team-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            text-align: center;
            min-width: 0;
            overflow: hidden;
        }

        .team-logo {
            width: 50px;
            height: 50px;
            object-fit: contain;
        }

        .team-name {
            font-weight: 700;
            font-size: 0.9rem;
            line-height: 1.2;
            color: var(--text-dark);
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .player-name {
            font-size: 0.75rem;
            color: var(--text-gray);
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .score-board {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-weight: 800;
            font-size: 1.5rem;
            color: var(--text-dark);
            white-space: nowrap;
            padding: 0 5px;
        }

        .score-box {
            background: var(--bg-body);
            padding: 5px 0;
            width: 36px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .vs-text {
            font-size: 1rem;
            color: var(--text-gray);
            font-weight: 600;
        }

        .back-button {
          display: flex; align-items: center; gap: 8px;
          color: var(--text-gray); font-size: 0.9rem;
          margin-bottom: 1rem; cursor: pointer;
          border: none; background: none; padding: 0;
        }
        .back-button:hover { color: var(--primary); }

        .skeleton {
            background: var(--hover-bg);
            border-radius: 8px;
            animation: pulse 1.5s infinite ease-in-out;
        }
        .skeleton-text { height: 16px; width: 60%; margin: 4px auto; }
        .skeleton-circle { width: 50px; height: 50px; border-radius: 50%; margin: 0 auto; }
        .skeleton-header { height: 20px; width: 100%; margin-bottom: 15px; }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        @media (max-width: 768px) {
            .matches-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : 'closed'}`}>
        <div className="logo-area">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
            </svg>
          </div>
          <span className="logo-text">Torneios <span>DDO</span></span>
        </div>

        <nav className="nav-menu">
          <a onClick={() => navigate('/')} className="nav-item" style={{ cursor: 'pointer' }}>
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a onClick={() => navigate('/jogadores')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Users size={20} /> Jogadores
          </a>
          <a onClick={() => navigate('/clubes')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Shield size={20} /> Clubes
          </a>
          <a onClick={() => navigate('/competicoes')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Trophy size={20} /> Competições
          </a>
          <a onClick={() => navigate('/titulos')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Star size={20} /> Títulos
          </a>
          <a onClick={() => navigate('/temporadas')} className="nav-item active" style={{ cursor: 'pointer' }}>
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
        <header className="top-header">
          <div className="left-header">
            <button className="toggle-btn menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <div className="search-bar">
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar time ou jogador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme}>
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
                {!getCurrentUserAvatar() && (currentUser?.nome?.charAt(0) || 'U')}
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
          <button 
            onClick={() => navigate(`/${temporadaId}/torneio/${torneioId}/fase/${faseId}`)} 
            className="back-button"
          >
            <ArrowLeft size={16} /> Voltar para Fase
          </button>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-dark)' }}>Rodadas e Partidas</h2>
            <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Acompanhe os resultados jogo a jogo</p>
          </div>

          {isLoading ? (
            <div className="matches-grid">
               {[...Array(8)].map((_, i) => (
                 <div key={i} className="match-card">
                    <div className="skeleton skeleton-header"></div>
                    <div className="teams-container">
                        <div className="team-info">
                            <div className="skeleton skeleton-circle"></div>
                            <div className="skeleton skeleton-text"></div>
                        </div>
                        <div className="skeleton" style={{width: 60, height: 30}}></div>
                        <div className="team-info">
                            <div className="skeleton skeleton-circle"></div>
                            <div className="skeleton skeleton-text"></div>
                        </div>
                    </div>
                 </div>
               ))}
            </div>
          ) : rodadas.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                Nenhuma rodada encontrada para esta fase.
            </div>
          ) : (
            <>
                <div className="rodada-header">
                    <button 
                        className="nav-rodada-btn" 
                        onClick={handlePrevRodada} 
                        disabled={currentRodadaIndex === 0}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    
                    <div className="rodada-title">
                        {currentRodada.nome || `Rodada ${currentRodada.numero}`}
                    </div>
                    
                    <button 
                        className="nav-rodada-btn" 
                        onClick={handleNextRodada} 
                        disabled={currentRodadaIndex === rodadas.length - 1}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="matches-grid">
                    {filteredPartidas.map((partida) => (
                        <div 
                            key={partida.id} 
                            className="match-card"
                            onClick={() => navigate(`/${temporadaId}/torneio/${torneioId}/fase/${faseId}/rodadas/${partida.id}`)}
                        >
                            <div className="match-header">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={12} /> {partida.estadio || 'Local não definido'}
                                </span>
                                {partida.wo && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>WO</span>}
                            </div>
                            
                            <div className="teams-container">
                                <div className="team-info">
                                    <img 
                                        src={partida.mandante.clubeImagem} 
                                        alt={partida.mandante.clubeNome} 
                                        className="team-logo" 
                                    />
                                    <div className="team-name" title={partida.mandante.clubeNome}>{partida.mandante.clubeNome}</div>
                                    <div className="player-name" title={partida.mandante.jogadorNome}>{partida.mandante.jogadorNome}</div>
                                </div>

                                <div className="score-board">
                                    {partida.golsMandante !== null ? (
                                        <>
                                            <div className="score-box">{partida.golsMandante}</div>
                                            <span>×</span>
                                            <div className="score-box">{partida.golsVisitante}</div>
                                        </>
                                    ) : (
                                        <span className="vs-text">VS</span>
                                    )}
                                </div>

                                <div className="team-info">
                                    <img 
                                        src={partida.visitante.clubeImagem} 
                                        alt={partida.visitante.clubeNome} 
                                        className="team-logo" 
                                    />
                                    <div className="team-name" title={partida.visitante.clubeNome}>{partida.visitante.clubeNome}</div>
                                    <div className="player-name" title={partida.visitante.jogadorNome}>{partida.visitante.jogadorNome}</div>
                                </div>
                            </div>

                            {partida.realizada && partida.houvePenaltis && (
                                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-gray)', marginTop: '5px' }}>
                                    (Pênaltis: {partida.penaltisMandante} - {partida.penaltisVisitante})
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {filteredPartidas.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: 'var(--text-gray)' }}>
                            Nenhuma partida encontrada com o filtro atual.
                        </div>
                    )}
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