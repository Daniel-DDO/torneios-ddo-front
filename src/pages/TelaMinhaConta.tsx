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
  Edit: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Camera: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>,
  Mail: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
};

export function TelaMinhaConta() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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
          <a onClick={() => navigate('/')} className="nav-item" style={{ cursor: 'pointer' }}><Icons.Dashboard /> Dashboard</a>
          <a onClick={() => navigate('/jogadores')} className="nav-item" style={{ cursor: 'pointer' }}><Icons.Users /> Jogadores</a>
          <a onClick={() => navigate('/clubes')} className="nav-item" style={{ cursor: 'pointer' }}><Icons.Shield /> Clubes</a>
          <a onClick={() => navigate('/competicoes')} className="nav-item" style={{ cursor: 'pointer' }}><Icons.Trophy /> Competições</a>
          <a href="#" className="nav-item"><Icons.Shield /> Títulos</a>
          <div className="nav-separator"></div>
          <a href="#" className="nav-item"><Icons.Calendar /> Partidas</a>
          <a onClick={() => navigate('/minha-conta')} className="nav-item active" style={{ cursor: 'pointer' }}><Icons.Wallet /> Minha conta</a>
          <a href="#" className="nav-item"><Icons.Settings /> Suporte</a>
          
          <div className="nav-separator"></div>
          {isAdmin && (
             <a onClick={() => navigate('/admin')} className="nav-item" style={{ cursor: 'pointer' }}>
               <Icons.Lock /> Menu Adm
             </a>
          )}
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
            {isAdmin && (
                <button className="btn-admin-header" onClick={() => navigate('/admin')}>
                    Painel do Adm
                </button>
            )}

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
          {currentUser && (
            <div className="profile-container">
              
              <div className="profile-header-card">
                <div className="profile-bg-detail"></div>
                
                <div 
                    className="profile-avatar-large"
                    style={{
                        backgroundImage: currentUser.imagem ? `url(${currentUser.imagem})` : 'none'
                    }}
                >
                    {!currentUser.imagem && currentUser.nome.charAt(0)}
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
                  <button className="action-btn" onClick={() => console.log('Atualizar foto')}>
                    <Icons.Camera />
                    Atualizar foto do perfil
                  </button>
                  <button className="action-btn" onClick={() => console.log('Atualizar conta')}>
                    <Icons.Edit />
                    Atualizar conta
                  </button>
                  <button className="action-btn" onClick={() => console.log('Atualizar email')}>
                    <Icons.Mail />
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
          user={currentUser}
          onClose={() => setShowUserPopup(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}