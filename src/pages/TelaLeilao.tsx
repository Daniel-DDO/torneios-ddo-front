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
  Gavel,
  Clock,
  Plus,
  Activity,
  TrendingUp,
  Timer,
  ArrowRight,
  AlertCircle,
  ChevronLeft
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

interface FeedItemDTO {
  idJogador: string;
  nomeJogador: string;
  idClube: string;
  nomeClube: string;
  imagemClube: string;
  valor: number;
  dataHora: string;
}

interface ClubeDisputadoDTO {
  idClube: string;
  nomeClube: string;
  imagemClube: string;
  totalLances: number;
  maiorLanceAtual: number;
}

interface StatusLanceJogadorDTO {
  prioridade: number;
  nomeClube: string;
  valorOfertado: number;
  status: string;
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

const fetchLeilaoFeed = async (leilaoId: string) => {
  const response = await API.get(`/api/leiloes/${leilaoId}/feed`);
  return response.data;
};

const fetchMaisDisputados = async (leilaoId: string) => {
  const response = await API.get(`/api/leiloes/${leilaoId}/mais-disputados`);
  return response.data;
};

const fetchMeuStatus = async (leilaoId: string) => {
  const response = await API.get(`/api/leiloes/${leilaoId}/meu-status`);
  return response.data;
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

export function TelaLeilao() {
  const navigate = useNavigate();
  const { temporadaId } = useParams();
  const queryClient = useQueryClient();
  const observerTarget = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showCriarLeilaoPopup, setShowCriarLeilaoPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

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
    const listaLeiloes = Array.isArray(leiloes) ? leiloes : [];
    return listaLeiloes.find(l => l.ativo);
  }, [leiloes]);

  useEffect(() => {
    if (!activeLeilao) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(activeLeilao.dataFim.endsWith('Z') ? activeLeilao.dataFim : `${activeLeilao.dataFim}Z`);
      const difference = end.getTime() - now.getTime();

      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)));
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
        setIsExpired(false);
      } else {
        setTimeLeft('Encerrado');
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [activeLeilao]);

  const { data: feedData = [] } = useQuery<FeedItemDTO[]>({
    queryKey: ['leilao-feed', activeLeilao?.id],
    queryFn: () => fetchLeilaoFeed(activeLeilao!.id),
    enabled: !!activeLeilao?.id,
    refetchInterval: 5000 
  });

  const { data: maisDisputados = [] } = useQuery<ClubeDisputadoDTO[]>({
    queryKey: ['leilao-disputados', activeLeilao?.id],
    queryFn: () => fetchMaisDisputados(activeLeilao!.id),
    enabled: !!activeLeilao?.id,
    refetchInterval: 10000
  });

  const { data: meuStatus = [] } = useQuery<StatusLanceJogadorDTO[]>({
    queryKey: ['meu-status', activeLeilao?.id],
    queryFn: () => fetchMeuStatus(activeLeilao!.id),
    enabled: !!activeLeilao?.id && !!currentUser,
    refetchInterval: 5000
  });

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
    const observer = new IntersectionObserver(handleObserver, { threshold: 0 });
    if (element) observer.observe(element);
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver, activeLeilao]);

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

  const formatDataHoraBrasilia = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString.endsWith('Z') ? dateString : `${dateString}Z`);
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const formatMoney = (value: number) => {
    return `D$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const isProprietario = currentUser && currentUser.cargo === 'PROPRIETARIO';

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      <style>{`
        .leilao-hero-banner {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 24px 32px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: var(--shadow-sm);
            position: relative;
            overflow: hidden;
        }

        .leilao-hero-banner::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 5px;
            background: var(--primary);
        }

        .timer-display {
            font-family: 'Inter', monospace;
            font-size: 2.2rem;
            font-weight: 800;
            color: var(--primary);
            line-height: 1.2;
            margin: 4px 0;
        }

        .brasilia-time {
            font-size: 0.75rem;
            color: var(--text-gray);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .panels-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 24px;
        }

        .panel-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            height: 360px;
            box-shadow: var(--shadow-sm);
        }

        .panel-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border-color);
        }

        .panel-title {
            font-size: 1rem;
            font-weight: 700;
            color: var(--text-dark);
        }

        .scroll-list {
            flex: 1;
            overflow-y: auto;
            padding-right: 6px;
        }

        .list-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px;
            border-radius: 10px;
            transition: background 0.2s;
            margin-bottom: 6px;
            border: 1px solid transparent;
        }

        .list-item:hover {
            background: var(--hover-bg);
            border-color: var(--border-color);
        }

        .list-item.clickable {
            cursor: pointer;
        }

        .mini-img {
            width: 32px;
            height: 32px;
            object-fit: contain;
            border-radius: 4px;
        }

        .avatar-circle {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--hover-bg);
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.8rem;
            border: 1px solid var(--border-color);
        }

        .status-tag {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
        }

        .status-ganhando { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .status-anulado { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .status-perdendo { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

        .table-container {
            background: var(--bg-card);
            border-radius: 16px;
            border: 1px solid var(--border-color);
            overflow: hidden;
            box-shadow: var(--shadow-sm);
        }

        .custom-table {
            width: 100%;
            border-collapse: collapse;
        }

        .custom-table th {
            text-align: left;
            padding: 14px 20px;
            background: var(--hover-bg);
            color: var(--text-gray);
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            border-bottom: 1px solid var(--border-color);
        }

        .custom-table td {
            padding: 14px 20px;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-dark);
            vertical-align: middle;
        }

        .custom-table tr:last-child td {
            border-bottom: none;
        }

        .custom-table tr:hover {
            background: var(--hover-bg);
        }

        .clube-row-img {
            width: 40px;
            height: 40px;
            object-fit: contain;
            margin-right: 12px;
        }

        .btn-primary-custom {
            background: var(--primary);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: opacity 0.2s;
        }

        .btn-primary-custom:hover {
            opacity: 0.9;
        }

        .btn-primary-custom:disabled {
            background: var(--text-gray);
            cursor: not-allowed;
            opacity: 0.7;
        }

        .back-btn-custom {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            padding: 10px 20px;
            border-radius: 12px;
            color: var(--text-gray);
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 24px;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-sm);
        }

        .back-btn-custom:hover {
            background: var(--hover-bg);
            color: var(--primary);
            border-color: var(--primary);
            transform: translateX(-4px);
        }

        @media (max-width: 1024px) {
            .panels-grid { grid-template-columns: 1fr; }
            .leilao-hero-banner { flex-direction: column; align-items: flex-start; gap: 20px; }
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
                className="t-btn"
                style={{background: 'var(--primary)', color: 'white', border: 'none'}}
                onClick={() => setShowLoginPopup(true)}
              >
                Login
              </button>
            )}
          </div>
        </header>

        <div className="page-content">
            <button onClick={() => navigate(`/${temporadaId}/torneios`)} className="back-btn-custom">
                <ChevronLeft size={18} /> Voltar para Torneios
            </button>

            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Leilão</h2>
                  <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', margin: '4px 0 0' }}>Dispute os melhores clubes para a temporada</p>
              </div>

              {isProprietario && (
                <button 
                  className="btn-primary-custom" 
                  onClick={() => setShowCriarLeilaoPopup(true)}
                >
                    <Plus size={18} /> Iniciar Leilão
                </button>
              )}
            </div>

            {isLoadingLeiloes ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                    <LoadingSpinner isLoading={true} />
                    <p style={{marginTop: 10}}>Carregando leilão...</p>
                </div>
            ) : activeLeilao ? (
                <>
                    <div className="leilao-hero-banner">
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-gray)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{width: 8, height: 8, background: isExpired ? 'var(--text-gray)' : '#10b981', borderRadius: '50%', boxShadow: isExpired ? 'none' : '0 0 8px #10b981'}}></div>
                                {isExpired ? 'Leilão Encerrado' : 'Leilão em Andamento'}
                            </h3>
                            <div className="timer-display" style={{color: isExpired ? 'var(--text-gray)' : 'var(--primary)'}}>
                                {timeLeft}
                            </div>
                            <div className="brasilia-time">
                                <Clock size={12} />
                                Horário de Brasília (UTC-3)
                            </div>
                        </div>
                        <button 
                            className="btn-primary-custom"
                            disabled={isExpired}
                            style={{padding: '12px 24px', fontSize: '1.05rem'}}
                            onClick={() => !isExpired && navigate(`/${temporadaId}/torneios/leilao/lance`)}
                        >
                            {isExpired ? 'Leilão Encerrado' : <><Gavel size={20} /> Dar Lances Agora</>}
                        </button>
                    </div>

                    <div className="panels-grid">
                        
                        <div className="panel-card">
                            <div className="panel-header">
                                <Activity size={18} color="var(--primary)" />
                                <span className="panel-title">Feed Ao Vivo</span>
                            </div>
                            <div className="scroll-list">
                                {feedData.length > 0 ? (
                                    feedData.map((item, index) => (
                                        <div key={`${item.idJogador}-${item.dataHora}-${index}`} className="list-item">
                                            <div className="avatar-circle">
                                                {item.nomeJogador.charAt(0)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{fontSize: '0.85rem', lineHeight: '1.3'}}>
                                                    <strong>{item.nomeJogador}</strong> no <strong>{item.nomeClube}</strong>
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-gray)' }}>
                                                    {formatDataHoraBrasilia(item.dataHora)}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>
                                                {formatMoney(item.valor)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-gray)', marginTop: '40px', fontSize: '0.9rem' }}>
                                        Nenhuma atividade recente.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="panel-card">
                            <div className="panel-header">
                                <Timer size={18} color="var(--primary)" />
                                <span className="panel-title">Meus Lances</span>
                            </div>
                            <div className="scroll-list">
                                {!currentUser ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-gray)' }}>
                                        <AlertCircle size={32} style={{marginBottom: 10, opacity: 0.5}} />
                                        <p style={{fontSize: '0.9rem'}}>Faça login para ver o status.</p>
                                        <button 
                                            className="btn-primary-custom" 
                                            style={{marginTop: 16, width: '100%', justifyContent: 'center'}}
                                            onClick={() => setShowLoginPopup(true)}
                                        >
                                            Entrar
                                        </button>
                                    </div>
                                ) : meuStatus.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-gray)' }}>
                                        <Gavel size={32} style={{marginBottom: 10, opacity: 0.5}} />
                                        <p style={{fontSize: '0.9rem'}}>Você ainda não realizou lances.</p>
                                        <button 
                                            className="btn-primary-custom" 
                                            disabled={isExpired}
                                            style={{marginTop: 16, width: '100%', justifyContent: 'center'}}
                                            onClick={() => navigate(`/${temporadaId}/torneios/leilao/lance`)}
                                        >
                                            {isExpired ? 'Encerrado' : 'Fazer Lance'}
                                        </button>
                                    </div>
                                ) : (
                                    meuStatus.map((status, index) => (
                                        <div key={index} className="list-item">
                                            <div style={{
                                                width: 24, height: 24, borderRadius: '6px', 
                                                background: 'var(--primary)', color:'white',
                                                display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize: '0.75rem'
                                            }}>
                                                {status.prioridade}º
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{fontWeight: 600, fontSize: '0.9rem'}}>{status.nomeClube}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                                                    {formatMoney(status.valorOfertado)}
                                                </div>
                                            </div>
                                            <div>
                                                {status.status === 'GANHANDO' && <span className="status-tag status-ganhando">Ganhando</span>}
                                                {status.status === 'ANULADO' && <span className="status-tag status-anulado">Anulado</span>}
                                                {status.status !== 'GANHANDO' && status.status !== 'ANULADO' && <span className="status-tag status-perdendo">{status.status}</span>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="panel-card">
                            <div className="panel-header">
                                <TrendingUp size={18} color="#eab308" />
                                <span className="panel-title">Mais Disputados</span>
                            </div>
                            <div className="scroll-list">
                                {maisDisputados.length > 0 ? (
                                    maisDisputados.map((item, index) => (
                                        <div 
                                            key={item.idClube} 
                                            className="list-item clickable"
                                            onClick={() => navigate(`/${temporadaId}/torneios/leilao/${item.idClube}`)}
                                        >
                                            <div style={{ 
                                                width: '24px', height: '24px', 
                                                background: index < 3 ? 'var(--primary)' : 'var(--border-color)',
                                                color: index < 3 ? 'white' : 'var(--text-gray)',
                                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.75rem', fontWeight: 'bold'
                                            }}>
                                                {index + 1}
                                            </div>
                                            <img src={item.imagemClube} alt={item.nomeClube} className="mini-img" />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.nomeClube}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-gray)' }}>
                                                    {item.totalLances} lances
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
                                                    {formatMoney(item.maiorLanceAtual)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-gray)', marginTop: '40px', fontSize: '0.9rem' }}>
                                        Nenhum dado disponível.
                                    </div>
                                )}
                            </div>
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
                            <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {clubesData?.pages.map((page) => (
                                page.conteudo
                                    .filter(clube => clube.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((clube) => (
                                    <tr 
                                        key={clube.id} 
                                        onClick={() => navigate(`/${temporadaId}/torneios/leilao/${clube.id}`)}
                                        style={{cursor: 'pointer'}}
                                    >
                                        <td>
                                            <div style={{display: 'flex', alignItems: 'center'}}>
                                                <img src={clube.imagem} alt={clube.nome} className="clube-row-img" />
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{clube.nome}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{formatLeagueName(clube.ligaClube)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff8e1', padding: '4px 8px', borderRadius: 8, border: '1px solid #fceeb5', color: '#b7791f', fontWeight: 700, fontSize: '0.85rem' }}>
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
                                            <div style={{ display: 'inline-block', background: 'rgba(78, 62, 255, 0.1)', color: 'var(--primary)', fontWeight: 700, padding: '6px 12px', borderRadius: 8, minWidth: 90, textAlign: 'center' }}>
                                                {formatMoney(clube.lanceMinimo)}
                                            </div>
                                        </td>
                                        <td style={{textAlign: 'right'}}>
                                            <ArrowRight size={18} color="var(--text-gray)" />
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
                        {Array.isArray(leiloes) && leiloes.map((leilao) => (
                            <tr key={leilao.id}>
                              <td>
                                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                                    <Gavel size={20} color="var(--primary)" />
                                    <span style={{fontWeight: 600}}>{leilao.descricao}</span>
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
                        {Array.isArray(leiloes) && leiloes.length === 0 && (
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