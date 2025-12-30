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
  LogIn,
  Lightbulb,
  CalendarSync
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupReivindicar from '../components/PopupReivindicar';

interface Torneio {
  id: number;
  nome: string;
  descricao: string;
  status: 'em_andamento' | 'inscricoes_abertas' | 'finalizado';
  imagem?: string;
  botao_texto?: string;
}

interface Player {
  id: number;
  nome: string;
  pontos: number;
  posicao: number;
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

export function TorneiosPage() {
  const navigate = useNavigate();
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
      descricao: 'A liga de pontos corridos mais disputada da comunidade.',
      status: 'em_andamento',
      imagem: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Ver Tabela',
    },
    {
      id: 2,
      nome: 'Copa das Nações',
      descricao: 'Escolha sua seleção e represente suas cores no mata-mata.',
      status: 'inscricoes_abertas',
      imagem: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Inscrever-se',
    },
    {
      id: 3,
      nome: 'Copa do Brasil',
      descricao: 'O caminho para o título nacional. Jogos de ida e volta.',
      status: 'em_andamento',
      imagem: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Assistir Jogos',
    },
  ];

  const players: Player[] = [
    { id: 1, nome: 'Lúcio DDO', pontos: 2850, posicao: 1 },
    { id: 2, nome: 'Daniel DDO', pontos: 2720, posicao: 2 },
    { id: 3, nome: 'OLS DDO', pontos: 2680, posicao: 3 },
    { id: 4, nome: 'Segredo_0', pontos: 2590, posicao: 4 },
    { id: 5, nome: 'Índio Mala', pontos: 2400, posicao: 5 },
    { id: 6, nome: 'Deatch DDO', pontos: 2300, posicao: 6 },
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_andamento': return 'Ao Vivo';
      case 'inscricoes_abertas': return 'Aberto';
      case 'finalizado': return 'Fim';
      default: return status;
    }
  };

  const [showReivindicarPopup, setShowReivindicarPopup] = useState(false);

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
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
              <input type="text" placeholder="Buscar..." />
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
          <div className="hero-banner full-width-banner">
              <div className="hero-overlay"></div>
              <div className="hero-content">
              <span className="badge-live">Ao Vivo em Breve</span>
              <h2>Grande Final da Liga Real DDO</h2>
              <div className="matchup-text">
                  LÚCIO <span className="vs">VS</span> DANIEL DDO
              </div>
              <div className="timer-pill">
                  Domingo 07/12 - 19:00H
              </div>
              </div>
          </div>

          <div className="content-split">
            
            <div className="left-column">
              <div className="section-header">
                <h3>Torneios em Destaque</h3>
                <a href="#" className="view-all">Ver todos</a>
              </div>

              <div className="tournaments-list">
                {torneios.map(torneio => (
                  <div key={torneio.id} className="tournament-row">
                    <div className="t-image" style={{backgroundImage: `url(${torneio.imagem})`}}></div>
                    <div className="t-info">
                      <h4>{torneio.nome}</h4>
                      <p>{torneio.descricao}</p>
                    </div>
                    <div className="t-status">
                        <span className={`status-pill ${torneio.status}`}>
                          {getStatusLabel(torneio.status)}
                        </span>
                    </div>
                    <button className="t-btn">{torneio.botao_texto}</button>
                  </div>
                ))}
              </div>
            </div>

            <aside className="right-column">
              {!currentUser && (
                <button 
                  onClick={() => setShowReivindicarPopup(true)}
                  style={{
                    width: '100%',
                    marginBottom: '20px',
                    padding: '15px',
                    background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)', 
                    border: 'none',
                    borderRadius: '16px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.9, marginBottom: '2px' }}>Sou Jogador?</span>
                    <span style={{ display: 'block', fontSize: '1rem', fontWeight: 'bold' }}>Reivindicar Conta</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px' }}>
                    <LogIn size={20} />
                  </div>
                </button>
              )}
              <div className="ranking-card">
                <div className="ranking-header">
                  <h3>Top Players</h3>
                  <span>Global</span>
                </div>
                
                <div className="leader-graph">
                    <div className="bar bar-2"><span>2</span></div>
                    <div className="bar bar-1"><span>1</span></div>
                    <div className="bar bar-3"><span>3</span></div>
                </div>

                <div className="players-list">
                  {players.map((player) => (
                    <div key={player.id} className="player-row">
                      <div className="player-rank">#{player.posicao}</div>
                      <div className="player-avatar">
                        {player.nome.charAt(0)}
                      </div>
                      <div className="player-details">
                        <span className="p-name">{player.nome}</span>
                        <span className="p-location">Brasil</span>
                      </div>
                      <div className="player-points">
                        {player.pontos}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
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
    </div>
  );
}