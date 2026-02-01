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
  Bell, 
  Gamepad2, 
  Star,
  Lightbulb,
  Settings,
  CalendarSync,
  ChevronLeft,
  Gavel,
  AlertCircle
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import LoadingSpinner from '../components/LoadingSpinner';

interface Leilao {
  id: string;
  descricao: string;
  temporadaId: string;
  ativo: boolean;
}

interface ResultadoParcialDTO {
  nomeClube: string;
  imagemClube: string;
  nomeVencedor: string;
  valor: number;
  prioridade: number;
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
}

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const fetchLeiloesPorTemporadaService = async (temporadaId: string) => {
  const response = await API.get(`/api/leiloes/temporada/${temporadaId}`);
  return response.data;
};

const fetchResultadosParciais = async (leilaoId: string) => {
  const response = await API.get(`/api/leiloes/${leilaoId}/resultados-parciais`);
  return response.data;
};

export function TelaLeilaoParciais() {
  const navigate = useNavigate();
  const { temporadaId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const { data: avatars = [] } = useQuery<Avatar[]>({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const { data: leiloes = [] } = useQuery<Leilao[]>({
    queryKey: ['leiloes', temporadaId],
    queryFn: () => fetchLeiloesPorTemporadaService(temporadaId || ''),
    enabled: !!temporadaId,
  });

  const leilaoId = useMemo(() => {
    if (Array.isArray(leiloes) && leiloes.length > 0) {
        return leiloes[0].id;
    }
    return null;
  }, [leiloes]);

  const { data: resultadosParciais = [], isLoading: isLoadingParciais } = useQuery<ResultadoParcialDTO[]>({
    queryKey: ['resultados-parciais', leilaoId],
    queryFn: () => fetchResultadosParciais(leilaoId!),
    enabled: !!leilaoId,
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

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const formatMoney = (value: number) => {
    return `D$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      <style>{`
        .table-container {
            background: var(--bg-card);
            border-radius: 16px;
            border: 1px solid var(--border-color);
            overflow: hidden;
            box-shadow: var(--shadow-sm);
        }
        .custom-table {
            width: 100%;
            border-collapse: collapse;
        }
        .custom-table th {
            text-align: left;
            padding: 14px 20px;
            background: var(--hover-bg);
            color: var(--text-gray);
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            border-bottom: 1px solid var(--border-color);
        }
        .custom-table td {
            padding: 14px 20px;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-dark);
            vertical-align: middle;
        }
        .custom-table tr:last-child td {
            border-bottom: none;
        }
        .custom-table tr:hover {
            background: var(--hover-bg);
        }
        .clube-row-img {
            width: 40px;
            height: 40px;
            object-fit: contain;
            margin-right: 12px;
        }
        .back-btn-custom {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            padding: 10px 20px;
            border-radius: 12px;
            color: var(--text-gray);
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 24px;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-sm);
        }
        .back-btn-custom:hover {
            background: var(--hover-bg);
            color: var(--primary);
            border-color: var(--primary);
            transform: translateX(-4px);
        }
        .priority-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            font-weight: bold;
            font-size: 0.8rem;
        }
        .priority-1 { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .priority-2 { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
        .priority-3 { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
        .priority-other { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        @media (max-width: 1024px) {
            .panels-grid { grid-template-columns: 1fr; }
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
                placeholder="Buscar clube ou vencedor..." 
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
                className="t-btn"
                style={{background: 'var(--primary)', color: 'white', border: 'none'}}
                onClick={() => setShowLoginPopup(true)}
              >
                Login
              </button>
            )}
          </div>
        </header>

        <div className="page-content">
            <button onClick={() => navigate(`/${temporadaId}/torneios/leilao`)} className="back-btn-custom">
                <ChevronLeft size={18} /> Voltar para o Leilão
            </button>

            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Gavel size={28} color="var(--primary)" />
                    Resultados Parciais
                </h2>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', margin: '4px 0 0' }}>
                    Acompanhe em tempo real quem está vencendo a disputa por cada clube.
                </p>
            </div>

            {isLoadingParciais ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                    <LoadingSpinner isLoading={true} />
                    <p style={{marginTop: 10}}>Calculando parciais...</p>
                </div>
            ) : resultadosParciais.length > 0 ? (
                <div className="table-container">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Clube</th>
                                <th>Vencedor Atual</th>
                                <th style={{ textAlign: 'center' }}>Prioridade</th>
                                <th style={{ textAlign: 'right' }}>Lance Atual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resultadosParciais
                                .filter(item => 
                                    item.nomeClube.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    item.nomeVencedor.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .sort((a, b) => b.valor - a.valor)
                                .map((item, index) => (
                                <tr key={`${item.nomeClube}-${index}`}>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center'}}>
                                            <img src={item.imagemClube} alt={item.nomeClube} className="clube-row-img" />
                                            <div style={{ fontWeight: 600 }}>{item.nomeClube}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                            <div style={{
                                                width: 24, height: 24, borderRadius: '50%', background: 'var(--hover-bg)', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--primary)'
                                            }}>
                                                {item.nomeVencedor.charAt(0)}
                                            </div>
                                            <span style={{fontWeight: 500}}>{item.nomeVencedor}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`priority-badge priority-${item.prioridade <= 3 ? item.prioridade : 'other'}`}>
                                            {item.prioridade}º
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                            {formatMoney(item.valor)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
                    <AlertCircle size={48} color="var(--border-color)" style={{marginBottom: 16}} />
                    <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Nenhum resultado parcial</h3>
                    <p style={{ fontSize: '0.9rem' }}>Ainda não há lances registrados neste leilão.</p>
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
    </div>
  );
}