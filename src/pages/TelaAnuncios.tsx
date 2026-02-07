import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Megaphone,
  Calendar,
  AlertTriangle,
  Zap,
  Info
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

interface Anuncio {
  id: string;
  titulo: string;
  mensagem: string;
  dataPostagem: string;
  tipoMensagem: string;
  imagem?: string;
  corMensagem?: string;
}

export function TelaAnuncios() {
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showNotificacaoPopup, setShowNotificacaoPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    const fetchAnuncios = async () => {
      try {
        setLoading(true);
        const response = await API.get('/anuncios/recentes');
        if (Array.isArray(response.data)) {
            setAnuncios(response.data);
        } else if (Array.isArray(response)) {
            setAnuncios(response);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnuncios();
  }, []);

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

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        setCurrentUser(null);
        setShowUserPopup(false);
    }
  };

  const getIconeTipo = (tipo: string) => {
      switch(tipo) {
          case 'ALERTA': return <AlertTriangle size={16} />;
          case 'EVENTO': return <CalendarSync size={16} />;
          case 'ATUALIZACAO': return <Zap size={16} />;
          default: return <Info size={16} />;
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
              <input type="text" placeholder="Buscar..." />
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
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Megaphone size={28} color="var(--primary)" />
                    Quadro de Avisos
                </h2>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.95rem' }}>
                    Fique por dentro das últimas novidades e comunicados oficiais.
                </p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="tp-hero-skeleton" style={{ height: '150px' }}></div>
                    ))}
                </div>
            ) : anuncios.length === 0 ? (
                <div className="tp-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-gray)' }}>
                    <h3>Nenhum anúncio recente</h3>
                    <p>No momento não há novos comunicados.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {anuncios.map((anuncio) => (
                        <div 
                            key={anuncio.id} 
                            className="tp-card" 
                            style={{ 
                                padding: '24px', 
                                borderLeft: `5px solid ${anuncio.corMensagem || 'var(--primary)'}`,
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}
                            onClick={() => navigate(`/anuncios/${anuncio.id}`)}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ 
                                        backgroundColor: anuncio.corMensagem ? `${anuncio.corMensagem}20` : 'rgba(37, 99, 235, 0.1)',
                                        color: anuncio.corMensagem || 'var(--primary)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        textTransform: 'uppercase',
                                        border: `1px solid ${anuncio.corMensagem ? anuncio.corMensagem : 'transparent'}`
                                    }}>
                                       {getIconeTipo(anuncio.tipoMensagem)}
                                       {anuncio.tipoMensagem}
                                    </span>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                        {anuncio.titulo}
                                    </h3>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-gray)' }}>
                                    <Calendar size={14} />
                                    {formatDate(anuncio.dataPostagem)}
                                </div>
                            </div>
                            
                            <div style={{ 
                                color: 'var(--text-secondary)', 
                                lineHeight: '1.5', 
                                fontSize: '0.95rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {anuncio.mensagem}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>

      {showLoginPopup && <PopupLogin onClose={() => setShowLoginPopup(false)} onLoginSuccess={setCurrentUser} />}
      {showUserPopup && currentUser && <PopupUser user={{...currentUser, imagem: currentUser.imagem || ''}} onClose={() => setShowUserPopup(false)} onLogout={handleLogout} />}
      {showNotificacaoPopup && <PopupNotificacao onClose={() => setShowNotificacaoPopup(false)} />}
    </div>
  );
}