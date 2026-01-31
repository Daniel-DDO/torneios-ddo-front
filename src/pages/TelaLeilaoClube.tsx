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
  DollarSign,
  Clock,
  Award,
  ChevronLeft
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';

interface Leilao {
  id: string;
  ativo: boolean;
}

interface ItemRankingDTO {
  nomeJogador: string;
  valorOfertado: number;
  prioridadeEscolhida: number;
  dataLance: string;
}

interface DisputaClubeDTO {
  clubeId: string;
  clubeNome: string;
  imagemClube: string;
  totalInteressados: number;
  ranking: ItemRankingDTO[];
}

interface UserData {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  cargo: string;
  saldoVirtual: number;
  finais: number;
  titulos: number;
  golsMarcados: number;
  partidasJogadas: number;
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

const fetchLeiloesPorTemporadaService = async (temporadaId: string) => {
  const response = await API.get(`/api/leiloes/temporada/${temporadaId}`);
  return response.data;
};

const fetchDisputaClube = async (leilaoId: string, clubeId: string) => {
  const response = await API.get(`/api/leiloes/${leilaoId}/disputa/${clubeId}`);
  return response.data;
};

export function TelaLeilaoClube() {
  const navigate = useNavigate();
  const { temporadaId, clubeId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const { data: avatars = [] } = useQuery<Avatar[]>({
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

  const { data: leiloes = [] } = useQuery<Leilao[]>({
    queryKey: ['leiloes', temporadaId],
    queryFn: () => fetchLeiloesPorTemporadaService(temporadaId || ''),
    enabled: !!temporadaId,
  });

  const activeLeilao = useMemo(() => {
    const listaLeiloes = Array.isArray(leiloes) ? leiloes : [];
    return listaLeiloes.find(l => l.ativo);
  }, [leiloes]);

  const { data: disputa, isLoading } = useQuery<DisputaClubeDTO>({
    queryKey: ['disputa-clube', activeLeilao?.id, clubeId],
    queryFn: () => fetchDisputaClube(activeLeilao!.id, clubeId || ''),
    enabled: !!activeLeilao?.id && !!clubeId,
    refetchInterval: 5000 
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
      const parsed = JSON.parse(storedUser);
      setCurrentUser({
        finais: 0,
        titulos: 0,
        golsMarcados: 0,
        partidasJogadas: 0,
        ...parsed
      });
    }
  }, []);

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

  const formatDataHoraBrasilia = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString.endsWith('Z') ? dateString : `${dateString}Z`);
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      {/* Estilos locais refinados para complementar o CSS global */}
      <style>{`
        .clube-header-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 30px;
            display: flex;
            align-items: center;
            gap: 24px;
            margin-bottom: 30px;
            box-shadow: var(--shadow-sm);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            animation: fadeInUp 0.6s ease-out forwards;
        }

        .clube-header-card:hover {
            box-shadow: var(--shadow-md);
            border-color: var(--primary);
            transform: translateY(-2px);
        }

        .clube-header-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 6px;
            height: 100%;
            background: var(--primary);
        }

        .clube-big-img {
            width: 90px;
            height: 90px;
            object-fit: contain;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
            transition: transform 0.3s;
        }

        .clube-header-card:hover .clube-big-img {
            transform: scale(1.05);
        }

        .clube-title h2 {
            font-size: 2rem;
            font-weight: 800;
            margin: 0 0 8px 0;
            color: var(--text-dark);
            letter-spacing: -0.5px;
        }

        .stat-badge {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            padding: 8px 16px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 0.9rem;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .ranking-table-container {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: var(--shadow-sm);
            animation: fadeInUp 0.8s ease-out forwards;
        }

        .ranking-row {
            display: grid;
            grid-template-columns: 80px 2fr 1fr 1.5fr 1.5fr;
            align-items: center;
            padding: 18px 30px;
            border-bottom: 1px solid var(--border-color);
            transition: all 0.2s;
        }

        .ranking-row:last-child {
            border-bottom: none;
        }

        .ranking-row:hover {
            background: var(--hover-bg);
        }

        .ranking-header {
            background: var(--bg-body);
            font-weight: 700;
            color: var(--text-gray);
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .pos-badge {
            width: 36px;
            height: 36px;
            border-radius: 12px;
            background: var(--bg-body);
            color: var(--text-gray);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-sm);
        }

        .pos-1 { background: #FFD700; color: #fff; border-color: #eab308; box-shadow: 0 4px 10px rgba(234, 179, 8, 0.3); }
        .pos-2 { background: #C0C0C0; color: #fff; border-color: #9ca3af; }
        .pos-3 { background: #CD7F32; color: #fff; border-color: #fdba74; }

        .priority-tag {
            background: var(--primary);
            color: white;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 700;
            box-shadow: 0 2px 6px rgba(78, 62, 255, 0.2);
        }

        .value-highlight {
            font-weight: 800;
            color: #10b981;
            font-size: 1.1rem;
            font-family: 'Inter', monospace;
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
                placeholder="Buscar..." 
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

        {/* Usando .page-content do CSS global para consistência */}
        <div className="page-content">
            <button 
                onClick={() => navigate(`/${temporadaId}/torneios/leilao`)} 
                className="back-btn-custom"
            >
                <ChevronLeft size={18} /> Voltar para o Leilão
            </button>

            {isLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-gray)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div className="tp-hero-skeleton" style={{width: '100px', height: '100px', borderRadius: '50%'}}></div>
                    <p>Carregando detalhes...</p>
                </div>
            ) : !disputa ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-gray)' }}>Disputa não encontrada.</div>
            ) : (
                <>
                    <div className="clube-header-card">
                        <img src={disputa.imagemClube} alt={disputa.clubeNome} className="clube-big-img" />
                        <div className="clube-title">
                            <h2>{disputa.clubeNome}</h2>
                            <div className="stat-badge">
                                <Users size={16} />
                                {disputa.totalInteressados} Interessados na disputa
                            </div>
                        </div>
                    </div>

                    <div className="ranking-table-container">
                        <div className="ranking-row ranking-header">
                            <div>Pos</div>
                            <div>Jogador</div>
                            <div style={{textAlign: 'center'}}>Prioridade</div>
                            <div>Data do Lance</div>
                            <div style={{textAlign: 'right'}}>Valor</div>
                        </div>

                        {disputa.ranking.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-gray)' }}>
                                <div style={{background: 'var(--hover-bg)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'}}>
                                    <DollarSign size={24} color="var(--text-gray)" />
                                </div>
                                Nenhum lance registrado para este clube ainda.
                            </div>
                        ) : (
                            disputa.ranking.map((item, index) => (
                                <div key={index} className="ranking-row">
                                    <div>
                                        <div className={`pos-badge pos-${index + 1}`}>
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {item.nomeJogador}
                                        {index === 0 && <Award size={18} color="#f59e0b" fill="#f59e0b" />}
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <span className="priority-tag">{item.prioridadeEscolhida}ª Opção</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-gray)' }}>
                                        <Clock size={14} />
                                        {formatDataHoraBrasilia(item.dataLance)}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className="value-highlight">{formatMoney(item.valorOfertado)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>

      </main>

      {showLoginPopup && (
        <PopupLogin 
          onClose={() => setShowLoginPopup(false)} 
          onLoginSuccess={(u) => {
            setCurrentUser({
                finais: 0,
                titulos: 0,
                golsMarcados: 0,
                partidasJogadas: 0,
                ...u
            });
            setShowLoginPopup(false);
          }} 
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