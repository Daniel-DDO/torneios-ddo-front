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
  TrendingUp
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupNotificacao from '../components/PopupNotificacao';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

interface PlayerStats {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  titulos: number;
  finais: number;
  partidasJogadas: number;
  vitorias: number;
  golsMarcados: number;
  golsSofridos: number;
  aproveitamento: string;
  saldo: number;
  pontosCoeficiente: number;
}

interface ComparacaoResponse {
  jogador1: PlayerStats;
  jogador2: PlayerStats;
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

  const { data: comparacao, isLoading } = useQuery<ComparacaoResponse>({
    queryKey: ['comparacao', id1, id2],
    queryFn: () => fetchComparacaoService(id1!, id2!),
    enabled: !!id1 && !!id2
  });

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

  const parsePercentage = (val: string) => parseFloat(val.replace('%', ''));

  const getBarWidth = (val1: number, val2: number) => {
    const total = val1 + val2;
    if (total === 0) return 50;
    return (val1 / total) * 100;
  };

  const generateAIAnalysis = (p1: PlayerStats, p2: PlayerStats) => {
    let p1Score = 0;
    let p2Score = 0;

    if (p1.titulos > p2.titulos) p1Score++; else if (p2.titulos > p1.titulos) p2Score++;
    if (p1.vitorias > p2.vitorias) p1Score++; else if (p2.vitorias > p1.vitorias) p2Score++;
    if (p1.golsMarcados > p2.golsMarcados) p1Score++; else if (p2.golsMarcados > p1.golsMarcados) p2Score++;
    if (parsePercentage(p1.aproveitamento) > parsePercentage(p2.aproveitamento)) p1Score++; else if (parsePercentage(p2.aproveitamento) > parsePercentage(p1.aproveitamento)) p2Score++;
    if (p1.pontosCoeficiente > p2.pontosCoeficiente) p1Score++; else if (p2.pontosCoeficiente > p1.pontosCoeficiente) p2Score++;

    if (p1Score > p2Score) return `Com base nos dados, ${p1.nome} apresenta um desempenho superior geral, dominando em ${p1Score} dos 5 principais quesitos analisados.`;
    if (p2Score > p1Score) return `A análise indica que ${p2.nome} vive um momento melhor, superando o adversário em ${p2Score} métricas chave.`;
    return `O confronto é extremamente equilibrado! Ambos os jogadores apresentam estatísticas muito próximas, prometendo um duelo imprevisível.`;
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

            {isLoading || !comparacao ? (
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
                      </div>
                  </div>

                  <div className="tp-card" style={{ padding: '30px', borderLeft: '4px solid var(--primary)', background: 'linear-gradient(to right, var(--bg-card), var(--hover-bg))' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ padding: '8px', background: 'rgba(78, 62, 255, 0.1)', borderRadius: '8px' }}>
                             <BrainCircuit size={24} color="var(--primary)" />
                          </div>
                          <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.1rem', fontWeight: '700' }}>Análise Inteligente</h3>
                      </div>
                      <p style={{ lineHeight: '1.7', fontSize: '1rem', color: 'var(--text-dark)', margin: 0 }}>
                          {generateAIAnalysis(comparacao.jogador1, comparacao.jogador2)}
                      </p>
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
                        <StatRow label="Partidas Jogadas" val1={comparacao.jogador1.partidasJogadas} val2={comparacao.jogador2.partidasJogadas} />
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
                        <StatRow label="Saldo Virtual" val1={comparacao.jogador1.saldo} val2={comparacao.jogador2.saldo} type="currency" />
                    </div>

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