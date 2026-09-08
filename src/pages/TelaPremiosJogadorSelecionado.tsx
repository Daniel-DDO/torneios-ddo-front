import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Menu, LayoutDashboard, Users, Trophy, Shield, Wallet, Search,
  ArrowLeft, Gamepad2, Lightbulb, Settings, CalendarSync,
  Award, Target, ShieldCheck, HeartHandshake, TrendingUp, Star,
  Sparkles, Calendar
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

type CategoriaPremio = 'ARTILHEIRO' | 'FAIR_PLAY' | 'MELHOR_DEFESA' | 'MELHOR_JOGADOR' | 'MELHOR_RANKING';

interface PremioTemporadaDTO {
  id: string;
  categoria: CategoriaPremio;
  jogadorId: string;
  jogadorNome: string;
  valorEstatistica: number;
  dataApuracao: string;
}

interface JogadorResumoDTO {
  id: string;
  nome: string;
  discord: string;
  pontosCoeficiente: number;
  imagem: string | null;
  cargo?: string;
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

interface CategoriaConfig {
  label: string;
  icon: React.ElementType;
  cor: string;
  corClara: string;
  unidade?: string;
}

const CATEGORIA_CONFIG: Record<CategoriaPremio, CategoriaConfig> = {
  MELHOR_JOGADOR: {
    label: 'Melhor Jogador',
    icon: Trophy,
    cor: '#f59e0b',
    corClara: 'rgba(245, 158, 11, 0.12)',
  },
  ARTILHEIRO: {
    label: 'Artilheiro',
    icon: Target,
    cor: '#ef4444',
    corClara: 'rgba(239, 68, 68, 0.12)',
    unidade: 'gols',
  },
  MELHOR_DEFESA: {
    label: 'Melhor Defesa',
    icon: ShieldCheck,
    cor: '#3b82f6',
    corClara: 'rgba(59, 130, 246, 0.12)',
    unidade: 'gols sofridos/jogo',
  },
  FAIR_PLAY: {
    label: 'Fair Play',
    icon: HeartHandshake,
    cor: '#10b981',
    corClara: 'rgba(16, 185, 129, 0.12)',
  },
  MELHOR_RANKING: {
    label: 'Melhor Ranking',
    icon: TrendingUp,
    cor: '#8b5cf6',
    corClara: 'rgba(139, 92, 246, 0.12)',
    unidade: 'pts',
  },
};

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const fetchJogadorResumoService = async (jogadorId: string): Promise<JogadorResumoDTO | null> => {
  try {
    const response = await API.get(`/jogador/${jogadorId}/resumo`);
    return response.data;
  } catch (error) {
    return null;
  }
};

const fetchPremiosJogadorService = async (jogadorId: string): Promise<PremioTemporadaDTO[]> => {
  try {
    const response = await API.get(`/api/premios-temporada/jogador/${jogadorId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    return [];
  }
};

export function TelaPremiosJogadorSelecionado() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const { data: avatars = [] } = useQuery<Avatar[]>({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const { data: jogador, isLoading: isLoadingJogador } = useQuery<JogadorResumoDTO | null>({
    queryKey: ['jogadorResumo', id],
    queryFn: () => fetchJogadorResumoService(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 15,
  });

  const { data: premios = [], isLoading: isLoadingPremios } = useQuery<PremioTemporadaDTO[]>({
    queryKey: ['premiosJogador', id],
    queryFn: () => fetchPremiosJogadorService(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar) => {
      map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

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
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  const handleLoginSuccess = (userData: UserData) => setCurrentUser(userData);

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair?')) {
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

  const getJogadorAvatar = () => {
    if (!jogador?.imagem) return null;
    if (jogador.imagem.startsWith('http')) return jogador.imagem;
    return avatarMap[jogador.imagem] || jogador.imagem;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const formatValor = (categoria: CategoriaPremio, valor: number) => {
    const config = CATEGORIA_CONFIG[categoria];
    const formatted = Number.isInteger(valor) ? String(valor) : valor.toFixed(2);
    return config.unidade ? `${formatted} ${config.unidade}` : formatted;
  };

  // Contagem de conquistas por categoria — usado no resumo no topo da página
  const contagemPorCategoria = useMemo(() => {
    const map: Partial<Record<CategoriaPremio, number>> = {};
    premios.forEach((p) => {
      map[p.categoria] = (map[p.categoria] || 0) + 1;
    });
    return map;
  }, [premios]);

  // Timeline ordenada da mais recente para a mais antiga
  const premiosOrdenados = useMemo(() => {
    return [...premios].sort((a, b) => new Date(b.dataApuracao).getTime() - new Date(a.dataApuracao).getTime());
  }, [premios]);

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>

      <LoadingSpinner isLoading={isLoadingJogador && isLoadingPremios} />

      <style>{`
        .premios-wrapper {
          max-width: 1000px;
          margin: 0 auto;
          padding-bottom: 40px;
          animation: fadeInUp 0.5s ease-out;
        }

        .premios-hero {
          background: var(--bg-card);
          border-radius: 24px;
          border: 1px solid var(--border-color);
          padding: 32px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 24px;
          box-shadow: var(--shadow-sm);
        }

        .premios-hero-avatar {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: var(--hover-bg);
          border: 2px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--primary);
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
        }

        .premios-hero-info h1 {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-dark);
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .premios-hero-info p {
          color: var(--text-gray);
          font-size: 0.9rem;
          margin: 0;
        }

        .premios-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .premio-summary-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          transition: transform 0.2s, border-color 0.2s;
        }

        .premio-summary-card:hover {
          transform: translateY(-3px);
          border-color: var(--primary);
        }

        .premio-summary-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .premio-summary-count {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-dark);
          line-height: 1;
        }

        .premio-summary-label {
          font-size: 0.78rem;
          color: var(--text-gray);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .timeline-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 28px;
          box-shadow: var(--shadow-sm);
        }

        .timeline-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 24px;
        }

        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }

        .timeline-item {
          display: flex;
          gap: 18px;
          padding: 16px 0;
          position: relative;
        }

        .timeline-item:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 23px;
          top: 54px;
          bottom: -16px;
          width: 2px;
          background: var(--border-color);
        }

        .timeline-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          z-index: 1;
          border: 3px solid var(--bg-card);
          box-shadow: 0 0 0 1px var(--border-color);
        }

        .timeline-content {
          flex: 1;
          background: var(--hover-bg);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 14px 18px;
        }

        .timeline-content-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }

        .timeline-categoria {
          font-weight: 800;
          font-size: 1rem;
        }

        .timeline-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: var(--text-gray);
          font-weight: 600;
        }

        .timeline-valor {
          font-size: 0.9rem;
          color: var(--text-dark);
          font-weight: 700;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: var(--text-gray);
        }

        .empty-state-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--hover-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        @media (max-width: 640px) {
          .premios-hero { flex-direction: column; text-align: center; }
          .timeline-content-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="logo-area">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
            </svg>
          </div>
          <span className="logo-text">Torneios <span>DDO</span></span>
        </div>

        <nav className="nav-menu">
          <a onClick={() => navigate('/')} className="nav-item" style={{ cursor: 'pointer' }}>
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a onClick={() => navigate('/jogadores')} className="nav-item active" style={{ cursor: 'pointer' }}>
            <Users size={20} /> Jogadores
          </a>
          <a onClick={() => navigate('/clubes')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Shield size={20} /> Clubes
          </a>
          <a onClick={() => navigate('/competicoes')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Trophy size={20} /> Competições
          </a>
          <a onClick={() => navigate('/titulos')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Star size={20} /> Títulos
          </a>
          <a onClick={() => navigate('/temporadas')} className="nav-item" style={{ cursor: 'pointer' }}>
            <CalendarSync size={20} /> Temporadas
          </a>
          <div className="nav-separator"></div>
          <a onClick={() => navigate('/partidas')} className="nav-item" style={{ cursor: 'pointer' }}>
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
          <div className="premios-wrapper">
            <button
              onClick={() => navigate(`/jogador/${id}`)}
              className="btn-back"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 50,
                color: 'var(--text-gray)', fontWeight: 500, marginBottom: 24, cursor: 'pointer'
              }}
            >
              <ArrowLeft size={18} /> Voltar para o perfil
            </button>

            {jogador && (
              <div className="premios-hero">
                <div
                  className="premios-hero-avatar"
                  style={{ backgroundImage: getJogadorAvatar() ? `url(${getJogadorAvatar()})` : 'none' }}
                >
                  {!getJogadorAvatar() && jogador.nome.charAt(0)}
                </div>
                <div className="premios-hero-info">
                  <h1><Award size={22} style={{ color: '#f59e0b' }} /> Prêmios de {jogador.nome}</h1>
                  <p>{premios.length} {premios.length === 1 ? 'conquista registrada' : 'conquistas registradas'} ao longo das temporadas</p>
                </div>
              </div>
            )}

            {isLoadingPremios ? (
              <div className="timeline-card">
                <div className="empty-state">
                  <div className="empty-state-icon"><Award size={36} style={{ opacity: 0.4 }} /></div>
                  <p>Carregando prêmios...</p>
                </div>
              </div>
            ) : premios.length === 0 ? (
              <div className="timeline-card">
                <div className="empty-state">
                  <div className="empty-state-icon"><Sparkles size={36} style={{ opacity: 0.4 }} /></div>
                  <h3 style={{ color: 'var(--text-dark)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
                    Nenhum prêmio ainda
                  </h3>
                  <p style={{ fontSize: '0.9rem' }}>Este jogador ainda não recebeu prêmios de temporada.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="premios-summary-grid">
                  {(Object.keys(CATEGORIA_CONFIG) as CategoriaPremio[])
                    .filter((cat) => contagemPorCategoria[cat])
                    .map((cat) => {
                      const config = CATEGORIA_CONFIG[cat];
                      const Icon = config.icon;
                      return (
                        <div key={cat} className="premio-summary-card">
                          <div className="premio-summary-icon" style={{ background: config.corClara, color: config.cor }}>
                            <Icon size={22} />
                          </div>
                          <div className="premio-summary-count">{contagemPorCategoria[cat]}x</div>
                          <div className="premio-summary-label">{config.label}</div>
                        </div>
                      );
                    })}
                </div>

                <div className="timeline-card">
                  <div className="timeline-header">
                    <Calendar size={20} style={{ color: 'var(--primary)' }} /> Linha do Tempo
                  </div>

                  <div className="timeline-list">
                    {premiosOrdenados.map((premio) => {
                      const config = CATEGORIA_CONFIG[premio.categoria];
                      const Icon = config.icon;
                      return (
                        <div key={premio.id} className="timeline-item">
                          <div className="timeline-icon-wrapper" style={{ background: config.corClara, color: config.cor }}>
                            <Icon size={22} />
                          </div>

                          <div className="timeline-content">
                            <div className="timeline-content-header">
                              <span className="timeline-categoria" style={{ color: config.cor }}>{config.label}</span>
                              <span className="timeline-date">
                                <Calendar size={12} /> {formatDate(premio.dataApuracao)}
                              </span>
                            </div>
                            <div className="timeline-valor">
                              {formatValor(premio.categoria, premio.valorEstatistica)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {showLoginPopup && (
        <PopupLogin onClose={() => setShowLoginPopup(false)} onLoginSuccess={handleLoginSuccess} />
      )}

      {showUserPopup && currentUser && (
        <PopupUser
          user={{ ...currentUser, imagem: getCurrentUserAvatar() }}
          onClose={() => setShowUserPopup(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}