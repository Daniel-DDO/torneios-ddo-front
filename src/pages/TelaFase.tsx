import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
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
  Crown,
  TrendingUp,
  Plus,
  ArrowLeft,
  Dices,
  GitBranch,
  Palette,
  FileText,
  CalendarDays,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupAdicionarJFase from '../components/PopupAdicionarJFase';
import PopupColorirPos from '../components/PopupColorirPos';
import PopupSorteio from '../components/PopupSorteio';
import PopupCopaReal from '../components/PopupCopaReal';
import PopupCopaLiga from '../components/PopupCopaLiga';
import { PdfRelatorioFase } from '../components/RelatorioFase';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

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
  algoritmoLiga: string | null;
  algoritmoMataMata: string | null;
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

export function TelaFase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { faseId, torneioId, temporadaId } = useParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showAddPlayerPopup, setShowAddPlayerPopup] = useState(false);
  const [showColorirPopup, setShowColorirPopup] = useState(false);
  const [showSorteioPopup, setShowSorteioPopup] = useState(false);
  const [showCopaRealPopup, setShowCopaRealPopup] = useState(false);
  const [showCopaLigaPopup, setShowCopaLigaPopup] = useState(false);

  const { data: avatars = [] } = useQuery<Avatar[]>({
    queryKey: ['avatares'],
    queryFn: async () => {
      const response = await API.get('/api/avatares');
      return Array.isArray(response.data) ? response.data : [];
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
    staleTime: 1000 * 30,
  });

  const { data: participantes = [], isLoading: isLoadingParticipantes } = useQuery<ParticipanteFase[]>({
    queryKey: ['participantes-fase', faseId],
    queryFn: async () => {
      const response = await API.get(`/participacao-fase/fase/${faseId}`);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!faseId,
    refetchInterval: 5000,
    staleTime: 2000
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

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const isAdmin = currentUser && ['DIRETOR', 'PROPRIETARIO', 'ADMINISTRADOR'].includes(currentUser.cargo);
  const isProprietario = currentUser && currentUser.cargo === 'PROPRIETARIO';

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

  const handleExportarPdf = async () => {
    if (gerandoPdf) return;
    setGerandoPdf(true);
    try {
      const response = await API.get(`/fase-torneio/${faseId}/dados-exportacao`);
      const exportData = response.data;

      if (!exportData?.classificacao) throw new Error("Dados incompletos");

      const doc = <PdfRelatorioFase data={exportData} />;
      const blob = await pdf(doc).toBlob();
      if (!blob) throw new Error("Erro blob");

      const safeFileName = exportData.faseNome ? exportData.faseNome.replace(/\s+/g, '_') : 'Relatorio';
      saveAs(blob, `Torneio_DDO_${safeFileName}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Erro ao baixar o PDF.");
    } finally {
      setGerandoPdf(false);
    }
  };

  const renderSkeletons = () => Array(8).fill(0).map((_, i) => (
    <tr key={i}>
      <td><div className="skeleton" style={{ width: '20px', height: '20px' }}></div></td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '50%' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="skeleton" style={{ width: '120px', height: '14px' }}></div>
          </div>
        </div>
      </td>
      {Array(8).fill(0).map((__, j) => (
        <td key={j}><div className="skeleton" style={{ width: '20px', height: '14px' }}></div></td>
      ))}
    </tr>
  ));

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
       <style>{`
        .glass-panel {
          background: var(--bg-card);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
        }

        .hero-section {
          position: relative;
          border-radius: 24px;
          background: linear-gradient(120deg, #1a1a2e 0%, #16213e 100%);
          overflow: hidden;
          padding: 40px;
          color: white;
          margin-bottom: 30px;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 280px;
        }
        
        .hero-bg-anim {
          position: absolute;
          top: -50%;
          left: -20%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(78,62,255,0.4) 0%, rgba(0,0,0,0) 60%);
          animation: pulse-glow 10s infinite alternate;
          pointer-events: none;
        }

        @keyframes pulse-glow {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 0.8; }
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 600px;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 71, 87, 0.2);
          color: #ff4757;
          padding: 6px 12px;
          border-radius: 30px;
          font-weight: 700;
          font-size: 0.8rem;
          margin-bottom: 16px;
          border: 1px solid rgba(255, 71, 87, 0.3);
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 16px;
          background: linear-gradient(to right, #ffffff, #a0aec0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-desc {
          font-size: 1.1rem;
          color: rgba(255,255,255,0.7);
          margin-bottom: 24px;
        }

        .btn-glow {
          background: #4e3eff;
          color: white;
          padding: 12px 28px;
          border-radius: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(78, 62, 255, 0.4);
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(78, 62, 255, 0.6);
        }

        .grid-layout {
          display: grid;
          grid-template-columns: 2fr 1.2fr;
          gap: 24px;
        }

        .section-header-styled {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-dark);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tournament-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .t-card-glass {
          background: var(--bg-card);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid var(--border-color);
          transition: 0.3s;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .t-card-glass:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1);
          border-color: var(--primary);
        }

        .t-img-area {
          height: 160px;
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .t-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 16px;
        }

        .t-status-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 800;
          background: rgba(255,255,255,0.95);
          color: #000;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        
        .t-status-badge.em_andamento { color: #00d09c; }
        .t-status-badge.finalizado { color: var(--text-gray); }
        .t-status-badge.disponivel { color: #8e44ad; }

        .t-body {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .t-name {
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 8px;
          color: var(--text-dark);
        }

        .t-description {
          font-size: 0.9rem;
          color: var(--text-gray);
          margin-bottom: 20px;
          line-height: 1.5;
          flex: 1;
        }

        .t-btn-outline {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          border: 2px solid var(--border-color);
          background: transparent;
          color: var(--text-dark);
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .t-btn-outline:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(78, 62, 255, 0.05);
        }

        .ranking-container {
          background: var(--bg-card);
          border-radius: 24px;
          border: 1px solid var(--border-color);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .ranking-header-bg {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
          padding: 24px;
          color: white;
          position: relative;
          overflow: hidden;
        }
        
        .ranking-header-content {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ranking-list {
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .rank-row-modern {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.2s;
        }

        .rank-row-modern:hover {
          background: var(--hover-bg);
        }

        .rank-pos-box {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1rem;
          border-radius: 8px;
          margin-right: 16px;
          flex-shrink: 0;
        }
        
        .pos-1 { background: linear-gradient(135deg, #FFD700 0%, #FDB931 100%); color: #fff; box-shadow: 0 4px 10px rgba(253, 185, 49, 0.4); }
        .pos-2 { background: linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%); color: #fff; }
        .pos-3 { background: linear-gradient(135deg, #CD7F32 0%, #A0522D 100%); color: #fff; }
        .pos-n { color: var(--text-gray); background: var(--border-color); font-size: 0.9rem; }

        .rank-avatar-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          margin-right: 16px;
          flex-shrink: 0;
          overflow: hidden;
          background: var(--border-color);
          position: relative;
        }

        .rank-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .rank-player-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .rank-name-txt {
          font-weight: 700;
          color: var(--text-dark);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 1rem;
          margin-bottom: 4px;
        }

        .rank-discord-txt {
          color: var(--text-gray);
          font-size: 0.8rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rank-score-box {
          background: rgba(78, 62, 255, 0.1);
          padding: 6px 12px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
          margin-left: 10px;
        }

        .score-val {
          color: var(--primary);
          font-weight: 800;
          font-size: 1rem;
        }

        .score-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          color: var(--text-gray);
          letter-spacing: 0.5px;
        }

        .load-more-strip {
          padding: 15px;
          text-align: center;
          cursor: pointer;
          color: var(--text-gray);
          font-size: 0.9rem;
          font-weight: 600;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .load-more-strip:hover {
          background: var(--hover-bg);
          color: var(--primary);
        }

        /* Specific Table Styles for TelaFase */
        .page-content { padding: 40px; }
        .table-container {
          background-color: var(--bg-card);
          border-radius: 24px;
          border: 1px solid var(--border-color);
          overflow: hidden;
          margin-top: 24px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
        }
        .custom-table { width: 100%; border-collapse: collapse; }
        .custom-table th, .custom-table td {
          padding: 16px 24px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }
        .custom-table th {
          background-color: var(--hover-bg);
          color: var(--text-gray);
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .custom-table td { color: var(--text-dark); font-size: 0.95rem; }
        .back-button {
          display: flex; align-items: center; gap: 8px;
          color: var(--text-gray); font-size: 0.95rem;
          margin-bottom: 1.5rem; cursor: pointer;
          border: none; background: none; padding: 0;
          font-weight: 600;
          transition: color 0.2s;
        }
        .back-button:hover { color: var(--primary); }
        .action-area { display: flex; gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
        .btn-action {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 20px; border-radius: 12px;
          font-weight: 600; font-size: 0.9rem;
          cursor: pointer; border: none; transition: all 0.2s;
        }
        .btn-add { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(78, 62, 255, 0.3); }
        .btn-add:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(78, 62, 255, 0.4); }
        .btn-utility { background: var(--bg-card); color: var(--text-dark); border: 1px solid var(--border-color); }
        .btn-utility:hover { background: var(--hover-bg); border-color: var(--primary); }
        .btn-pdf { background: #0ea5e9; color: white; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); }
        .btn-pdf:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4); }
        
        .bracket-cta-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5rem 3rem;
            background: var(--bg-card);
            border: 2px dashed var(--border-color);
            border-radius: 24px;
            margin-top: 2rem;
            text-align: center;
            transition: 0.3s;
        }
        .bracket-cta-container:hover { border-color: var(--primary); background: rgba(78, 62, 255, 0.02); }
        .bracket-cta-icon {
            color: var(--primary);
            margin-bottom: 1.5rem;
            opacity: 0.8;
            filter: drop-shadow(0 0 10px rgba(78,62,255,0.4));
        }
        .bracket-cta-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.8rem; color: var(--text-dark); }
        .bracket-cta-text { color: var(--text-gray); margin-bottom: 2rem; max-width: 500px; font-size: 1.1rem; line-height: 1.6; }
        
        .clube-img-td { width: 32px; height: 32px; object-fit: contain; margin-right: 16px; }
        .legend-container {
          display: flex; flex-wrap: wrap; gap: 16px; margin-top: 24px; padding: 20px;
          background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color);
        }
        .legend-item { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 600; color: var(--text-gray); }
        .legend-color { width: 16px; height: 16px; border-radius: 4px; }
        
        .skeleton {
          background: linear-gradient(90deg, var(--hover-bg) 25%, var(--border-color) 50%, var(--hover-bg) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        @media (max-width: 1100px) {
          .grid-layout {
            grid-template-columns: 1fr;
          }
          
          .hero-section {
            flex-direction: column;
            align-items: flex-start;
            padding: 30px;
          }
          
          .hero-content {
            max-width: 100%;
            margin-bottom: 20px;
          }

          .hero-title {
            font-size: 2rem;
          }

          .rank-avatar-box {
            width: 40px;
            height: 40px;
            margin-right: 12px;
          }

          .rank-pos-box {
            width: 28px;
            height: 28px;
            font-size: 0.9rem;
            margin-right: 12px;
          }
        }
        
        @media (max-width: 768px) {
          .page-content { padding: 20px; }
          .custom-table th, .custom-table td { padding: 12px; font-size: 0.85rem; }
          .action-area { justify-content: stretch; width: 100%; }
          .btn-action { flex: 1; justify-content: center; }
          .hide-mobile { display: none; }
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
                placeholder="Buscar participante..." 
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
          <button onClick={() => navigate(`/${temporadaId}/${torneioId}/fases`)} className="back-button">
            <ArrowLeft size={18} /> Voltar para Fases
          </button>

          <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              {isLoadingFase ? (
                <>
                  <div className="skeleton" style={{ width: '300px', height: '42px', marginBottom: '12px' }}></div>
                  <div className="skeleton" style={{ width: '200px', height: '20px' }}></div>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: '2.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-dark)', lineHeight: '1.1' }}>
                    {fase?.nome}
                    {fase?.tipoTorneio === 'MATA_MATA' && <GitBranch size={28} color="var(--primary)" />}
                    {fase?.tipoTorneio === 'PONTOS_CORRIDOS' && <TrendingUp size={28} color="#10b981" />}
                    {fase?.tipoTorneio === 'GRUPOS' && <LayoutDashboard size={28} color="#f59e0b" />}
                  </h2>
                  <p style={{ color: 'var(--text-gray)', fontSize: '1rem', marginTop: '8px', fontWeight: 500 }}>
                    <span style={{color: 'var(--primary)'}}>{fase?.torneioNome}</span> • {fase?.tipoTorneio?.replace('_', ' ')}
                  </p>
                </>
              )}
            </div>

            <div className="action-area">
              {fase?.tipoTorneio !== 'MATA_MATA' && (
                <button 
                  className="btn-action btn-pdf" 
                  onClick={handleExportarPdf} 
                  disabled={gerandoPdf}
                  title="Baixar Relatório em PDF"
                >
                  {gerandoPdf ? <div className="spinner-mini"></div> : <FileText size={18} />}
                  Relatório
                </button>
              )}

              {isAdmin && (
                <button className="btn-action btn-add" onClick={() => setShowAddPlayerPopup(true)}>
                  <Plus size={18} /> Add Jogador
                </button>
              )}

              {isProprietario && (
                <>
                  {fase?.tipoTorneio === 'MATA_MATA' ? (
                    <>
                      <button className="btn-action btn-utility" onClick={() => setShowCopaRealPopup(true)}>
                        <Crown size={18} color="#f59e0b" /> Sorteio Real
                      </button>
                      <button className="btn-action btn-utility" onClick={() => setShowSorteioPopup(true)}>
                        <Dices size={18} /> Sorteio Elim.
                      </button>
                      <button className="btn-action btn-utility" onClick={() => setShowCopaLigaPopup(true)}>
                        <Trophy size={18} color="#8b5cf6" /> Sorteio Copa Liga
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="btn-action btn-utility" 
                        onClick={() => setShowColorirPopup(true)} 
                        style={{ color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                      >
                        <Palette size={18} /> Zonas
                      </button>
                      <button className="btn-action btn-utility" onClick={() => setShowSorteioPopup(true)}>
                        <Dices size={18} /> Sortear
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {!isLoadingFase && fase?.tipoTorneio === 'MATA_MATA' ? (
            <div className="bracket-cta-container">
              <GitBranch size={80} className="bracket-cta-icon" />
              <h3 className="bracket-cta-title">Visualização de Chaveamento</h3>
              <p className="bracket-cta-text">
                Esta fase é disputada em formato eliminatório. Acesse a tela de chaveamento interativo para ver os confrontos, atualizar resultados e acompanhar o caminho dos times até a grande final.
              </p>
              
              <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center'}}>
                <button 
                  className="btn-action btn-add" 
                  style={{ fontSize: '1.1rem', padding: '14px 32px' }}
                  onClick={() => navigate(`/${temporadaId}/torneio/${torneioId}/fase/${faseId}/bracket`)}
                >
                  Ver Chaveamento <ChevronRight size={20} />
                </button>
                
                <button 
                    className="btn-action btn-utility"
                    style={{ fontSize: '1rem', padding: '14px 24px' }}
                    onClick={() => navigate(`/${temporadaId}/torneio/${torneioId}/fase/${faseId}/rodadas`)}
                >
                    <CalendarDays size={20} /> Ver Lista de Partidas
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                      <th>Participante</th>
                      <th style={{ textAlign: 'center' }}>Pts</th>
                      <th style={{ textAlign: 'center' }}>J</th>
                      <th style={{ textAlign: 'center' }}>V</th>
                      <th style={{ textAlign: 'center' }}>E</th>
                      <th style={{ textAlign: 'center' }}>D</th>
                      <th className="hide-mobile" style={{ textAlign: 'center' }}>GP</th>
                      <th className="hide-mobile" style={{ textAlign: 'center' }}>GC</th>
                      <th style={{ textAlign: 'center' }}>SG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingParticipantes ? renderSkeletons() : (
                      <>
                        {filteredParticipantes.map((p) => (
                          <tr
                            key={p.jogadorClubeId}
                            style={{ 
                                borderLeft: (p.zonaCor && p.zonaCor !== '#FFFFFF') ? `6px solid ${p.zonaCor}` : '6px solid transparent',
                                backgroundColor: (currentUser && p.nomeJogador === currentUser.nome) ? 'rgba(78, 62, 255, 0.05)' : 'transparent'
                            }}
                          >
                            <td style={{ fontWeight: '800', textAlign: 'center', color: (p.posicao <= 3) ? 'var(--text-dark)' : 'var(--text-gray)' }}>
                                {p.posicao}º
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <img 
                                    src={p.imagemClube} 
                                    alt={p.nomeClube} 
                                    className="clube-img-td" 
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=?';
                                    }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.nomeJogador}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', fontWeight: 500 }}>{p.nomeClube}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1rem', textAlign: 'center' }}>{p.pontos}</td>
                            <td style={{ textAlign: 'center' }}>{p.jogos}</td>
                            <td style={{ textAlign: 'center' }}>{p.vitorias}</td>
                            <td style={{ textAlign: 'center' }}>{p.empates}</td>
                            <td style={{ textAlign: 'center' }}>{p.derrotas}</td>
                            <td className="hide-mobile" style={{ textAlign: 'center' }}>{p.golsPro}</td>
                            <td className="hide-mobile" style={{ textAlign: 'center' }}>{p.golsContra}</td>
                            <td style={{ 
                                fontWeight: '700', 
                                textAlign: 'center',
                                color: p.saldoGols > 0 ? '#10b981' : p.saldoGols < 0 ? '#ef4444' : 'var(--text-gray)' 
                            }}>
                              {p.saldoGols > 0 ? `+${p.saldoGols}` : p.saldoGols}
                            </td>
                          </tr>
                        ))}
                        {filteredParticipantes.length === 0 && !isLoadingParticipantes && (
                          <tr>
                            <td colSpan={10} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-gray)' }}>
                              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'}}>
                                <div style={{background: 'var(--hover-bg)', padding: '20px', borderRadius: '50%'}}>
                                    <AlertCircle size={40} style={{ opacity: 0.5 }} />
                                </div>
                                <p style={{fontSize: '1.1rem', fontWeight: 500}}>Nenhum participante encontrado nesta fase.</p>
                                {isAdmin && (
                                    <button className="btn-action btn-add" onClick={() => setShowAddPlayerPopup(true)}>
                                        Adicionar Primeiro Jogador
                                    </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {!isLoadingParticipantes && legendas.length > 0 && (
                <div className="legend-container">
                  {legendas.map(([nome, cor]) => (
                    <div key={nome} className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: cor, boxShadow: `0 2px 5px ${cor}66` }}></div>
                      <span>{nome}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-action btn-utility"
                  onClick={() => navigate(`/${temporadaId}/torneio/${torneioId}/fase/${faseId}/rodadas`)}
                  style={{padding: '12px 24px', fontSize: '1rem'}}
                >
                  <CalendarDays size={20} /> Gerenciar Rodadas e Partidas
                </button>
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
          user={{ ...currentUser, imagem: getCurrentUserAvatar() }}
          onClose={() => setShowUserPopup(false)}
          onLogout={handleLogout}
        />
      )}

      {showAddPlayerPopup && (
        <PopupAdicionarJFase
          faseId={faseId || ''}
          temporadaId={temporadaId || ''}
          onClose={() => setShowAddPlayerPopup(false)}
          onSubmit={() => queryClient.invalidateQueries({ queryKey: ['participantes-fase', faseId] })}
        />
      )}

      {showColorirPopup && (
        <PopupColorirPos
          faseId={faseId || ''}
          onClose={() => setShowColorirPopup(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['participantes-fase', faseId] })}
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

      {showCopaRealPopup && (
      <PopupCopaReal
        faseId={faseId || ''}
        onClose={() => setShowCopaRealPopup(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['participantes-fase', faseId] });
          queryClient.invalidateQueries({ queryKey: ['fase-detalhe', faseId] });
        }}
      />
    )}

      {showCopaLigaPopup && (
        <PopupCopaLiga
          onClose={() => setShowCopaLigaPopup(false)}
          onSubmit={() => {
            queryClient.invalidateQueries({ queryKey: ['participantes-fase', faseId] });
            queryClient.invalidateQueries({ queryKey: ['fase-detalhe', faseId] });
          }}
        />
      )}
    </div>
  );
}