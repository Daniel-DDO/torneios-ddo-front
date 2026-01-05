import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Menu, LayoutDashboard, Users, Trophy, Shield, Wallet, Search, 
  Bell, ArrowLeft, Gamepad2, Lightbulb, Settings, CalendarSync, 
  CheckCircle, Clock, Award, BarChart3, Target, 
  Flag, Ban, Swords, Crown, Sparkles, TrendingUp, Info
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';

interface InsigniaDefinition {
  id: string;
  nome: string;
  imagem: string;
  descricao: string;
}

interface PlayerInsignia {
  id?: string;
  nome: string;
  imagem?: string;
  descricao?: string;
  cor?: string;
}

interface Player {
  id: string;
  nome: string;
  discord: string;
  finais: number;
  titulos: number;
  golsMarcados: number;
  golsSofridos: number;
  partidasJogadas: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  criacaoConta: string;
  modificacaoConta: string;
  statusJogador: 'ATIVO' | 'INATIVO' | 'SUSPENSO';
  contaReivindicada: boolean;
  cargo: any;
  imagem: string | null;
  descricao: string | null;
  suspensoAte: string | null;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  saldoVirtual: number;
  pontosCoeficiente: number;
  insignias: PlayerInsignia[];
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

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const fetchInsigniasService = async () => {
    const response = await API.get('/insignia');
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
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredBadgeId, setHoveredBadgeId] = useState<string | null>(null);

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const { data: insigniasDefinitions = [] } = useQuery({
    queryKey: ['insigniasDefinitions'],
    queryFn: fetchInsigniasService,
    staleTime: 1000 * 60 * 15,
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: any) => {
        map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

  const insigniaDetailsMap = useMemo(() => {
      const map: Record<string, InsigniaDefinition> = {};
      insigniasDefinitions.forEach((def: InsigniaDefinition) => {
          map[def.nome] = def; 
      });
      return map;
  }, [insigniasDefinitions]);

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
      console.error(error);
      navigate('/jogadores');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setCurrentUser(userData);
    localStorage.setItem('user_data', JSON.stringify(userData));
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        setCurrentUser(null);
        setShowUserPopup(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigate(`/jogadores?busca=${searchTerm}`);
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isSuspended = useMemo(() => {
    if (!player?.suspensoAte) return false;
    return new Date(player.suspensoAte) > new Date();
  }, [player]);

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      <LoadingSpinner isLoading={loading} />

      <style>{`
        .profile-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            padding-bottom: 40px;
            animation: fadeInUp 0.5s ease-out;
        }

        .btn-back {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 50px;
            color: var(--text-gray);
            font-weight: 500;
            margin-bottom: 24px;
            transition: all 0.2s;
            cursor: pointer;
        }
        .btn-back:hover {
            color: var(--primary);
            border-color: var(--primary);
            transform: translateX(-4px);
        }

        .profile-hero {
            position: relative;
            background: var(--bg-card);
            border-radius: 24px;
            border: 1px solid var(--border-color);
            overflow: visible;
            margin-bottom: 24px;
            box-shadow: var(--shadow-sm);
            padding: 40px;
        }

        .hero-body {
            display: flex;
            align-items: center;
            gap: 30px;
            flex-wrap: wrap;
        }

        .avatar-container {
            width: 130px;
            height: 130px;
            border-radius: 30px;
            padding: 5px;
            background: var(--bg-card);
            border: 2px solid var(--border-color);
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .avatar-img {
            width: 100%;
            height: 100%;
            border-radius: 25px;
            object-fit: cover;
            background-color: var(--hover-bg);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: var(--primary);
            font-weight: 800;
        }

        .user-identity {
            flex: 1;
        }
        .user-name {
            font-size: 2.2rem;
            font-weight: 800;
            color: var(--text-dark);
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
            line-height: 1.1;
        }
        .verified-icon { color: #0ea5e9; }
        
        .user-tags {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }
        .tag-role {
            background: rgba(78, 62, 255, 0.1);
            color: var(--primary);
            padding: 6px 14px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
        }
        .tag-discord {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-gray);
            font-size: 0.9rem;
            font-weight: 500;
            background: var(--hover-bg);
            padding: 6px 14px;
            border-radius: 12px;
        }

        .hero-stats {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
        }
        .stat-pill {
            background: var(--hover-bg);
            border: 1px solid var(--border-color);
            padding: 12px 20px;
            border-radius: 16px;
            text-align: right;
            min-width: 100px;
            transition: transform 0.2s;
        }
        .stat-pill:hover { transform: translateY(-2px); border-color: var(--primary); }
        .stat-pill-value {
            font-size: 1.3rem;
            font-weight: 800;
            display: block;
        }
        .stat-pill-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            color: var(--text-gray);
            font-weight: 600;
            margin-top: 2px;
        }
        .text-green { color: #10b981; }
        .text-purple { color: #8b5cf6; }
        .text-orange { color: #f59e0b; }

        .content-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 24px;
        }

        .card-box {
            background: var(--bg-card);
            border-radius: 24px;
            border: 1px solid var(--border-color);
            padding: 24px;
            box-shadow: var(--shadow-sm);
            margin-bottom: 24px;
            position: relative;
        }
        .card-box:last-child { margin-bottom: 0; }

        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
        }
        .card-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-dark);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .w-d-l-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 30px;
        }
        .wdl-item {
            background: var(--hover-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 16px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .wdl-val {
            font-size: 2rem;
            font-weight: 800;
            line-height: 1;
            margin-bottom: 4px;
        }
        .wdl-lbl {
            font-size: 0.75rem;
            text-transform: uppercase;
            font-weight: 600;
            color: var(--text-gray);
        }
        .val-win { color: #10b981; }
        .val-draw { color: var(--text-gray); }
        .val-loss { color: #ef4444; }

        .progress-section { margin-bottom: 24px; }
        .progress-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-dark);
        }
        .progress-track {
            height: 14px;
            background: var(--hover-bg);
            border-radius: 10px;
            overflow: hidden;
            display: flex;
        }
        .progress-bar { height: 100%; }
        .bar-win { background: #10b981; }
        .bar-draw { background: #cbd5e1; }
        .bar-loss { background: #ef4444; }

        .stats-row {
            display: flex;
            justify-content: space-between;
            padding: 16px 0;
            border-bottom: 1px dashed var(--border-color);
        }
        .stats-row:last-child { border-bottom: none; }
        .stat-k { color: var(--text-gray); font-weight: 500; }
        .stat-v { color: var(--text-dark); font-weight: 700; }

        .discipline-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .discipline-card {
            background: var(--hover-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .card-visual {
            width: 36px;
            height: 48px;
            border-radius: 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .card-yellow { background: #facc15; }
        .card-red { background: #ef4444; }
        .disc-info h4 { font-size: 1.5rem; font-weight: 800; color: var(--text-dark); line-height: 1; }
        .disc-info span { font-size: 0.7rem; text-transform: uppercase; color: var(--text-gray); font-weight: 700; }

        .suspension-alert {
            margin-top: 16px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #ef4444;
            padding: 12px;
            border-radius: 12px;
            font-size: 0.9rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .badges-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
            gap: 14px;
            position: relative;
        }
        .badge-slot {
            aspect-ratio: 1;
            background: var(--hover-bg);
            border-radius: 14px;
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            cursor: pointer;
            position: relative;
        }
        .badge-slot:hover {
            transform: scale(1.1) translateY(-4px);
            border-color: var(--primary);
            background: var(--bg-card);
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            z-index: 20;
        }
        .badge-icon { width: 65%; height: 65%; object-fit: contain; }
        .badge-count {
            background: var(--hover-bg);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-gray);
        }

        .badge-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            width: 240px;
            background: rgba(20, 20, 30, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 12px;
            color: #fff;
            margin-bottom: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 100;
            pointer-events: none;
            text-align: center;
            animation: fadeIn 0.2s ease-out;
        }
        .badge-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 6px;
            border-style: solid;
            border-color: rgba(20, 20, 30, 0.95) transparent transparent transparent;
        }
        .tooltip-title {
            font-weight: 700;
            font-size: 0.9rem;
            margin-bottom: 4px;
            color: #fff;
        }
        .tooltip-desc {
            font-size: 0.75rem;
            color: #cbd5e1;
            line-height: 1.4;
        }

        .bio-box {
            background: var(--hover-bg);
            padding: 16px;
            border-radius: 16px;
            border: 1px solid var(--border-color);
            margin-bottom: 20px;
            font-style: italic;
            color: var(--text-gray);
            font-size: 0.95rem;
            line-height: 1.5;
        }

        .info-list { display: flex; flex-direction: column; gap: 4px; }
        .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px dashed var(--border-color);
        }
        .info-item:last-child { border-bottom: none; }
        .info-label { display: flex; align-items: center; gap: 8px; color: var(--text-gray); font-size: 0.9rem; }
        .info-value { font-weight: 600; color: var(--text-dark); font-size: 0.9rem; }

        .status-badge {
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
        }
        .status-active { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .status-inactive { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

        @media (max-width: 900px) {
            .hero-body { flex-direction: column; align-items: center; text-align: center; justify-content: center; }
            .hero-stats { justify-content: center; width: 100%; }
            .content-grid { grid-template-columns: 1fr; }
            .user-name { justify-content: center; }
            .user-tags { justify-content: center; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
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
          <a onClick={() => navigate('/')} className="nav-item">
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a onClick={() => navigate('/jogadores')} className="nav-item active">
            <Users size={20} /> Jogadores
          </a>
          <a onClick={() => navigate('/clubes')} className="nav-item">
            <Shield size={20} /> Clubes
          </a>
          <a onClick={() => navigate('/competicoes')} className="nav-item">
            <Trophy size={20} /> Competições
          </a>
          <a onClick={() => navigate('/titulos')} className="nav-item">
            <Award size={20} /> Títulos
          </a>
          <a onClick={() => navigate('/temporadas')} className="nav-item">
            <CalendarSync size={20} /> Temporadas
          </a>
          <div className="nav-separator"></div>
          <a onClick={() => navigate('/partidas')} className="nav-item">
            <Gamepad2 size={20} /> Partidas
          </a>
           <a onClick={() => navigate('/minha-conta')} className="nav-item">
            <Wallet size={20} /> Minha conta
          </a>
          <a onClick={() => navigate('/suporte')} className="nav-item">
            <Settings size={20} /> Suporte
          </a>
        </nav>
      </aside>

      <main className="main-content">
        
        <header className="top-header compact">
          <div className="left-header">
            <button className="toggle-btn menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <div className="search-bar">
              <Search size={20} />
              <input 
                type="text" 
                placeholder="Buscar jogador..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
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
            <button onClick={() => navigate('/jogadores')} className="btn-back">
                <ArrowLeft size={18} /> Voltar para Jogadores
            </button>

            {!loading && player && (
                <div className="profile-wrapper">
                    
                    <div className="profile-hero">
                        <div className="hero-body">
                            <div className="avatar-container">
                                {getPlayerAvatar() ? (
                                    <img src={getPlayerAvatar()!} alt={player.nome} className="avatar-img" />
                                ) : (
                                    <div className="avatar-img">{player.nome.charAt(0)}</div>
                                )}
                            </div>
                            
                            <div className="user-identity">
                                <h1 className="user-name">
                                    {player.nome}
                                    {player.contaReivindicada && <CheckCircle className="verified-icon" size={24} fill="currentColor" />}
                                </h1>
                                <div className="user-tags">
                                    <span className="tag-role">
                                        {typeof player.cargo === 'string' ? player.cargo : (player.cargo?.nome || 'Jogador')}
                                    </span>
                                    <span className="tag-discord">
                                        <Swords size={16} /> {player.discord}
                                    </span>
                                </div>
                            </div>

                            <div className="hero-stats">
                                <div className="stat-pill">
                                    <span className="stat-pill-value text-green">{formatCurrency(player.saldoVirtual)}</span>
                                    <span className="stat-pill-label">Saldo</span>
                                </div>
                                <div className="stat-pill">
                                    <span className="stat-pill-value text-purple">{player.pontosCoeficiente.toFixed(2)}</span>
                                    <span className="stat-pill-label">Coeficiente</span>
                                </div>
                                <div className="stat-pill">
                                    <span className="stat-pill-value text-orange">{player.titulos}</span>
                                    <span className="stat-pill-label">Títulos</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="content-grid">
                        
                        <div className="main-stats-col">
                            <div className="card-box">
                                <div className="card-header">
                                    <h3 className="card-title"><BarChart3 className="text-purple" size={22}/> Desempenho em Partidas</h3>
                                </div>

                                <div className="w-d-l-grid">
                                    <div className="wdl-item">
                                        <span className="wdl-val val-win">{player.vitorias}</span>
                                        <span className="wdl-lbl">Vitórias</span>
                                    </div>
                                    <div className="wdl-item">
                                        <span className="wdl-val val-draw">{player.empates}</span>
                                        <span className="wdl-lbl">Empates</span>
                                    </div>
                                    <div className="wdl-item">
                                        <span className="wdl-val val-loss">{player.derrotas}</span>
                                        <span className="wdl-lbl">Derrotas</span>
                                    </div>
                                </div>

                                <div className="progress-section">
                                    <div className="progress-header">
                                        <span>Taxa de Vitória</span>
                                        <span>{player.partidasJogadas > 0 ? ((player.vitorias / player.partidasJogadas) * 100).toFixed(1) : 0}%</span>
                                    </div>
                                    <div className="progress-track">
                                        <div className="progress-bar bar-win" style={{width: `${(player.vitorias / player.partidasJogadas) * 100}%`}}></div>
                                        <div className="progress-bar bar-draw" style={{width: `${(player.empates / player.partidasJogadas) * 100}%`}}></div>
                                        <div className="progress-bar bar-loss" style={{width: `${(player.derrotas / player.partidasJogadas) * 100}%`}}></div>
                                    </div>
                                </div>

                                <div className="stats-row">
                                    <span className="stat-k">Gols Pró</span>
                                    <span className="stat-v">{player.golsMarcados}</span>
                                </div>
                                <div className="stats-row">
                                    <span className="stat-k">Gols Contra</span>
                                    <span className="stat-v">{player.golsSofridos}</span>
                                </div>
                                <div className="stats-row">
                                    <span className="stat-k">Saldo de Gols</span>
                                    <span className="stat-v" style={{color: (player.golsMarcados - player.golsSofridos) >= 0 ? 'var(--success)' : '#ef4444'}}>
                                        {player.golsMarcados - player.golsSofridos}
                                    </span>
                                </div>
                            </div>

                            <div className="card-box">
                                <div className="card-header">
                                    <h3 className="card-title"><Shield className="text-orange" size={22}/> Disciplina</h3>
                                </div>
                                <div className="discipline-grid">
                                    <div className="discipline-card">
                                        <div className="card-visual card-yellow"></div>
                                        <div className="disc-info">
                                            <h4>{player.cartoesAmarelos}</h4>
                                            <span>Cartões Amarelos</span>
                                        </div>
                                    </div>
                                    <div className="discipline-card">
                                        <div className="card-visual card-red"></div>
                                        <div className="disc-info">
                                            <h4>{player.cartoesVermelhos}</h4>
                                            <span>Cartões Vermelhos</span>
                                        </div>
                                    </div>
                                </div>
                                {isSuspended && (
                                    <div className="suspension-alert">
                                        <Ban size={18} />
                                        <span>Suspenso até {formatDate(player.suspensoAte)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="side-info-col">
                            <div className="card-box">
                                <div className="card-header">
                                    <h3 className="card-title"><Crown className="text-orange" size={22}/> Insígnias</h3>
                                    <span className="badge-count">{player.insignias?.length || 0}</span>
                                </div>
                                <div className="badges-grid">
                                    {player.insignias && player.insignias.length > 0 ? (
                                        player.insignias.map((insignia, idx) => {
                                            const details = insigniaDetailsMap[insignia.nome] || insignia;
                                            const uniqueId = insignia.id || `badge-${idx}`;
                                            return (
                                                <div 
                                                    key={uniqueId} 
                                                    className="badge-slot" 
                                                    onMouseEnter={() => setHoveredBadgeId(uniqueId)}
                                                    onMouseLeave={() => setHoveredBadgeId(null)}
                                                    onClick={() => setHoveredBadgeId(hoveredBadgeId === uniqueId ? null : uniqueId)}
                                                >
                                                    {insignia.imagem ? (
                                                        <img src={insignia.imagem} alt={insignia.nome} className="badge-icon"/>
                                                    ) : (
                                                        <Sparkles size={20} className="text-orange"/>
                                                    )}
                                                    
                                                    {hoveredBadgeId === uniqueId && (
                                                        <div className="badge-tooltip">
                                                            <div className="tooltip-title">{details.nome}</div>
                                                            <div className="tooltip-desc">{details.descricao || "Sem descrição disponível."}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px', color: 'var(--text-gray)'}}>
                                            <Info size={24} opacity={0.5}/>
                                            <span style={{fontSize: '0.9rem'}}>Nenhuma insígnia conquistada.</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card-box">
                                <div className="card-header">
                                    <h3 className="card-title"><Target className="text-purple" size={22}/> Informações</h3>
                                </div>
                                
                                {player.descricao && (
                                    <div className="bio-box">
                                        "{player.descricao}"
                                    </div>
                                )}

                                <div className="info-list">
                                    <div className="info-item">
                                        <span className="info-label"><Clock size={16}/> Membro desde</span>
                                        <span className="info-value">{formatDate(player.criacaoConta)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label"><TrendingUp size={16}/> Última atividade</span>
                                        <span className="info-value">{formatDate(player.modificacaoConta)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label"><Flag size={16}/> Status</span>
                                        <span className={`status-badge ${player.statusJogador === 'ATIVO' ? 'status-active' : 'status-inactive'}`}>
                                            {player.statusJogador}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
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
    </div>
  );
}