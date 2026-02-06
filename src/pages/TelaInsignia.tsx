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
  Gamepad2, 
  Star,
  Lightbulb,
  CalendarSync,
  Loader2,
  Medal,
  ArrowLeft
} from 'lucide-react';
import { API } from '../services/api';
import PopupUser from '../components/PopupUser';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

interface Insignia {
  id: string;
  nome: string;
  imagem: string;
  descricao: string;
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

const fetchInsigniasService = async () => {
  const response = await API.get('/insignia');
  return response.data || [];
};

export function TelaInsignia() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: insignias = [], isLoading } = useQuery<Insignia[]>({
    queryKey: ['insignias'],
    queryFn: fetchInsigniasService,
    staleTime: 1000 * 60 * 30,
  });

  const filteredInsignias = useMemo(() => {
    if (!searchTerm) return insignias;
    return insignias.filter(ins => 
      ins.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [insignias, searchTerm]);

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

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        setCurrentUser(null);
        setShowUserPopup(false);
        navigate('/');
    }
  };

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

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
        }

        .header-title {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-dark);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .insignias-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .insignia-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .insignia-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1);
          border-color: var(--primary);
        }

        .insignia-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 6px;
          background: linear-gradient(90deg, var(--primary), #a0aec0);
        }

        .insignia-img-container {
          width: 100px;
          height: 100px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 10px 15px rgba(0,0,0,0.2));
          transition: transform 0.3s;
        }

        .insignia-card:hover .insignia-img-container {
          transform: scale(1.1);
        }

        .insignia-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .insignia-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 10px;
        }

        .insignia-desc {
          font-size: 0.9rem;
          color: var(--text-gray);
          line-height: 1.5;
        }

        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          background: var(--bg-card);
          border-radius: 24px;
          border: 1px solid var(--border-color);
          color: var(--text-gray);
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
            >
              <Menu size={24} />
            </button>
            <div className="search-bar">
              <Search size={20} />
              <input 
                type="text" 
                placeholder="Buscar insígnia..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme}>
              <Lightbulb size={20} />
            </button>
            <BotaoNotificacao user={currentUser} />
            
            {currentUser && (
              <div 
                className="user-avatar-mini"
                onClick={() => setShowUserPopup(true)}
                style={{
                    cursor: 'pointer',
                    background: 'var(--primary)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white'
                }}
              >
                {currentUser.imagem ? (
                    <img src={currentUser.imagem} alt="" style={{width:'100%', height:'100%', borderRadius:'50%'}} />
                ) : (
                    currentUser.nome.charAt(0)
                )}
              </div>
            )}
          </div>
        </header>

        <div className="page-content">
          <div className="page-header">
            <div className="header-title">
               <button onClick={() => navigate(-1)} style={{background:'none', border:'none', cursor:'pointer', color:'inherit', display:'flex'}}>
                 <ArrowLeft size={28} />
               </button>
               Galeria de Insígnias
            </div>
          </div>

          {isLoading ? (
            <div className="empty-state">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p style={{marginTop: '16px'}}>Carregando insígnias...</p>
            </div>
          ) : (
            <div className="insignias-grid">
              {filteredInsignias.length > 0 ? (
                filteredInsignias.map((insignia) => (
                  <div key={insignia.id} className="insignia-card">
                    <div className="insignia-img-container">
                      <img src={insignia.imagem} alt={insignia.nome} className="insignia-img" />
                    </div>
                    <h3 className="insignia-name">{insignia.nome}</h3>
                    <p className="insignia-desc">{insignia.descricao}</p>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <Medal size={48} style={{opacity: 0.3, marginBottom: '16px'}} />
                  <p>Nenhuma insígnia encontrada.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showUserPopup && currentUser && (
        <PopupUser 
          user={currentUser}
          onClose={() => setShowUserPopup(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}