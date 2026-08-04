import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Bell,
  Gamepad2,
  Star,
  Lightbulb,
  CalendarSync,
  TrendingUp,
  ShieldAlert,
  ArrowUpCircle,
  ArrowDownCircle,
  Info,
  Swords,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupReivindicar from '../components/PopupReivindicar';
import PopupRecuperarSenha from '../components/PopupRecuperarSenha';
import PopupNotificacao from '../components/PopupNotificacao';

import bronze1 from '../assets/imagens/insignias/bronze1.png';
import prata1 from '../assets/imagens/insignias/prata1.png';
import ouro1 from '../assets/imagens/insignias/ouro1.png';
import platina1 from '../assets/imagens/insignias/platina1.png';
import diamante2 from '../assets/imagens/insignias/diamante2.png';
import champion1 from '../assets/imagens/insignias/champion1.png';

interface JogadorRanking {
  jogadorId: string;
  nomeJogador: string;
  rankAtual: string;
  pontosAtuais: number;
  emColocacao: boolean;
  partidasFaltantesColocacao: number;
  pontosParaProximoRank: number;
  pontosDeColchaoAntesDoRebaixamento: number;
  strikesRebaixamento: number;
  strikesParaRebaixar: number;
  imagemJogador?: string | null;
  discordJogador?: string | null;
}

interface UserData {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  cargo: 'PROPRIETARIO' | 'DIRETOR' | 'ADMINISTRADOR' | 'JOGADOR';
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

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  link: string;
  tipo: string;
  lida: boolean;
  dataCriacao: string;
}

const RANK_ICONS: Record<string, string> = {
  'Bronze': bronze1,
  'Prata': prata1,
  'Ouro': ouro1,
  'Platina': platina1,
  'Diamante': diamante2,
  'Champion': champion1,
};

// Ordem de progressão dos ranks, conforme o enum RankJogador do back
const RANKS_ORDEM: { nome: string; icone: string }[] = [
  { nome: 'Bronze', icone: bronze1 },
  { nome: 'Prata', icone: prata1 },
  { nome: 'Ouro', icone: ouro1 },
  { nome: 'Platina', icone: platina1 },
  { nome: 'Diamante', icone: diamante2 },
  { nome: 'Champion', icone: champion1 },
];

const MIN_PARTIDAS_COLOCACAO = 5;
const STRIKES_PARA_REBAIXAR = 2;

const RANK_COLORS: Record<string, string> = {
  'Bronze': '#a97142',
  'Prata': '#b6c1cc',
  'Ouro': '#e6b800',
  'Platina': '#3ea6ff',
  'Diamante': '#4ee3d8',
  'Champion': '#ff4757',
  'Sem Ranking': '#8a8f98',
};

// Tenta identificar a "família" de rank a partir do texto retornado pelo back
// (ex: "Ouro II", "Diamante 2", "Champion") para escolher o ícone certo.
const getRankFamily = (rankAtual: string): string | null => {
  const normalized = rankAtual.toLowerCase();
  if (normalized.includes('bronze')) return 'Bronze';
  if (normalized.includes('prata')) return 'Prata';
  if (normalized.includes('ouro')) return 'Ouro';
  if (normalized.includes('platina')) return 'Platina';
  if (normalized.includes('diamante')) return 'Diamante';
  if (normalized.includes('champion') || normalized.includes('campeão') || normalized.includes('campeao')) return 'Champion';
  return null;
};

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

const fetchTabelaRankingService = async () => {
  const response = await API.get('/api/ranking/tabela');
  return response.data || [];
};

export function TelaTabelaRanking() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showRecuperarSenhaPopup, setShowRecuperarSenhaPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReivindicarPopup, setShowReivindicarPopup] = useState(false);
  const [showNotificacaoPopup, setShowNotificacaoPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const { data: notificacoes = [], isError: isAuthError } = useQuery<Notificacao[]>({
    queryKey: ['notificacoesMinhas'],
    queryFn: fetchMinhasNotificacoesService,
    enabled: !!currentUser,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 5,
    retry: false
  });

  const { data: tabelaRanking = [], isLoading: isLoadingRanking } = useQuery<JogadorRanking[]>({
    queryKey: ['tabelaRanking'],
    queryFn: fetchTabelaRankingService,
    staleTime: 1000 * 60 * 2,
  });

  const temNotificacaoNaoLida = useMemo(() => {
    return notificacoes.some(n => !n.lida);
  }, [notificacoes]);

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: Avatar) => {
      map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

  // Ordena por pontos (maior primeiro), já que o back não garante ordenação
  const rankingOrdenado = useMemo(() => {
    return [...tabelaRanking].sort((a, b) => b.pontosAtuais - a.pontosAtuais);
  }, [tabelaRanking]);

  const filteredRanking = useMemo(() => {
    if (!searchTerm) return rankingOrdenado;
    return rankingOrdenado.filter(jogador =>
      jogador.nomeJogador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (jogador.discordJogador || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rankingOrdenado, searchTerm]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

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
    if (isAuthError) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      setCurrentUser(null);
    }
  }, [isAuthError]);

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

  // Calcula % de progresso até o próximo rank, com base nos pontos atuais
  // e nos pontos que faltam (pontosParaProximoRank é a distância restante).
  const getProgressoSubida = (jogador: JogadorRanking) => {
    const total = jogador.pontosAtuais + jogador.pontosParaProximoRank;
    if (total <= 0) return 0;
    const pct = (jogador.pontosAtuais / total) * 100;
    return Math.min(100, Math.max(0, pct));
  };

  // Calcula % de "risco" de rebaixamento com base nos strikes acumulados
  const getProgressoRebaixamento = (jogador: JogadorRanking) => {
    if (!jogador.strikesParaRebaixar) return 0;
    const pct = (jogador.strikesRebaixamento / jogador.strikesParaRebaixar) * 100;
    return Math.min(100, Math.max(0, pct));
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={{ zIndex: 100 }}>
        <div className="logo-area">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
            </svg>
          </div>
          <span className="logo-text">Torneios <span>DDO</span></span>
        </div>

        <nav className="nav-menu">
          <a onClick={() => handleNavigate('/')} className="nav-item" style={{ cursor: 'pointer' }}>
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a onClick={() => handleNavigate('/jogadores')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Users size={20} /> Jogadores
          </a>
          <a onClick={() => handleNavigate('/clubes')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Shield size={20} /> Clubes
          </a>
          <a onClick={() => handleNavigate('/competicoes')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Trophy size={20} /> Competições
          </a>
          <a onClick={() => handleNavigate('/titulos')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Star size={20} /> Títulos
          </a>
          <a onClick={() => handleNavigate('/temporadas')} className="nav-item" style={{ cursor: 'pointer' }}>
            <CalendarSync size={20} /> Temporadas
          </a>
          <div className="nav-separator"></div>
          <a onClick={() => handleNavigate('/partidas')} className="nav-item" style={{ cursor: 'pointer' }}>
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
                placeholder="Buscar jogador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  onClick={() => setShowReivindicarPopup(true)}
                  className="reivindicar-btn-header"
                  style={{
                    background: 'transparent',
                    color: 'var(--text-dark)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginLeft: '10px',
                    display: isMobile ? 'none' : 'block'
                  }}
                >
                  Reivindicar Conta
                </button>
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

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-dark)' }}>
              <TrendingUp className="text-primary" size={26} />
              Tabela de Ranking
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>
              Temporada Rankeada &middot; Coeficiente Geral
            </span>
          </div>

          {/* Explicação do sistema de ranking */}
          <div className="tp-card" style={{ padding: isMobile ? '20px' : '28px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Info className="text-primary" size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>
                Como funciona o Ranking
              </h3>
            </div>

            {/* Trilha de ranks */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '8px' : '4px',
              overflowX: 'auto',
              paddingBottom: '14px',
              marginBottom: '18px'
            }}>
              {RANKS_ORDEM.map((rank, idx) => (
                <div key={rank.nome} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: isMobile ? '64px' : '76px'
                  }}>
                    <img
                      src={rank.icone}
                      alt={rank.nome}
                      style={{
                        width: isMobile ? '44px' : '52px',
                        height: isMobile ? '44px' : '52px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))'
                      }}
                    />
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: RANK_COLORS[rank.nome],
                      textAlign: 'center'
                    }}>
                      {rank.nome}
                    </span>
                  </div>
                  {idx < RANKS_ORDEM.length - 1 && (
                    <div style={{
                      width: isMobile ? '14px' : '22px',
                      height: '2px',
                      background: 'var(--border-color)',
                      flexShrink: 0
                    }} />
                  )}
                </div>
              ))}
            </div>

            {/* Regras */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  background: 'rgba(78, 62, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '8px',
                  color: 'var(--primary)',
                  flexShrink: 0
                }}>
                  <Swords size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '2px' }}>
                    Partidas de colocação
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-gray)', lineHeight: 1.5, margin: 0 }}>
                    Todo jogador começa "Sem Ranking" e precisa disputar {MIN_PARTIDAS_COLOCACAO} partidas rankeadas.
                    Só depois delas o rank inicial é definido, de acordo com os pontos acumulados.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  background: 'rgba(46, 213, 115, 0.12)',
                  borderRadius: '10px',
                  padding: '8px',
                  color: '#2ed573',
                  flexShrink: 0
                }}>
                  <ArrowUpCircle size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '2px' }}>
                    Vitórias, empates e derrotas
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-gray)', lineHeight: 1.5, margin: 0 }}>
                    Cada resultado soma ou subtrai pontos conforme o rank atual do jogador. Ao atingir a
                    pontuação mínima do próximo rank, a promoção é imediata e os strikes de rebaixamento são zerados.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  background: 'rgba(255, 71, 87, 0.1)',
                  borderRadius: '10px',
                  padding: '8px',
                  color: '#ff4757',
                  flexShrink: 0
                }}>
                  <TrendingDown size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '2px' }}>
                    Strikes de rebaixamento
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-gray)', lineHeight: 1.5, margin: 0 }}>
                    Se os pontos caem abaixo do mínimo do rank atual, o jogador recebe 1 strike. Ao acumular{' '}
                    {STRIKES_PARA_REBAIXAR} strikes, ele é rebaixado para o rank correspondente à pontuação atual
                    e os strikes voltam a zero.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  background: 'rgba(62, 166, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '8px',
                  color: '#3ea6ff',
                  flexShrink: 0
                }}>
                  <RefreshCw size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '2px' }}>
                    Decaimento de temporada
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-gray)', lineHeight: 1.5, margin: 0 }}>
                    Ao virar a temporada, todos os ranks podem recuar algumas posições na trilha, reiniciando
                    a pontuação próxima ao mínimo do novo rank — mantendo a competitividade em alta.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoadingRanking ? (
            <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--text-gray)' }}>
              <div className="animate-spin" style={{ width: '28px', height: '28px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
            </div>
          ) : filteredRanking.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-gray)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={36} />
              <p>Nenhum jogador encontrado na tabela de ranking.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredRanking.map((jogador, index) => {
                const rankFamily = getRankFamily(jogador.rankAtual);
                const rankIcon = rankFamily ? RANK_ICONS[rankFamily] : null;
                const rankColor = (rankFamily && RANK_COLORS[rankFamily]) || RANK_COLORS['Sem Ranking'];
                const avatarUrl = jogador.imagemJogador ? avatarMap[jogador.imagemJogador] || jogador.imagemJogador : null;
                const progressoSubida = getProgressoSubida(jogador);
                const progressoRebaixamento = getProgressoRebaixamento(jogador);

                return (
                  <div
                    key={jogador.jogadorId}
                    className="tp-card"
                    onClick={() => navigate(`/jogador/${jogador.jogadorId}`)}
                    style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'stretch' : 'center',
                      gap: isMobile ? '14px' : '20px',
                      padding: '18px 20px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.08)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {/* Posição */}
                    <div style={{
                      minWidth: '32px',
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: 'var(--text-gray)',
                      textAlign: 'center'
                    }}>
                      #{index + 1}
                    </div>

                    {/* Avatar + Nome */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: isMobile ? 'none' : 1, minWidth: 0 }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={jogador.nomeJogador} style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', background: 'var(--border-color)', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: 'var(--text-gray)', fontSize: '1.1rem', flexShrink: 0 }}>
                          {jogador.nomeJogador.charAt(0)}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {jogador.nomeJogador}
                        </div>
                        {jogador.discordJogador && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                            @{jogador.discordJogador}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rank atual */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      minWidth: isMobile ? 'auto' : '170px',
                      justifyContent: isMobile ? 'flex-start' : 'center'
                    }}>
                      {rankIcon ? (
                        <img src={rankIcon} alt={jogador.rankAtual} style={{ width: '36px', height: '36px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} />
                      ) : (
                        <ShieldAlert size={30} style={{ color: rankColor }} />
                      )}
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: rankColor }}>
                          {jogador.rankAtual}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                          {jogador.pontosAtuais} pts
                        </div>
                      </div>
                    </div>

                    {/* Progresso */}
                    <div style={{ flex: isMobile ? 'none' : 1.4, minWidth: isMobile ? 'auto' : '220px' }}>
                      {jogador.emColocacao ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-gray)', marginBottom: '4px' }}>
                            <span>Em colocação</span>
                            <span>{jogador.partidasFaltantesColocacao} partida(s) restantes</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', borderRadius: '6px', background: 'var(--border-color)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.max(5, 100 - (jogador.partidasFaltantesColocacao * 20))}%`,
                              background: 'linear-gradient(90deg, #4e3eff, #8a7dff)',
                              borderRadius: '6px'
                            }} />
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-gray)', marginBottom: '4px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ArrowUpCircle size={12} /> Próximo rank
                              </span>
                              <span>faltam {jogador.pontosParaProximoRank} pts</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', borderRadius: '6px', background: 'var(--border-color)', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${progressoSubida}%`,
                                background: 'linear-gradient(90deg, #2ed573, #7bed9f)',
                                borderRadius: '6px'
                              }} />
                            </div>
                          </div>

                          {jogador.strikesParaRebaixar > 0 && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-gray)', marginBottom: '4px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <ArrowDownCircle size={12} /> Risco de queda
                                </span>
                                <span>{jogador.strikesRebaixamento}/{jogador.strikesParaRebaixar} strikes</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', borderRadius: '6px', background: 'var(--border-color)', overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%',
                                  width: `${progressoRebaixamento}%`,
                                  background: 'linear-gradient(90deg, #ff6b6b, #ff4757)',
                                  borderRadius: '6px'
                                }} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {showReivindicarPopup && (
        <PopupReivindicar
          onClose={() => setShowReivindicarPopup(false)}
          onSubmit={(data) => {
            console.log("Dados para Reivindicar:", data);
            setShowReivindicarPopup(false);
          }}
        />
      )}

      {showRecuperarSenhaPopup && (
        <PopupRecuperarSenha
          onClose={() => setShowRecuperarSenhaPopup(false)}
          onSuccess={() => {
            setShowRecuperarSenhaPopup(false);
            alert("Senha redefinida com sucesso!");
          }}
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