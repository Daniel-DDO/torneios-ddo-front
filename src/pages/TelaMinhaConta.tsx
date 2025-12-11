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
  Edit, 
  Camera, 
  Mail, 
  Gamepad2,
  Star,
  Lightbulb,
  Settings,
  CalendarSync
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupAtualizarFoto from '../components/PopupAtualizarFoto';
import PopupAlterarCredenciais from '../components/PopupAlterarCredenciais';

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

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

export function TelaMinhaConta() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAvatarPopup, setShowAvatarPopup] = useState(false);
  
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

  const handleAvatarUpdate = (novaUrl: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, imagem: novaUrl };
      setCurrentUser(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const isAdmin = currentUser && ['ADMINISTRADOR', 'DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (value: number) => {
    return 'D$ ' + value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const [showCredenciaisPopup, setShowCredenciaisPopup] = useState(false);

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      <LoadingSpinner isLoading={loading} />

      <style>{`
        .page-content {
          padding: 2rem 3rem;
          display: flex;
          justify-content: center;
        }

        .profile-container {
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .profile-header-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 3rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        .profile-bg-detail {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          opacity: 0.1;
          z-index: 0;
        }

        .profile-avatar-large {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 4px solid var(--bg-card);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: 700;
          color: white;
          background-color: var(--primary);
          background-position: center;
          background-size: cover;
          z-index: 1;
          margin-bottom: 1.5rem;
          position: relative;
        }

        .profile-badge {
          position: absolute;
          bottom: 5px;
          right: 5px;
          background: var(--success);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid var(--bg-card);
        }

        .profile-info {
          text-align: center;
          z-index: 1;
        }

        .profile-name {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
        }

        .profile-discord {
          color: var(--primary);
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .profile-role-tag {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 2rem;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          width: 100%;
          margin-bottom: 2rem;
        }

        .stat-box {
          background: var(--bg-main);
          padding: 1.5rem;
          border-radius: var(--radius);
          text-align: center;
          border: 1px solid var(--border-color);
          transition: transform 0.2s;
        }

        .stat-box:hover {
          transform: translateY(-2px);
          border-color: var(--primary);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 4px;
        }

        .stat-value.money {
          color: var(--success);
        }

        .stat-label {
          font-size: 0.85rem;
          color: var(--text-gray);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .profile-details-list {
          width: 100%;
          border-top: 1px solid var(--border-color);
          padding-top: 2rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .detail-item label {
          display: block;
          font-size: 0.8rem;
          color: var(--text-gray);
          margin-bottom: 4px;
        }

        .detail-item span {
          font-size: 1rem;
          color: var(--text-dark);
          font-weight: 500;
        }

        .action-buttons-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          width: 100%;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 20px;
          border-radius: var(--radius);
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-dark);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
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
          .profile-details-list {
            grid-template-columns: 1fr;
            gap: 1rem;
            text-align: center;
          }
          .action-buttons-container {
            grid-template-columns: 1fr;
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
          <a href="#" className="nav-item">
            <Star size={20} /> Títulos
          </a>
          <a onClick={() => navigate('/temporadas')} className="nav-item" style={{cursor: 'pointer'}}>
            <CalendarSync size={20} /> Temporadas
          </a>
          <div className="nav-separator"></div>
          <a href="#" className="nav-item">
            <Gamepad2 size={20} /> Partidas
          </a>
          <a onClick={() => navigate('/minha-conta')} className="nav-item active" style={{ cursor: 'pointer' }}>
            <Wallet size={20} /> Minha conta
          </a>
          <a href="#" className="nav-item">
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
            <button className="icon-btn"><Bell size={20} /></button>

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
          {currentUser && (
            <div className="profile-container">
              
              <div className="profile-header-card">
                <div className="profile-bg-detail"></div>
                
                <div 
                    className="profile-avatar-large"
                    style={{
                        backgroundImage: getCurrentUserAvatar() ? `url(${getCurrentUserAvatar()})` : 'none'
                    }}
                >
                    {!getCurrentUserAvatar() && currentUser.nome.charAt(0)}
                    <div className="profile-badge"></div>
                </div>

                <div className="profile-info">
                    <h1 className="profile-name">{currentUser.nome}</h1>
                    <div className="profile-discord">
                          <span style={{opacity: 0.7}}>#</span> {currentUser.discord}
                    </div>
                    <span className="profile-role-tag">
                        {currentUser.cargo.replace('_', ' ')}
                    </span>
                </div>

                <div className="profile-stats-grid">
                    <div className="stat-box">
                        <div className="stat-value money">{formatCurrency(currentUser.saldoVirtual)}</div>
                        <div className="stat-label">Saldo Virtual</div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-value">{currentUser.partidasJogadas}</div>
                        <div className="stat-label">Partidas</div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-value">{currentUser.titulos}</div>
                        <div className="stat-label">Títulos</div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-value">{currentUser.golsMarcados}</div>
                        <div className="stat-label">Gols Marcados</div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-value">{currentUser.golsSofridos}</div>
                        <div className="stat-label">Gols Sofridos</div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-value">
                            {currentUser.partidasJogadas > 0 
                                ? (currentUser.golsMarcados / currentUser.partidasJogadas).toFixed(2).replace('.', ',') 
                                : '0,00'}
                        </div>
                        <div className="stat-label">Média p/ Jogo</div>
                    </div>
                </div>

                <div className="profile-details-list">
                    <div className="detail-item">
                        <label>ID do Jogador</label>
                        <span style={{fontFamily: 'monospace', fontSize: '0.9rem'}}>{currentUser.id}</span>
                    </div>
                    <div className="detail-item">
                        <label>Membro desde</label>
                        <span>{formatDate(currentUser.criacaoConta)}</span>
                    </div>
                </div>
              </div>

              <div className="action-buttons-container">
                  <button className="action-btn" onClick={() => setShowAvatarPopup(true)}>
                    <Camera size={20} />
                    Atualizar foto do perfil
                  </button>
                  <button className="action-btn" onClick={() => console.log('Atualizar conta')}>
                    <Edit size={20} />
                    Atualizar conta
                  </button>
                  <button className="action-btn" onClick={() => setShowCredenciaisPopup(true)}>
                    <Mail size={20} />
                    Atualizar email e senha
                  </button>
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

      {showAvatarPopup && (
        <PopupAtualizarFoto
          onClose={() => setShowAvatarPopup(false)}
          onUpdateSuccess={handleAvatarUpdate}
        />
      )}

      {showCredenciaisPopup && (
        <PopupAlterarCredenciais
          onClose={() => setShowCredenciaisPopup(false)}
          onSuccess={() => {
            setShowCredenciaisPopup(false);
            alert('Credenciais atualizadas com sucesso!');
          }}
        />
      )}
    </div>
  );
}