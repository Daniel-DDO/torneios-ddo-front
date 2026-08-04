import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Menu, 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Shield, 
  Wallet, 
  Search, 
  Gamepad2, 
  Star,
  Lightbulb,
  Settings,
  CalendarSync,
  Plus,
  ArrowLeft,
  Link,
  UserCheck,
  Gavel,
  RefreshCw,
  Shuffle,
  Award,
  Target,
  Crown,
  ShieldCheck,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupNovoTorneio from '../components/PopupNovoTorneio';
import PopupJogadorClube from '../components/PopupJogadorClube';
import PopupTrocarJogador from '../components/PopupTrocarJogador';
import PopupSorteioJogClube from '../components/PopupSorteioJogClube';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

interface Torneio {
  id: string;
  nome: string;
  temporadaId: string;
  temporadaNome: string;
  competicaoId: string;
  competicaoNome: string;
  status?: string; 
  vagas?: number;
  dataInicio?: string;
}

interface Competicao {
  id: string;
  nome: string;
  imagem: string;
  divisao: string;
  valor: number;
  descricao: string;
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

interface Temporada {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  ativa: boolean;
}

interface PremioTemporada {
  id: string | null;
  categoria: string;
  jogadorId: string;
  jogadorNome: string;
  valorEstatistica: number;
  dataApuracao: string | null;
}

const CATEGORIA_LABELS: Record<string, string> = {
  ARTILHEIRO: 'Artilheiro',
  FAIR_PLAY: 'Fair Play',
  MELHOR_DEFESA: 'Melhor defesa',
  MELHOR_JOGADOR: 'Melhor jogador',
  MELHOR_RANKING: 'Melhor ranking',
};

const CATEGORIA_ICONS: Record<string, React.ElementType> = {
  ARTILHEIRO: Target,
  FAIR_PLAY: ShieldCheck,
  MELHOR_DEFESA: Shield,
  MELHOR_JOGADOR: Star,
  MELHOR_RANKING: TrendingUp,
};

const normalizarCategoria = (categoria: string) =>
  CATEGORIA_LABELS[categoria] ?? categoria.charAt(0) + categoria.slice(1).toLowerCase().replace(/_/g, ' ');

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const fetchTorneiosPorTemporadaService = async (temporadaId: string) => {
  const response = await API.get(`/torneio/temporada/${temporadaId}`);
  return response.data;
};

const fetchCompeticoesSimplesService = async () => {
    const response = await API.get('/competicao/lista-simples');
    return response.data;
};

const fetchTemporadaService = async (temporadaId: string) => {
  const response = await API.get(`/temporada/${temporadaId}`);
  return response.data;
};

const fetchPremiosDefinitivosService = async (temporadaId: string) => {
  const response = await API.get(`/api/premios-temporada/${temporadaId}`);
  return response.data;
};

const fetchPremiosPreviewService = async (temporadaId: string) => {
  const response = await API.get(`/api/premios-temporada/preview/${temporadaId}`);
  return response.data;
};

const apurarPremiosService = async (temporadaId: string) => {
  const response = await API.post(`/api/premios-temporada/apurar/${temporadaId}`);
  return response.data;
};

export function TelaTorneios() {
  const navigate = useNavigate();
  const { temporadaId } = useParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: avatars = [] } = useQuery<Avatar[]>({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const { data: torneios = [], isLoading: isLoadingTorneios } = useQuery<Torneio[]>({
    queryKey: ['torneios', temporadaId],
    queryFn: () => fetchTorneiosPorTemporadaService(temporadaId || ''),
    enabled: !!temporadaId,
  });

  const { data: competicoes = [], isLoading: isLoadingCompeticoes } = useQuery<Competicao[]>({
    queryKey: ['competicoes-simples'],
    queryFn: fetchCompeticoesSimplesService,
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: Avatar) => {
        map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

  const competicaoMap = useMemo(() => {
    const map: Record<string, Competicao> = {};
    competicoes.forEach((comp) => {
        map[comp.id] = comp;
    });
    return map;
  }, [competicoes]);

  // ----- Temporada / Prêmios -----
  const { data: temporada } = useQuery<Temporada>({
    queryKey: ['temporada', temporadaId],
    queryFn: () => fetchTemporadaService(temporadaId || ''),
    enabled: !!temporadaId,
    staleTime: 1000 * 60 * 5,
  });

  const isPeriodoEncerrado = useMemo(() => {
    if (!temporada?.dataFim) return false;
    const hoje = new Date();
    const dataFim = new Date(`${temporada.dataFim}T23:59:59`);
    return hoje > dataFim;
  }, [temporada]);

  const { data: premios = [], isLoading: isLoadingPremios, isFetching: isFetchingPremios } = useQuery<PremioTemporada[]>({
    queryKey: ['premios-temporada', temporadaId, isPeriodoEncerrado],
    queryFn: () =>
      isPeriodoEncerrado
        ? fetchPremiosDefinitivosService(temporadaId || '')
        : fetchPremiosPreviewService(temporadaId || ''),
    enabled: !!temporadaId && !!temporada,
    staleTime: 1000 * 60,
  });

  const [isApurando, setIsApurando] = useState(false);

  const handleApurarPremios = async () => {
    if (!temporadaId) return;
    if (!window.confirm('Deseja apurar os prêmios definitivos desta temporada? Essa ação irá gravar o resultado final.')) return;

    setIsApurando(true);
    try {
      await apurarPremiosService(temporadaId);
      queryClient.invalidateQueries({ queryKey: ['premios-temporada', temporadaId] });
    } catch (error) {
      console.error('Erro ao apurar prêmios:', error);
      window.alert('Não foi possível apurar os prêmios. Tente novamente.');
    } finally {
      setIsApurando(false);
    }
  };
  // ----- Fim Temporada / Prêmios -----

  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showNovoTorneioPopup, setShowNovoTorneioPopup] = useState(false);
  const [showJogadorClubePopup, setShowJogadorClubePopup] = useState(false);
  const [showTrocarJogadorPopup, setShowTrocarJogadorPopup] = useState(false);
  const [showSorteioPopup, setShowSorteioPopup] = useState(false);
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

  const handleNovoTorneioSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ['torneios', temporadaId] });
  };

  const handleTrocarJogadorSuccess = () => {
    
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const filteredTorneios = torneios.filter((torneio) => {
    const term = searchTerm.toLowerCase();
    const nomeTorneio = torneio.nome.toLowerCase();
    
    const comp = competicaoMap[torneio.competicaoId];
    const nomeCompeticao = comp ? comp.nome.toLowerCase() : '';

    return nomeTorneio.includes(term) || nomeCompeticao.includes(term);
  });

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const handleVerJogadores = () => {
    if (temporadaId) {
        navigate(`/${temporadaId}/torneios/jogadores`);
    }
  };

  const handleTorneioClick = (torneioId: string) => {
    if (temporadaId && torneioId) {
      navigate(`/${temporadaId}/${torneioId}/fases`);
    }
  };

  const isLoading = isLoadingTorneios || isLoadingCompeticoes;

  const hasAdminPrivileges = currentUser && ['ADMINISTRADOR', 'DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo);
  const canSwapPlayers = currentUser && ['DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo);
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

        .status-aberto {
          background-color: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .status-encerrado {
          background-color: var(--border-color);
          color: var(--text-gray);
        }

        .status-andamento {
          background-color: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
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

        .comp-cell {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .comp-logo-mini {
            width: 36px;
            height: 36px;
            object-fit: contain;
            border-radius: 4px;
        }

        .ver-jogadores-btn {
            background-color: transparent;
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            margin-right: 10px;
        }

        .ver-jogadores-btn:hover {
            background-color: var(--hover-bg);
            border-color: var(--primary);
            color: var(--primary);
        }

        .premio-card {
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background-color: var(--hover-bg);
        }

        .premio-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--bg-card);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--primary);
        }

        .premio-categoria {
          font-size: 0.8rem;
          color: var(--text-gray);
          font-weight: 600;
          text-transform: uppercase;
        }

        .premio-jogador {
          font-size: 1rem;
          font-weight: 700;
          margin-top: 2px;
          color: var(--text-dark);
        }

        .premio-valor {
          font-size: 0.85rem;
          color: var(--text-gray);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .page-content { padding: 1rem; }
          .custom-table th, .custom-table td { padding: 12px; }
          .ver-jogadores-btn span { display: none; }
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
                placeholder="Buscar torneio ou competição..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="header-actions">
            
            <button className="ver-jogadores-btn" onClick={handleVerJogadores}>
                <UserCheck size={18} />
                <span>Jogadores dessa temporada</span>
            </button>

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
            <button onClick={() => navigate('/temporadas')} className="back-button">
                <ArrowLeft size={16} /> Voltar para Temporadas
            </button>

            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Torneios da Temporada</h2>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Gerencie os torneios desta temporada</p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="t-btn" 
                  onClick={() => navigate(`/${temporadaId}/torneios/leilao`)}
                  style={{
                      background: 'var(--bg-card)', 
                      color: 'var(--text-primary)', 
                      border: '1px solid var(--border-color)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      cursor: 'pointer'
                  }}
                >
                    <Gavel size={18} /> Leilões
                </button>

                {hasAdminPrivileges && (
                    <button 
                      className="t-btn" 
                      onClick={() => setShowJogadorClubePopup(true)}
                      style={{
                          background: 'var(--bg-card)', 
                          color: 'var(--text-primary)', 
                          border: '1px solid var(--border-color)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          cursor: 'pointer'
                      }}
                    >
                        <Link size={18} /> Vincular Jogadores
                    </button>
                )}

                {isProprietario && (
                    <button 
                      className="t-btn" 
                      onClick={handleApurarPremios}
                      disabled={isApurando}
                      style={{
                          background: 'var(--bg-card)', 
                          color: 'var(--text-primary)', 
                          border: '1px solid var(--border-color)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          cursor: isApurando ? 'not-allowed' : 'pointer',
                          opacity: isApurando ? 0.7 : 1,
                      }}
                    >
                        {isApurando ? <Loader2 size={18} className="spin" /> : <Award size={18} />}
                        Apurar prêmios
                    </button>
                )}

                {isProprietario && (
                    <button 
                      className="t-btn" 
                      onClick={() => setShowNovoTorneioPopup(true)}
                      style={{background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px'}}
                    >
                        <Plus size={18} /> Novo Torneio
                    </button>
                )}
            </div>
            </div>

            <div className="table-container">
              {isLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>Carregando dados...</div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Competição</th>
                      <th>Torneio</th>
                      <th>Temporada</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTorneios.map((torneio) => {
                      const competicao = competicaoMap[torneio.competicaoId];
                      return (
                        <tr 
                            key={torneio.id}
                            onClick={() => handleTorneioClick(torneio.id)}
                        >
                          <td>
                            <div className="comp-cell">
                                {competicao ? (
                                    <>
                                        <img src={competicao.imagem} alt={competicao.nome} className="comp-logo-mini" />
                                        <span>{competicao.nome}</span>
                                    </>
                                ) : (
                                    <span>{torneio.competicaoNome || 'Competição Desconhecida'}</span>
                                )}
                            </div>
                          </td>
                          <td>{torneio.nome}</td>
                          <td>{torneio.temporadaNome}</td>
                          <td>
                             {torneio.status ? (
                                <span className={`status-badge ${
                                    torneio.status === 'ABERTO' ? 'status-aberto' : 
                                    torneio.status === 'EM_ANDAMENTO' ? 'status-andamento' : 'status-encerrado'
                                }`}>
                                    {torneio.status === 'EM_ANDAMENTO' ? 'Em Andamento' : torneio.status}
                                </span>
                             ) : (
                                <span className="status-badge status-aberto">Aberto</span>
                             )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTorneios.length === 0 && (
                      <tr>
                          <td colSpan={4} style={{textAlign: 'center', padding: '30px', color: 'var(--text-secondary)'}}>
                              Nenhum torneio encontrado
                          </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="table-container">
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Prêmios da Temporada</h3>
                {!isPeriodoEncerrado && (
                  <span className="status-badge status-andamento">Prévia — sujeito a alteração</span>
                )}
              </div>

              {isLoadingPremios ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                  Carregando prêmios...
                </div>
              ) : premios.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                  Nenhum prêmio disponível ainda.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', padding: '20px 24px' }}>
                  {premios.map((premio) => {
                    const Icone = CATEGORIA_ICONS[premio.categoria] ?? Crown;
                    return (
                      <div key={premio.categoria} className="premio-card">
                        <div className="premio-icon">
                          <Icone size={20} />
                        </div>
                        <div>
                          <div className="premio-categoria">
                            {normalizarCategoria(premio.categoria)}
                          </div>
                          <div className="premio-jogador">
                            {premio.jogadorNome}
                          </div>
                          <div className="premio-valor">
                            {premio.valorEstatistica}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isFetchingPremios && !isLoadingPremios && (
                <div style={{ padding: '8px 24px', fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                  Atualizando...
                </div>
              )}
            </div>

            {canSwapPlayers && (
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                     <button 
                        className="t-btn" 
                        onClick={() => setShowSorteioPopup(true)}
                        style={{
                            background: 'var(--bg-card)', 
                            color: 'var(--text-primary)', 
                            border: '1px solid var(--border-color)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        <Shuffle size={18} /> Sorteio de Times
                    </button>
                    <button 
                        className="t-btn" 
                        onClick={() => setShowTrocarJogadorPopup(true)}
                        style={{
                            background: 'var(--bg-card)', 
                            color: 'var(--text-primary)', 
                            border: '1px solid var(--border-color)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={18} /> Substituir Jogador
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
          user={{
            ...currentUser,
            imagem: getCurrentUserAvatar()
          }}
          onClose={() => setShowUserPopup(false)}
          onLogout={handleLogout}
        />
      )}

      {showNovoTorneioPopup && (
        <PopupNovoTorneio 
          onClose={() => setShowNovoTorneioPopup(false)} 
          onSubmit={handleNovoTorneioSubmit} 
        />
      )}

      {showJogadorClubePopup && (
        <PopupJogadorClube 
          onClose={() => setShowJogadorClubePopup(false)}
        />
      )}

      {showTrocarJogadorPopup && temporadaId && (
        <PopupTrocarJogador
          temporadaId={temporadaId}
          onClose={() => setShowTrocarJogadorPopup(false)}
          onSuccess={handleTrocarJogadorSuccess}
        />
      )}

      {showSorteioPopup && (
        <PopupSorteioJogClube 
            onClose={() => setShowSorteioPopup(false)}
            onSuccess={() => setShowSorteioPopup(false)}
        />
      )}
    </div>
  );
}