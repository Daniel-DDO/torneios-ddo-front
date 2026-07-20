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
  Gamepad2,
  Star,
  Lightbulb,
  CalendarSync,
  Target,
  Award,
  Percent,
  ShieldCheck,
  Swords,
  Flame,
  Zap,
  Crown
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

interface RecordeJogador {
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string | null;
  valorFormatado: string;
  valorBruto: number;
}

interface RecordeTemporada {
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string | null;
  temporadaNome: string;
  valor: number;
  partidasJogadas: number;
}

interface TimeResumo {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string | null;
  clubeId: string;
  clubeNome: string;
  clubeImagem: string | null;
  clubeSigla: string;
}

interface RecordePartida {
  partidaId: string;
  mandante: TimeResumo;
  visitante: TimeResumo;
  golsMandante: number;
  golsVisitante: number;
  dataHora: string;
  estadio: string | null;
}

interface RecordeClube {
  clubeId: string;
  clubeNome: string;
  clubeImagem: string | null;
  titulos: number;
}

interface HallDaFamaResponse {
  artilheiroMaximo: RecordeJogador[];
  maisTitulos: RecordeJogador[];
  maisFinais: RecordeJogador[];
  maisPartidas: RecordeJogador[];
  melhorAproveitamento: RecordeJogador | null;
  melhorAtaqueTemporada: RecordeTemporada[];
  melhorDefesaTemporada: RecordeTemporada[];
  partidaComMaisGols: RecordePartida[];
  maiorGoleada: RecordePartida[];
  clubeComMaisTitulos: RecordeClube[];
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

const fetchHallDaFamaService = async (): Promise<HallDaFamaResponse> => {
  const response = await API.get('/api/hall-da-fama');
  const data = (response && (response as any).data) ? (response as any).data : response;
  return data as HallDaFamaResponse;
};

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

export function TelaHallDaFama() {
  const navigate = useNavigate();

  const { data: hallDaFama, isLoading: loading } = useQuery({
    queryKey: ['hall-da-fama'],
    queryFn: fetchHallDaFamaService,
    staleTime: 1000 * 60 * 10,
  });

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: Avatar) => {
      map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

  const resolveImagem = (imagem: string | null) => {
    if (!imagem) return null;
    return avatarMap[imagem] || imagem;
  };

  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
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

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>

      <LoadingSpinner isLoading={loading} />

      <style>{`
        .page-content {
          padding: 2rem 3rem;
        }

        .hof-section {
          margin-bottom: 40px;
        }

        .hof-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 16px;
        }

        .hof-section-title svg {
          color: var(--primary);
        }

        .hof-empty {
          color: var(--text-gray);
          font-size: 0.9rem;
          padding: 12px 0;
        }

        /* ---- Lista de recordes (jogador / temporada / clube) ---- */
        .hof-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hof-row {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }

        .hof-row:hover {
          transform: translateX(4px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary);
        }

        .hof-row-rank {
          width: 30px;
          height: 30px;
          min-width: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #1e1e1e;
          font-weight: 800;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hof-row-avatar {
          width: 56px;
          height: 56px;
          min-width: 56px;
          border-radius: 50%;
          flex-shrink: 0;
          overflow: hidden;
          background-color: var(--hover-bg);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--primary);
          font-size: 1.1rem;
          border: 2px solid var(--border-color);
        }

        .hof-row-avatar.square {
          border-radius: 12px;
        }

        .hof-row-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hof-row-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-dark);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hof-row-subtitle {
          font-size: 0.8rem;
          color: var(--text-gray);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hof-row-value-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
          text-align: right;
        }

        .hof-row-value {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--primary);
          white-space: nowrap;
        }

        .hof-row-value-label {
          font-size: 0.65rem;
          color: var(--text-gray);
          text-transform: uppercase;
        }

        /* ---- Cards de partida (mandante x visitante) ---- */
        .hof-match-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }

        .hof-match-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary);
        }

        .hof-match-team {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }

        .hof-match-logo {
          width: 52px;
          height: 52px;
          min-width: 52px;
          border-radius: 10px;
          background: var(--hover-bg);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }

        .hof-match-player {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-dark);
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hof-match-club {
          font-size: 0.72rem;
          color: var(--text-gray);
        }

        .hof-match-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .hof-match-score-num {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--primary);
          white-space: nowrap;
        }

        .hof-match-meta {
          font-size: 0.7rem;
          color: var(--text-gray);
          text-align: center;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .page-content { padding: 1rem; }

          .hof-row { padding: 10px 14px; gap: 12px; }
          .hof-row-avatar { width: 44px; height: 44px; min-width: 44px; font-size: 0.9rem; }
          .hof-row-rank { width: 24px; height: 24px; min-width: 24px; font-size: 0.7rem; }
          .hof-row-name { font-size: 0.9rem; }
          .hof-row-value { font-size: 1rem; }

          .hof-match-card { flex-direction: column; align-items: stretch; }
          .hof-match-team { flex-direction: row; justify-content: flex-start; }
          .hof-match-logo { width: 40px; height: 40px; min-width: 40px; }
          .hof-match-score { flex-direction: row; justify-content: space-between; }
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
                placeholder="Buscar jogador ou clube..."
                disabled
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
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Hall da Fama</h2>
            <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
              Os recordes históricos de todas as temporadas e torneios
            </p>
          </div>

          {!loading && hallDaFama && (
            <>
              {/* Recordes individuais vitalícios */}
              <div className="hof-section">
                <div className="hof-section-title">
                  <Target size={22} /> Artilheiro Máximo
                </div>
                <RecordeJogadorLista recordes={hallDaFama.artilheiroMaximo} resolveImagem={resolveImagem} />
              </div>

              <div className="hof-section">
                <div className="hof-section-title">
                  <Trophy size={22} /> Maior Colecionador de Títulos
                </div>
                <RecordeJogadorLista recordes={hallDaFama.maisTitulos} resolveImagem={resolveImagem} />
              </div>

              <div className="hof-section">
                <div className="hof-section-title">
                  <Award size={22} /> Mais Finais Disputadas
                </div>
                <RecordeJogadorLista recordes={hallDaFama.maisFinais} resolveImagem={resolveImagem} />
              </div>

              <div className="hof-section">
                <div className="hof-section-title">
                  <Users size={22} /> Mais Partidas Disputadas
                </div>
                <RecordeJogadorLista recordes={hallDaFama.maisPartidas} resolveImagem={resolveImagem} />
              </div>

              {hallDaFama.melhorAproveitamento && (
                <div className="hof-section">
                  <div className="hof-section-title">
                    <Percent size={22} /> Melhor Aproveitamento
                  </div>
                  <RecordeJogadorLista recordes={[hallDaFama.melhorAproveitamento]} resolveImagem={resolveImagem} />
                </div>
              )}

              {/* Recordes por temporada */}
              <div className="hof-section">
                <div className="hof-section-title">
                  <Swords size={22} /> Melhor Ataque numa Temporada
                </div>
                <RecordeTemporadaLista recordes={hallDaFama.melhorAtaqueTemporada} resolveImagem={resolveImagem} sufixo="gols" />
              </div>

              <div className="hof-section">
                <div className="hof-section-title">
                  <ShieldCheck size={22} /> Melhor Defesa numa Temporada
                </div>
                <RecordeTemporadaLista recordes={hallDaFama.melhorDefesaTemporada} resolveImagem={resolveImagem} sufixo="gols sofridos" />
              </div>

              {/* Recordes de partida */}
              <div className="hof-section">
                <div className="hof-section-title">
                  <Zap size={22} /> Partida com Mais Gols
                </div>
                <RecordePartidaLista recordes={hallDaFama.partidaComMaisGols} resolveImagem={resolveImagem} />
              </div>

              <div className="hof-section">
                <div className="hof-section-title">
                  <Flame size={22} /> Maior Goleada da História
                </div>
                <RecordePartidaLista recordes={hallDaFama.maiorGoleada} resolveImagem={resolveImagem} />
              </div>

              {/* Recorde de clube */}
              <div className="hof-section">
                <div className="hof-section-title">
                  <Shield size={22} /> Clube com Mais Títulos
                </div>
                {hallDaFama.clubeComMaisTitulos.length === 0 ? (
                  <div className="hof-empty">Ainda sem dados suficientes.</div>
                ) : (
                  <div className="hof-list">
                    {hallDaFama.clubeComMaisTitulos.map((clube, index) => (
                      <HofListRow
                        key={clube.clubeId}
                        imagemUrl={resolveImagem(clube.clubeImagem)}
                        iniciais={clube.clubeNome.substring(0, 2).toUpperCase()}
                        nome={clube.clubeNome}
                        subtitulo="Clube"
                        valor={String(clube.titulos)}
                        valorLabel="Títulos"
                        rank={index + 1}
                        mostrarRank={hallDaFama.clubeComMaisTitulos.length > 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
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
    </div>
  );
}

// ---- Subcomponentes internos ----

function HofListRow({
  imagemUrl,
  iniciais,
  nome,
  subtitulo,
  valor,
  valorLabel,
  rank,
  mostrarRank,
  avatarQuadrado = false,
}: {
  imagemUrl: string | null;
  iniciais: string;
  nome: string;
  subtitulo: string;
  valor: string;
  valorLabel?: string;
  rank?: number;
  mostrarRank?: boolean;
  avatarQuadrado?: boolean;
}) {
  return (
    <div className="hof-row">
      {mostrarRank && <div className="hof-row-rank">#{rank}</div>}
      <div
        className={`hof-row-avatar${avatarQuadrado ? ' square' : ''}`}
        style={imagemUrl ? { backgroundImage: `url(${imagemUrl})` } : undefined}
      >
        {!imagemUrl && iniciais}
      </div>
      <div className="hof-row-info">
        <div className="hof-row-name">{nome}</div>
        <div className="hof-row-subtitle">{subtitulo}</div>
      </div>
      <div className="hof-row-value-wrap">
        <div className="hof-row-value">{valor}</div>
        {valorLabel && <div className="hof-row-value-label">{valorLabel}</div>}
      </div>
    </div>
  );
}

function RecordeJogadorLista({
  recordes,
  resolveImagem
}: {
  recordes: any[];
  resolveImagem: (img: string | null) => string | null;
}) {
  if (!recordes || recordes.length === 0) {
    return <div className="hof-empty">Ainda sem dados suficientes.</div>;
  }

  return (
    <div className="hof-list">
      {recordes.map((r, index) => (
        <HofListRow
          key={r.jogadorId}
          imagemUrl={resolveImagem(r.jogadorImagem)}
          iniciais={r.jogadorNome.substring(0, 2).toUpperCase()}
          nome={r.jogadorNome}
          subtitulo="Recorde histórico"
          valor={r.valorFormatado}
          rank={index + 1}
          mostrarRank={recordes.length > 1}
        />
      ))}
    </div>
  );
}

function RecordeTemporadaLista({
  recordes,
  resolveImagem,
  sufixo
}: {
  recordes: any[];
  resolveImagem: (img: string | null) => string | null;
  sufixo: string;
}) {
  if (!recordes || recordes.length === 0) {
    return <div className="hof-empty">Ainda sem dados suficientes.</div>;
  }

  return (
    <div className="hof-list">
      {recordes.map((r, index) => (
        <HofListRow
          key={`${r.jogadorId}-${r.temporadaNome}`}
          imagemUrl={resolveImagem(r.jogadorImagem)}
          iniciais={r.jogadorNome.substring(0, 2).toUpperCase()}
          nome={r.jogadorNome}
          subtitulo={`${r.temporadaNome} · ${r.partidasJogadas} partidas`}
          valor={String(r.valor)}
          valorLabel={sufixo}
          rank={index + 1}
          mostrarRank={recordes.length > 1}
        />
      ))}
    </div>
  );
}

function RecordePartidaLista({
  recordes,
  resolveImagem
}: {
  recordes: any[];
  resolveImagem: (img: string | null) => string | null;
}) {
  if (!recordes || recordes.length === 0) {
    return <div className="hof-empty">Ainda sem dados suficientes.</div>;
  }

  const formatarData = (dataString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date(dataString));
  };

  return (
    <div className="hof-list">
      {recordes.map((r) => {
        const logoMandante = resolveImagem(r.mandante.clubeImagem);
        const logoVisitante = resolveImagem(r.visitante.clubeImagem);
        return (
          <div key={r.partidaId} className="hof-match-card">
            <div className="hof-match-team">
              <div
                className="hof-match-logo"
                style={logoMandante ? { backgroundImage: `url(${logoMandante})` } : undefined}
              ></div>
              <span className="hof-match-player">{r.mandante.jogadorNome}</span>
              <span className="hof-match-club">{r.mandante.clubeSigla}</span>
            </div>

            <div className="hof-match-score">
              <span className="hof-match-score-num">{r.golsMandante} × {r.golsVisitante}</span>
              <span className="hof-match-meta">
                {formatarData(r.dataHora)}{r.estadio ? ` · ${r.estadio}` : ''}
              </span>
            </div>

            <div className="hof-match-team">
              <div
                className="hof-match-logo"
                style={logoVisitante ? { backgroundImage: `url(${logoVisitante})` } : undefined}
              ></div>
              <span className="hof-match-player">{r.visitante.jogadorNome}</span>
              <span className="hof-match-club">{r.visitante.clubeSigla}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}