import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';

// Interface baseada no JSON fornecido
interface UserData {
  id: string;
  nome: string;
  discord: string;
  finais: number;
  titulos: number;
  golsMarcados: number;
  golsSofridos: number;
  partidasJogadas: number;
  criacaoConta: string;
  modificacaoConta: string;
  statusJogador: string;
  contaReivindicada: boolean;
  cargo: string;
  imagem: string | null;
  descricao: string | null;
  suspensoAte: string | null;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  saldoVirtual: number;
  insignias: any[];
}

const Icons = {
  Menu: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Dashboard: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Users: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Trophy: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17"></path><path d="M14 14.66V17"></path><path d="M12 2v1"></path><path d="M12 22v-3"></path><path d="M12 2a7 7 0 0 0-7 7c0 4.3 4 8 8 9a7 7 0 0 0 7-9 7 7 0 0 0-7-7z"></path></svg>,
  Shield: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  Calendar: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Wallet: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
  Settings: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Search: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Bell: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  Admin: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path><path d="M12 6v6l4 2"></path></svg>,
  Edit: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Lock: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Camera: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
};

export function TelaMinhaConta() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Estados de layout
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

  // Carregar dados do usuário
  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      // Se não tiver logado, pode redirecionar ou mostrar popup
      // setShowLoginPopup(true);
    }
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

  // Função auxiliar para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Verificação de permissão
  const isAdmin = currentUser && ['ADMINISTRADOR', 'DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo);

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      {/* Estilos Inline Específicos para layout desta tela */}
      <style>{`
        .profile-header {
            display: flex;
            align-items: center;
            gap: 24px;
            background: var(--bg-card);
            padding: 30px;
            border-radius: var(--radius);
            border: 1px solid var(--border-color);
            margin-bottom: 24px;
            flex-wrap: wrap;
        }
        .profile-avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background-color: var(--hover-bg);
            background-size: cover;
            background-position: center;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            color: var(--primary);
            border: 3px solid var(--primary);
        }
        .profile-info h1 {
            font-size: 1.8rem;
            margin-bottom: 4px;
            color: var(--text-dark);
        }
        .profile-info p {
            color: var(--text-gray);
            margin-bottom: 8px;
        }
        .role-badge {
            background: var(--primary);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 30px;
        }
        .stat-card-detail {
            background: var(--bg-card);
            padding: 20px;
            border-radius: var(--radius);
            border: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }
        .stat-card-detail .value {
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--text-dark);
        }
        .stat-card-detail .label {
            font-size: 0.85rem;
            color: var(--text-gray);
            margin-top: 4px;
        }
        .action-buttons-container {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
        }
        .action-btn {
            flex: 1;
            min-width: 200px;
            padding: 16px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            color: var(--text-dark);
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: 0.2s;
        }
        .action-btn:hover {
            border-color: var(--primary);
            color: var(--primary);
            background: var(--hover-bg);
            transform: translateY(-2px);
        }
        .details-section {
            background: var(--bg-card);
            padding: 24px;
            border-radius: var(--radius);
            border: 1px solid var(--border-color);
            margin-bottom: 24px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid var(--border-color);
        }
        .detail-row:last-child { border-bottom: none; }
        .detail-key { color: var(--text-gray); }
        .detail-val { font-weight: 600; color: var(--text-dark); }

        @media (max-width: 768px) {
            .profile-header { flex-direction: column; text-align: center; }
            .action-buttons-container { flex-direction: column; }
        }
      `}</style>

      {/* SIDEBAR (Mesma da TelaJogadores) */}
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
          <a onClick={() => navigate('/')} className="nav-item" style={{cursor: 'pointer'}}><Icons.Dashboard /> Dashboard</a>
          <a onClick={() => navigate('/jogadores')} className="nav-item" style={{cursor: 'pointer'}}><Icons.Users /> Jogadores</a>
          <a onClick={() => navigate('/clubes')} className="nav-item" style={{cursor: 'pointer'}}><Icons.Shield /> Clubes</a>
          <a onClick={() => navigate('/competicoes')} className="nav-item" style={{cursor: 'pointer'}}><Icons.Trophy /> Competições</a>
          <a href="#" className="nav-item"><Icons.Shield /> Títulos</a>
          <div className="nav-separator"></div>
          <a href="#" className="nav-item"><Icons.Calendar /> Partidas</a>
           {/* Active Class aqui */}
          <a onClick={() => navigate('/minha-conta')} className="nav-item active" style={{ cursor: 'pointer' }}><Icons.Wallet /> Minha conta</a>
          <a href="#" className="nav-item"><Icons.Settings /> Suporte</a>
        </nav>
      </aside>

      <main className="main-content">
        
        {/* HEADER */}
        <header className="top-header compact">
          <div className="left-header">
            <button 
              className="toggle-btn menu-toggle" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Alternar Menu"
            >
              <Icons.Menu />
            </button>
            <h2 style={{ fontSize: '1.2rem', marginLeft: '10px' }}>Minha Conta</h2>
          </div>
          
          <div className="header-actions">
            
            {/* LÓGICA DO BOTÃO DE ADMIN */}
            {isAdmin && (
                <button 
                    onClick={() => navigate('/admin')}
                    style={{
                        background: 'var(--text-dark)', 
                        color: 'white', 
                        border: 'none', 
                        padding: '8px 16px', 
                        borderRadius: '6px', 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginRight: '12px'
                    }}
                >
                    <Icons.Admin /> Painel do Admin
                </button>
            )}

            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
              💡
            </button>
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

        {/* CONTEÚDO DA TELA */}
        <div className="page-content">
            
            {currentUser ? (
                <>
                    {/* Header do Perfil */}
                    <div className="profile-header">
                        <div className="profile-avatar" style={{backgroundImage: currentUser.imagem ? `url(${currentUser.imagem})` : 'none'}}>
                             {!currentUser.imagem && currentUser.nome.charAt(0)}
                        </div>
                        <div className="profile-info">
                            <span className="role-badge">{currentUser.cargo}</span>
                            <h1>{currentUser.nome}</h1>
                            <p style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{opacity: 0.7}}>Discord:</span> 
                                <span style={{fontWeight: 600, color: '#5865F2'}}>{currentUser.discord}</span>
                            </p>
                            <p style={{ fontSize: '0.85rem' }}>Membro desde: {formatDate(currentUser.criacaoConta)}</p>
                        </div>
                        
                        {/* Saldo em destaque */}
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                             <div style={{ fontSize: '0.9rem', color: 'var(--text-gray)' }}>Saldo Virtual</div>
                             <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2ecc71' }}>
                                $ {currentUser.saldoVirtual.toLocaleString('pt-BR')}
                             </div>
                        </div>
                    </div>

                    {/* Grid de Estatísticas */}
                    <h3 style={{ marginBottom: '16px', color: 'var(--text-gray)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Estatísticas</h3>
                    <div className="stats-grid">
                        <div className="stat-card-detail">
                            <div className="value">{currentUser.partidasJogadas}</div>
                            <div className="label">Partidas</div>
                        </div>
                        <div className="stat-card-detail">
                            <div className="value">{currentUser.titulos}</div>
                            <div className="label">Títulos</div>
                        </div>
                        <div className="stat-card-detail">
                            <div className="value">{currentUser.golsMarcados}</div>
                            <div className="label">Gols Marcados</div>
                        </div>
                        <div className="stat-card-detail">
                            <div className="value">{currentUser.finais}</div>
                            <div className="label">Finais</div>
                        </div>
                    </div>

                    {/* Informações Detalhadas */}
                    <div className="details-section">
                        <div className="detail-row">
                            <span className="detail-key">ID do Jogador</span>
                            <span className="detail-val" style={{fontSize: '0.8rem', fontFamily: 'monospace'}}>{currentUser.id}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-key">Status</span>
                            <span className="detail-val" style={{ color: currentUser.statusJogador === 'ATIVO' ? '#2ecc71' : 'red' }}>
                                {currentUser.statusJogador}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-key">Cartões Amarelos</span>
                            <span className="detail-val">{currentUser.cartoesAmarelos}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-key">Cartões Vermelhos</span>
                            <span className="detail-val">{currentUser.cartoesVermelhos}</span>
                        </div>
                    </div>

                    {/* Botões de Ação Solicitados */}
                    <div className="action-buttons-container">
                        <button className="action-btn">
                            <Icons.Camera /> Alterar Foto
                        </button>
                        <button className="action-btn">
                            <Icons.Edit /> Editar Perfil
                        </button>
                        <button className="action-btn">
                            <Icons.Lock /> Atualizar Email e Senha
                        </button>
                    </div>
                </>
            ) : (
                // State vazio/carregando se não tiver usuário
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-gray)' }}>
                    <h3>Faça login para ver sua conta</h3>
                    <button 
                        onClick={() => setShowLoginPopup(true)}
                        style={{
                            marginTop: '1rem',
                            padding: '10px 20px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Entrar agora
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