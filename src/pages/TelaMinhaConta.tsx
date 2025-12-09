import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';

interface PlayerData {
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

interface UserSession {
    token: string;
    jogador: PlayerData;
}

const Icons = {
    Menu: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
    Dashboard: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
    Users: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    Trophy: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17"></path><path d="M14 14.66V17"></path><path d="M12 2v1"></path><path d="M12 22v-3"></path><path d="M12 2a7 7 0 0 0-7 7c0 4.3 4 8 8 9a7 7 0 0 0 7-9 7 7 0 0 0-7-7z"></path></svg>,
    Shield: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
    Calendar: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
    Wallet: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
    Settings: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    Search: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
    Bell: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
    Edit: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
    Lock: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
    Key: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
};

export function TelaMinhaConta() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
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
        const loadUserData = async () => {
            setLoading(true);
            const storedUser = localStorage.getItem('user_data');
            if (storedUser) {
                try {
                    const parsedData = JSON.parse(storedUser);
                    const sessionData: UserSession = parsedData.token && parsedData.jogador
                        ? parsedData
                        : { token: '', jogador: parsedData as PlayerData }; 

                    setCurrentUser(sessionData);
                } catch (error) {
                    console.error("Erro ao carregar dados do usuário no localStorage", error);
                    localStorage.removeItem('user_data');
                }
            }
            setLoading(false);
        };
        loadUserData();
    }, []);

    const handleLoginSuccess = (userData: any) => {
        const sessionData: UserSession = userData.token && userData.jogador ? userData : {
            token: userData.token || 'simulated_token',
            jogador: userData.jogador || userData as PlayerData
        };

        setCurrentUser(sessionData);
        localStorage.setItem('user_data', JSON.stringify(sessionData));
        setShowLoginPopup(false);
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

    const jogador = currentUser?.jogador;

    return (
        <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
            <LoadingSpinner isLoading={loading} />

            <style>{`
                .page-content {
                    padding: 2rem 3rem;
                }

                .profile-main-container {
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .profile-card-large {
                    background-color: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius);
                    padding: 32px;
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    gap: 32px;
                    position: relative;
                    box-shadow: var(--shadow-sm);
                    transition: all 0.3s ease;
                }

                .profile-left {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    border-right: 1px solid var(--border-color);
                    padding-right: 32px;
                }

                .avatar-wrapper {
                    position: relative;
                    width: 160px;
                    height: 160px;
                    min-width: 160px;
                    min-height: 160px;
                    border-radius: 50%;
                    border: 4px solid var(--bg-body);
                    box-shadow: var(--shadow-md);
                    margin-bottom: 20px;
                    cursor: pointer;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    z-index: 1;
                }

                .avatar-wrapper:hover {
                    transform: scale(1.05);
                    border-color: var(--primary);
                    box-shadow: 0 10px 20px rgba(78, 62, 255, 0.2);
                }

                .avatar-image {
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                    background-color: var(--primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 4rem;
                    color: white;
                    font-weight: 700;
                    border-radius: 50%;
                }

                .avatar-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 0.9rem;
                    font-weight: 600;
                    opacity: 0;
                    transition: all 0.3s ease;
                    text-align: center;
                    padding: 10px;
                    backdrop-filter: blur(3px);
                    border-radius: 50%;
                }

                .avatar-wrapper:hover .avatar-overlay {
                    opacity: 1;
                }

                .profile-right {
                    display: flex;
                    flex-direction: column;
                }

                .user-header-info {
                    margin-bottom: 24px;
                }

                .user-name {
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--text-dark);
                    margin-bottom: 4px;
                }

                .user-discord {
                    color: var(--primary);
                    background: rgba(78, 62, 255, 0.1);
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    display: inline-block;
                    transition: all 0.2s ease;
                }
                
                .user-discord:hover {
                    background: var(--primary);
                    color: white;
                    transform: translateY(-2px);
                }

                .user-bio {
                    margin-top: 16px;
                    color: var(--text-gray);
                    line-height: 1.6;
                    font-size: 1rem;
                }

                .wallet-display-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: linear-gradient(135deg, var(--bg-body), var(--hover-bg));
                    padding: 24px 28px;
                    border-radius: 20px;
                    margin-bottom: 32px;
                    border: 1px solid var(--border-color);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: default;
                    position: relative;
                    overflow: hidden;
                }

                .wallet-display-row::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 4px;
                    height: 100%;
                    background: var(--success);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .wallet-display-row:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 30px rgba(0, 208, 156, 0.15);
                    border-color: rgba(0, 208, 156, 0.3);
                    background: linear-gradient(135deg, var(--bg-card), rgba(0, 208, 156, 0.05));
                }

                .wallet-display-row:hover::before {
                    opacity: 1;
                }

                .wallet-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .wallet-label {
                    font-size: 0.9rem;
                    color: var(--text-gray);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .wallet-amount {
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--success);
                    letter-spacing: -0.5px;
                }

                .wallet-icon-box {
                    width: 56px;
                    height: 56px;
                    background: rgba(0, 208, 156, 0.1);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--success);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .wallet-display-row:hover .wallet-icon-box {
                    background: var(--success);
                    color: white;
                    transform: scale(1.1) rotate(15deg);
                    box-shadow: 0 4px 15px rgba(0, 208, 156, 0.4);
                }

                .stats-grid-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .stat-box-large {
                    background: var(--bg-body);
                    padding: 24px 16px;
                    border-radius: 16px;
                    text-align: center;
                    border: 1px solid var(--border-color);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: default;
                    position: relative;
                    overflow: hidden;
                }

                .stat-box-large::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background: var(--primary);
                    transform: scaleX(0);
                    transition: transform 0.3s ease;
                }

                .stat-box-large:hover {
                    transform: translateY(-8px);
                    border-color: rgba(78, 62, 255, 0.3);
                    box-shadow: 0 12px 25px rgba(0,0,0,0.08);
                    background: var(--bg-card);
                }

                .stat-box-large:hover::after {
                    transform: scaleX(1);
                }

                .stat-val-lg { 
                    font-size: 1.8rem; 
                    font-weight: 800; 
                    color: var(--text-dark); 
                    transition: color 0.3s ease;
                    line-height: 1;
                    margin-bottom: 8px;
                }
                
                .stat-box-large:hover .stat-val-lg {
                    color: var(--primary);
                    transform: scale(1.1);
                }

                .stat-lbl-lg { 
                    font-size: 0.75rem; 
                    color: var(--text-gray); 
                    text-transform: uppercase; 
                    font-weight: 700;
                    letter-spacing: 0.8px;
                }

                .buttons-container {
                    display: flex;
                    gap: 16px;
                    margin-top: auto;
                }

                .btn-action {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 28px;
                    border-radius: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 0.95rem;
                    border: 1px solid transparent;
                }

                .btn-primary {
                    background: var(--primary);
                    color: white;
                    box-shadow: 0 4px 12px rgba(78, 62, 255, 0.25);
                }
                
                .btn-primary:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(78, 62, 255, 0.4);
                    background: var(--primary-light);
                }

                .btn-outline {
                    background: transparent;
                    border-color: var(--border-color);
                    color: var(--text-dark);
                }
                
                .btn-outline:hover {
                    border-color: var(--text-gray);
                    background: var(--hover-bg);
                    transform: translateY(-3px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }

                @media (max-width: 900px) {
                    .profile-card-large { grid-template-columns: 1fr; padding: 24px; }
                    .profile-left { border-right: none; border-bottom: 1px solid var(--border-color); padding-right: 0; padding-bottom: 24px; }
                    .stats-grid-row { grid-template-columns: 1fr 1fr; }
                    .buttons-container { flex-direction: column; }
                    .btn-action { justify-content: center; }
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
                    <a onClick={() => navigate('/')} className="nav-item" style={{cursor: 'pointer'}}><Icons.Dashboard /> Dashboard</a>
                    <a onClick={() => navigate('/jogadores')} className="nav-item" style={{cursor: 'pointer'}}><Icons.Users /> Jogadores</a>
                    <a onClick={() => navigate('/clubes')} className="nav-item" style={{cursor: 'pointer'}}><Icons.Shield /> Clubes</a>
                    <a onClick={() => navigate('/competicoes')} className="nav-item" style={{cursor: 'pointer'}}><Icons.Trophy /> Competições</a>
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
                        <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
                            💡
                        </button>
                        <button className="icon-btn"><Icons.Bell /></button>
                        
                        {jogador ? (
                            <div 
                                className="user-avatar-mini" 
                                onClick={() => setShowUserPopup(true)}
                                style={{
                                    backgroundImage: jogador.imagem ? `url(${jogador.imagem})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundColor: jogador.imagem ? 'transparent' : 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    borderRadius: '50%'
                                }}
                            >
                                {!jogador.imagem && jogador.nome.charAt(0)}
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
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Minha Conta</h2>
                        <p style={{ color: 'var(--text-gray)', fontSize: '0.95rem' }}>Gerencie suas informações pessoais e visualize seu desempenho</p>
                    </div>

                    {jogador ? (
                        <div className="profile-main-container">
                            <div className="profile-card-large">
                                
                                <div className="profile-left">
                                    <div className="avatar-wrapper">
                                        {jogador.imagem ? (
                                            <div className="avatar-image" style={{backgroundImage: `url(${jogador.imagem})`}}></div>
                                        ) : (
                                            <div className="avatar-image">{jogador.nome.charAt(0)}</div>
                                        )}
                                        <div className="avatar-overlay">
                                            <Icons.Edit />
                                            <span style={{marginTop: '6px'}}>Editar Imagem</span>
                                        </div>
                                    </div>
                                    
                                    <div className="user-discord">@{jogador.discord}</div>
                                    <div style={{
                                        marginTop: '16px', 
                                        fontWeight: '800', 
                                        color: 'var(--text-gray)', 
                                        fontSize: '0.85rem', 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '1.5px',
                                        border: '1px solid var(--border-color)',
                                        padding: '4px 12px',
                                        borderRadius: '8px'
                                    }}>
                                        {jogador.cargo}
                                    </div>
                                </div>

                                <div className="profile-right">
                                    <div className="user-header-info">
                                        <h1 className="user-name">{jogador.nome}</h1>
                                        {jogador.descricao ? (
                                            <p className="user-bio">{jogador.descricao}</p>
                                        ) : (
                                            <p className="user-bio" style={{fontStyle: 'italic', opacity: 0.6}}>Nenhuma descrição definida para o perfil.</p>
                                        )}
                                    </div>

                                    <div className="wallet-display-row">
                                        <div className="wallet-info">
                                            <div className="wallet-label">Saldo Virtual Disponível</div>
                                            <div className="wallet-amount">
                                                D$ {jogador.saldoVirtual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                            </div>
                                        </div>
                                        <div className="wallet-icon-box">
                                            <Icons.Wallet />
                                        </div>
                                    </div>

                                    <div className="stats-grid-row">
                                        <div className="stat-box-large">
                                            <div className="stat-val-lg">{jogador.partidasJogadas}</div>
                                            <div className="stat-lbl-lg">Partidas</div>
                                        </div>
                                        <div className="stat-box-large">
                                            <div className="stat-val-lg">{jogador.golsMarcados}</div>
                                            <div className="stat-lbl-lg">Gols</div>
                                        </div>
                                        <div className="stat-box-large">
                                            <div className="stat-val-lg">{jogador.titulos}</div>
                                            <div className="stat-lbl-lg">Títulos</div>
                                        </div>
                                        <div className="stat-box-large">
                                            <div className="stat-val-lg">{jogador.finais}</div>
                                            <div className="stat-lbl-lg">Finais</div>
                                        </div>
                                    </div>

                                    <div className="buttons-container">
                                        <button className="btn-action btn-primary">
                                            <Icons.Edit /> Editar minha conta
                                        </button>
                                        <button className="btn-action btn-outline">
                                            <Icons.Key /> Atualizar email/senha
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ) : (
                        <div style={{textAlign: 'center', padding: '4rem', color: 'var(--text-gray)'}}>
                            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🔒</div>
                            <h3>Acesso Restrito</h3>
                            <p>Faça login para visualizar seu perfil completo.</p>
                            <button 
                                onClick={() => setShowLoginPopup(true)}
                                className="btn-action btn-primary"
                                style={{margin: '20px auto'}}
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
                    user={currentUser.jogador}
                    onClose={() => setShowUserPopup(false)}
                    onLogout={handleLogout}
                />
            )}
        </div>
    );
}