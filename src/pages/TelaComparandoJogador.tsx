import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  Swords,
  BrainCircuit,
  ChevronLeft,
  Crown,
  Target,
  Activity,
  TrendingUp,
  History,
  Ban,
  Home,
  Plane,
  Sparkles,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupNotificacao from '../components/PopupNotificacao';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

interface CasaForaStats {
  jogadorId: string;
  nome: string;
  discord: string;
  imagem: string | null;
  vClubeCasa: number;
  eClubeCasa: number;
  dClubeCasa: number;
  vSelecaoCasa: number;
  eSelecaoCasa: number;
  dSelecaoCasa: number;
  vClubeFora: number;
  eClubeFora: number;
  dClubeFora: number;
  vSelecaoFora: number;
  eSelecaoFora: number;
  dSelecaoFora: number;
  golsMarcadosCasa: number;
  golsSofridosCasa: number;
  golsMarcadosFora: number;
  golsSofridosFora: number;
}

interface EstiloJogador {
  jogadorId: string;
  partidasConsideradas: number;
  mediaGolsMarcadosPorJogo: number;
  mediaGolsSofridosPorJogo: number;
  mediaEstrelasClubes: number;
  mediaGolsMarcadosGlobal: number;
  mediaGolsSofridosGlobal: number;
  mediaEstrelasGlobal: number;
  estiloProvavel: string;
  caracteristicas: string[];
}

interface FormaRecente {
  ultimosResultados: string[];
  pontuacaoForma: number;
  tendencia: string;
}

interface PlayerStats {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  titulos: number;
  finais: number;
  jogos: number;
  vitorias: number;
  golsMarcados: number;
  golsSofridos: number;
  aproveitamento: string;
  saldoVirtual: number;
  pontosCoeficiente: number;
  casaFora: CasaForaStats;
  estilo: EstiloJogador;
  formaRecente: FormaRecente;
}

interface JogadorClubeResumo {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string | null;
  clubeId: string;
  clubeNome: string;
  clubeImagem: string | null;
  clubeSigla: string;
}

interface PartidaHistorico {
  id: string;
  faseId: string;
  rodadaId: string | null;
  numeroRodada: number | null;
  dataHora: string;
  estadio: string | null;
  mandante: JogadorClubeResumo | null;
  visitante: JogadorClubeResumo | null;
  golsMandante: number | null;
  golsVisitante: number | null;
  realizada: boolean;
  wo: boolean;
  houvePenaltis: boolean;
  penaltisMandante: number | null;
  penaltisVisitante: number | null;
  anulada: boolean;
  motivoAnulacao: string | null;
}

interface ResumoConfrontoDireto {
  vitoriasJogador1: number;
  vitoriasJogador2: number;
  empates: number;
}

interface AnaliseComparativa {
  vantagemMandoJogador1: number;
  vantagemMandoJogador2: number;
  favoritoGeral: string;
  margemVantagem: number;
  leituraEstilistica: string;
  pontosDeAtencao: string[];
}

interface ComparacaoResponse {
  jogador1: PlayerStats;
  jogador2: PlayerStats;
  confrontosDiretos: PartidaHistorico[];
  resumoConfrontoDireto: ResumoConfrontoDireto;
  analiseComparativa: AnaliseComparativa;
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

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const fetchComparacaoService = async (id1: string, id2: string): Promise<ComparacaoResponse> => {
  // Propaga o erro (ex: 400 de validação) para o react-query em vez de
  // engolir a exceção — assim a tela sai do estado de loading e mostra
  // a mensagem correta, ao invés de ficar tentando novamente.
  const response = await API.get(`/jogador/comparar`, {
    params: { id1, id2 }
  });
  return response.data;
};

export function TelaComparandoJogador() {
  const navigate = useNavigate();
  const { id1, id2 } = useParams();
  
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

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const { data: comparacao, isLoading, isError, error } = useQuery<ComparacaoResponse>({
    queryKey: ['comparacao', id1, id2],
    queryFn: () => fetchComparacaoService(id1!, id2!),
    enabled: !!id1 && !!id2,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // O back retorna 400 com um payload de erro de validação (ex: jogador sem
  // partidas suficientes para estimar estilo). Extraímos a mensagem amigável
  // para exibir em vez de deixar a tela tentando renderizar dados inexistentes.
  const comparacaoErrorMessage = useMemo(() => {
    if (!isError) return null;
    const respData = (error as any)?.response?.data;
    if (respData?.message) return respData.message as string;
    return 'Não foi possível carregar a comparação entre esses jogadores no momento.';
  }, [isError, error]);

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: any) => {
        map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

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
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatData = (iso: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(iso));
  };

  const parsePercentage = (val: string) => parseFloat(val.replace('%', '').replace(',', '.'));

  const getBarWidth = (val1: number, val2: number) => {
    const total = val1 + val2;
    if (total === 0) return 50;
    return (val1 / total) * 100;
  };

  // Casa/Fora somado (clube + seleção) para cada jogador
  const getCasaForaResumo = (cf: CasaForaStats) => {
    const vCasa = cf.vClubeCasa + cf.vSelecaoCasa;
    const eCasa = cf.eClubeCasa + cf.eSelecaoCasa;
    const dCasa = cf.dClubeCasa + cf.dSelecaoCasa;
    const totalCasa = vCasa + eCasa + dCasa;

    const vFora = cf.vClubeFora + cf.vSelecaoFora;
    const eFora = cf.eClubeFora + cf.eSelecaoFora;
    const dFora = cf.dClubeFora + cf.dSelecaoFora;
    const totalFora = vFora + eFora + dFora;

    const pct = (v: number, total: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

    return {
      casa: { 
        v: vCasa, e: eCasa, d: dCasa, total: totalCasa, aproveitamento: pct(vCasa, totalCasa),
        golsPro: cf.golsMarcadosCasa,
        golsContra: cf.golsSofridosCasa,
        saldo: cf.golsMarcadosCasa - cf.golsSofridosCasa
      },
      fora: { 
        v: vFora, e: eFora, d: dFora, total: totalFora, aproveitamento: pct(vFora, totalFora),
        golsPro: cf.golsMarcadosFora,
        golsContra: cf.golsSofridosFora,
        saldo: cf.golsMarcadosFora - cf.golsSofridosFora
      },
    };
  };

  const StatRow = ({ label, val1, val2, type = 'number', highlightBetter = true }: { label: string, val1: string | number, val2: string | number, type?: 'number' | 'currency' | 'percent', highlightBetter?: boolean }) => {
    let num1 = typeof val1 === 'string' ? (type === 'percent' ? parsePercentage(val1) : 0) : val1;
    let num2 = typeof val2 === 'string' ? (type === 'percent' ? parsePercentage(val2) : 0) : val2;
    
    if (type === 'currency') {
       num1 = val1 as number;
       num2 = val2 as number;
    }

    const better1 = highlightBetter && num1 > num2;
    const better2 = highlightBetter && num2 > num1;

    const width1 = getBarWidth(num1, num2);
    const width2 = 100 - width1;

    const display1 = type === 'currency' ? formatCurrency(val1 as number) : val1;
    const display2 = type === 'currency' ? formatCurrency(val2 as number) : val2;

    return (
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
           <span style={{ color: better1 ? 'var(--primary)' : 'var(--text-dark)', fontWeight: better1 ? 'bold' : 'normal', opacity: better1 ? 1 : 0.7 }}>{display1}</span>
           <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--text-gray)' }}>{label}</span>
           <span style={{ color: better2 ? 'var(--primary)' : 'var(--text-dark)', fontWeight: better2 ? 'bold' : 'normal', opacity: better2 ? 1 : 0.7 }}>{display2}</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--bg-body)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
           <div style={{ width: `${width1}%`, background: better1 ? 'var(--primary)' : 'var(--text-gray)', opacity: better1 ? 1 : 0.3, height: '100%', transition: 'width 1s ease' }}></div>
           <div style={{ width: '2px', background: 'var(--bg-card)'}}></div>
           <div style={{ width: `${width2}%`, background: better2 ? 'var(--primary)' : 'var(--text-gray)', opacity: better2 ? 1 : 0.3, height: '100%', transition: 'width 1s ease' }}></div>
        </div>
      </div>
    );
  };

  const getPlacarConfronto = (partida: PartidaHistorico, jogador1Id: string) => {
    if (partida.wo) return 'W.O.';
    if (partida.golsMandante === null || partida.golsVisitante === null) return '-';

    const mandanteEhJogador1 = partida.mandante?.jogadorId === jogador1Id;
    const golsJ1 = mandanteEhJogador1 ? partida.golsMandante : partida.golsVisitante;
    const golsJ2 = mandanteEhJogador1 ? partida.golsVisitante : partida.golsMandante;

    let placar = `${golsJ1} x ${golsJ2}`;

    if (partida.houvePenaltis && partida.penaltisMandante !== null && partida.penaltisVisitante !== null) {
      const penJ1 = mandanteEhJogador1 ? partida.penaltisMandante : partida.penaltisVisitante;
      const penJ2 = mandanteEhJogador1 ? partida.penaltisVisitante : partida.penaltisMandante;
      placar += ` (${penJ1} x ${penJ2} pên.)`;
    }

    return placar;
  };

  const getVencedorConfronto = (partida: PartidaHistorico, jogador1Id: string, jogador2Id: string) => {
    if (partida.golsMandante === null || partida.golsVisitante === null) return null;

    const mandanteEhJogador1 = partida.mandante?.jogadorId === jogador1Id;
    let golsJ1 = mandanteEhJogador1 ? partida.golsMandante : partida.golsVisitante;
    let golsJ2 = mandanteEhJogador1 ? partida.golsVisitante : partida.golsMandante;

    if (golsJ1 === golsJ2 && partida.houvePenaltis && partida.penaltisMandante !== null && partida.penaltisVisitante !== null) {
      golsJ1 = mandanteEhJogador1 ? partida.penaltisMandante : partida.penaltisVisitante;
      golsJ2 = mandanteEhJogador1 ? partida.penaltisVisitante : partida.penaltisMandante;
    }

    if (golsJ1 > golsJ2) return jogador1Id;
    if (golsJ2 > golsJ1) return jogador2Id;
    return null;
  };

  const resultBadgeColor: Record<string, string> = {
    V: '#10b981',
    E: '#94a3b8',
    D: '#ef4444',
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
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99 }}
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
              <input type="text" placeholder="Buscar..." disabled />
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

        <div className="page-content" style={{ animation: 'fadeInUp 0.6s ease-out', paddingBottom: '60px', paddingLeft: '5%', paddingRight: '5%', paddingTop: '30px' }}>
          
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        width: '40px', 
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-dark)',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0, lineHeight: 1.2 }}>Comparativo</h1>
                    <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginTop: '4px', margin: 0 }}>Análise detalhada frente a frente</p>
                </div>
            </div>

            {isError ? (
              <div
                className="tp-card"
                style={{
                  padding: '50px 30px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <AlertTriangle size={30} color="#ef4444" />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1.1rem', fontWeight: 700 }}>
                    Não foi possível gerar a comparação
                  </h3>
                  <p style={{ margin: '8px 0 0 0', color: 'var(--text-gray)', fontSize: '0.9rem', maxWidth: '420px' }}>
                    {comparacaoErrorMessage}
                  </p>
                </div>
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    marginTop: '8px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Voltar
                </button>
              </div>
            ) : isLoading || !comparacao ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                  <LoadingSpinner isLoading={true} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  
                  <div className="tp-card" style={{ padding: '40px 20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, background: 'linear-gradient(90deg, var(--primary) 0%, transparent 50%, #ef4444 100%)', pointerEvents: 'none' }}></div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%', zIndex: 1 }}>
                          <div 
                              style={{
                                  width: '110px',
                                  height: '110px',
                                  borderRadius: '50%',
                                  border: '4px solid var(--primary)',
                                  padding: '4px',
                                  background: 'var(--bg-card)',
                                  marginBottom: '16px',
                                  boxShadow: '0 10px 25px rgba(78, 62, 255, 0.2)'
                              }}
                          >
                            <div style={{
                                width: '100%', height: '100%', borderRadius: '50%',
                                backgroundImage: comparacao.jogador1.imagem ? `url(${avatarMap[comparacao.jogador1.imagem] || comparacao.jogador1.imagem})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundColor: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2.5rem', color: 'white'
                            }}>
                              {!comparacao.jogador1.imagem && comparacao.jogador1.nome.charAt(0)}
                            </div>
                          </div>
                          <h2 style={{ textAlign: 'center', fontSize: '1.4rem', marginBottom: '4px', color: 'var(--text-dark)', fontWeight: '800' }}>{comparacao.jogador1.nome}</h2>
                          <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '600', background: 'rgba(78, 62, 255, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>
                            {comparacao.jogador1.discord}
                          </span>

                          <div style={{ display: 'flex', gap: '6px', marginTop: '14px' }}>
                              {[...comparacao.jogador1.formaRecente.ultimosResultados].reverse().map((r, idx) => (
                                  <div
                                      key={idx}
                                      title={r === 'V' ? 'Vitória' : r === 'E' ? 'Empate' : 'Derrota'}
                                      style={{
                                          width: '26px', height: '26px', borderRadius: '50%',
                                          background: resultBadgeColor[r] || '#94a3b8',
                                          color: 'white', fontWeight: 800, fontSize: '0.7rem',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                                      }}
                                  >
                                      {r}
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                          <div style={{ 
                              width: '56px', 
                              height: '56px', 
                              borderRadius: '16px', 
                              background: 'var(--bg-body)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              marginBottom: '8px',
                              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                          }}>
                              <Swords size={28} color="var(--text-gray)" />
                          </div>
                          <span style={{ fontWeight: '900', color: 'var(--text-gray)', fontSize: '1.2rem', letterSpacing: '1px' }}>VS</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%', zIndex: 1 }}>
                          <div 
                              style={{
                                  width: '110px',
                                  height: '110px',
                                  borderRadius: '50%',
                                  border: '4px solid var(--text-gray)',
                                  padding: '4px',
                                  background: 'var(--bg-card)',
                                  marginBottom: '16px',
                                  boxShadow: 'var(--shadow-md)'
                              }}
                          >
                             <div style={{
                                width: '100%', height: '100%', borderRadius: '50%',
                                backgroundImage: comparacao.jogador2.imagem ? `url(${avatarMap[comparacao.jogador2.imagem] || comparacao.jogador2.imagem})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundColor: 'var(--text-gray)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2.5rem', color: 'white'
                            }}>
                              {!comparacao.jogador2.imagem && comparacao.jogador2.nome.charAt(0)}
                            </div>
                          </div>
                          <h2 style={{ textAlign: 'center', fontSize: '1.4rem', marginBottom: '4px', color: 'var(--text-dark)', fontWeight: '800' }}>{comparacao.jogador2.nome}</h2>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)', fontWeight: '600', background: 'var(--bg-body)', padding: '4px 12px', borderRadius: '20px' }}>
                            {comparacao.jogador2.discord}
                          </span>

                          <div style={{ display: 'flex', gap: '6px', marginTop: '14px' }}>
                              {[...comparacao.jogador2.formaRecente.ultimosResultados].reverse().map((r, idx) => (
                                  <div
                                      key={idx}
                                      title={r === 'V' ? 'Vitória' : r === 'E' ? 'Empate' : 'Derrota'}
                                      style={{
                                          width: '26px', height: '26px', borderRadius: '50%',
                                          background: resultBadgeColor[r] || '#94a3b8',
                                          color: 'white', fontWeight: 800, fontSize: '0.7rem',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                                      }}
                                  >
                                      {r}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* ===== Análise Inteligente (vinda do backend) ===== */}
                  <div className="tp-card" style={{ padding: '30px', borderLeft: '4px solid var(--primary)', background: 'linear-gradient(to right, var(--bg-card), var(--hover-bg))' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ padding: '8px', background: 'rgba(78, 62, 255, 0.1)', borderRadius: '8px' }}>
                             <BrainCircuit size={24} color="var(--primary)" />
                          </div>
                          <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.1rem', fontWeight: '700' }}>Análise Inteligente</h3>
                      </div>

                      <p style={{ lineHeight: '1.7', fontSize: '1rem', color: 'var(--text-dark)', margin: 0 }}>
                          {comparacao.analiseComparativa.favoritoGeral}
                          {comparacao.analiseComparativa.margemVantagem > 0 && (
                            <> &mdash; margem estimada de <strong>{comparacao.analiseComparativa.margemVantagem.toFixed(1)} pp</strong>.</>
                          )}
                      </p>

                      <p style={{ lineHeight: '1.7', fontSize: '0.95rem', color: 'var(--text-gray)', marginTop: '12px', marginBottom: 0 }}>
                          {comparacao.analiseComparativa.leituraEstilistica}
                      </p>

                      {comparacao.analiseComparativa.pontosDeAtencao.length > 0 && (
                          <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {comparacao.analiseComparativa.pontosDeAtencao.map((ponto, idx) => (
                                  <div
                                      key={idx}
                                      style={{
                                          display: 'flex', alignItems: 'flex-start', gap: '8px',
                                          background: 'rgba(245, 158, 11, 0.1)',
                                          border: '1px solid rgba(245, 158, 11, 0.2)',
                                          borderRadius: '10px',
                                          padding: '10px 14px',
                                          fontSize: '0.85rem',
                                          color: 'var(--text-dark)',
                                          fontWeight: 600
                                      }}
                                  >
                                      <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
                                      {ponto}
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                    
                    <div className="tp-card" style={{ padding: '24px' }}>
                        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                            <Crown size={20} color="#EAB308" />
                            Conquistas
                        </h3>
                        <StatRow label="Títulos Totais" val1={comparacao.jogador1.titulos} val2={comparacao.jogador2.titulos} />
                        <StatRow label="Finais Disputadas" val1={comparacao.jogador1.finais} val2={comparacao.jogador2.finais} />
                        <StatRow label="Pontuação de Ranking" val1={comparacao.jogador1.pontosCoeficiente} val2={comparacao.jogador2.pontosCoeficiente} />
                    </div>

                    <div className="tp-card" style={{ padding: '24px' }}>
                        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                            <Activity size={20} color="#10B981" />
                            Performance
                        </h3>
                        <StatRow label="Aproveitamento" val1={comparacao.jogador1.aproveitamento} val2={comparacao.jogador2.aproveitamento} type="percent" />
                        <StatRow label="Vitórias" val1={comparacao.jogador1.vitorias} val2={comparacao.jogador2.vitorias} />
                        <StatRow label="Partidas Jogadas" val1={comparacao.jogador1.jogos} val2={comparacao.jogador2.jogos} />
                    </div>

                    <div className="tp-card" style={{ padding: '24px' }}>
                        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                            <Target size={20} color="#EF4444" />
                            Ataque & Defesa
                        </h3>
                        <StatRow label="Gols Marcados" val1={comparacao.jogador1.golsMarcados} val2={comparacao.jogador2.golsMarcados} />
                        <StatRow label="Gols Sofridos (Menor melhor)" val1={comparacao.jogador1.golsSofridos} val2={comparacao.jogador2.golsSofridos} highlightBetter={false} />
                        <StatRow label="Saldo de Gols" val1={comparacao.jogador1.golsMarcados - comparacao.jogador1.golsSofridos} val2={comparacao.jogador2.golsMarcados - comparacao.jogador2.golsSofridos} />
                    </div>

                    <div className="tp-card" style={{ padding: '24px' }}>
                        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                            <TrendingUp size={20} color="#3B82F6" />
                            Valor de Mercado
                        </h3>
                        <StatRow label="Saldo Virtual" val1={comparacao.jogador1.saldoVirtual} val2={comparacao.jogador2.saldoVirtual} type="currency" />
                    </div>

                  </div>

                  {/* ===== Casa x Fora ===== */}
                  <div className="tp-card" style={{ padding: '24px' }}>
                      <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                          <Home size={20} color="#10B981" />
                          Desempenho Casa x Fora
                      </h3>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
                          {[comparacao.jogador1, comparacao.jogador2].map((jog, jIdx) => {
                              const resumo = getCasaForaResumo(jog.casaFora);
                              const accent = jIdx === 0 ? 'var(--primary)' : '#ef4444';
                              return (
                                  <div key={jog.id} style={{ background: 'var(--bg-body)', borderRadius: '14px', padding: '18px', border: '1px solid var(--border-color)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontWeight: 800, color: accent }}>
                                          {jog.nome}
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                          {/* Bloco Casa */}
                                          <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border-color)' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>
                                                  <Home size={14} /> Casa · {resumo.casa.aproveitamento}%
                                              </div>
                                              <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                  <span style={{ color: '#10b981' }}>{resumo.casa.v}V</span>
                                                  <span style={{ color: 'var(--text-gray)' }}>{resumo.casa.e}E</span>
                                                  <span style={{ color: '#ef4444' }}>{resumo.casa.d}D</span>
                                              </div>
                                              {/* Adição dos Gols Casa */}
                                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
                                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{resumo.casa.golsPro}</span>
                                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700 }}>GP</span>
                                                  </div>
                                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{resumo.casa.golsContra}</span>
                                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700 }}>GC</span>
                                                  </div>
                                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: resumo.casa.saldo >= 0 ? '#10b981' : '#ef4444' }}>
                                                          {resumo.casa.saldo > 0 ? `+${resumo.casa.saldo}` : resumo.casa.saldo}
                                                      </span>
                                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700 }}>SG</span>
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          {/* Bloco Fora */}
                                          <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border-color)' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '8px' }}>
                                                  <Plane size={14} /> Fora · {resumo.fora.aproveitamento}%
                                              </div>
                                              <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                  <span style={{ color: '#10b981' }}>{resumo.fora.v}V</span>
                                                  <span style={{ color: 'var(--text-gray)' }}>{resumo.fora.e}E</span>
                                                  <span style={{ color: '#ef4444' }}>{resumo.fora.d}D</span>
                                              </div>
                                              {/* Adição dos Gols Fora */}
                                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
                                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{resumo.fora.golsPro}</span>
                                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700 }}>GP</span>
                                                  </div>
                                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{resumo.fora.golsContra}</span>
                                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700 }}>GC</span>
                                                  </div>
                                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: resumo.fora.saldo >= 0 ? '#10b981' : '#ef4444' }}>
                                                          {resumo.fora.saldo > 0 ? `+${resumo.fora.saldo}` : resumo.fora.saldo}
                                                      </span>
                                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700 }}>SG</span>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '20px', paddingTop: '18px', borderTop: '1px dashed var(--border-color)' }}>
                          <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: comparacao.analiseComparativa.vantagemMandoJogador1 >= 0 ? '#10b981' : '#ef4444' }}>
                                  {comparacao.analiseComparativa.vantagemMandoJogador1 > 0 ? '+' : ''}{comparacao.analiseComparativa.vantagemMandoJogador1.toFixed(1)} pp
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>
                                  Vantagem de mando · {comparacao.jogador1.nome}
                              </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: comparacao.analiseComparativa.vantagemMandoJogador2 >= 0 ? '#10b981' : '#ef4444' }}>
                                  {comparacao.analiseComparativa.vantagemMandoJogador2 > 0 ? '+' : ''}{comparacao.analiseComparativa.vantagemMandoJogador2.toFixed(1)} pp
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>
                                  Vantagem de mando · {comparacao.jogador2.nome}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* ===== Estilo de Jogo & Forma Recente ===== */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
                      <div className="tp-card" style={{ padding: '24px' }}>
                          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                              <Sparkles size={20} color="#8b5cf6" />
                              Estilo Provável
                          </h3>

                          {[comparacao.jogador1, comparacao.jogador2].map((jog, jIdx) => (
                              <div key={jog.id} style={{ marginBottom: jIdx === 0 ? '18px' : 0, background: 'var(--bg-body)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--border-color)' }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: jIdx === 0 ? 'var(--primary)' : '#ef4444', marginBottom: '6px' }}>
                                      {jog.nome}
                                  </div>
                                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '8px', lineHeight: 1.4 }}>
                                      {jog.estilo.estiloProvavel}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {jog.estilo.caracteristicas.map((c, idx) => (
                                          <div key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <Sparkles size={12} style={{ color: '#8b5cf6', flexShrink: 0 }} /> {c}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="tp-card" style={{ padding: '24px' }}>
                          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                              <Flame size={20} color="#f97316" />
                              Forma Recente
                          </h3>

                          {[comparacao.jogador1, comparacao.jogador2].map((jog, jIdx) => (
                              <div
                                  key={jog.id}
                                  style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                      background: 'var(--bg-body)', borderRadius: '12px', padding: '14px 16px',
                                      border: '1px solid var(--border-color)',
                                      marginBottom: jIdx === 0 ? '12px' : 0
                                  }}
                              >
                                  <div>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: jIdx === 0 ? 'var(--primary)' : '#ef4444', marginBottom: '4px' }}>
                                          {jog.nome}
                                      </div>
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                          {[...jog.formaRecente.ultimosResultados].reverse().map((r, idx) => (
                                              <div
                                                  key={idx}
                                                  style={{
                                                      width: '22px', height: '22px', borderRadius: '50%',
                                                      background: resultBadgeColor[r] || '#94a3b8',
                                                      color: 'white', fontWeight: 800, fontSize: '0.65rem',
                                                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                  }}
                                              >
                                                  {r}
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)' }}>{jog.formaRecente.pontuacaoForma}</div>
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-gray)', fontWeight: 700 }}>{jog.formaRecente.tendencia}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="tp-card" style={{ padding: '24px' }}>
                      <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                          <History size={20} color="var(--primary)" />
                          Confronto Direto
                      </h3>

                      {comparacao.confrontosDiretos.length === 0 ? (
                          <p style={{ color: 'var(--text-gray)', fontSize: '0.95rem', textAlign: 'center', padding: '20px 0' }}>
                              Estes jogadores ainda não se enfrentaram.
                          </p>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', marginBottom: '28px', padding: '20px', background: 'var(--bg-body)', borderRadius: '12px' }}>
                              <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)' }}>{comparacao.resumoConfrontoDireto.vitoriasJogador1}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{comparacao.jogador1.nome}</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-gray)' }}>{comparacao.resumoConfrontoDireto.empates}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Empates</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ef4444' }}>{comparacao.resumoConfrontoDireto.vitoriasJogador2}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{comparacao.jogador2.nome}</div>
                              </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {comparacao.confrontosDiretos.map((partida) => {
                                  const vencedorId = getVencedorConfronto(partida, comparacao.jogador1.id, comparacao.jogador2.id);
                                  const clubeJ1 = partida.mandante?.jogadorId === comparacao.jogador1.id ? partida.mandante : partida.visitante;
                                  const clubeJ2 = partida.mandante?.jogadorId === comparacao.jogador1.id ? partida.visitante : partida.mandante;

                                  return (
                                      <div
                                          key={partida.id}
                                          style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              padding: '14px 16px',
                                              background: 'var(--bg-body)',
                                              borderRadius: '10px',
                                              border: partida.anulada ? '1px dashed var(--border-color)' : '1px solid transparent',
                                              opacity: partida.anulada ? 0.6 : 1
                                          }}
                                      >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '32%' }}>
                                              {clubeJ1?.clubeImagem && (
                                                  <img
                                                      src={clubeJ1.clubeImagem}
                                                      alt={clubeJ1.clubeSigla}
                                                      style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }}
                                                  />
                                              )}
                                              <span style={{
                                                  fontWeight: vencedorId === comparacao.jogador1.id ? '800' : '500',
                                                  color: vencedorId === comparacao.jogador1.id ? 'var(--primary)' : 'var(--text-dark)',
                                                  fontSize: '0.9rem'
                                              }}>
                                                  {clubeJ1?.clubeSigla || '-'}
                                              </span>
                                          </div>

                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '36%' }}>
                                              <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                                                  {getPlacarConfronto(partida, comparacao.jogador1.id)}
                                              </span>
                                              <span style={{ fontSize: '0.7rem', color: 'var(--text-gray)', marginTop: '2px' }}>
                                                  {formatData(partida.dataHora)}
                                              </span>
                                              {partida.anulada && (
                                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#ef4444', marginTop: '2px' }}>
                                                      <Ban size={12} /> Anulada
                                                  </span>
                                              )}
                                          </div>

                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', width: '32%' }}>
                                              <span style={{
                                                  fontWeight: vencedorId === comparacao.jogador2.id ? '800' : '500',
                                                  color: vencedorId === comparacao.jogador2.id ? '#ef4444' : 'var(--text-dark)',
                                                  fontSize: '0.9rem'
                                              }}>
                                                  {clubeJ2?.clubeSigla || '-'}
                                              </span>
                                              {clubeJ2?.clubeImagem && (
                                                  <img
                                                      src={clubeJ2.clubeImagem}
                                                      alt={clubeJ2.clubeSigla}
                                                      style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }}
                                                  />
                                              )}
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                        </>
                      )}
                  </div>

              </div>
            )}
          </div>
        </div>
      </main>

      {showLoginPopup && (
        <PopupLogin onClose={() => setShowLoginPopup(false)} onLoginSuccess={handleLoginSuccess} />
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
        <PopupNotificacao onClose={() => setShowNotificacaoPopup(false)} />
      )}
    </div>
  );
}