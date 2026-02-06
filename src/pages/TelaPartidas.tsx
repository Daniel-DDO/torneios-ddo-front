import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  Calendar,
  Clock,
  MapPin
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

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
  golsSofridos: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  descricao: string | null;
  contaReivindicada: boolean;
  suspensoAte: string | null;
  insignias: any[];
  criacaoConta: string;
  modificacaoConta?: string;
  statusJogador: string;
}

interface Avatar {
  id: string;
  url: string;
  nome?: string;
}

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
  estadio: string;
  mandante: TimePartidaDTO;
  visitante: TimePartidaDTO;
  golsMandante: number | null;
  golsVisitante: number | null;
  realizada: boolean;
  wo: boolean;
  houvePenaltis: boolean;
  penaltisMandante: number | null;
  penaltisVisitante: number | null;
}

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

export function TelaPartidas() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'pendentes' | 'feitas'>('pendentes');

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
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
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch (e) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
    setLoading(false);
  }, [navigate]);

  const { data: partidasPendentes = [], isLoading: isLoadingPendentes } = useQuery({
    queryKey: ['partidasPendentes', currentUser?.id],
    queryFn: async () => {
      const response = await API.get(`partida/jogador/${currentUser?.id}/pendentes`);
      return response.data || [];
    },
    enabled: !!currentUser?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const { data: partidasFeitas = [], isLoading: isLoadingFeitas } = useQuery({
    queryKey: ['partidasFeitas', currentUser?.id],
    queryFn: async () => {
      const response = await API.get(`partida/jogador/${currentUser?.id}/feitas`);
      return response.data || [];
    },
    enabled: !!currentUser?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const handleLoginSuccess = (userData: UserData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      setCurrentUser(null);
      setShowUserPopup(false);
      navigate('/');
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const isAdmin = currentUser && ['ADMINISTRADOR', 'DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo);

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const formatDataHora = (dataString: string | null) => {
    if (!dataString) return { dia: 'A definir', hora: '--:--' };
    const date = new Date(dataString);
    return {
      dia: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      <LoadingSpinner isLoading={loading || (activeTab === 'pendentes' ? isLoadingPendentes : isLoadingFeitas)} />

      <style>{`
    .page-content {
      padding: 2rem 3rem;
      display: flex;
      justify-content: center;
    }

    .matches-container {
      width: 100%;
      max-width: 1000px;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .tabs-header {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 1rem;
    }

    .tab-btn {
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

    .tab-btn.active {
        background: var(--primary);
        color: white;
    }

    .tab-btn:hover:not(.active) {
        background: var(--bg-card);
        color: var(--text-dark);
    }

    .matches-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .match-card {
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

    .match-card:hover {
        transform: translateY(-2px);
        border-color: var(--primary);
    }

    .match-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
        color: var(--text-gray);
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 0.8rem;
    }

    .match-info-group {
        display: flex;
        gap: 1.5rem;
    }

    .match-info-tag {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .match-content {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 2rem;
        padding: 0.5rem 0;
    }

    .team-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        text-align: center;
        min-width: 0;
        overflow: hidden;
    }

    .team-logo {
        width: 70px;
        height: 70px;
        object-fit: contain;
        margin-bottom: 5px;
    }

    .team-logo-placeholder {
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

    .team-name {
        font-weight: 700;
        color: var(--text-dark);
        font-size: 1.1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        padding: 0 5px;
    }

    .player-info {
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

    .player-avatar-small {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: var(--primary);
        background-size: cover;
        background-position: center;
        flex-shrink: 0;
    }

    .player-name {
        font-size: 0.8rem;
        color: var(--text-gray);
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .score-board {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        min-width: 80px;
    }

    .score-main {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--text-dark);
    }

    .score-penalties {
        font-size: 0.85rem;
        color: var(--text-gray);
    }

    .vs-text {
        font-size: 1.5rem;
        color: var(--text-gray);
        font-weight: 700;
        opacity: 0.5;
    }

    .status-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
    }

    .status-agendada { background: rgba(var(--primary-rgb), 0.1); color: var(--primary); }
    .status-finalizada { background: rgba(var(--success-rgb), 0.1); color: var(--success); }
    .status-wo { background: rgba(var(--danger-rgb), 0.1); color: var(--danger); }

    .empty-state {
        text-align: center;
        padding: 4rem;
        color: var(--text-gray);
        background: var(--bg-card);
        border-radius: var(--radius);
        border: 1px dashed var(--border-color);
    }

    .btn-admin-header {
        background-color: var(--primary);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        margin-right: 12px;
        transition: opacity 0.2s;
        font-size: 0.9rem;
    }
    
    .btn-admin-header:hover {
      opacity: 0.9;
    }

    @media (max-width: 768px) {
        .match-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }
        .score-main {
            justify-content: center;
        }
        .page-content {
            padding: 1rem;
        }
        .match-info-group {
            flex-direction: column;
            gap: 0.5rem;
        }
    }
  `}</style>

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
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
          <a onClick={() => navigate('/temporadas')} className="nav-item" style={{ cursor: 'pointer' }}>
            <CalendarSync size={20} /> Temporadas
          </a>
          <div className="nav-separator"></div>
          <a onClick={() => navigate('/partidas')} className="nav-item active" style={{ cursor: 'pointer' }}>
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
              <input type="text" placeholder="Buscar no sistema..." />
            </div>
          </div>

          <div className="header-actions">
            {isAdmin && (
              <button className="btn-admin-header" onClick={() => navigate('/admin')}>
                Painel do Adm
              </button>
            )}

            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
              <Lightbulb size={20} />
            </button>
            <BotaoNotificacao user={currentUser} />

            {currentUser && (
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
            )}
          </div>
        </header>

        <div className="page-content">
          <div className="matches-container">
            <div className="tabs-header">
              <button
                className={`tab-btn ${activeTab === 'pendentes' ? 'active' : ''}`}
                onClick={() => setActiveTab('pendentes')}
              >
                Próximas Partidas
              </button>
              <button
                className={`tab-btn ${activeTab === 'feitas' ? 'active' : ''}`}
                onClick={() => setActiveTab('feitas')}
              >
                Histórico
              </button>
            </div>

            <div className="matches-list">
              {activeTab === 'pendentes' ? (
                partidasPendentes.length > 0 ? (
                  partidasPendentes.map((partida: PartidaDTO) => {
                    const { dia, hora } = formatDataHora(partida.dataHora);
                    return (
                      <div
                        key={partida.id}
                        className="match-card"
                        onClick={() => navigate(`/partida/${partida.id}`)}
                      >
                        <div className="match-header">
                          <div className="match-info-group">
                            <div className="match-info-tag">
                              <Calendar size={14} /> {dia}
                              {partida.dataHora && <><Clock size={14} style={{ marginLeft: '8px' }} /> {hora}</>}
                            </div>
                            <div className="match-info-tag">
                              <MapPin size={14} /> {partida.estadio}
                            </div>
                          </div>
                          <div className="match-info-tag">
                            <span style={{ fontWeight: 600, marginRight: '10px' }}>Rodada {partida.numeroRodada}</span>
                            <span className="status-badge status-agendada">AGENDADA</span>
                          </div>
                        </div>
                        <div className="match-content">
                          <div className="team-display">
                            {partida.mandante.clubeImagem ? (
                              <img src={partida.mandante.clubeImagem} alt={partida.mandante.clubeNome} className="team-logo" />
                            ) : (
                              <div className="team-logo-placeholder">{partida.mandante.clubeSigla}</div>
                            )}
                            <span className="team-name" title={partida.mandante.clubeNome}>{partida.mandante.clubeNome}</span>
                            <div className="player-info">
                              <div
                                className="player-avatar-small"
                                style={{ backgroundImage: partida.mandante.jogadorImagem ? `url(${partida.mandante.jogadorImagem})` : 'none' }}
                              ></div>
                              <span className="player-name">{partida.mandante.jogadorNome}</span>
                            </div>
                          </div>

                          <div className="vs-text">VS</div>

                          <div className="team-display">
                            {partida.visitante.clubeImagem ? (
                              <img src={partida.visitante.clubeImagem} alt={partida.visitante.clubeNome} className="team-logo" />
                            ) : (
                              <div className="team-logo-placeholder">{partida.visitante.clubeSigla}</div>
                            )}
                            <span className="team-name" title={partida.visitante.clubeNome}>{partida.visitante.clubeNome}</span>
                            <div className="player-info">
                              <div
                                className="player-avatar-small"
                                style={{ backgroundImage: partida.visitante.jogadorImagem ? `url(${partida.visitante.jogadorImagem})` : 'none' }}
                              ></div>
                              <span className="player-name">{partida.visitante.jogadorNome}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <Gamepad2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>Nenhuma partida pendente encontrada.</p>
                  </div>
                )
              ) : (
                partidasFeitas.length > 0 ? (
                  partidasFeitas.map((partida: PartidaDTO) => {
                    const { dia } = formatDataHora(partida.dataHora);
                    return (
                      <div
                        key={partida.id}
                        className="match-card"
                        onClick={() => navigate(`/partida/${partida.id}`)}
                      >
                        <div className="match-header">
                          <div className="match-info-group">
                            <div className="match-info-tag">
                              <Calendar size={14} /> {dia}
                            </div>
                            <div className="match-info-tag">
                              <MapPin size={14} /> {partida.estadio}
                            </div>
                          </div>
                          <div className="match-info-tag">
                            <span style={{ fontWeight: 600, marginRight: '10px' }}>Rodada {partida.numeroRodada}</span>
                            <span className={`status-badge ${partida.wo ? 'status-wo' : 'status-finalizada'}`}>
                              {partida.wo ? 'W.O.' : 'FINALIZADA'}
                            </span>
                          </div>
                        </div>
                        <div className="match-content">
                          <div className="team-display">
                            {partida.mandante.clubeImagem ? (
                              <img src={partida.mandante.clubeImagem} alt={partida.mandante.clubeNome} className="team-logo" />
                            ) : (
                              <div className="team-logo-placeholder">{partida.mandante.clubeSigla}</div>
                            )}
                            <span className="team-name" title={partida.mandante.clubeNome}>{partida.mandante.clubeNome}</span>
                            <div className="player-info">
                              <div
                                className="player-avatar-small"
                                style={{ backgroundImage: partida.mandante.jogadorImagem ? `url(${partida.mandante.jogadorImagem})` : 'none' }}
                              ></div>
                              <span className="player-name">{partida.mandante.jogadorNome}</span>
                            </div>
                          </div>

                          <div className="score-board">
                            <div className="score-main">
                              <span>{partida.golsMandante ?? 0}</span>
                              <span style={{ opacity: 0.3, fontSize: '1.5rem' }}>x</span>
                              <span>{partida.golsVisitante ?? 0}</span>
                            </div>
                            {partida.houvePenaltis && (
                              <span className="score-penalties">
                                ({partida.penaltisMandante} - {partida.penaltisVisitante} Pen.)
                              </span>
                            )}
                          </div>

                          <div className="team-display">
                            {partida.visitante.clubeImagem ? (
                              <img src={partida.visitante.clubeImagem} alt={partida.visitante.clubeNome} className="team-logo" />
                            ) : (
                              <div className="team-logo-placeholder">{partida.visitante.clubeSigla}</div>
                            )}
                            <span className="team-name" title={partida.visitante.clubeNome}>{partida.visitante.clubeNome}</span>
                            <div className="player-info">
                              <div
                                className="player-avatar-small"
                                style={{ backgroundImage: partida.visitante.jogadorImagem ? `url(${partida.visitante.jogadorImagem})` : 'none' }}
                              ></div>
                              <span className="player-name">{partida.visitante.jogadorNome}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <Trophy size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>Nenhuma partida realizada encontrada.</p>
                  </div>
                )
              )}
            </div>
          </div>
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