import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Menu,
  LayoutDashboard,
  Users,
  Trophy,
  Shield,
  Calendar,
  Wallet,
  Settings,
  Search,
  Bell,
  Key,
  Lock,
  UserPlus,
  UserCheck,
  Gamepad2,
  Star,
  Lightbulb,
  Megaphone
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupAutorizar from '../components/PopupAutorizar';
import PopupCadastrarJogador from '../components/PopupCadastrarJogador';

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

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

export function TelaAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showCadastrarJogadorPopup, setShowCadastrarJogadorPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

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
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);

      // Verifica se o cargo é de administrador/diretor/proprietário
      if (['ADMINISTRADOR', 'DIRETOR', 'PROPRIETARIO'].includes(parsedUser.cargo)) {
        setIsAuthorized(true);
      } else {
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

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  if (!isAuthorized) {
    return <LoadingSpinner isLoading={true} />;
  }

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      <LoadingSpinner isLoading={loading} />

      <style>{`
        .page-content {
          padding: 2rem 3rem;
        }

        .admin-header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .admin-grid-actions {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 24px;
        }

        .action-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 24px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        .action-card:hover {
            border-color: var(--primary);
            box-shadow: var(--shadow-md);
            transform: translateY(-3px);
        }

        .action-icon {
            margin-bottom: 16px;
            color: var(--primary);
            width: 40px;
            height: 40px;
        }

        .action-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-dark);
            margin-bottom: 8px;
        }

        .action-desc {
            font-size: 0.9rem;
            color: var(--text-gray);
            line-height: 1.5;
        }

        @media (max-width: 900px) {
            .page-content { padding: 1rem; }
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
          <div className="nav-separator"></div>
          <a href="#" className="nav-item">
            <Gamepad2 size={20} /> Partidas
          </a>
          <a onClick={() => navigate('/minha-conta')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Wallet size={20} /> Minha conta
          </a>
          <a href="#" className="nav-item">
            <Settings size={20} /> Suporte
          </a>
          
          <div className="nav-separator"></div>
          <a className="nav-item active" style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold' }}>
            <Lock size={18} /> Menu Adm
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
          <div className="admin-header-section">
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Painel Administrativo</h2>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                Bem-vindo, {currentUser && currentUser.cargo ? currentUser.cargo.charAt(0) + currentUser.cargo.slice(1).toLowerCase() : 'Admin'}. Gerencie o sistema aqui.
              </p>
            </div>
          </div>

          <div className="admin-grid-actions">
            
            <div 
                className="action-card" 
                onClick={() => setShowAuthPopup(true)} 
            >
                <div className="action-icon"><Key size={40} /></div>
                <h4 className="action-title">Autorizar jogador</h4>
                <p className="action-desc">Gerar código para conta reivindicada</p>
            </div>

            <div className="action-card" onClick={() => console.log('Recupere a senha')}>
                <div className="action-icon"><Lock size={40} /></div>
                <h4 className="action-title">Recuperar senha</h4>
                <p className="action-desc">Gere e envie o pin para o jogador que esqueceu da sua senha</p>
            </div>

            <div className="action-card" onClick={() => setShowCadastrarJogadorPopup(true)}>
                <div className="action-icon"><UserPlus size={40} /></div>
                <h4 className="action-title">Cadastrar jogador</h4>
                <p className="action-desc">Cadastre os novos jogadores aqui</p>
            </div>

            <div className="action-card" onClick={() => console.log('Atualizar jogador')}>
                <div className="action-icon"><UserCheck size={40} /></div>
                <h4 className="action-title">Atualizar jogador</h4>
                <p className="action-desc">Aposentou? Voltou? Atualize o status dos jogadores aqui</p>
            </div>

            <div className="action-card" onClick={() => console.log('Gerenciar temporadas')}>
                <div className="action-icon"><Calendar size={40} /></div>
                <h4 className="action-title">Gerenciar temporadas</h4>
                <p className="action-desc">Visualize, crie e edite as temporadas</p>
            </div>

            <div className="action-card" onClick={() => console.log('Gerenciar torneios')}>
                <div className="action-icon"><Trophy size={40} /></div>
                <h4 className="action-title">Gerenciar torneios</h4>
                <p className="action-desc">Visualize, crie e edite os torneios</p>
            </div>

            <div className="action-card" onClick={() => console.log('Gerenciar clubes')}>
                <div className="action-icon"><Shield size={40} /></div>
                <h4 className="action-title">Cadastrar clubes</h4>
                <p className="action-desc">Visualize e crie os clubes</p>
            </div>

            <div className="action-card" onClick={() => console.log('Criar anúncio')}>
                <div className="action-icon"><Megaphone size={40} /></div>
                <h4 className="action-title">Criar anúncio</h4>
                <p className="action-desc">Visualize, crie e edite os anúncios</p>
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

      {showAuthPopup && currentUser && (
        <PopupAutorizar
          adminId={currentUser.id}
          onClose={() => setShowAuthPopup(false)}
        />
      )}

      {showCadastrarJogadorPopup && (
        <PopupCadastrarJogador
          onClose={() => setShowCadastrarJogadorPopup(false)}
        />
      )}
    </div>
  );
}