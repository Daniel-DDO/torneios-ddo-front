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
  Settings,
  Search,
  Gamepad2,
  Star,
  Lightbulb,
  CalendarSync,
  ArrowLeft,
  Award
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

interface CompeticaoDetalheDTO {
  id: string;
  nome: string;
  imagem: string;
  divisao: string;
  valor: number;
  descricao: string;
  tituloId: string | null;
  tituloNome: string | null;
  tituloImagem: string | null;
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
  nome?: string;
}

const fetchCompeticaoPorIdService = async (id: string): Promise<CompeticaoDetalheDTO | null> => {
  try {
    const response = await API.get(`/competicao/${id}`);
    const data = (response && (response as any).data) ? (response as any).data : response;
    return data as CompeticaoDetalheDTO;
  } catch (error) {
    console.error('Erro ao buscar competição', error);
    return null;
  }
};

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

export function TelaCompeticaoSelecionada() {
  const navigate = useNavigate();
  const { competicaoId } = useParams();

  const { data: competicao, isLoading: loading } = useQuery<CompeticaoDetalheDTO | null>({
    queryKey: ['competicao', competicaoId],
    queryFn: () => fetchCompeticaoPorIdService(competicaoId || ''),
    enabled: !!competicaoId,
    staleTime: 1000 * 60 * 5,
  });

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

  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
  }, []);

  const handleLoginSuccess = (userData: UserData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair?')) {
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

  const competicaoImagemUrl = competicao?.imagem
    ? (avatarMap[competicao.imagem] || competicao.imagem)
    : null;

  const tituloImagemUrl = competicao?.tituloImagem
    ? (avatarMap[competicao.tituloImagem] || competicao.tituloImagem)
    : null;

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>

      <LoadingSpinner isLoading={loading} />

      <style>{`
        .page-content {
          padding: 2rem 3rem;
        }

        .back-button {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-gray);
            font-size: 0.9rem;
            margin-bottom: 1rem;
            cursor: pointer;
            border: none;
            background: none;
            padding: 0;
        }

        .back-button:hover {
            color: var(--primary);
        }

        .competicao-header-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 32px;
          display: flex;
          align-items: center;
          gap: 32px;
          box-shadow: var(--shadow-sm);
        }

        .competicao-avatar-grande {
          width: 120px;
          height: 120px;
          border-radius: 20px;
          background: var(--hover-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary);
          border: 2px solid var(--border-color);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          flex-shrink: 0;
        }

        .competicao-info-principal {
          flex: 1;
        }

        .competicao-nome {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-dark);
          margin-bottom: 8px;
        }

        .competicao-descricao {
          color: var(--text-gray);
          font-size: 0.95rem;
          line-height: 1.5;
          max-width: 700px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 24px;
        }

        .stat-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 20px 24px;
          box-shadow: var(--shadow-sm);
        }

        .stat-card-label {
          font-size: 0.8rem;
          color: var(--text-gray);
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .stat-card-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .titulo-card {
          margin-top: 24px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .titulo-avatar {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          background: var(--hover-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          border: 2px solid var(--border-color);
          flex-shrink: 0;
        }

        .titulo-label {
          font-size: 0.8rem;
          color: var(--text-gray);
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .titulo-nome {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--text-gray);
        }

        @media (max-width: 768px) {
          .page-content { padding: 1rem; }
          .competicao-header-card { flex-direction: column; text-align: center; }
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
          <a onClick={() => navigate('/competicoes')} className="nav-item active" style={{cursor: 'pointer'}}>
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
                placeholder="Buscar competição..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
              <Lightbulb size={20} />
            </button>
            <BotaoNotificacao user={currentUser} />
            
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
            <button onClick={() => navigate('/competicoes')} className="back-button">
                <ArrowLeft size={16} /> Voltar para Competições
            </button>

            {!loading && !competicao && (
              <div className="empty-state">Competição não encontrada.</div>
            )}

            {!loading && competicao && (
              <>
                <div className="competicao-header-card">
                  {competicaoImagemUrl ? (
                    <div className="competicao-avatar-grande" style={{backgroundImage: `url(${competicaoImagemUrl})`}}></div>
                  ) : (
                    <div className="competicao-avatar-grande">
                      {competicao.nome.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="competicao-info-principal">
                    <div className="competicao-nome">{competicao.nome}</div>
                    <div className="competicao-descricao">
                      {competicao.descricao || 'Sem descrição cadastrada para esta competição.'}
                    </div>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-card-label">Divisão</div>
                    <div className="stat-card-value">{competicao.divisao || '-'}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label">Valor (Peso)</div>
                    <div className="stat-card-value">{competicao.valor ?? '-'}</div>
                  </div>
                </div>

                {competicao.tituloId && (
                  <div className="titulo-card">
                    {tituloImagemUrl ? (
                      <div className="titulo-avatar" style={{backgroundImage: `url(${tituloImagemUrl})`}}></div>
                    ) : (
                      <div className="titulo-avatar">
                        <Award size={28} color="var(--primary)" />
                      </div>
                    )}
                    <div>
                      <div className="titulo-label">
                        <Award size={14} /> Título vinculado
                      </div>
                      <div className="titulo-nome">{competicao.tituloNome}</div>
                    </div>
                  </div>
                )}
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