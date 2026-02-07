import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  ArrowLeft,
  Calendar,
  ExternalLink,
  Flame,
  Swords,
  AlertTriangle,
  Crown,
  Target
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupNotificacao from '../components/PopupNotificacao';

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

interface NoticiaDetalhada {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'TITANS' | 'ZEBRA' | 'GOLEADA' | 'DECISAO' | 'BATALHA' | 'JOGO_QUENTE';
  linkPartida: string;
  dataCriacao: string;
}

const NEWS_CONFIG = {
  TITANS: {
    label: 'Choque de Titãs',
    icon: <Swords size={20} />,
    color: '#FFD700',
    image: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=1000&auto=format&fit=crop'
  },
  ZEBRA: {
    label: 'Zebra Histórica',
    icon: <AlertTriangle size={20} />,
    color: '#ff4757',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1000&auto=format&fit=crop'
  },
  GOLEADA: {
    label: 'Goleada',
    icon: <Target size={20} />,
    color: '#2ed573',
    image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=1000&auto=format&fit=crop'
  },
  DECISAO: {
    label: 'Decisão',
    icon: <Crown size={20} />,
    color: '#ffa502',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000&auto=format&fit=crop'
  },
  BATALHA: {
    label: 'Batalha',
    icon: <Shield size={20} />,
    color: '#747d8c',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=1000&auto=format&fit=crop'
  },
  JOGO_QUENTE: {
    label: 'Jogo Quente',
    icon: <Flame size={20} />,
    color: '#ff6b81',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop'
  }
};

export function TelaNoticiaSelecionada() {
  const navigate = useNavigate();
  const { noticiaId } = useParams();
  
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showNotificacaoPopup, setShowNotificacaoPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [noticia, setNoticia] = useState<NoticiaDetalhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    const fetchNoticia = async () => {
      if (!noticiaId) return;
      try {
        setLoading(true);
        const response = await API.get(`/api/noticias/${noticiaId}`);
        setNoticia(response.data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNoticia();
  }, [noticiaId]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getNewsConfig = (tipo: string) => {
    return NEWS_CONFIG[tipo as keyof typeof NEWS_CONFIG] || NEWS_CONFIG.JOGO_QUENTE;
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        setCurrentUser(null);
        setShowUserPopup(false);
    }
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={{zIndex: 100}}>
        <div className="logo-area">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
               <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/>
            </svg>
          </div>
          <span className="logo-text">Torneios <span>DDO</span></span>
        </div>

        <nav className="nav-menu">
          <a onClick={() => handleNavigate('/')} className="nav-item" style={{cursor: 'pointer'}}>
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a onClick={() => handleNavigate('/jogadores')} className="nav-item" style={{cursor: 'pointer'}}>
            <Users size={20} /> Jogadores
          </a>
          <a onClick={() => handleNavigate('/clubes')} className="nav-item" style={{cursor: 'pointer'}}>
            <Shield size={20} /> Clubes
          </a>
          <a onClick={() => handleNavigate('/competicoes')} className="nav-item" style={{cursor: 'pointer'}}>
            <Trophy size={20} /> Competições
          </a>
          <a onClick={() => handleNavigate('/titulos')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Star size={20} /> Títulos
          </a>
          <a onClick={() => handleNavigate('/temporadas')} className="nav-item" style={{cursor: 'pointer'}}>
            <CalendarSync size={20} /> Temporadas
          </a>
          <div className="nav-separator"></div>
          <a onClick={() => handleNavigate('/partidas')} className="nav-item" style={{cursor: 'pointer'}}>
            <Gamepad2 size={20} /> Partidas
          </a>
           <a onClick={() => handleNavigate('/minha-conta')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Wallet size={20} /> Minha conta
          </a>
          <a onClick={() => handleNavigate('/suporte')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Settings size={20} /> Suporte
          </a>
        </nav>
      </aside>

      {isMobile && sidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
              <input type="text" placeholder="Buscar jogador..." />
            </div>
          </div>
          
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
              <Lightbulb size={20} />
            </button>
            <button 
              className="icon-btn" 
              onClick={() => setShowNotificacaoPopup(true)}
            >
                <Bell size={20} />
            </button>
            
            {currentUser ? (
              <div 
                className="user-avatar-mini"
                onClick={() => setShowUserPopup(true)}
                style={{
                  backgroundImage: currentUser.imagem ? `url(${currentUser.imagem})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {!currentUser.imagem && currentUser.nome.charAt(0)}
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
                    cursor: 'pointer'
                }}
              >
                Login
              </button>
            )}
          </div>
        </header>

        <div className="page-content">
          
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={() => navigate(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-gray)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 500
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-gray)'}
            >
              <ArrowLeft size={20} /> Voltar
            </button>
          </div>

          {loading ? (
             <div className="tp-hero-skeleton" style={{ height: '400px' }}></div>
          ) : error || !noticia ? (
            <div className="tp-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-gray)' }}>
              <h3>Notícia não encontrada</h3>
              <p>O conteúdo que você procura pode ter sido removido.</p>
            </div>
          ) : (
            (() => {
              const config = getNewsConfig(noticia.tipo);
              return (
                <div className="tp-card" style={{ padding: '0', overflow: 'hidden', maxWidth: '900px', margin: '0 auto' }}>
                  <div style={{
                    height: '320px',
                    width: '100%',
                    position: 'relative',
                    backgroundImage: `url(${config.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
                    }}></div>

                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      padding: '30px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: config.color,
                        color: '#fff',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        marginBottom: '16px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        {config.icon} {config.label}
                      </div>

                      <h1 style={{
                        color: 'white',
                        fontSize: isMobile ? '1.8rem' : '2.5rem',
                        fontWeight: '800',
                        lineHeight: 1.2,
                        marginBottom: '12px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                      }}>
                        {noticia.titulo}
                      </h1>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '0.9rem'
                      }}>
                        <Calendar size={16} />
                        {formatDate(noticia.dataCriacao)}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: isMobile ? '24px' : '40px' }}>
                    <p style={{
                      fontSize: '1.1rem',
                      lineHeight: '1.8',
                      color: 'var(--text-dark)',
                      marginBottom: '40px',
                      whiteSpace: 'pre-line'
                    }}>
                      {noticia.mensagem}
                    </p>

                    {noticia.linkPartida && (
                      <div style={{
                        padding: '24px',
                        backgroundColor: 'var(--hover-bg)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}>
                        <div>
                          <h4 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1rem', marginBottom: '4px' }}>Quer ver como foi?</h4>
                          <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                            Confira todos os detalhes, estatísticas e lances desta partida.
                          </p>
                        </div>
                        
                        <a 
                          href={noticia.linkPartida}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 15px rgba(78, 62, 255, 0.2)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(78, 62, 255, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(78, 62, 255, 0.2)';
                          }}
                        >
                          Ver Partida <ExternalLink size={18} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </main>

      {showLoginPopup && <PopupLogin onClose={() => setShowLoginPopup(false)} onLoginSuccess={setCurrentUser} />}
      {showUserPopup && currentUser && <PopupUser user={{...currentUser, imagem: currentUser.imagem || ''}} onClose={() => setShowUserPopup(false)} onLogout={handleLogout} />}
      {showNotificacaoPopup && <PopupNotificacao onClose={() => setShowNotificacaoPopup(false)} />}
    </div>
  );
}