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
  Bell,
  Gamepad2,
  Star,
  Settings,
  CalendarSync,
  Lightbulb,
  Medal,
  Crown
} from 'lucide-react';
import { API } from '../services/api';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import '../styles/TorneiosPage.css';

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

interface Titulo {
  id: number;
  nome: string;
  descricao: string;
  temporada: string;
  dataConquista: string;
  imagem?: string;
  vencedorNome?: string;
  clubeNome?: string;
}

export function TelaTitulos() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: async () => {
      const response = await API.get('/api/avatares');
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 1000 * 60 * 30,
    enabled: !!currentUser
  });

  const { data: titulos = [], isLoading } = useQuery({
    queryKey: ['titulos'],
    queryFn: async () => {
      const response = await API.get('/titulos');
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 1000 * 60 * 5
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((a: any) => (map[a.id] = a.url));
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
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      <style>{`
        .titulos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          padding: 24px;
        }

        .titulo-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }

        .titulo-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          border-color: var(--primary);
        }

        .titulo-icon-wrapper {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          border: 1px solid rgba(255,215,0,0.2);
        }

        .titulo-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 8px;
        }

        .titulo-season {
          font-size: 0.85rem;
          color: var(--primary);
          font-weight: 600;
          background: rgba(var(--primary-rgb), 0.1);
          padding: 4px 12px;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .titulo-details {
          width: 100%;
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: var(--text-gray);
        }

        .titulo-winner {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .shimmer {
          background: linear-gradient(90deg, var(--bg-card) 0%, var(--bg-body) 50%, var(--bg-card) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          color: var(--text-gray);
          gap: 16px;
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
          <a onClick={() => navigate('/')} className="nav-item"><LayoutDashboard size={20} /> Dashboard</a>
          <a onClick={() => navigate('/jogadores')} className="nav-item"><Users size={20} /> Jogadores</a>
          <a onClick={() => navigate('/clubes')} className="nav-item"><Shield size={20} /> Clubes</a>
          <a onClick={() => navigate('/competicoes')} className="nav-item"><Trophy size={20} /> Competições</a>
          <a className="nav-item active"><Star size={20} /> Títulos</a>
          <a onClick={() => navigate('/temporadas')} className="nav-item"><CalendarSync size={20} /> Temporadas</a>
          <div className="nav-separator"></div>
          <a onClick={() => navigate('/partidas')} className="nav-item"><Gamepad2 size={20} /> Partidas</a>
          <a onClick={() => navigate('/minha-conta')} className="nav-item"><Wallet size={20} /> Minha conta</a>
          <a onClick={() => navigate('/suporte')} className="nav-item"><Settings size={20} /> Suporte</a>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="left-header">
            <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <div className="search-bar">
              <Search size={18} />
              <input placeholder="Buscar títulos..." />
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
              <Lightbulb size={20} />
            </button>
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            {currentUser ? (
              <div
                className="user-avatar-mini"
                onClick={() => setShowUserPopup(true)}
                style={{
                  backgroundImage: currentUser.imagem
                    ? `url(${avatarMap[currentUser.imagem] || currentUser.imagem})`
                    : 'none',
                  backgroundSize: 'cover',
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
                  borderRadius: '8px',
                  fontWeight: 600
                }}
              >
                Login
              </button>
            )}
          </div>
        </header>

        <div className="page-content">
          <div className="page-header-simple">
            <h2>Galeria de Títulos</h2>
            <p>Histórico de conquistas e campeões das temporadas</p>
          </div>

          <div className="titulos-grid">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="titulo-card shimmer" style={{ height: '240px' }}></div>
              ))
            ) : titulos.length > 0 ? (
              titulos.map((titulo: Titulo) => (
                <div key={titulo.id} className="titulo-card">
                  <div className="titulo-icon-wrapper">
                    {titulo.imagem ? (
                      <img
                        src={titulo.imagem}
                        alt={titulo.nome}
                        style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                      />
                    ) : (
                      <Trophy size={36} color="#FFD700" />
                    )}
                  </div>
                  <h3 className="titulo-name">{titulo.nome}</h3>
                  <span className="titulo-season">{titulo.temporada}</span>
                  <div className="titulo-details">
                    <div className="titulo-winner">
                      <Medal size={14} />
                      <span>{titulo.vencedorNome || 'Não definido'}</span>
                    </div>
                    {titulo.clubeNome && (
                      <div className="titulo-winner">
                        <Crown size={14} />
                        <span>{titulo.clubeNome}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Trophy size={48} opacity={0.3} />
                <h3>Nenhum título registrado</h3>
                <p>Os títulos das competições aparecerão aqui.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showLoginPopup && (
        <PopupLogin onClose={() => setShowLoginPopup(false)} onLoginSuccess={setCurrentUser} />
      )}
      {showUserPopup && currentUser && (
        <PopupUser
          user={{ ...currentUser, imagem: avatarMap[currentUser.imagem || ''] || currentUser.imagem }}
          onClose={() => setShowUserPopup(false)}
          onLogout={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user_data');
            setCurrentUser(null);
            setShowUserPopup(false);
          }}
        />
      )}
    </div>
  );
}