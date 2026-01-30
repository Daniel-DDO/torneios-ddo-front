import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Menu, 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Shield, 
  Wallet, 
  Search, 
  Bell, 
  Gamepad2, 
  Star,
  Lightbulb,
  Settings,
  CalendarSync,
  ArrowLeft,
  Gavel,
  Clock,
  Plus,
  AlertCircle
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupCriarLeilao from '../components/PopupCriarLeilao';
import LoadingSpinner from '../components/LoadingSpinner';

interface Leilao {
  id: string;
  descricao: string;
  temporadaId: string;
  dataInicio: string;
  dataFim: string;
  ativo: boolean;
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
  nome?: string;
}

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const fetchLeiloesPorTemporadaService = async (temporadaId: string) => {
  const response = await API.get(`/api/leiloes/temporada/${temporadaId}`);
  return response.data;
};

export function TelaLeilao() {
  const navigate = useNavigate();
  const { temporadaId } = useParams();
  const queryClient = useQueryClient();
  const observerTarget = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: avatars = [] } = useQuery<Avatar[]>({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const { data: leiloes = [], isLoading: isLoadingLeiloes } = useQuery<Leilao[]>({
    queryKey: ['leiloes', temporadaId],
    queryFn: () => fetchLeiloesPorTemporadaService(temporadaId || ''),
    enabled: !!temporadaId,
  });

  const activeLeilao = useMemo(() => {
    return leiloes.find(l => l.ativo);
  }, [leiloes]);

  const {
    data: clubesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery<PageResponse<ClubeDTO>>({
    queryKey: ['clubes-leilao', activeLeilao?.id],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await API.get(`/clube/clubes?page=${pageParam}&size=20&sort=valorAvaliado,desc`);
      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.ultimaPagina ? undefined : lastPage.paginaAtual + 1;
    },
    enabled: !!activeLeilao
  });

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
  }, [handleObserver, activeLeilao]);

  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showCriarLeilaoPopup, setShowCriarLeilaoPopup] = useState(false);
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

  const handleCriarLeilaoSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ['leiloes', temporadaId] });
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMoney = (value: number) => {
    return `D$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const isProprietario = currentUser && currentUser.cargo === 'PROPRIETARIO';

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      <style>{`
        .page-content {
          padding: 2rem 3rem;
        }

        .table-container {
          background-color: var(--bg-card);
          border-radius: var(--radius);
          border: 1px solid var(--border-color);
          overflow: hidden;
          margin-top: 24px;
          box-shadow: var(--shadow-sm);
        }

        .custom-table {
          width: 100%;
          border-collapse: collapse;
        }

        .custom-table th, .custom-table td {
          padding: 16px 24px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }

        .custom-table th {
          background-color: var(--hover-bg);
          color: var(--text-gray);
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
        }

        .custom-table td {
          color: var(--text-dark);
          font-size: 1rem;
        }

        .custom-table tbody tr {
          transition: background-color 0.2s;
          cursor: pointer;
        }

        .custom-table tbody tr:hover {
          background-color: var(--hover-bg);
        }

        .custom-table tr:last-child td {
          border-bottom: none;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .status-ativo {
          background-color: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .status-encerrado {
          background-color: var(--border-color);
          color: var(--text-gray);
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

        .leilao-header {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 24px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-left: 5px solid #10b981;
        }

        .leilao-timer {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-dark);
        }

        @media (max-width: 768px) {
          .page-content { padding: 1rem; }
          .custom-table th, .custom-table td { padding: 12px; }
          .leilao-header { flex-direction: column; gap: 16px; align-items: flex-start; }
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
          <a onClick={() => navigate('/temporadas')} className="nav-item active" style={{cursor: 'pointer'}}>
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
                placeholder={activeLeilao ? "Buscar clube..." : "Buscar leilão..."} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
              <Lightbulb size={20} />
            </button>
            <button className="icon-btn"><Bell size={20} /></button>
            
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
            <button onClick={() => navigate(`/${temporadaId}/torneios`)} className="back-button">
                <ArrowLeft size={16} /> Voltar para Torneios
            </button>

            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Leilão</h2>
                  <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Dispute os melhores clubes para a temporada</p>
              </div>

              {isProprietario && (
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="t-btn" 
                      onClick={() => setShowCriarLeilaoPopup(true)}
                      style={{background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px'}}
                    >
                        <Plus size={18} /> Iniciar Leilão
                    </button>
                </div>
              )}
            </div>

            {isLoadingLeiloes ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>Carregando dados...</div>
            ) : activeLeilao ? (
                <>
                    <div className="leilao-header">
                        <div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px 0' }}>
                                Leilão Aberto: {activeLeilao.descricao}
                            </h3>
                            <div className="leilao-timer">
                                <Clock size={20} color="#10b981" />
                                <span>Encerra em: {formatDate(activeLeilao.dataFim)}</span>
                            </div>
                        </div>
                        <div>
                            <span className="status-badge status-ativo" style={{ fontSize: '1rem', padding: '8px 16px' }}>EM ANDAMENTO</span>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="custom-table">
                        <thead>
                            <tr>
                            <th>Clube</th>
                            <th style={{ textAlign: 'center' }}>Estrelas</th>
                            <th style={{ textAlign: 'right' }}>Valor Avaliado</th>
                            <th style={{ textAlign: 'right' }}>Lance Mínimo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clubesData?.pages.map((page) => (
                                page.conteudo
                                    .filter(clube => clube.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((clube) => (
                                    <tr key={clube.id}>
                                        <td>
                                            <div className="clube-info">
                                                <img src={clube.imagem} alt={clube.nome} className="clube-img" />
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{clube.nome}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{clube.ligaClube.replace('_', ' ')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="star-badge" style={{ justifyContent: 'center' }}>
                                                <span>{clube.estrelas.toFixed(1)}</span>
                                                <Star size={12} fill="#b7791f" />
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, color: 'var(--text-gray)' }}>
                                                {formatMoney(clube.valorAvaliado)}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="price-tag">
                                                {formatMoney(clube.lanceMinimo)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ))}
                        </tbody>
                        </table>
                        <div ref={observerTarget} style={{ height: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {isFetchingNextPage && <LoadingSpinner isLoading={true} />}
                        </div>
                    </div>
                </>
            ) : (
                <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Histórico de Leilões</th>
                          <th>Início</th>
                          <th>Fim</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leiloes.map((leilao) => (
                            <tr key={leilao.id}>
                              <td>
                                <div className="clube-info">
                                    <Gavel size={20} color="var(--primary)" />
                                    <span>{leilao.descricao}</span>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                    <Clock size={14} /> {formatDate(leilao.dataInicio)}
                                </div>
                              </td>
                              <td>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                    <Clock size={14} /> {formatDate(leilao.dataFim)}
                                </div>
                              </td>
                              <td>
                                 {leilao.ativo ? (
                                    <span className="status-badge status-ativo">Aberto</span>
                                 ) : (
                                    <span className="status-badge status-encerrado">Encerrado</span>
                                 )}
                              </td>
                            </tr>
                          ))}
                        {leiloes.length === 0 && (
                          <tr>
                              <td colSpan={4} style={{textAlign: 'center', padding: '50px', color: 'var(--text-secondary)'}}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                      <AlertCircle size={48} color="var(--border-color)" />
                                      <div>
                                          <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Nenhum leilão ativo</h3>
                                          <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>Aguarde o início da próxima janela de transferências.</p>
                                      </div>
                                  </div>
                              </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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

      {showCriarLeilaoPopup && (
        <PopupCriarLeilao 
          onClose={() => setShowCriarLeilaoPopup(false)}
          onSubmit={handleCriarLeilaoSubmit}
        />
      )}
    </div>
  );
}