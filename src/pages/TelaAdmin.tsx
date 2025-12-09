import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';

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

const Icons = {
  Menu: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Dashboard: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Users: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Trophy: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17"></path><path d="M14 14.66V17"></path><path d="M12 2v1"></path><path d="M12 22v-3"></path><path d="M12 2a7 7 0 0 0-7 7c0 4.3 4 8 8 9a7 7 0 0 0 7-9 7 7 0 0 0-7-7z"></path></svg>,
  Shield: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  Calendar: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Wallet: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
  Settings: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Search: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Bell: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  Lock: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Alert: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  FileText: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
};

export function TelaAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
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

    .admin-stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 20px;
        margin-bottom: 32px;
    }

    .admin-stat-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        transition: 0.2s;
    }
    
    .admin-stat-card:hover {
        transform: translateY(-2px);
        border-color: var(--primary);
    }

    .stat-icon-wrapper {
        width: 50px;
        height: 50px;
        border-radius: 12px;
        background: var(--hover-bg);
        color: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .stat-info h4 {
        font-size: 0.9rem;
        color: var(--text-gray);
        margin-bottom: 4px;
        font-weight: 500;
    }

    .stat-info span {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-dark);
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

    .urgent-badge {
        position: absolute;
        top: 16px;
        right: 16px;
        background: #ff4757;
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 12px;
    }

    @media (max-width: 900px) {
        .page-content { padding: 1rem; }
        .admin-stats-row { grid-template-columns: 1fr; }
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
          <a onClick={() => navigate('/')} className="nav-item" style={{ cursor: 'pointer' }}><Icons.Dashboard /> Dashboard</a>
          <a onClick={() => navigate('/jogadores')} className="nav-item" style={{ cursor: 'pointer' }}><Icons.Users /> Jogadores</a>
          <a onClick={() => navigate('/clubes')} className="nav-item" style={{ cursor: 'pointer' }}><Icons.Shield /> Clubes</a>
          <a onClick={() => navigate('/competicoes')} className="nav-item" style={{ cursor: 'pointer' }}><Icons.Trophy /> Competições</a>
          <a href="#" className="nav-item"><Icons.Shield /> Títulos</a>
          <div className="nav-separator"></div>
          <a href="#" className="nav-item"><Icons.Calendar /> Partidas</a>
          <a onClick={() => navigate('/minha-conta')} className="nav-item" style={{ cursor: 'pointer' }}><Icons.Wallet /> Minha conta</a>
          <a href="#" className="nav-item"><Icons.Settings /> Suporte</a>
          
          <div className="nav-separator"></div>
          <a className="nav-item active" style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold' }}>
            <Icons.Lock /> Menu Adm
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
              <Icons.Menu />
            </button>
            <div className="search-bar">
              <Icons.Search />
              <input type="text" placeholder="Buscar no sistema..." />
            </div>
          </div>

          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">💡</button>
            <button className="icon-btn"><Icons.Bell /></button>

            {currentUser && (
              <div
                className="user-avatar-mini"
                onClick={() => setShowUserPopup(true)}
                style={{
                  backgroundImage: currentUser.imagem ? `url(${currentUser.imagem})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: currentUser.imagem ? 'transparent' : 'var(--primary)',
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
            )}
          </div>
        </header>

        <div className="page-content">
          <div className="admin-header-section">
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Painel Administrativo</h2>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                Bem-vindo, {currentUser && currentUser.cargo ? currentUser.cargo.charAt(0) + currentUser.cargo.slice(1).toLowerCase() : 'Admin'}. Controle total do sistema.
              </p>
            </div>
          </div>

          <div className="admin-stats-row">
            <div className="admin-stat-card">
              <div className="stat-icon-wrapper"><Icons.Users /></div>
              <div className="stat-info">
                <h4>Total Jogadores</h4>
                <span>142</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-icon-wrapper" style={{color: '#f1c40f'}}><Icons.Alert /></div>
              <div className="stat-info">
                <h4>Pendências</h4>
                <span>3</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-icon-wrapper" style={{color: '#2ecc71'}}><Icons.Trophy /></div>
              <div className="stat-info">
                <h4>Torneios Ativos</h4>
                <span>2</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-icon-wrapper" style={{color: '#9b59b6'}}><Icons.Wallet /></div>
              <div className="stat-info">
                <h4>Economia</h4>
                <span>D$ 850k</span>
              </div>
            </div>
          </div>

          <h3 style={{marginBottom: '20px', color: 'var(--text-dark)'}}>Ações Rápidas</h3>
          
          <div className="admin-grid-actions">
            <div className="action-card">
              <div className="action-icon"><Icons.Users /></div>
              <h4 className="action-title">Gerenciar Usuários</h4>
              <p className="action-desc">Editar permissões, aplicar banimentos e verificar novos cadastros.</p>
            </div>

            <div className="action-card">
              <div className="urgent-badge">1 Pendente</div>
              <div className="action-icon"><Icons.Shield /></div>
              <h4 className="action-title">Verificar Partidas</h4>
              <p className="action-desc">Aprovar ou rejeitar resultados de partidas enviadas pelos jogadores.</p>
            </div>

            <div className="action-card">
              <div className="action-icon"><Icons.Trophy /></div>
              <h4 className="action-title">Criar Competição</h4>
              <p className="action-desc">Configurar novas ligas, copas ou torneios de mata-mata.</p>
            </div>

            <div className="action-card">
              <div className="action-icon"><Icons.Wallet /></div>
              <h4 className="action-title">Gestão Financeira</h4>
              <p className="action-desc">Injetar saldo, aplicar multas e visualizar fluxo de D$.</p>
            </div>

            <div className="action-card">
              <div className="action-icon"><Icons.FileText /></div>
              <h4 className="action-title">Logs do Sistema</h4>
              <p className="action-desc">Auditoria de ações realizadas por outros membros da staff.</p>
            </div>

            <div className="action-card">
              <div className="action-icon"><Icons.Settings /></div>
              <h4 className="action-title">Configurações Gerais</h4>
              <p className="action-desc">Alterar banner principal, avisos e manutenção do site.</p>
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
          user={currentUser}
          onClose={() => setShowUserPopup(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}