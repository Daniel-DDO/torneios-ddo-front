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
  Settings, 
  Search, 
  Bell, 
  Gamepad2, 
  Star,
  Lightbulb,
  CalendarSync,
  Loader2,
  ChevronDown,
  ChevronUp,
  Crown,
  TrendingUp,
  Target,
  Swords,
  Lock
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupReivindicar from '../components/PopupReivindicar';
import PopupRecuperarSenha from '../components/PopupRecuperarSenha';

interface Torneio {
  id: number;
  nome: string;
  descricao: string;
  status: 'em_andamento' | 'inscricoes_abertas' | 'finalizado';
  imagem?: string;
  botao_texto?: string;
}

interface Player {
  id: string;
  nome: string;
  discord: string;
  pontosCoeficiente: number;
  imagem?: string;
}

interface UserData {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  cargo: 'PROPRIETARIO' | 'DIRETOR' | 'ADMINISTRADOR' | 'JOGADOR';
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

const fetchTopPlayersService = async () => {
  const response = await API.get('/jogador/by-coeficiente10');
  return response.data || [];
};

export function TorneiosPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showRecuperarSenhaPopup, setShowRecuperarSenhaPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [playersLimit, setPlayersLimit] = useState(5);

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const { data: topPlayers = [], isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['topPlayers'],
    queryFn: fetchTopPlayersService,
    staleTime: 1000 * 60 * 5, 
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: Avatar) => {
        map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return topPlayers;
    return topPlayers.filter(player => 
      player.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.discord.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [topPlayers, searchTerm]);

  const displayedPlayers = useMemo(() => {
    return filteredPlayers.slice(0, playersLimit);
  }, [filteredPlayers, playersLimit]);

  const togglePlayersLimit = () => {
    if (playersLimit === 5) {
      setPlayersLimit(filteredPlayers.length);
    } else {
      setPlayersLimit(5);
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

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

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const torneios: Torneio[] = [
    {
      id: 1,
      nome: 'Liga Real DDO',
      descricao: 'A elite do futebol virtual em disputa.',
      status: 'em_andamento',
      imagem: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Ver Classificação',
    },
    {
      id: 2,
      nome: 'Copa das Nações',
      descricao: 'Represente sua seleção no mata-mata.',
      status: 'inscricoes_abertas',
      imagem: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Inscrever-se',
    },
    {
      id: 3,
      nome: 'Supercopa',
      descricao: 'O confronto final dos campeões.',
      status: 'finalizado',
      imagem: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Ver Resultados',
    },
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_andamento': return 'AO VIVO';
      case 'inscricoes_abertas': return 'ABERTO';
      case 'finalizado': return 'FINALIZADO';
      default: return status;
    }
  };

  const [showReivindicarPopup, setShowReivindicarPopup] = useState(false);

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
       <style>{`
        .glass-panel {
          background: var(--bg-card);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
        }

        .hero-section {
          position: relative;
          border-radius: 24px;
          background: linear-gradient(120deg, #1a1a2e 0%, #16213e 100%);
          overflow: hidden;
          padding: 40px;
          color: white;
          margin-bottom: 30px;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 280px;
        }
        
        .hero-bg-anim {
          position: absolute;
          top: -50%;
          left: -20%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(78,62,255,0.4) 0%, rgba(0,0,0,0) 60%);
          animation: pulse-glow 10s infinite alternate;
          pointer-events: none;
        }

        @keyframes pulse-glow {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 0.8; }
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 600px;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 71, 87, 0.2);
          color: #ff4757;
          padding: 6px 12px;
          border-radius: 30px;
          font-weight: 700;
          font-size: 0.8rem;
          margin-bottom: 16px;
          border: 1px solid rgba(255, 71, 87, 0.3);
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 16px;
          background: linear-gradient(to right, #ffffff, #a0aec0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-desc {
          font-size: 1.1rem;
          color: rgba(255,255,255,0.7);
          margin-bottom: 24px;
        }

        .btn-glow {
          background: #4e3eff;
          color: white;
          padding: 12px 28px;
          border-radius: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(78, 62, 255, 0.4);
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(78, 62, 255, 0.6);
        }

        .grid-layout {
          display: grid;
          grid-template-columns: 2fr 1.2fr;
          gap: 24px;
        }

        .section-header-styled {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-dark);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tournament-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .t-card-glass {
          background: var(--bg-card);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid var(--border-color);
          transition: 0.3s;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .t-card-glass:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1);
          border-color: var(--primary);
        }

        .t-img-area {
          height: 160px;
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .t-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 16px;
        }

        .t-status-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 800;
          background: rgba(255,255,255,0.95);
          color: #000;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        
        .t-status-badge.em_andamento { color: #00d09c; }
        .t-status-badge.finalizado { color: var(--text-gray); }

        .t-body {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .t-name {
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 8px;
          color: var(--text-dark);
        }

        .t-description {
          font-size: 0.9rem;
          color: var(--text-gray);
          margin-bottom: 20px;
          line-height: 1.5;
          flex: 1;
        }

        .t-btn-outline {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          border: 2px solid var(--border-color);
          background: transparent;
          color: var(--text-dark);
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .t-btn-outline:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(78, 62, 255, 0.05);
        }

        .ranking-container {
          background: var(--bg-card);
          border-radius: 24px;
          border: 1px solid var(--border-color);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .ranking-header-bg {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
          padding: 24px;
          color: white;
          position: relative;
          overflow: hidden;
        }
        
        .ranking-header-content {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ranking-list {
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .rank-row-modern {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.2s;
        }

        .rank-row-modern:hover {
          background: var(--hover-bg);
        }

        .rank-pos-box {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1rem;
          border-radius: 8px;
          margin-right: 16px;
          flex-shrink: 0;
        }
        
        .pos-1 { background: linear-gradient(135deg, #FFD700 0%, #FDB931 100%); color: #fff; box-shadow: 0 4px 10px rgba(253, 185, 49, 0.4); }
        .pos-2 { background: linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%); color: #fff; }
        .pos-3 { background: linear-gradient(135deg, #CD7F32 0%, #A0522D 100%); color: #fff; }
        .pos-n { color: var(--text-gray); background: var(--border-color); font-size: 0.9rem; }

        .rank-avatar-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          margin-right: 16px;
          flex-shrink: 0;
          overflow: hidden;
          background: var(--border-color);
          position: relative;
        }

        .rank-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .rank-player-info {
          flex: 1;
          min-width: 0; /* CRUCIAL FOR TEXT OVERFLOW */
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .rank-name-txt {
          font-weight: 700;
          color: var(--text-dark);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 1rem;
          margin-bottom: 4px;
        }

        .rank-discord-txt {
          color: var(--text-gray);
          font-size: 0.8rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rank-score-box {
          background: rgba(78, 62, 255, 0.1);
          padding: 6px 12px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
          margin-left: 10px;
        }

        .score-val {
          color: var(--primary);
          font-weight: 800;
          font-size: 1rem;
        }

        .score-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          color: var(--text-gray);
          letter-spacing: 0.5px;
        }

        .load-more-strip {
          padding: 15px;
          text-align: center;
          cursor: pointer;
          color: var(--text-gray);
          font-size: 0.9rem;
          font-weight: 600;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .load-more-strip:hover {
          background: var(--hover-bg);
          color: var(--primary);
        }

        /* Responsividade Ajustada */
        @media (max-width: 1100px) {
          .grid-layout {
            grid-template-columns: 1fr;
          }
          
          .hero-section {
            flex-direction: column;
            align-items: flex-start;
            padding: 30px;
          }
          
          .hero-content {
            max-width: 100%;
            margin-bottom: 20px;
          }

          .hero-title {
            font-size: 2rem;
          }

          .rank-avatar-box {
            width: 40px;
            height: 40px;
            margin-right: 12px;
          }

          .rank-pos-box {
            width: 28px;
            height: 28px;
            font-size: 0.9rem;
            margin-right: 12px;
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
          <a onClick={() => navigate('/')} className="nav-item active" style={{cursor: 'pointer'}}>
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a onClick={() => navigate('/jogadores')} className="nav-item" style={{cursor: 'pointer'}}>
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
          
          <div className="hero-section">
            <div className="hero-bg-anim"></div>
            <div className="hero-content">
              <div className="hero-tag">
                <span className="pulse-dot"></span> TEMPORADA 2026
              </div>
              <h1 className="hero-title">Domine o Campo<br/>Virtual</h1>
              <p className="hero-desc">Participe dos torneios mais competitivos, suba no ranking e conquiste a glória na comunidade DDO.</p>
              
              {!currentUser ? (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button className="btn-glow" onClick={() => setShowReivindicarPopup(true)}>
                    Entrar na Arena <Swords size={20} />
                  </button>
                  <button 
                    className="btn-glow" 
                    onClick={() => setShowRecuperarSenhaPopup(true)}
                    style={{ background: 'rgba(255,255,255,0.1)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    Recuperar Senha <Lock size={20} />
                  </button>
                </div>
              ) : (
                <button className="btn-glow" onClick={() => navigate('/competicoes')}>
                  Ver Meus Torneios <Target size={20} />
                </button>
              )}
            </div>
          </div>

          <div className="grid-layout">
            
            <div className="left-section">
              <div className="section-header-styled">
                <div className="section-title">
                  <Gamepad2 size={24} className="text-primary" />
                  Competições Ativas
                </div>
              </div>

              <div className="tournament-cards">
                {torneios.map(torneio => (
                  <div key={torneio.id} className="t-card-glass">
                    <div className="t-img-area" style={{backgroundImage: `url(${torneio.imagem})`}}>
                      <div className="t-img-overlay">
                        <span className={`t-status-badge ${torneio.status}`}>
                          {getStatusLabel(torneio.status)}
                        </span>
                      </div>
                    </div>
                    <div className="t-body">
                      <h4 className="t-name">{torneio.nome}</h4>
                      <p className="t-description">{torneio.descricao}</p>
                      <button className="t-btn-outline">{torneio.botao_texto}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="right-section">
              <div className="ranking-container">
                <div className="ranking-header-bg">
                  <div className="ranking-header-content">
                    <div>
                      <h3 style={{fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <Crown size={20} fill="white" /> Top Ranking
                      </h3>
                      <span style={{fontSize: '0.85rem', opacity: 0.8}}>Melhores por Coeficiente</span>
                    </div>
                    <TrendingUp size={32} style={{opacity: 0.3}} />
                  </div>
                </div>

                <div className="ranking-list">
                  {isLoadingPlayers ? (
                    <div style={{padding: '40px', display: 'flex', justifyContent: 'center'}}>
                      <Loader2 className="animate-spin text-primary" size={28} />
                    </div>
                  ) : filteredPlayers.length > 0 ? (
                    <>
                      {displayedPlayers.map((player, index) => {
                        const avatarUrl = player.imagem ? avatarMap[player.imagem] : null;
                        const posClass = index === 0 ? 'pos-1' : index === 1 ? 'pos-2' : index === 2 ? 'pos-3' : 'pos-n';
                        
                        return (
                          <div key={player.id} className="rank-row-modern">
                            <div className={`rank-pos-box ${posClass}`}>
                              {index + 1}
                            </div>
                            
                            <div className="rank-avatar-box">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={player.nome} className="rank-avatar-img" />
                              ) : (
                                <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background: 'var(--border-color)', fontWeight:'bold', color:'var(--text-gray)'}}>
                                  {player.nome.charAt(0)}
                                </div>
                              )}
                            </div>

                            <div className="rank-player-info">
                              <span className="rank-name-txt">{player.nome}</span>
                              <span className="rank-discord-txt">@{player.discord}</span>
                            </div>

                            <div className="rank-score-box">
                              <span className="score-val">{player.pontosCoeficiente.toFixed(2)}</span>
                              <span className="score-label">pts</span>
                            </div>
                          </div>
                        );
                      })}

                      {filteredPlayers.length > 5 && (
                        <div className="load-more-strip" onClick={togglePlayersLimit}>
                          {playersLimit === 5 ? (
                            <>Ver ranking completo <ChevronDown size={16} /></>
                          ) : (
                            <>Recolher <ChevronUp size={16} /></>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{padding: '30px', textAlign: 'center', color: 'var(--text-gray)'}}>
                      Nenhum jogador encontrado.
                    </div>
                  )}
                </div>
              </div>
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

      {showReivindicarPopup && (
      <PopupReivindicar 
        onClose={() => setShowReivindicarPopup(false)}
        onSubmit={(data) => {
          console.log("Dados para Reivindicar:", data);
          setShowReivindicarPopup(false);
        }}
      />
    )}

    {showRecuperarSenhaPopup && (
        <PopupRecuperarSenha 
          onClose={() => setShowRecuperarSenhaPopup(false)}
          onSuccess={() => {
            setShowRecuperarSenhaPopup(false);
            alert("Senha redefinida com sucesso!");
          }}
        />
    )}
    </div>
  );
}