import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

interface MercadoDTO {
  cotacaoAtual: number;
  variacaoPercentual: number;
  tendencia: string;
  mensagem: string;
  corIndicativa: string;
}

interface ConquistaDTO {
  id: string;
  titulo: {
    id: string;
    nome: string;
    imagem: string;
  };
  nomeEdicao: string;
}

interface ClubeDTO {
  id: string;
  nome: string;
  estadio: string;
  imagem: string;
  ligaClube: string;
  sigla: string;
  corPrimaria: string;
  corSecundaria: string;
  ativo: boolean;
  estrelas: number;
  titulos: number;
  valorAvaliado: number;
  lanceMinimo: number;
  conquistas: ConquistaDTO[];
  nomeExtenso?: string;
}

interface PageResponse<T> {
  conteudo: T[];
  paginaAtual: number;
  totalPaginas: number;
  totalElementos: number;
  tamanhoPagina: number;
  ultimaPagina: boolean;
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
}

interface SortConfig {
  key: keyof ClubeDTO | null;
  direction: 'asc' | 'desc' | null;
}

const fetchMercadoStatus = async (): Promise<MercadoDTO> => {
  const response = await API.get('/torneio/mercado');
  return response.data;
};

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const formatLeagueName = (liga: string) => {
  const map: Record<string, string> = {
    'LALIGA': 'LaLiga EA Sports',
    'PREMIER_LEAGUE': 'Premier League',
    'BRASILEIRAO': 'Brasileirão',
    'SERIEA': 'Série A',
    'BUNDESLIGA': 'Bundesliga',
    'LIGUEONE': 'Ligue One',
    'ARGENTINA': 'Liga Argentina',
    'SELECAO': 'Seleção',
    'SAUDI_PRO_LEAGUE': 'Saudi Pro League',
    'OUTROS': 'Outros'
  };
  return map[liga] || liga.replace(/_/g, ' ');
};

export function TelaMercado() {
  const navigate = useNavigate();
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'clubes' | 'selecoes'>('clubes');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const { data: mercado } = useQuery<MercadoDTO>({
    queryKey: ['mercado-financeiro'],
    queryFn: fetchMercadoStatus,
    refetchInterval: 60000 
  });

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const {
    data: clubesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingClubes
  } = useInfiniteQuery<PageResponse<ClubeDTO>>({
    queryKey: ['lista-mercado', tipoVisualizacao, sortConfig.key, sortConfig.direction],
    queryFn: async ({ pageParam = 0 }) => {
      const endpoint = tipoVisualizacao === 'clubes' ? '/clube/clubes' : '/clube/selecoes';
      
      let url = `${endpoint}?page=${pageParam}&size=20`;
      
      if (sortConfig.key && sortConfig.direction) {
        url += `&sort=${sortConfig.key},${sortConfig.direction}`;
      }

      const response = await API.get(url);
      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.ultimaPagina ? undefined : lastPage.paginaAtual + 1;
    }
  });

  const flattenedAndSortedData = useMemo(() => {
    if (!clubesData) return [];
    
    const allItems = clubesData.pages.flatMap(page => page.conteudo);

    if (!sortConfig.key || !sortConfig.direction) {
      return allItems;
    }

    return [...allItems].sort((a, b) => {
      const key = sortConfig.key as keyof ClubeDTO;
      const aValue = a[key];
      const bValue = b[key];

      if (aValue === bValue) return 0;
      
      if (sortConfig.direction === 'asc') {
        return aValue! < bValue! ? -1 : 1;
      } else {
        return aValue! > bValue! ? -1 : 1;
      }
    });
  }, [clubesData, sortConfig]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return flattenedAndSortedData;
    const lowerTerm = searchTerm.toLowerCase();
    return flattenedAndSortedData.filter(clube => 
      clube.nome.toLowerCase().includes(lowerTerm) || 
      (clube.nomeExtenso && clube.nomeExtenso.toLowerCase().includes(lowerTerm))
    );
  }, [flattenedAndSortedData, searchTerm]);

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: Avatar) => {
      map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  useEffect(() => {
    const element = observerTarget.current;
    const option = { threshold: 0 };
    
    const observer = new IntersectionObserver(handleObserver, option);
    if (element) observer.observe(element);
    
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

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
    if (window.confirm("Deseja realmente sair?")) {
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

  const formatMoney = (value: number) => {
    return `D$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getCorTendencia = (cor: string) => {
    switch (cor) {
      case 'VERDE': return '#00d09c'; 
      case 'VERMELHO': return '#ff4d4d'; 
      case 'CINZA': return '#718096';
      default: return '#718096';
    }
  };

  const getIconeTendencia = (tendencia: string) => {
    switch (tendencia) {
      case 'ALTA': return <TrendingUp size={32} />;
      case 'BAIXA': return <TrendingDown size={32} />;
      default: return <Minus size={32} />;
    }
  };

  const handleSort = (key: keyof ClubeDTO) => {
    setSortConfig(current => {
      if (current.key === key) {
        if (current.direction === 'desc') return { key, direction: 'asc' };
        if (current.direction === 'asc') return { key: null, direction: null };
        return { key, direction: 'desc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <Minus size={14} style={{ opacity: 0.3 }} />;
    if (sortConfig.direction === 'asc') return <ChevronUp size={16} />;
    if (sortConfig.direction === 'desc') return <ChevronDown size={16} />;
    return <Minus size={14} style={{ opacity: 0.3 }} />;
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>

      <LoadingSpinner isLoading={loadingClubes && !clubesData} />

      <style>{`
        .page-content {
          padding: 2rem 3rem;
        }

        .market-header-card {
           background-color: var(--bg-card);
           border-radius: var(--radius);
           border: 1px solid var(--border-color);
           padding: 24px;
           margin-bottom: 24px;
           display: flex;
           flex-direction: column;
        }

        .market-tabs {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
        }

        .tab-btn {
            flex: 1;
            padding: 12px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
            background: var(--bg-card);
            color: var(--text-gray);
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s;
        }

        .tab-btn.active {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }

        .market-table-container {
            background: var(--bg-card);
            border-radius: var(--radius);
            border: 1px solid var(--border-color);
            overflow: hidden;
        }

        .market-table {
            width: 100%;
            border-collapse: collapse;
        }

        .market-table th {
            text-align: left;
            padding: 16px;
            color: var(--text-gray);
            font-size: 0.85rem;
            border-bottom: 1px solid var(--border-color);
            background: var(--hover-bg);
            cursor: pointer;
            user-select: none;
            transition: background 0.2s;
        }
        
        .market-table th:hover {
            background: var(--border-color);
            color: var(--text-dark);
        }

        .market-table td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-dark);
        }

        .clube-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .clube-img {
            width: 40px;
            height: 40px;
            object-fit: contain;
        }

        .star-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #fff8e1;
            padding: 4px 8px;
            border-radius: 12px;
            border: 1px solid #fceeb5;
            color: #b7791f;
            font-weight: 700;
        }

        .price-tag {
             display: inline-block;
             background: rgba(78, 62, 255, 0.1); 
             color: var(--primary); 
             font-weight: 700; 
             padding: 6px 12px; 
             border-radius: 8px;
             min-width: 100px;
             text-align: center;
        }
        
        .th-content {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        @media (max-width: 768px) {
          .page-content { padding: 1rem; }
          .market-table th, .market-table td { padding: 10px; font-size: 0.9rem; }
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
          <a onClick={() => navigate('/competicoes')} className="nav-item" style={{cursor: 'pointer'}}>
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
                placeholder="Buscar no mercado..." 
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
            <div style={{ marginBottom: '1rem' }}>
               <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Mercado da Bola</h2>
               <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Acompanhe a cotação e valorize seu clube</p>
            </div>

            {mercado && (
                <div className="market-header-card" style={{ borderLeft: `5px solid ${getCorTendencia(mercado.corIndicativa)}` }}>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ 
                                padding: '12px', 
                                borderRadius: '50%', 
                                backgroundColor: `${getCorTendencia(mercado.corIndicativa)}20`,
                                color: getCorTendencia(mercado.corIndicativa)
                            }}>
                                {getIconeTendencia(mercado.tendencia)}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                                D$ {mercado.cotacaoAtual.toFixed(2)}
                                </h2>
                                <span style={{ 
                                    fontSize: '0.9rem', 
                                    fontWeight: 700, 
                                    color: getCorTendencia(mercado.corIndicativa) 
                                }}>
                                {mercado.variacaoPercentual > 0 ? '+' : ''}{mercado.variacaoPercentual}% ({mercado.tendencia})
                                </span>
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '300px', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-gray)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Boletim Diário
                            </h4>
                            <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-dark)', fontWeight: 500 }}>
                                {mercado.mensagem}
                            </p>
                        </div>
                   </div>
                </div>
            )}

            <div className="market-tabs">
                <button 
                    className={`tab-btn ${tipoVisualizacao === 'clubes' ? 'active' : ''}`}
                    onClick={() => {
                        setTipoVisualizacao('clubes');
                        setSortConfig({ key: null, direction: null });
                    }}
                >
                    <Shield size={18} />
                    Clubes
                </button>
                <button 
                    className={`tab-btn ${tipoVisualizacao === 'selecoes' ? 'active' : ''}`}
                    onClick={() => {
                        setTipoVisualizacao('selecoes');
                        setSortConfig({ key: null, direction: null });
                    }}
                >
                    <Globe size={18} />
                    Seleções
                </button>
            </div>

            <div className="market-table-container">
                <table className="market-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('nome')}>
                                <div className="th-content">
                                    CLUBE {renderSortIcon('nome')}
                                </div>
                            </th>
                            <th onClick={() => handleSort('estrelas')} style={{ textAlign: 'center' }}>
                                <div className="th-content" style={{ justifyContent: 'center' }}>
                                    ESTRELAS {renderSortIcon('estrelas')}
                                </div>
                            </th>
                            <th onClick={() => handleSort('valorAvaliado')} style={{ textAlign: 'right' }}>
                                <div className="th-content" style={{ justifyContent: 'flex-end' }}>
                                    VALOR DE MERCADO {renderSortIcon('valorAvaliado')}
                                </div>
                            </th>
                            <th onClick={() => handleSort('lanceMinimo')} style={{ textAlign: 'right' }}>
                                <div className="th-content" style={{ justifyContent: 'flex-end' }}>
                                    LANCE MÍNIMO {renderSortIcon('lanceMinimo')}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((clube) => (
                            <tr key={clube.id}>
                                <td>
                                    <div className="clube-info">
                                        <img src={clube.imagem} alt={clube.nome} className="clube-img" />
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{clube.nome}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                                                {formatLeagueName(clube.ligaClube)}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <div className="star-badge">
                                        <span>{clube.estrelas.toFixed(1)}</span>
                                        <Star size={12} fill="#b7791f" />
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700 }}>
                                        {formatMoney(clube.valorAvaliado)}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className="price-tag">
                                        {formatMoney(clube.lanceMinimo)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && !loadingClubes && (
                             <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>
                                    Nenhum clube encontrado
                                </td>
                             </tr>
                        )}
                    </tbody>
                </table>
                
                <div ref={observerTarget} style={{ height: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {isFetchingNextPage && <LoadingSpinner isLoading={true} />}
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
    </div>
  );
}