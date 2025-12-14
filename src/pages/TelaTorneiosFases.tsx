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
  ArrowLeft
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupNovaFase from '../components/PopupNovaFase';

interface FaseTorneioDTO {
  id: string;
  nome: string;
  ordem: number;
  torneioId: string;
  torneioNome: string;
  tipoTorneio: string;
  numeroRodadas: number | null;
  faseInicialMataMata: string | null;
  temJogoVolta: boolean | null;
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

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const fetchFasesPorTorneioService = async (torneioId: string) => {
  const response = await API.get(`/fase-torneio/torneio/${torneioId}`);
  return response.data;
};

export function TelaTorneiosFases() {
  const navigate = useNavigate();
  const { torneioId, temporadaId } = useParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: avatars = [] } = useQuery<Avatar[]>({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const { data: fases = [], isLoading } = useQuery<FaseTorneioDTO[]>({
    queryKey: ['fases', torneioId],
    queryFn: () => fetchFasesPorTorneioService(torneioId || ''),
    enabled: !!torneioId,
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
  const [showNovaFasePopup, setShowNovaFasePopup] = useState(false);
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

  const handleNovaFaseSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ['fases', torneioId] });
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const filteredFases = fases.filter((fase) => {
    const term = searchTerm.toLowerCase();
    return fase.nome.toLowerCase().includes(term);
  });

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const formatTipoTorneio = (tipo: string) => {
    switch (tipo) {
        case 'GRUPOS': return 'Fase de Grupos';
        case 'PONTOS_CORRIDOS': return 'Pontos Corridos';
        case 'MATA_MATA': return 'Mata-Mata';
        case 'JOGO_UNICO': return 'Jogo Único';
        default: return tipo;
    }
  };

  const getDetalhesFase = (fase: FaseTorneioDTO) => {
    if (fase.tipoTorneio === 'PONTOS_CORRIDOS' || fase.tipoTorneio === 'GRUPOS') {
        return `${fase.numeroRodadas} Rodadas`;
    }
    if (fase.tipoTorneio === 'MATA_MATA') {
        return `${fase.faseInicialMataMata} ${fase.temJogoVolta ? '(Ida e Volta)' : '(Jogo Único)'}`;
    }
    return '-';
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

        .badge-type {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            background-color: var(--hover-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
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
          <a href="#" className="nav-item">
            <Star size={20} /> Títulos
          </a>
          <a onClick={() => navigate('/temporadas')} className="nav-item active" style={{cursor: 'pointer'}}>
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
                placeholder="Buscar fase..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
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

            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Fases do Torneio</h2>
                    <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Gerencie as etapas deste torneio</p>
                </div>

                {currentUser && ['DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo) && (
                    <button 
                      className="t-btn" 
                      onClick={() => setShowNovaFasePopup(true)}
                      style={{background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px'}}
                    >
                        <Plus size={18} /> Nova Fase
                    </button>
                )}
            </div>

            <div className="table-container">
              {isLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>Carregando fases...</div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{width: '80px', textAlign: 'center'}}>Ordem</th>
                      <th>Nome da Fase</th>
                      <th>Tipo</th>
                      <th>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFases.map((fase) => (
                        <tr key={fase.id} onClick={() => navigate(`/${temporadaId}/torneio/${torneioId}/fase/${fase.id}`)}>
                          <td style={{textAlign: 'center', fontWeight: 'bold'}}>{fase.ordem}</td>
                          <td>{fase.nome}</td>
                          <td>
                              <span className="badge-type">{formatTipoTorneio(fase.tipoTorneio)}</span>
                          </td>
                          <td style={{color: 'var(--text-gray)'}}>
                              {getDetalhesFase(fase)}
                          </td>
                        </tr>
                    ))}
                    {filteredFases.length === 0 && (
                      <tr>
                          <td colSpan={4} style={{textAlign: 'center', padding: '30px', color: 'var(--text-secondary)'}}>
                              Nenhuma fase encontrada
                          </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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

      {showNovaFasePopup && (
        <PopupNovaFase 
          onClose={() => setShowNovaFasePopup(false)} 
          onSubmit={handleNovaFaseSubmit} 
        />
      )}
    </div>
  );
}