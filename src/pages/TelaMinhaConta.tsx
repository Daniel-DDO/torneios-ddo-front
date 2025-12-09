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
  Menu: () => (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
  Dashboard: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  Trophy: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17"></path>
      <path d="M14 14.66V17"></path>
      <path d="M12 2v1"></path>
      <path d="M12 22v-3"></path>
      <path d="M12 2a7 7 0 0 0-7 7c0 4.3 4 8 8 9a7 7 0 0 0 7-9 7 7 0 0 0-7-7z"></path>
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  ),
  Calendar: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Wallet: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  Search: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Bell: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  Save: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  )
};

export function TelaMinhaConta() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    setLoading(false);
  }, []);

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

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      <LoadingSpinner isLoading={loading} />

      <style>{`
        .page-content {
          padding: 2rem 3rem;
        }
        
        .account-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
          margin-top: 24px;
        }

        .section-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 24px;
          height: fit-content;
        }

        .profile-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .profile-avatar-xl {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: var(--hover-bg);
          border: 3px solid var(--border-color);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary);
          background-size: cover;
          background-position: center;
        }

        .profile-name {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 4px;
        }

        .profile-role {
          background: var(--hover-bg);
          color: var(--primary);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 24px;
          border: 1px solid var(--border-color);
        }

        .wallet-card {
            background: linear-gradient(135deg, var(--bg-body), var(--hover-bg));
            border-radius: 12px;
            padding: 20px;
            width: 100%;
            margin-bottom: 24px;
            border: 1px solid var(--border-color);
        }

        .wallet-label {
            font-size: 0.85rem;
            color: var(--text-gray);
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .wallet-amount {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--success);
        }

        .stats-summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            width: 100%;
        }

        .stat-mini-box {
            background: var(--hover-bg);
            padding: 12px;
            border-radius: 8px;
            text-align: center;
        }

        .stat-mini-val { font-weight: 700; font-size: 1.1rem; color: var(--text-dark); }
        .stat-mini-lbl { font-size: 0.75rem; color: var(--text-gray); }

        .form-section-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--text-dark);
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border-color);
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 24px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
        }

        .form-group label {
            font-size: 0.9rem;
            color: var(--text-gray);
            margin-bottom: 8px;
            font-weight: 500;
        }

        .form-input {
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            background: var(--bg-body);
            color: var(--text-dark);
            font-size: 0.95rem;
            transition: all 0.2s;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
        }

        .form-input:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }

        .btn-save {
            background: var(--primary);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: 0.2s;
            margin-top: 16px;
        }

        .btn-save:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        @media (max-width: 900px) {
            .account-grid { grid-template-columns: 1fr; }
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
          <a onClick={() => navigate('/')} className="nav-item" style={{ cursor: 'pointer' }}><Icons.Dashboard /> Dashboard</a>
          <a onClick={() => navigate('/jogadores')} className="nav-item" style={{ cursor: 'pointer' }}><Icons.Users /> Jogadores</a>
          <a onClick={() => navigate('/clubes')} className="nav-item" style={{ cursor: 'pointer' }}><Icons.Shield /> Clubes</a>
          <a onClick={() => navigate('/competicoes')} className="nav-item" style={{ cursor: 'pointer' }}><Icons.Trophy /> Competições</a>
          <a href="#" className="nav-item"><Icons.Shield /> Títulos</a>
          <div className="nav-separator"></div>
          <a href="#" className="nav-item"><Icons.Calendar /> Partidas</a>
          <a onClick={() => navigate('/minha-conta')} className="nav-item active" style={{ cursor: 'pointer' }}><Icons.Wallet /> Minha conta</a>
          <a href="#" className="nav-item"><Icons.Settings /> Suporte</a>
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
              <input type="text" placeholder="Buscar..." />
            </div>
          </div>

          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">💡</button>
            <button className="icon-btn"><Icons.Bell /></button>

            {currentUser ? (
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
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Minha Conta</h2>
            <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Gerencie suas informações e visualize suas estatísticas</p>
          </div>

          {currentUser ? (
            <div className="account-grid">
              <div className="section-card profile-header">
                {currentUser.imagem ? (
                  <div className="profile-avatar-xl" style={{ backgroundImage: `url(${currentUser.imagem})` }}></div>
                ) : (
                  <div className="profile-avatar-xl">{currentUser.nome.charAt(0)}</div>
                )}
                <h3 className="profile-name">{currentUser.nome}</h3>
                <span className="profile-role">{currentUser.cargo || 'Jogador'}</span>

                <div className="wallet-card">
                  <div className="wallet-label"><Icons.Wallet /> Saldo Virtual</div>
                  <div className="wallet-amount">D$ {currentUser.saldoVirtual.toLocaleString()}</div>
                </div>

                <div className="stats-summary">
                  <div className="stat-mini-box">
                    <div className="stat-mini-val">{currentUser.titulos}</div>
                    <div className="stat-mini-lbl">Títulos</div>
                  </div>
                  <div className="stat-mini-box">
                    <div className="stat-mini-val">{currentUser.finais}</div>
                    <div className="stat-mini-lbl">Finais</div>
                  </div>
                  <div className="stat-mini-box">
                    <div className="stat-mini-val">{currentUser.partidasJogadas}</div>
                    <div className="stat-mini-lbl">Partidas</div>
                  </div>
                  <div className="stat-mini-box">
                    <div className="stat-mini-val">{currentUser.golsMarcados}</div>
                    <div className="stat-mini-lbl">Gols</div>
                  </div>
                </div>
              </div>

              <div className="section-card">
                <h4 className="form-section-title">Informações Pessoais</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nome de Usuário</label>
                    <input type="text" className="form-input" defaultValue={currentUser.nome} />
                  </div>
                  <div className="form-group">
                    <label>Discord ID</label>
                    <input type="text" className="form-input" value={currentUser.discord} disabled style={{ opacity: 0.6 }} />
                  </div>
                  <div className="form-group">
                    <label>ID do Sistema</label>
                    <input type="text" className="form-input" value={currentUser.id} disabled style={{ opacity: 0.6 }} />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <input type="text" className="form-input" value="Ativo" disabled style={{ opacity: 0.6 }} />
                  </div>
                </div>

                <h4 className="form-section-title" style={{ marginTop: '24px' }}>Segurança</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nova Senha</label>
                    <input type="password" className="form-input" placeholder="Digite para alterar" />
                  </div>
                  <div className="form-group">
                    <label>Confirmar Senha</label>
                    <input type="password" className="form-input" placeholder="Confirme a nova senha" />
                  </div>
                </div>

                <button className="btn-save">
                  <Icons.Save /> Salvar Alterações
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-gray)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>🔒</div>
              <h3>Você precisa estar logado</h3>
              <p style={{ marginBottom: '2rem' }}>Faça login para acessar suas informações de conta.</p>
              <button
                onClick={() => setShowLoginPopup(true)}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Fazer Login
              </button>
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
          user={currentUser}
          onClose={() => setShowUserPopup(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
