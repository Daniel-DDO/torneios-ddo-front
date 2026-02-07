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
  Info,
  AlertTriangle,
  Zap
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

interface AnuncioDetalhado {
  id: string;
  titulo: string;
  mensagem: string;
  dataPostagem: string;
  tipoMensagem: string;
  imagem?: string;
  corMensagem?: string;
}

export function TelaAnuncioSelecionado() {
  const { anuncioId } = useParams();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showNotificacaoPopup, setShowNotificacaoPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [anuncio, setAnuncio] = useState<AnuncioDetalhado | null>(null);
  const [loading, setLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    const fetchAnuncio = async () => {
      if (!anuncioId) return;
      try {
        setLoading(true);
        const response = await API.get(`/anuncios/${anuncioId}`);
        setAnuncio(response.data || response);
      } catch (err) {
        console.error(err);
        navigate('/anuncios'); 
      } finally {
        setLoading(false);
      }
    };

    fetchAnuncio();
  }, [anuncioId, navigate]);

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
        navigate('/');
    }
  };

  const getIconeTipo = (tipo: string) => {
      switch(tipo) {
          case 'ALERTA': return <AlertTriangle size={18} />;
          case 'EVENTO': return <CalendarSync size={18} />;
          case 'ATUALIZACAO': return <Zap size={18} />;
          default: return <Info size={18} />;
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
          <button 
             onClick={() => navigate('/anuncios')}
             style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: '8px',
               background: 'none',
               border: 'none',
               color: 'var(--text-secondary)',
               cursor: 'pointer',
               marginBottom: '20px',
               fontSize: '1rem',
               padding: 0
             }}
          >
             <ArrowLeft size={20} /> Voltar para Anúncios
          </button>

          {loading || !anuncio ? (
             <div className="tp-hero-skeleton" style={{ height: '300px' }}></div>
          ) : (
             <div className="tp-card" style={{ padding: '0', overflow: 'hidden' }}>
                {anuncio.imagem && (
                  <div style={{ 
                    width: '100%', 
                    height: '350px', 
                    backgroundImage: `url(${anuncio.imagem})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderBottom: '1px solid var(--border-color)'
                  }}></div>
                )}
                
                <div style={{ padding: '30px' }}>
                    <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        marginBottom: '16px', 
                        flexWrap: 'wrap'
                    }}>
                        <span style={{ 
                            backgroundColor: anuncio.corMensagem || 'var(--primary)',
                            color: '#fff',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            textTransform: 'uppercase'
                        }}>
                           {getIconeTipo(anuncio.tipoMensagem)}
                           {anuncio.tipoMensagem}
                        </span>

                        <span style={{ 
                            backgroundColor: 'var(--bg-body)',
                            color: 'var(--text-secondary)',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                           <Calendar size={16} />
                           {formatDate(anuncio.dataPostagem)}
                        </span>
                    </div>

                    <h1 style={{ 
                        fontSize: '2rem', 
                        fontWeight: '800', 
                        color: 'var(--text-dark)', 
                        marginBottom: '24px',
                        lineHeight: '1.3'
                    }}>
                        {anuncio.titulo}
                    </h1>

                    <div style={{ 
                        fontSize: '1.1rem', 
                        lineHeight: '1.8', 
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-line',
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '24px'
                    }}>
                        {anuncio.mensagem}
                    </div>
                </div>
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