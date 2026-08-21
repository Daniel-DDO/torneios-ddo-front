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
  Wand2,
  ImageOff
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupUser from '../components/PopupUser';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

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

interface ConquistaResumo {
  id: string;
  tituloNome: string;
  tituloImagem: string | null;
  nomeEdicao: string;
  jogadorNome: string;
  clubeNome: string;
  imagem: string | null;
  dataConquista: string;
}

type StatusGeracao = 'idle' | 'gerando' | 'sucesso' | 'erro';

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const fetchConquistasService = async (): Promise<ConquistaResumo[]> => {
  const response = await API.get('/titulos/conquistas');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

export function TelaConquistasAdm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [statusPorConquista, setStatusPorConquista] = useState<Record<string, StatusGeracao>>({});

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const {
    data: conquistas = [],
    isLoading: carregandoConquistas,
    refetch: refetchConquistas
  } = useQuery({
    queryKey: ['conquistas-admin'],
    queryFn: fetchConquistasService,
    enabled: isAuthorized,
    staleTime: 1000 * 60,
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: Avatar) => {
      map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

  const conquistasFiltradas = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    if (!termo) return conquistas;

    return conquistas.filter((c: ConquistaResumo) =>
      c.jogadorNome.toLowerCase().includes(termo) ||
      c.clubeNome.toLowerCase().includes(termo) ||
      c.tituloNome.toLowerCase().includes(termo) ||
      c.nomeEdicao.toLowerCase().includes(termo)
    );
  }, [conquistas, termoBusca]);

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
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);

      if (['PROPRIETARIO', 'DIRETOR'].includes(parsedUser.cargo)) {
        setIsAuthorized(true);
      } else {
        navigate('/admin');
      }
    } else {
      navigate('/');
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      setCurrentUser(null);
      setShowUserPopup(false);
      navigate('/');
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleGerarArte = async (conquistaId: string) => {
    setStatusPorConquista(prev => ({ ...prev, [conquistaId]: 'gerando' }));

    try {
      await API.post(`/titulos/conquistas/${conquistaId}/forcar-arte`);
      setStatusPorConquista(prev => ({ ...prev, [conquistaId]: 'sucesso' }));
      setTimeout(() => {
        refetchConquistas();
        setStatusPorConquista(prev => ({ ...prev, [conquistaId]: 'idle' }));
      }, 4000);
    } catch (error) {
      setStatusPorConquista(prev => ({ ...prev, [conquistaId]: 'erro' }));
      setTimeout(() => {
        setStatusPorConquista(prev => ({ ...prev, [conquistaId]: 'idle' }));
      }, 4000);
    }
  };

  const textoBotao = (status: StatusGeracao) => {
    if (status === 'gerando') return 'Gerando...';
    if (status === 'sucesso') return 'Enviado!';
    if (status === 'erro') return 'Falhou, tentar de novo';
    return 'Gerar arte';
  };

  if (!isAuthorized) {
    return <LoadingSpinner isLoading={true} />;
  }

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      <LoadingSpinner isLoading={loading} />

      <style>{`
        .page-content {
          padding: 2rem 3rem;
        }

        .admin-header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .conquistas-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            gap: 16px;
            flex-wrap: wrap;
        }

        .conquistas-search {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 8px 14px;
            min-width: 280px;
            color: var(--text-gray);
        }

        .conquistas-search input {
            border: none;
            outline: none;
            background: transparent;
            color: var(--text-dark);
            width: 100%;
            font-size: 0.9rem;
        }

        .conquistas-lista {
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .conquista-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .conquista-thumb {
            width: 56px;
            height: 56px;
            border-radius: 10px;
            object-fit: cover;
            background: var(--bg-hover, rgba(0,0,0,0.05));
            flex-shrink: 0;
        }

        .conquista-thumb-placeholder {
            width: 56px;
            height: 56px;
            border-radius: 10px;
            background: var(--bg-hover, rgba(0,0,0,0.05));
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-gray);
            flex-shrink: 0;
        }

        .conquista-info {
            flex: 1;
            min-width: 0;
        }

        .conquista-titulo-nome {
            font-weight: 700;
            color: var(--text-dark);
            font-size: 1rem;
        }

        .conquista-detalhe {
            color: var(--text-gray);
            font-size: 0.85rem;
            margin-top: 2px;
        }

        .conquista-acao {
            flex-shrink: 0;
        }

        .btn-gerar-arte {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: var(--radius);
            padding: 10px 16px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
            white-space: nowrap;
        }

        .btn-gerar-arte:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .btn-gerar-arte.status-erro {
            background: #d9534f;
        }

        .btn-gerar-arte.status-sucesso {
            background: #2e9e5b;
        }

        .conquistas-vazio {
            text-align: center;
            padding: 3rem 1rem;
            color: var(--text-gray);
        }

        @media (max-width: 900px) {
            .page-content { padding: 1rem; }
            .conquista-card { flex-wrap: wrap; }
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
              <input type="text" placeholder="Buscar no sistema..." />
            </div>
          </div>

          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
              <Lightbulb size={20} />
            </button>
            <BotaoNotificacao user={currentUser} />

            {currentUser && (
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
            )}
          </div>
        </header>

        <div className="page-content">
          <div className="admin-header-section">
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Conquistas</h2>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                Gerencie as artes de campeão geradas para cada conquista.
              </p>
            </div>
          </div>

          <div className="conquistas-toolbar">
            <div className="conquistas-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por jogador, clube ou título..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
            </div>
          </div>

          {carregandoConquistas && <LoadingSpinner isLoading={true} />}

          {!carregandoConquistas && conquistasFiltradas.length === 0 && (
            <div className="conquistas-vazio">Nenhuma conquista encontrada.</div>
          )}

          {!carregandoConquistas && conquistasFiltradas.length > 0 && (
            <div className="conquistas-lista">
              {conquistasFiltradas.map((conquista: ConquistaResumo) => {
                const status = statusPorConquista[conquista.id] || 'idle';
                return (
                  <div className="conquista-card" key={conquista.id}>
                    {conquista.imagem ? (
                      <img className="conquista-thumb" src={conquista.imagem} alt={conquista.tituloNome} />
                    ) : (
                      <div className="conquista-thumb-placeholder">
                        <ImageOff size={22} />
                      </div>
                    )}

                    <div className="conquista-info">
                      <div className="conquista-titulo-nome">
                        {conquista.tituloNome} — {conquista.nomeEdicao}
                      </div>
                      <div className="conquista-detalhe">
                        {conquista.jogadorNome} · {conquista.clubeNome} · {formatarData(conquista.dataConquista)}
                      </div>
                    </div>

                    <div className="conquista-acao">
                      <button
                        className={`btn-gerar-arte ${status === 'erro' ? 'status-erro' : ''} ${status === 'sucesso' ? 'status-sucesso' : ''}`}
                        disabled={status === 'gerando'}
                        onClick={() => handleGerarArte(conquista.id)}
                      >
                        <Wand2 size={16} />
                        {textoBotao(status)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

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