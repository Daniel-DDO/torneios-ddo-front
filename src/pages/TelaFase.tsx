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
  Bell,
  Gamepad2,
  Star,
  Lightbulb,
  Settings,
  CalendarSync,
  Plus,
  ArrowLeft,
  Dices,
  GitBranch,
  Download,
  Palette
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupAdicionarJFase from '../components/PopupAdicionarJFase';
import PopupColorirPos from '../components/PopupColorirPos';
import PopupSorteio from '../components/PopupSorteio';

interface FaseTorneioDTO {
  id: string;
  nome: string;
  ordem: number;
  torneioId: string;
  torneioNome: string;
  tipoTorneio: 'PONTOS_CORRIDOS' | 'GRUPOS' | 'MATA_MATA' | 'JOGO_UNICO';
  numeroRodadas: number | null;
  faseInicialMataMata: string | null;
  temJogoVolta: boolean | null;
}

interface ParticipanteFase {
  posicao: number;
  jogadorClubeId: string;
  nomeJogador: string;
  nomeClube: string;
  imagemClube: string;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldoGols: number;
  zonaNome: string;
  zonaCor: string;
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

export function TelaFase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { faseId, torneioId, temporadaId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showAddPlayerPopup, setShowAddPlayerPopup] = useState(false);
  const [showColorirPopup, setShowColorirPopup] = useState(false);
  const [showSorteioPopup, setShowSorteioPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const { data: avatars = [] } = useQuery<Avatar[]>({
    queryKey: ['avatares'],
    queryFn: async () => {
      const response = await API.get('/api/avatares');
      const data = response.data || response;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: fase, isLoading: isLoadingFase } = useQuery<FaseTorneioDTO>({
    queryKey: ['fase-detalhe', faseId],
    queryFn: async () => {
      const response = await API.get(`/fase-torneio/${faseId}`);
      return response.data;
    },
    enabled: !!faseId,
    retry: false
  });

  const { data: participantes = [], isLoading: isLoadingParticipantes } = useQuery<ParticipanteFase[]>({
    queryKey: ['participantes-fase', faseId],
    queryFn: async () => {
      const response = await API.get(`/participacao-fase/fase/${faseId}`);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!faseId,
    refetchInterval: 5000 
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: Avatar) => {
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

  const handleAddPlayerSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ['participantes-fase', faseId] });
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const isAdmin = currentUser && ['DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo);
  const isProprietario = currentUser && currentUser.cargo === 'PROPRIETARIO';

  const filteredParticipantes = useMemo(() => {
    return participantes.filter(p =>
      (p?.nomeJogador || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p?.nomeClube || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [participantes, searchTerm]);

  const legendas = useMemo(() => {
    const zones = new Map<string, string>();
    participantes.forEach(p => {
      if (p.zonaNome && p.zonaCor && p.zonaCor !== '#FFFFFF') {
        zones.set(p.zonaNome, p.zonaCor);
      }
    });
    return Array.from(zones.entries());
  }, [participantes]);

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>

      <style>{`
        .page-content { padding: 2rem 3rem; }
        .table-container {
          background-color: var(--bg-card);
          border-radius: var(--radius);
          border: 1px solid var(--border-color);
          overflow: hidden;
          margin-top: 24px;
          box-shadow: var(--shadow-sm);
        }
        .custom-table { width: 100%; border-collapse: collapse; }
        .custom-table th, .custom-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }
        .custom-table th {
          background-color: var(--hover-bg);
          color: var(--text-gray);
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
        }
        .custom-table td { color: var(--text-dark); font-size: 0.9rem; }
        .back-button {
          display: flex; align-items: center; gap: 8px;
          color: var(--text-gray); font-size: 0.9rem;
          margin-bottom: 1rem; cursor: pointer;
          border: none; background: none; padding: 0;
        }
        .back-button:hover { color: var(--primary); }
        .action-area { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn-action {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 8px;
          font-weight: 600; font-size: 0.85rem;
          cursor: pointer; border: none; transition: all 0.2s;
        }
        .btn-add { background: var(--primary); color: white; }
        .btn-utility { background: var(--hover-bg); color: var(--text-dark); border: 1px solid var(--border-color); }
        .clube-img-td { width: 28px; height: 28px; object-fit: contain; margin-right: 12px; }
        .legend-container {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 20px;
          padding: 15px;
          background: var(--bg-card);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }
        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 600; }
        .legend-color { width: 12px; height: 12px; border-radius: 3px; }
        @media (max-width: 768px) {
          .page-content { padding: 1rem; }
          .custom-table th, .custom-table td { padding: 8px; font-size: 0.8rem; }
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
          <a onClick={() => navigate('/jogadores')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Users size={20} /> Jogadores
          </a>
          <a onClick={() => navigate('/clubes')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Shield size={20} /> Clubes
          </a>
          <a onClick={() => navigate('/competicoes')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Trophy size={20} /> Competições
          </a>
          <a href="#" className="nav-item">
            <Star size={20} /> Títulos
          </a>
          <a onClick={() => navigate('/temporadas')} className="nav-item active" style={{ cursor: 'pointer' }}>
            <CalendarSync size={20} /> Temporadas
          </a>
          <div className="nav-separator"></div>
          <a href="#" className="nav-item">
            <Gamepad2 size={20} /> Partidas
          </a>
          <a onClick={() => navigate('/minha-conta')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Wallet size={20} /> Minha conta
          </a>
          <a href="#" className="nav-item">
            <Settings size={20} /> Suporte
          </a>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-header compact">
          <div className="left-header">
            <button className="toggle-btn menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <div className="search-bar">
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar na fase..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme}>
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
                {!getCurrentUserAvatar() && (currentUser?.nome?.charAt(0) || 'U')}
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
          <button onClick={() => navigate(`/${temporadaId}/torneio/${torneioId}/fases`)} className="back-button">
            <ArrowLeft size={16} /> Voltar para Fases
          </button>

          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{fase?.nome || 'Detalhes da Fase'}</h2>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>{fase?.torneioNome}</p>
            </div>

            <div className="action-area">
              {isAdmin && (
                <button className="btn-action btn-add" onClick={() => setShowAddPlayerPopup(true)}>
                  <Plus size={18} /> Adicionar Jogador
                </button>
              )}

              {isProprietario && (
                <button className="btn-action btn-utility" onClick={() => setShowColorirPopup(true)} style={{ background: '#6366f1', color: 'white' }}>
                  <Palette size={18} /> Colorir posições
                </button>
              )}

              {isProprietario && (
                <button className="btn-action btn-utility" onClick={() => setShowSorteioPopup(true)}>
                  <Dices size={18} /> Sortear
                </button>
              )}

              {isAdmin && fase?.tipoTorneio === 'MATA_MATA' && (
                fase.ordem === 1 ? (
                  <button className="btn-action btn-utility">
                    <GitBranch size={18} /> Gerar Bracket
                  </button>
                ) : (
                  <button className="btn-action btn-utility">
                    <Download size={18} /> Importar Classificados
                  </button>
                )
              )}
            </div>
          </div>

          {(isLoadingFase || isLoadingParticipantes) ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-gray)' }}>Carregando...</div>
          ) : (
            fase?.tipoTorneio === 'MATA_MATA' ? (
              <div className="bracket-container">
                <div className="bracket-column">
                  <h4 style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-gray)' }}>MATA-MATA</h4>
                  {participantes.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                      Não há jogadores nesta fase.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>Pos</th>
                        <th>Participante</th>
                        <th>P</th>
                        <th>J</th>
                        <th>V</th>
                        <th>E</th>
                        <th>D</th>
                        <th>GP</th>
                        <th>GC</th>
                        <th>SG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipantes.map((p) => (
                        <tr 
                          key={p.jogadorClubeId} 
                          style={{ borderLeft: (p.zonaCor && p.zonaCor !== '#FFFFFF') ? `5px solid ${p.zonaCor}` : '5px solid transparent' }}
                        >
                          <td style={{ fontWeight: 'bold' }}>{p.posicao}º</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <img src={p.imagemClube} alt={p.nomeClube} className="clube-img-td" />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600 }}>{p.nomeJogador}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-gray)' }}>{p.nomeClube}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{p.pontos}</td>
                          <td>{p.jogos}</td>
                          <td>{p.vitorias}</td>
                          <td>{p.empates}</td>
                          <td>{p.derrotas}</td>
                          <td>{p.golsPro}</td>
                          <td>{p.golsContra}</td>
                          <td style={{ fontWeight: '600', color: p.saldoGols > 0 ? '#10b981' : p.saldoGols < 0 ? '#ef4444' : 'inherit' }}>
                            {p.saldoGols}
                          </td>
                        </tr>
                      ))}
                      {filteredParticipantes.length === 0 && (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                            Nenhum participante encontrado nesta fase.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {legendas.length > 0 && (
                  <div className="legend-container">
                    {legendas.map(([nome, cor]) => (
                      <div key={nome} className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: cor }}></div>
                        <span>{nome}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
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

      {showAddPlayerPopup && (
        <PopupAdicionarJFase
          faseId={faseId || ''}
          temporadaId={temporadaId || ''}
          onClose={() => setShowAddPlayerPopup(false)}
          onSubmit={handleAddPlayerSubmit}
        />
      )}

      {showColorirPopup && (
        <PopupColorirPos
          faseId={faseId || ''}
          onClose={() => setShowColorirPopup(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['participantes-fase', faseId] });
          }}
        />
      )}

      {showSorteioPopup && (
        <PopupSorteio
          faseId={faseId || ''}
          onClose={() => setShowSorteioPopup(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['participantes-fase', faseId] });
            queryClient.invalidateQueries({ queryKey: ['fase-detalhe', faseId] });
          }}
        />
      )}
    </div>
  );
}