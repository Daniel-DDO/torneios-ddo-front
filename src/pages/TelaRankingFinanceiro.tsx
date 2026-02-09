import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { 
  Menu, 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Shield,  
  Wallet, 
  Settings, 
  Search, 
  Bell, 
  Gamepad2, 
  Star,
  Lightbulb,
  CalendarSync,
  ChevronLeft,
  ChevronRight,
  Medal,
  Crown
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupNotificacao from '../components/PopupNotificacao';

interface JogadorRanking {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  cargo: string;
  saldo: number;
}

interface PageableResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
}

interface UserData {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  cargo: 'PROPRIETARIO' | 'DIRETOR' | 'ADMINISTRADOR' | 'JOGADOR';
  saldoVirtual: number;
  finais?: number;
  titulos?: number;
  golsMarcados?: number;
  partidasJogadas?: number;
}

interface Notificacao {
  id: string;
  lida: boolean;
}

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const fetchMinhasNotificacoesService = async () => {
  const response = await API.get('/api/notificacoes/minhas');
  return response.data || [];
};

const fetchRankingFinanceiroService = async (page: number): Promise<PageableResponse<JogadorRanking>> => {
  const response = await API.get('/jogador/ranking-financeiro', {
    params: {
      page,
      size: 20
    }
  });
  return response.data;
};

export function TelaRankingFinanceiro() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotificacaoPopup, setShowNotificacaoPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [page, setPage] = useState(0);

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const { data: notificacoes = [] } = useQuery<Notificacao[]>({
    queryKey: ['notificacoesMinhas'],
    queryFn: fetchMinhasNotificacoesService,
    enabled: !!currentUser,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 5 
  });

  const { data: rankingPage, isLoading: isLoadingRanking } = useQuery<PageableResponse<JogadorRanking>>({
    queryKey: ['rankingFinanceiro', page],
    queryFn: () => fetchRankingFinanceiroService(page),
    placeholderData: keepPreviousData 
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    avatars.forEach((avatar: any) => {
        map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

  const temNotificacaoNaoLida = useMemo(() => {
    return notificacoes.some(n => !n.lida);
  }, [notificacoes]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize(); 

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoginSuccess = (userData: any) => {
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

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    return `D$ ${formatted}`;
  };

  const getPosicaoIcon = (index: number, pageNum: number) => {
    const globalIndex = index + (pageNum * 20);
    if (globalIndex === 0) return <Crown size={20} color="#FFD700" fill="#FFD700" />;
    if (globalIndex === 1) return <Medal size={20} color="#C0C0C0" fill="#C0C0C0" />;
    if (globalIndex === 2) return <Medal size={20} color="#CD7F32" fill="#CD7F32" />;
    return <span style={{ fontWeight: 'bold', color: 'var(--text-gray)', width: '20px', textAlign: 'center' }}>{globalIndex + 1}º</span>;
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={{zIndex: 100}}>
        <div className="logo-area">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
               <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/>
            </svg>
          </div>
          <span className="logo-text">Torneios <span>DDO</span></span>
        </div>

        <nav className="nav-menu">
          <a onClick={() => handleNavigate('/')} className="nav-item" style={{cursor: 'pointer'}}>
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a onClick={() => handleNavigate('/jogadores')} className="nav-item active" style={{cursor: 'pointer'}}>
            <Users size={20} /> Jogadores
          </a>
          <a onClick={() => handleNavigate('/clubes')} className="nav-item" style={{cursor: 'pointer'}}>
            <Shield size={20} /> Clubes
          </a>
          <a onClick={() => handleNavigate('/competicoes')} className="nav-item" style={{cursor: 'pointer'}}>
            <Trophy size={20} /> Competições
          </a>
          <a onClick={() => handleNavigate('/titulos')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Star size={20} /> Títulos
          </a>
          <a onClick={() => handleNavigate('/temporadas')} className="nav-item" style={{cursor: 'pointer'}}>
            <CalendarSync size={20} /> Temporadas
          </a>
          <div className="nav-separator"></div>
          <a onClick={() => handleNavigate('/partidas')} className="nav-item" style={{cursor: 'pointer'}}>
            <Gamepad2 size={20} /> Partidas
          </a>
           <a onClick={() => handleNavigate('/minha-conta')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Wallet size={20} /> Minha conta
          </a>
          <a onClick={() => handleNavigate('/suporte')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Settings size={20} /> Suporte
          </a>
        </nav>
      </aside>

      {isMobile && sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="main-content" style={{ overflowX: 'hidden' }}>
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
                placeholder="Buscar..." 
                disabled
              />
            </div>
          </div>
          
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
              <Lightbulb size={20} />
            </button>
            <button 
              className="icon-btn" 
              onClick={() => setShowNotificacaoPopup(true)}
              style={{ position: 'relative' }}
            >
                <Bell size={20} />
                {currentUser && temNotificacaoNaoLida && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#ff4757',
                    borderRadius: '50%',
                    border: '1px solid var(--header-bg, #fff)'
                  }}></span>
                )}
            </button>
            
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
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
              </div>
            )}
          </div>
        </header>

        <div className="page-content" style={{ animation: 'fadeInUp 0.6s ease-out', paddingBottom: '40px' }}>
          
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                    onClick={() => navigate('/jogadores')}
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        color: 'var(--text-dark)'
                    }}
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Ranking Financeiro</h1>
                    <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginTop: '4px' }}>Os magnatas do DDO</p>
                </div>
            </div>
          </div>

          <div className="tp-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
                            <th style={{ padding: '16px', textAlign: 'center', width: '60px' }}>#</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: '600' }}>JOGADOR</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: '600' }}>CARGO</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: '600' }}>SALDO VIRTUAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingRanking ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td colSpan={4} style={{ padding: '20px' }}>
                                        <div className="tp-hero-skeleton" style={{ height: '30px', width: '100%' }}></div>
                                    </td>
                                </tr>
                            ))
                        ) : rankingPage?.content.map((jogador, index) => (
                            <tr 
                                key={jogador.id} 
                                style={{ 
                                    borderBottom: '1px solid var(--border-color)',
                                    background: currentUser?.id === jogador.id ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        {getPosicaoIcon(index, rankingPage.pageable.pageNumber)}
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div 
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--primary)',
                                                backgroundImage: jogador.imagem ? `url(${avatarMap[jogador.imagem] || jogador.imagem})` : 'none',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                flexShrink: 0,
                                                border: currentUser?.id === jogador.id ? '2px solid var(--primary)' : 'none'
                                            }}
                                        >
                                            {!jogador.imagem && jogador.nome.charAt(0)}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ 
                                                fontWeight: '600', 
                                                color: 'var(--text-dark)',
                                                fontSize: '0.95rem'
                                            }}>
                                                {jogador.nome}
                                            </span>
                                            <span style={{ 
                                                fontSize: '0.8rem', 
                                                color: 'var(--text-gray)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <span style={{ opacity: 0.7 }}>#</span> {jogador.discord}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        background: 'rgba(0,0,0,0.05)',
                                        color: 'var(--text-gray)',
                                        textTransform: 'uppercase'
                                    }}>
                                        {jogador.cargo.replace('_', ' ')}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <span style={{ 
                                        fontWeight: '700', 
                                        color: '#10b981',
                                        fontSize: '1rem'
                                    }}>
                                        {formatCurrency(jogador.saldo)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {rankingPage && rankingPage.totalPages > 1 && (
                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)', marginRight: '10px' }}>
                        Página {(rankingPage.pageable.pageNumber || 0) + 1} de {rankingPage.totalPages}
                    </span>
                    <button 
                        disabled={rankingPage.first}
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: rankingPage.first ? 'rgba(0,0,0,0.05)' : 'var(--card-bg)',
                            color: rankingPage.first ? 'var(--text-gray)' : 'var(--text-dark)',
                            cursor: rankingPage.first ? 'default' : 'pointer'
                        }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button 
                        disabled={rankingPage.last}
                        onClick={() => setPage(p => p + 1)}
                        style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: rankingPage.last ? 'rgba(0,0,0,0.05)' : 'var(--card-bg)',
                            color: rankingPage.last ? 'var(--text-gray)' : 'var(--text-dark)',
                            cursor: rankingPage.last ? 'default' : 'pointer'
                        }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
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
            imagem: getCurrentUserAvatar(),
            finais: currentUser.finais || 0,
            titulos: currentUser.titulos || 0,
            golsMarcados: currentUser.golsMarcados || 0,
            partidasJogadas: currentUser.partidasJogadas || 0
          }}
          onClose={() => setShowUserPopup(false)}
          onLogout={handleLogout}
        />
      )}

      {showNotificacaoPopup && (
        <PopupNotificacao 
          onClose={() => setShowNotificacaoPopup(false)}
        />
      )}
    </div>
  );
}