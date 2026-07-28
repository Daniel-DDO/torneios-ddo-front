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
  Search,
  Gamepad2,
  Star,
  Settings,
  CalendarSync,
  Lightbulb,
  Coins,
  ArrowLeft,
  Crown,
  Medal
} from 'lucide-react';
import { API } from '../services/api';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import '../styles/TorneiosPage.css';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

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

interface Titulo {
  id: string;
  nome: string;
  valor: number;
  descricao: string;
  imagem: string;
  imagemGerarPost: string;
  ativo: boolean;
}

interface TituloCampeaoDTO {
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string | null;
  quantidadeTitulos: number;
}

const fetchTituloService = async (tituloId: string) => {
  const response = await API.get(`/titulos/${tituloId}`);
  return response.data;
};

const fetchTop3CampeoesService = async (tituloId: string) => {
  const response = await API.get(`/conquistas/titulo/${tituloId}/top3-campeoes`);
  return response.data;
};

export function TelaTituloSelecionado() {
  const navigate = useNavigate();
  const { tituloId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: async () => {
      const response = await API.get('/api/avatares');
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 1000 * 60 * 30,
    enabled: !!currentUser
  });

  const { data: titulo, isLoading: isLoadingTitulo } = useQuery<Titulo>({
    queryKey: ['titulo', tituloId],
    queryFn: () => fetchTituloService(tituloId || ''),
    enabled: !!tituloId
  });

  const { data: top3 = [], isLoading: isLoadingTop3 } = useQuery<TituloCampeaoDTO[]>({
    queryKey: ['top3-campeoes', tituloId],
    queryFn: () => fetchTop3CampeoesService(tituloId || ''),
    enabled: !!tituloId
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((a: any) => (map[a.id] = a.url));
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

  const getMedalColor = (posicao: number) => {
    if (posicao === 0) return '#eab308';
    if (posicao === 1) return '#9ca3af';
    return '#b45309';
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      <style>{`
        .titulo-detalhe-container {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 32px;
          display: flex;
          gap: 32px;
          align-items: center;
          margin-top: 1rem;
        }

        .titulo-detalhe-imagem {
          width: 140px;
          height: 140px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .titulo-detalhe-imagem img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
        }

        .titulo-detalhe-info h2 {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-dark);
          margin: 0 0 8px 0;
        }

        .titulo-detalhe-desc {
          color: var(--text-gray);
          font-size: 0.95rem;
          margin-bottom: 16px;
          max-width: 600px;
        }

        .titulo-detalhe-badges {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .titulo-value-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .status-badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
        }

        .status-ativo {
          background: rgba(34, 197, 94, 0.12);
          color: #16a34a;
        }

        .status-inativo {
          background: rgba(113, 113, 122, 0.12);
          color: #71717a;
        }

        .top3-section {
          margin-top: 2.5rem;
        }

        .top3-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-top: 1.5rem;
        }

        .top3-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }

        .top3-posicao {
          position: absolute;
          top: 14px;
          left: 14px;
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-gray);
        }

        .top3-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          background-color: var(--border-color);
          margin-bottom: 14px;
          border: 3px solid var(--border-color);
        }

        .top3-nome {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 10px;
        }

        .top3-quantidade {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          color: var(--text-gray);
          gap: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          margin-top: 1.5rem;
        }

        .shimmer {
          background: linear-gradient(90deg, var(--bg-card) 0%, var(--bg-body) 50%, var(--bg-card) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
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
          <a onClick={() => navigate('/')} className="nav-item"><LayoutDashboard size={20} /> Dashboard</a>
          <a onClick={() => navigate('/jogadores')} className="nav-item"><Users size={20} /> Jogadores</a>
          <a onClick={() => navigate('/clubes')} className="nav-item"><Shield size={20} /> Clubes</a>
          <a onClick={() => navigate('/competicoes')} className="nav-item"><Trophy size={20} /> Competições</a>
          <a onClick={() => navigate('/titulos')} className="nav-item active"><Star size={20} /> Títulos</a>
          <a onClick={() => navigate('/temporadas')} className="nav-item"><CalendarSync size={20} /> Temporadas</a>
          <div className="nav-separator"></div>
          <a onClick={() => navigate('/partidas')} className="nav-item"><Gamepad2 size={20} /> Partidas</a>
          <a onClick={() => navigate('/minha-conta')} className="nav-item"><Wallet size={20} /> Minha conta</a>
          <a onClick={() => navigate('/suporte')} className="nav-item"><Settings size={20} /> Suporte</a>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="left-header">
            <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <div className="search-bar">
              <Search size={18} />
              <input placeholder="Buscar títulos..." disabled />
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
              <Lightbulb size={20} />
            </button>
            <BotaoNotificacao user={currentUser} />
            {currentUser ? (
              <div
                className="user-avatar-mini"
                onClick={() => setShowUserPopup(true)}
                style={{
                  backgroundImage: currentUser.imagem
                    ? `url(${avatarMap[currentUser.imagem] || currentUser.imagem})`
                    : 'none',
                  backgroundSize: 'cover',
                  cursor: 'pointer'
                }}
              >
                {!currentUser.imagem && currentUser.nome.charAt(0)}
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
                  borderRadius: '8px',
                  fontWeight: 600
                }}
              >
                Login
              </button>
            )}
          </div>
        </header>

        <div className="page-content">
          <button onClick={() => navigate('/titulos')} className="back-button">
            <ArrowLeft size={16} /> Voltar para Títulos
          </button>

          {isLoadingTitulo ? (
            <div className="titulo-detalhe-container shimmer" style={{ height: '180px' }}></div>
          ) : titulo ? (
            <div className="titulo-detalhe-container">
              <div className="titulo-detalhe-imagem">
                {titulo.imagem ? (
                  <img src={titulo.imagem} alt={titulo.nome} />
                ) : (
                  <Trophy size={80} color="#FFD700" strokeWidth={1} />
                )}
              </div>
              <div className="titulo-detalhe-info">
                <h2>{titulo.nome}</h2>
                <p className="titulo-detalhe-desc">{titulo.descricao || 'Sem descrição disponível.'}</p>
                <div className="titulo-detalhe-badges">
                  <div className="titulo-value-badge">
                    <Coins size={16} />
                    <span>{titulo.valor}</span>
                  </div>
                  <span className={`status-badge ${titulo.ativo ? 'status-ativo' : 'status-inativo'}`}>
                    {titulo.ativo ? 'Ativo' : 'Histórico'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Trophy size={48} opacity={0.3} />
              <h3>Título não encontrado</h3>
            </div>
          )}

          <div className="top3-section">
            <div className="section-divider" style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Crown size={24} color="#eab308" /> Top 3 Maiores Campeões
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-gray)', marginTop: '4px' }}>
                  Jogadores com mais conquistas deste título.
                </p>
              </div>
            </div>

            {isLoadingTop3 ? (
              <div className="top3-grid">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="top3-card shimmer" style={{ height: '200px' }}></div>
                ))}
              </div>
            ) : top3.length > 0 ? (
              <div className="top3-grid">
                {top3.map((campeao, index) => (
                  <div key={campeao.jogadorId} className="top3-card" onClick={() => navigate(`/jogador/${campeao.jogadorId}`)} style={{ cursor: 'pointer' }}>
                    <div className="top3-posicao">
                      <Medal size={18} color={getMedalColor(index)} />
                    </div>
                    {campeao.jogadorImagem ? (
                      <img src={avatarMap[campeao.jogadorImagem] || campeao.jogadorImagem} alt={campeao.jogadorNome} className="top3-avatar" />
                    ) : (
                      <div className="top3-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-gray)' }}>
                        {campeao.jogadorNome.charAt(0)}
                      </div>
                    )}
                    <span className="top3-nome">{campeao.jogadorNome}</span>
                    <div className="top3-quantidade" style={{ color: getMedalColor(index) }}>
                      <Trophy size={16} />
                      <span>{campeao.quantidadeTitulos} {campeao.quantidadeTitulos === 1 ? 'título' : 'títulos'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Crown size={48} opacity={0.3} />
                <h3>Ninguém conquistou este título ainda</h3>
              </div>
            )}
          </div>
        </div>
      </main>

      {showLoginPopup && (
        <PopupLogin onClose={() => setShowLoginPopup(false)} onLoginSuccess={setCurrentUser} />
      )}
      {showUserPopup && currentUser && (
        <PopupUser
          user={{ ...currentUser, imagem: avatarMap[currentUser.imagem || ''] || currentUser.imagem }}
          onClose={() => setShowUserPopup(false)}
          onLogout={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user_data');
            setCurrentUser(null);
            setShowUserPopup(false);
          }}
        />
      )}
    </div>
  );
}