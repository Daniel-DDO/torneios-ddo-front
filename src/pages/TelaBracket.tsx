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
  Settings, 
  Search, 
  Bell, 
  Gamepad2, 
  Star,
  Lightbulb,
  CalendarSync,
  Loader2,
  ArrowLeft,
  Share2,
  AlertCircle,
  Swords
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TelaBracket.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';

interface PartidaParticipante {
  id: string;
  jogadorNome: string;
  clubeNome: string;
  clubeImagem: string;
  golsMarcados: number;
}

interface PartidaBracket {
  id: string;
  chaveIndex: number;
  etapaMataMata: string;
  tipoPartida: string;
  dataHora: string | null;
  status: string;
  mandante: PartidaParticipante | null;
  visitante: PartidaParticipante | null;
  golsMandante: number | null;
  golsVisitante: number | null;
  penaltisMandante: number | null;
  penaltisVisitante: number | null;
  vencedorId?: string;
}

interface ConfrontoAgrupado {
  chaveIndex: number;
  ida?: PartidaBracket;
  volta?: PartidaBracket;
  unico?: PartidaBracket;
}

interface UserData {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  cargo: 'PROPRIETARIO' | 'DIRETOR' | 'ADMINISTRADOR' | 'JOGADOR';
  saldoVirtual: number;
}

interface Avatar {
  id: string;
  url: string;
}

const STAGE_ORDER = [
  'TRINTA_E_DOIS_AVOS',
  'DEZESSEIS_AVOS',
  'OITAVAS',
  'QUARTAS',
  'SEMI',
  'FINAL',
  'TERCEIRO_LUGAR' 
];

const STAGE_LABELS: Record<string, string> = {
  'TRINTA_E_DOIS_AVOS': '32-avos',
  'DEZESSEIS_AVOS': '16-avos',
  'OITAVAS': 'Oitavas',
  'QUARTAS': 'Quartas',
  'SEMI': 'Semifinal',
  'FINAL': 'Grande Final',
  'TERCEIRO_LUGAR': '3º Lugar'
};

export function TelaBracket() {
  const navigate = useNavigate();
  const { faseId, torneioId, temporadaId } = useParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);

  const { data: avatars = [] } = useQuery<Avatar[]>({
    queryKey: ['avatares'],
    queryFn: async () => {
      const response = await API.get('/api/avatares');
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar) => { map[avatar.id] = avatar.url; });
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

  const { data: bracketData, isLoading } = useQuery<Record<string, PartidaBracket[]>>({
    queryKey: ['bracket-fase', faseId],
    queryFn: async () => {
      const response = await API.get(`/api/bracket/${faseId}`);
      return response.data;
    },
    enabled: !!faseId
  });

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const handleLoginSuccess = (userData: UserData) => setCurrentUser(userData);
  
  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      setCurrentUser(null);
      setShowUserPopup(false);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const agruparPartidas = (partidas: PartidaBracket[]): ConfrontoAgrupado[] => {
    const map = new Map<number, ConfrontoAgrupado>();

    partidas.forEach(p => {
      if (!map.has(p.chaveIndex)) {
        map.set(p.chaveIndex, { chaveIndex: p.chaveIndex });
      }
      const entry = map.get(p.chaveIndex)!;

      if (p.tipoPartida === 'MATA_MATA_IDA') entry.ida = p;
      else if (p.tipoPartida === 'MATA_MATA_VOLTA') entry.volta = p;
      else entry.unico = p;
    });

    return Array.from(map.values()).sort((a, b) => a.chaveIndex - b.chaveIndex);
  };

  const getOrderedStages = () => {
    if (!bracketData) return [];
    return STAGE_ORDER.filter(stage => bracketData[stage] && bracketData[stage].length > 0);
  };

  const getGeometry = (colIndex: number) => {
    const CARD_HEIGHT = 88;
    const BASE_GAP = 16;
    
    const multiplier = Math.pow(2, colIndex);
    
    const gap = (multiplier * (CARD_HEIGHT + BASE_GAP)) - CARD_HEIGHT;
    
    const paddingTop = colIndex === 0 ? 0 : ((multiplier - 1) * (CARD_HEIGHT + BASE_GAP)) / 2;

    return {
      gap: `${gap}px`,
      paddingTop: `${paddingTop}px`,
      connectorHeight: `${multiplier * (CARD_HEIGHT + BASE_GAP)}px`
    };
  };

  const renderConfronto = (confronto: ConfrontoAgrupado, stageKey: string) => {
    const jogo = confronto.unico || confronto.volta || confronto.ida;
    if (!jogo) return null;

    const mandante = jogo.mandante;
    const visitante = jogo.visitante;
    const finalizada = jogo.status === 'FINALIZADA';

    const temPenaltis = finalizada && ((confronto.unico?.penaltisMandante !== null) || (confronto.volta?.penaltisMandante !== null));
    const pMandante = confronto.unico?.penaltisMandante ?? confronto.volta?.penaltisMandante;
    const pVisitante = confronto.unico?.penaltisVisitante ?? confronto.volta?.penaltisVisitante;

    let mandanteVenceu = false;
    let visitanteVenceu = false;

    if (finalizada) {
        let saldo = 0;
        if (confronto.unico) {
            saldo = (confronto.unico.golsMandante || 0) - (confronto.unico.golsVisitante || 0);
        } else {
            const gm = (confronto.ida?.golsMandante || 0) + (confronto.volta?.golsMandante || 0);
            const gv = (confronto.ida?.golsVisitante || 0) + (confronto.volta?.golsVisitante || 0);
            saldo = gm - gv;
        }

        if (saldo > 0) mandanteVenceu = true;
        else if (saldo < 0) visitanteVenceu = true;
        else if (temPenaltis) {
            if ((pMandante || 0) > (pVisitante || 0)) mandanteVenceu = true;
            else visitanteVenceu = true;
        }
    }

    const renderParticipante = (p: PartidaParticipante | null, isWinner: boolean, isLoser: boolean, isMandante: boolean) => {
      const gols = confronto.unico 
        ? (isMandante ? confronto.unico.golsMandante : confronto.unico.golsVisitante)
        : (isMandante 
            ? (confronto.ida?.golsMandante ?? 0) + (confronto.volta?.golsMandante ?? 0)
            : (confronto.ida?.golsVisitante ?? 0) + (confronto.volta?.golsVisitante ?? 0)
          );

      const golsIda = isMandante ? confronto.ida?.golsMandante : confronto.ida?.golsVisitante;
      const golsVolta = isMandante ? confronto.volta?.golsMandante : confronto.volta?.golsVisitante;

      return (
        <div className={`participant-row ${isWinner ? 'winner' : ''} ${isLoser ? 'loser' : ''} ${!p ? 'tbd' : ''}`}>
          <div className="p-info">
             {p ? (
               <img src={p.clubeImagem} alt="" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=?'} />
             ) : (
               <div className="shield-placeholder">
                 <Shield size={12} />
               </div>
             )}
             <span title={p?.jogadorNome}>{p?.jogadorNome || 'Aguardando'}</span>
          </div>
          
          {p && (jogo.status !== 'AGENDADA') && (
            <div className="p-score">
              {confronto.unico ? (
                 <span>{gols ?? ''}</span>
              ) : (
                 <div className="agg-score">
                    <span>{golsIda ?? '-'}</span>
                    <span>{golsVolta ?? '-'}</span>
                 </div>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className={`match-card ${stageKey.toLowerCase()}`}>
        <div className="match-card-header">
           <span className="match-id">#{confronto.chaveIndex}</span>
           <span className={`status-dot ${jogo.status}`}></span>
        </div>
        
        <div className="participants-container">
          {renderParticipante(mandante, mandanteVenceu, visitanteVenceu, true)}
          {renderParticipante(visitante, visitanteVenceu, mandanteVenceu, false)}
        </div>

        {temPenaltis && (
            <div className="penalties-display">
                <span className={mandanteVenceu ? 'win-pk' : ''}>({pMandante})</span>
                <span className="pk-label">PK</span>
                <span className={visitanteVenceu ? 'win-pk' : ''}>({pVisitante})</span>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
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
          <a onClick={() => navigate('/')} className="nav-item">
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a onClick={() => navigate('/jogadores')} className="nav-item">
            <Users size={20} /> Jogadores
          </a>
          <a onClick={() => navigate('/clubes')} className="nav-item">
            <Shield size={20} /> Clubes
          </a>
          <a onClick={() => navigate('/competicoes')} className="nav-item">
            <Trophy size={20} /> Competições
          </a>
          <a onClick={() => navigate('/titulos')} className="nav-item">
            <Star size={20} /> Títulos
          </a>
          <a onClick={() => navigate('/temporadas')} className="nav-item active">
            <CalendarSync size={20} /> Temporadas
          </a>
          <div className="nav-separator"></div>
          <a onClick={() => navigate('/partidas')} className="nav-item">
            <Gamepad2 size={20} /> Partidas
          </a>
           <a onClick={() => navigate('/minha-conta')} className="nav-item">
            <Wallet size={20} /> Minha conta
          </a>
          <a onClick={() => navigate('/suporte')} className="nav-item">
            <Settings size={20} /> Suporte
          </a>
        </nav>
      </aside>

      <main className="main-content bracket-bg">
        <header className="top-header compact transparent-header">
          <div className="left-header">
            <button 
              className="toggle-btn menu-toggle" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <div className="search-bar glass">
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
            <button className="icon-btn theme-toggle-btn glass-btn" onClick={toggleTheme}>
              <Lightbulb size={20} />
            </button>
            <button className="icon-btn glass-btn"><Bell size={20} /></button>
            
            {currentUser ? (
              <div 
                className="user-avatar-mini"
                onClick={() => setShowUserPopup(true)}
                style={{
                  backgroundImage: getCurrentUserAvatar() ? `url(${getCurrentUserAvatar()})` : 'none',
                }}
              >
                {!getCurrentUserAvatar() && currentUser.nome.charAt(0)}
              </div>
            ) : (
              <button 
                className="login-btn-header glass-btn" 
                onClick={() => setShowLoginPopup(true)}
              >
                Login
              </button>
            )}
          </div>
        </header>

        <div className="bracket-wrapper">
            <div className="bracket-header-control">
                <button onClick={() => navigate(`/${temporadaId}/torneio/${torneioId}/fase/${faseId}`)} className="btn-glass back">
                    <ArrowLeft size={18} /> Voltar
                </button>
                <div className="bracket-info">
                    <div className="icon-glow">
                        <Swords size={28} />
                    </div>
                    <h1>Mata-Mata</h1>
                </div>
                <button className="btn-glass share" onClick={() => window.print()}>
                    <Share2 size={18} />
                </button>
            </div>

            <div className="bracket-viewport custom-scrollbar">
                {isLoading ? (
                    <div className="state-msg"><Loader2 className="spin" /> Carregando...</div>
                ) : !bracketData || Object.keys(bracketData).length === 0 ? (
                    <div className="state-msg"><AlertCircle /> Chaveamento não disponível</div>
                ) : (
                    <div className="bracket-canvas">
                        {getOrderedStages().map((stageKey, colIndex) => {
                            const confrontos = agruparPartidas(bracketData[stageKey]);
                            const { gap, paddingTop } = getGeometry(colIndex);
                            const isFinal = stageKey === 'FINAL' || stageKey === 'TERCEIRO_LUGAR';

                            return (
                                <div key={stageKey} className={`bracket-column col-idx-${colIndex}`}>
                                    <div className="column-title">
                                        <span>{STAGE_LABELS[stageKey]}</span>
                                    </div>
                                    <div 
                                        className="column-content"
                                        style={{ gap, paddingTop }}
                                    >
                                        {confrontos.map(confronto => (
                                            <div key={confronto.chaveIndex} className="match-node">
                                                {renderConfronto(confronto, stageKey)}
                                                
                                                {!isFinal && <div className="connector-h-right"></div>}
                                                
                                                {colIndex > 0 && !isFinal && (
                                                    <div className="connector-fork-left"></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
            imagem: getCurrentUserAvatar(),
            titulos: 0,
            finais: 0,
            golsMarcados: 0,
            partidasJogadas: 0
          }}
          onClose={() => setShowUserPopup(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}