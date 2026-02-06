import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
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
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

interface JogadorClubeDTO {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string;
  clubeId: string;
  clubeNome: string;
  clubeImagem: string;
  clubeSigla: string;
  temporadaId: string;
  temporadaNome: string;
  golsMarcados: number;
  golsSofridos: number;
  jogos: number;
  pontosCoeficiente: number;
  statusTemporada: string;
  vitorias: number;
  empates: number;
  derrotas: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  balancoFinanceiro: number;
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

type SortDirection = 'asc' | 'desc' | null;
type SortKey = 'clube' | 'jogador' | 'partidas' | 'ved' | 'gp' | 'gc' | 'coeficiente';

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const fetchInscritosService = async (temporadaId: string) => {
  const response = await API.get(`/inscricao/temporada/${temporadaId}`);
  return response.data;
};

export function TelaTorneiosJogadores() {
  const navigate = useNavigate();
  const { temporadaId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: SortDirection }>({
    key: null,
    direction: null,
  });

  const { data: avatars = [] } = useQuery<Avatar[]>({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
  });

  const { data: inscritos = [], isLoading, isPlaceholderData } = useQuery<JogadorClubeDTO[]>({
    queryKey: ['inscritos', temporadaId],
    queryFn: () => fetchInscritosService(temporadaId || ''),
    enabled: !!temporadaId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: Avatar) => {
      map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

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

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }

    setSortConfig({ key: direction ? key : null, direction });
  };

  const filteredAndSortedInscritos = useMemo(() => {
    let result = inscritos.filter((item) => {
      const term = searchTerm.toLowerCase();
      return item.jogadorNome.toLowerCase().includes(term) || item.clubeNome.toLowerCase().includes(term);
    });

    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
        
        switch (sortConfig.key) {
          case 'clube':
            return a.clubeNome.localeCompare(b.clubeNome) * multiplier;
          case 'jogador':
            return a.jogadorNome.localeCompare(b.jogadorNome) * multiplier;
          case 'partidas':
            return (a.jogos - b.jogos) * multiplier;
          case 'ved':
            if (a.vitorias !== b.vitorias) return (a.vitorias - b.vitorias) * multiplier;
            if (a.empates !== b.empates) return (a.empates - b.empates) * multiplier;
            return (b.derrotas - a.derrotas) * multiplier;
          case 'gp':
            return (a.golsMarcados - b.golsMarcados) * multiplier;
          case 'gc':
            return (a.golsSofridos - b.golsSofridos) * multiplier;
          case 'coeficiente':
            return (a.pontosCoeficiente - b.pontosCoeficiente) * multiplier;
          default:
            return 0;
        }
      });
    }

    return result;
  }, [inscritos, searchTerm, sortConfig]);

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key || !sortConfig.direction) {
      return <ChevronsUpDown size={14} style={{ opacity: 0.3 }} />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} style={{ color: 'var(--primary)' }} /> 
      : <ArrowDown size={14} style={{ color: 'var(--primary)' }} />;
  };

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

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
          position: relative;
        }

        .loading-overlay-smooth {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--primary), transparent);
          background-size: 200% 100%;
          animation: loading-bar 1.5s infinite linear;
          z-index: 10;
        }

        @keyframes loading-bar {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
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
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s;
        }

        .custom-table th:hover {
          background-color: var(--border-color);
          color: var(--text-dark);
        }

        .th-content {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .th-content.center {
            justify-content: center;
        }

        .th-content.right {
            justify-content: flex-end;
        }

        .custom-table td {
          color: var(--text-dark);
          font-size: 1rem;
        }

        .custom-table tbody tr {
          transition: background-color 0.2s;
        }

        .custom-table tbody tr:hover {
          background-color: var(--hover-bg);
        }

        .custom-table tr:last-child td {
          border-bottom: none;
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

        .clube-cell {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .clube-logo-mini {
            width: 32px;
            height: 32px;
            object-fit: contain;
        }

        .ved-cell {
            font-size: 0.9rem;
            color: var(--text-gray);
            letter-spacing: 1px;
        }

        @media (max-width: 768px) {
          .page-content { padding: 1rem; }
          .custom-table th, .custom-table td { padding: 12px; }
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
                placeholder="Buscar jogador ou clube..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            <button onClick={() => navigate(`/${temporadaId}/torneios`)} className="back-button">
                <ArrowLeft size={16} /> Voltar para Torneios
            </button>

            <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Jogadores da Temporada</h2>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Lista de inscritos e seus desempenhos gerais</p>
            </div>

            <div className="table-container">
              {isLoading && !inscritos.length ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>Carregando dados...</div>
              ) : (
                <>
                {isPlaceholderData && <div className="loading-overlay-smooth" />}
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('clube')}>
                        <div className="th-content">
                            Clube {renderSortIcon('clube')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('jogador')}>
                        <div className="th-content">
                            Jogador {renderSortIcon('jogador')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('partidas')}>
                        <div className="th-content center">
                            Partidas {renderSortIcon('partidas')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('ved')}>
                        <div className="th-content center">
                            V-E-D {renderSortIcon('ved')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('gp')}>
                        <div className="th-content center">
                            Gols Pró {renderSortIcon('gp')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('gc')}>
                        <div className="th-content center">
                            Gols Contra {renderSortIcon('gc')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('coeficiente')}>
                        <div className="th-content right">
                            Coeficiente {renderSortIcon('coeficiente')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedInscritos.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="clube-cell">
                                <img src={item.clubeImagem} alt={item.clubeNome} className="clube-logo-mini" />
                                <span>{item.clubeNome}</span>
                            </div>
                          </td>
                          <td>{item.jogadorNome}</td>
                          <td style={{textAlign: 'center'}}>{item.jogos}</td>
                          <td style={{textAlign: 'center'}}>
                              <span className="ved-cell">
                                {item.vitorias}-{item.empates}-{item.derrotas}
                              </span>
                          </td>
                          <td style={{textAlign: 'center', color: '#10b981'}}>{item.golsMarcados}</td>
                          <td style={{textAlign: 'center', color: '#ef4444'}}>{item.golsSofridos}</td>
                          <td style={{textAlign: 'right', fontWeight: 'bold'}}>{item.pontosCoeficiente.toFixed(3)}</td>
                        </tr>
                    ))}
                    {filteredAndSortedInscritos.length === 0 && (
                      <tr>
                          <td colSpan={7} style={{textAlign: 'center', padding: '30px', color: 'var(--text-secondary)'}}>
                              {searchTerm ? 'Nenhum resultado para a busca' : 'Nenhum jogador inscrito encontrado'}
                          </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </>
              )}
            </div>
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