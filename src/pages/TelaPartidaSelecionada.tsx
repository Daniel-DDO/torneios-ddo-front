import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  ArrowLeft,
  MapPin,
  Clock,
  Youtube,
  AlertTriangle,
  Banknote,
  FileText,
  Edit3,
  Lightbulb,
  Share2,
  TrendingUp,
  AlertCircle,
  Percent,
  MessageSquare,
  Send,
  Trash2,
  Lock
} from 'lucide-react';
import { API, API_SECUNDARIA } from '../services/api';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupRegistrarPartida from '../components/PopupRegistrarPartida';
import PopupReportarPartida from '../components/PopupReportarPartida';
import PopupGeral from '../components/PopupGeral';
import PopupGeralConf from '../components/PopupGeralConf';
import '../styles/TorneiosPage.css';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

interface JogadorClubeDTO {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string | null;
  clubeId: string;
  clubeNome: string;
  clubeImagem: string;
  clubeSigla: string;
}

interface PartidaDTO {
  id: string;
  faseId: string;
  rodadaId: string | null;
  numeroRodada: number | null;
  etapaMataMata: string | null;
  chaveIndex: number | null;
  dataHora: string | null;
  estadio: string | null;
  linkPartida: string | null;
  mandante: JogadorClubeDTO;
  visitante: JogadorClubeDTO;
  golsMandante: number | null;
  golsVisitante: number | null;
  realizada: boolean;
  wo: boolean;
  houveProrrogacao: boolean;
  houvePenaltis: boolean;
  penaltisMandante: number | null;
  penaltisVisitante: number | null;
  logEventos: string | null;
  cartoesAmarelosMandante: number | null;
  cartoesVermelhosMandante: number | null;
  cartoesAmarelosVisitante: number | null;
  cartoesVermelhosVisitante: number | null;
  coeficienteMandante: number | null;
  coeficienteVisitante: number | null;
  tipoPartida: string | null;
  proximaPartidaId: string | null;
  slotNaProxima: number | null;
  receitaMandante: number | null;
  receitaVisitante: number | null;
}

interface ProbabilidadeDTO {
  chanceMandante: number;
  chanceEmpate: number;
  chanceVisitante: number;
  analisePreJogo: string;
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

interface ComentarioBackend {
  id: string;
  texto: string;
  jogadorId: string;
  partidaId: string;
  dataHora: string;
}

interface JogadorResumoDTO {
  id: string;
  nome: string;
  discord: string;
  pontosCoeficiente: number;
  imagem: string | null;
  cargo?: string; 
}

interface AvatarDTO {
  id: string;
  url: string;
  nome: string;
}

const formatDateComment = (dateString: string) => {
  const date = new Date(dateString); 
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `Há ${diffMins} min`;
  if (diffHours < 24) return `Há ${diffHours} h`;
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

function CommentItem({ 
  comentario, 
  currentUser, 
  onDeleteRequest 
}: { 
  comentario: ComentarioBackend; 
  currentUser: UserData | null;
  onDeleteRequest: (id: string) => void;
}) {
  const { data: jogador } = useQuery<JogadorResumoDTO>({
    queryKey: ['jogador-resumo', comentario.jogadorId],
    queryFn: async () => {
      const response = await API.get(`/jogador/${comentario.jogadorId}/resumo`);
      return response.data;
    },
    staleTime: 1000 * 60 * 30
  });

  const isUuidImage = jogador?.imagem && !jogador.imagem.startsWith('http');
  
  const { data: avatarData } = useQuery<AvatarDTO>({
    queryKey: ['avatar-url', jogador?.imagem],
    queryFn: async () => {
      if (!jogador?.imagem) return null;
      const response = await API.get(`/api/avatares/${jogador.imagem}`);
      return response.data;
    },
    enabled: !!isUuidImage,
    staleTime: Infinity
  });

  const displayImage = isUuidImage ? avatarData?.url : jogador?.imagem;
  const displayName = jogador?.nome || 'Carregando...';

  const canDelete = currentUser && (
    currentUser.id === comentario.jogadorId || 
    ['DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo)
  );

  return (
    <div className="comment-item">
      <div 
        className="user-avatar-comment"
        style={{ 
          backgroundImage: displayImage ? `url(${displayImage})` : 'none',
          backgroundSize: 'cover',
          width: 40, height: 40, fontSize: '0.9rem'
        }}
      >
        {!displayImage && (displayName.charAt(0) || <Users size={20} />)}
      </div>
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-author">{displayName}</span>
          {jogador && jogador.cargo && ['ADMINISTRADOR', 'DIRETOR', 'PROPRIETARIO'].includes(jogador.cargo) && (
            <span className={`role-badge ${jogador.cargo.toLowerCase()}`}>
              {jogador.cargo === 'ADMINISTRADOR' || jogador.cargo === 'PROPRIETARIO' ? 'Admin' : 'Staff'}
            </span>
          )}
          <span className="comment-time">{formatDateComment(comentario.dataHora)}</span>
          
          {canDelete && (
            <button className="btn-delete-comment" onClick={() => onDeleteRequest(comentario.id)} title="Apagar comentário">
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <div className="comment-bubble">
          {comentario.texto}
        </div>
      </div>
    </div>
  );
}

export function TelaPartidaSelecionada() {
  const navigate = useNavigate();
  const { partidaId } = useParams();
  const queryClient = useQueryClient();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showRegistrarPopup, setShowRegistrarPopup] = useState(false);
  const [showReportarPopup, setShowReportarPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  
  const [novoComentario, setNovoComentario] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [popupInfo, setPopupInfo] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'info'
  });

  const { data: partida, isLoading, refetch } = useQuery<PartidaDTO>({
    queryKey: ['partida-detalhe', partidaId],
    queryFn: async () => {
      const response = await API.get(`/partida/${partidaId}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  });

  const { data: probabilidade } = useQuery<ProbabilidadeDTO>({
    queryKey: ['partida-probabilidade', partidaId],
    queryFn: async () => {
      const response = await API.get(`/partida/${partidaId}/probabilidade`);
      return response.data;
    },
    enabled: !!partidaId && !!partida && !partida.realizada,
    staleTime: 1000 * 60 * 15
  });

  const { data: comentarios = [], isLoading: isLoadingComentarios } = useQuery<ComentarioBackend[]>({
    queryKey: ['comentarios', partidaId],
    queryFn: async () => {
      const response = await API_SECUNDARIA.get(`/comentarios/${partidaId}`);
      return response.data;
    },
    enabled: !!partidaId,
    refetchInterval: 5000 
  });

  const postComentarioMutation = useMutation({
    mutationFn: async (texto: string) => {
      return await API_SECUNDARIA.post('/comentarios', {
        texto,
        partidaId
      });
    },
    onSuccess: () => {
      setNovoComentario('');
      queryClient.invalidateQueries({ queryKey: ['comentarios', partidaId] });
    },
    onError: () => {
      setPopupInfo({
        show: true,
        title: 'Erro',
        message: 'Não foi possível enviar o comentário.',
        type: 'error'
      });
    }
  });

  const deleteComentarioMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!currentUser) throw new Error("Não logado");
      return await API_SECUNDARIA.delete(`/comentarios/${id}`, {
        params: { jogadorId: currentUser.id }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios', partidaId] });
      setPopupInfo({
        show: true,
        title: 'Apagado',
        message: 'Comentário removido com sucesso.',
        type: 'info'
      });
      setCommentToDelete(null);
    },
    onError: () => {
      setPopupInfo({
        show: true,
        title: 'Erro',
        message: 'Erro ao excluir o comentário.',
        type: 'error'
      });
      setCommentToDelete(null);
    }
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
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  const hasEditPermission = () => {
    if (!currentUser) return false;
    return ['ADMINISTRADOR', 'DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo);
  };

  const hasReportPermission = () => {
    if (!currentUser) return false;
    return ['DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'A definir';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (val: number | null) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const handleShare = async () => {
    if (!partida) return;
    const shareData = {
      title: 'Torneios DDO',
      text: `Confira o resultado de ${partida.mandante.clubeNome} vs ${partida.visitante.clubeNome}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setPopupInfo({
        show: true,
        title: 'Copiado',
        message: 'Link copiado para a área de transferência!',
        type: 'success'
      });
    }
  };

  const handleEnviarComentario = () => {
    if (!novoComentario.trim()) return;
    if (novoComentario.length > 500) {
      setPopupInfo({
        show: true,
        title: 'Atenção',
        message: 'O comentário excede o limite de 500 caracteres.',
        type: 'warning'
      });
      return;
    }
    postComentarioMutation.mutate(novoComentario);
  };

  const handleDeleteRequest = (id: string) => {
    setCommentToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (commentToDelete) {
      deleteComentarioMutation.mutate(commentToDelete);
    }
  };

  const handleCancelDelete = () => {
    setCommentToDelete(null);
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      <style>{`
        .match-hero {
          background: var(--bg-card);
          border-radius: var(--radius);
          padding: 0;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border-color);
          margin-bottom: 24px;
        }
        .hero-top-bar {
          background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .hero-content {
          padding: 40px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          flex-wrap: wrap;
        }
        .team-display {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          min-width: 180px;
        }
        .team-logo-lg {
          width: 110px;
          height: 110px;
          object-fit: contain;
          margin-bottom: 16px;
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.1));
          transition: transform 0.3s;
        }
        .team-logo-lg:hover { transform: scale(1.05); }
        .team-name-lg {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-dark);
          margin-bottom: 4px;
        }
        .player-badge {
          background: var(--hover-bg);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.85rem;
          color: var(--text-gray);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .score-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-width: 140px;
        }
        .main-score {
          font-size: 4rem;
          font-weight: 900;
          line-height: 1;
          color: var(--text-dark);
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .score-divider { color: var(--border-color); font-weight: 300; }
        .status-tag {
          text-transform: uppercase;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }
        .st-finished { background: rgba(0, 208, 156, 0.15); color: var(--success); }
        .st-scheduled { background: rgba(78, 62, 255, 0.15); color: var(--primary); }
        .penalties-score {
          font-size: 0.9rem;
          color: var(--text-gray);
          background: var(--bg-body);
          padding: 4px 12px;
          border-radius: 8px;
        }
        .wo-badge {
          background: #ffe4e6; color: #be123c;
          padding: 6px 16px; border-radius: 8px; font-weight: 800; font-size: 1rem;
          border: 1px solid #fecdd3;
        }
        .match-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        .detail-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 24px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-dark);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px dashed var(--border-color);
        }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: var(--text-gray); display: flex; align-items: center; gap: 8px; }
        .info-value { font-weight: 600; color: var(--text-dark); }
        .info-sub { font-size: 0.8rem; opacity: 0.8; font-weight: 400; margin-left: 4px; }
        .stats-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .cards-area {
          display: flex;
          gap: 6px;
        }
        .card-box {
          width: 12px; height: 18px; border-radius: 2px; display: inline-block;
        }
        .c-yellow { background: #fbbf24; }
        .c-red { background: #ef4444; }
        .log-terminal {
          background: var(--bg-body);
          border-radius: 12px;
          padding: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          color: var(--text-gray);
          max-height: 250px;
          overflow-y: auto;
          line-height: 1.6;
          border: 1px solid var(--border-color);
        }
        .action-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-top: auto;
        }
        .btn-full {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }
        .btn-watch { background: #ef4444; color: white; }
        .btn-watch:hover { background: #dc2626; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
        .btn-admin { background: var(--primary); color: white; }
        .btn-admin:hover { background: var(--primary-light); box-shadow: 0 4px 12px rgba(78, 62, 255, 0.3); }
        .btn-report { background: #f59e0b; color: white; }
        .btn-report:hover { background: #d97706; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); }
        .skeleton-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          background: var(--hover-bg);
        }

        .comments-section {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .comments-header-area {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .comments-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-dark);
        }
        
        .comment-input-area {
          padding: 24px;
          background: var(--bg-body);
          border-bottom: 1px solid var(--border-color);
        }
        .input-box-wrapper {
          display: flex;
          gap: 16px;
          background: var(--bg-card);
          padding: 16px;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }
        .user-avatar-comment {
          border-radius: 50%;
          background: var(--bg-body);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--border-color);
          flex-shrink: 0;
          font-weight: 700;
          color: var(--text-gray);
          overflow: hidden;
        }
        .input-fields-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .comment-textarea {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--text-dark);
          font-family: inherit;
          resize: vertical;
          min-height: 60px;
          font-size: 0.95rem;
        }
        .comment-textarea:focus {
          outline: none;
        }
        .input-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px solid var(--border-color);
        }
        .char-count {
          font-size: 0.75rem;
          color: var(--text-gray);
        }
        .btn-send-comment {
          background: var(--primary);
          color: white;
          border: none;
          padding: 8px 24px;
          border-radius: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-send-comment:hover {
          background: var(--primary-light);
        }
        .btn-send-comment:disabled {
          background: var(--text-gray);
          cursor: not-allowed;
          opacity: 0.7;
        }
        
        .login-prompt {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 20px;
          background: var(--bg-card);
          border-radius: 12px;
          border: 1px dashed var(--border-color);
          color: var(--text-gray);
        }
        .login-btn-inline {
          background: var(--hover-bg);
          color: var(--primary);
          border: 1px solid var(--border-color);
          padding: 6px 16px;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
        }

        .comments-list-container {
          padding: 0;
          max-height: 700px;
          overflow-y: auto;
        }
        .comment-item {
          display: flex;
          gap: 16px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.1s;
        }
        .comment-item:last-child {
          border-bottom: none;
        }
        .comment-item:hover {
          background: var(--hover-bg);
        }
        .comment-content {
          flex: 1;
        }
        .comment-header {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 6px;
        }
        .comment-author {
          font-weight: 700;
          color: var(--text-dark);
          font-size: 0.95rem;
        }
        .role-badge {
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .role-badge.administrador, .role-badge.proprietario {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .role-badge.diretor {
          background: rgba(78, 62, 255, 0.1);
          color: var(--primary);
          border: 1px solid rgba(78, 62, 255, 0.2);
        }
        .comment-time {
          font-size: 0.8rem;
          color: var(--text-gray);
          margin-left: auto;
        }
        .btn-delete-comment {
          background: transparent;
          border: none;
          color: var(--text-gray);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
          margin-left: 8px;
        }
        .btn-delete-comment:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        .comment-bubble {
          color: var(--text-dark);
          line-height: 1.6;
          font-size: 0.95rem;
          white-space: pre-wrap;
          word-break: break-word;
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        @media (max-width: 900px) {
          .match-grid { grid-template-columns: 1fr; }
          .hero-content { gap: 20px; }
          .main-score { font-size: 3rem; }
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
          <a onClick={() => navigate('/titulos')} className="nav-item"><Star size={20} /> Títulos</a>
          <a onClick={() => navigate('/temporadas')} className="nav-item active"><CalendarSync size={20} /> Temporadas</a>
          <div className="nav-separator"></div>
          <a onClick={() => navigate('/partidas')} className="nav-item"><Gamepad2 size={20} /> Partidas</a>
          <a onClick={() => navigate('/minha-conta')} className="nav-item"><Wallet size={20} /> Minha conta</a>
          <a onClick={() => navigate('/suporte')} className="nav-item"><Settings size={20} /> Suporte</a>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="left-header">
            <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={24} /></button>
            <div className="search-bar"><Search size={18} /><input placeholder="Buscar..." /></div>
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
                style={{ backgroundImage: currentUser.imagem ? `url(${currentUser.imagem})` : 'none', backgroundSize: 'cover', cursor: 'pointer' }}
              >
                {!currentUser.imagem && currentUser.nome.charAt(0)}
              </div>
            ) : (
              <button className="login-btn-header" onClick={() => setShowLoginPopup(true)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}>Login</button>
            )}
          </div>
        </header>

        <div className="page-content">
          <button onClick={() => navigate(-1)} className="back-button" style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', color: 'var(--text-gray)', marginBottom: 20, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
            <ArrowLeft size={18} /> Voltar
          </button>

          {isLoading ? (
            <div className="match-hero skeleton-pulse" style={{ height: 300 }}></div>
          ) : !partida ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-gray)' }}>Partida não encontrada.</div>
          ) : (
            <>
              <div className="match-hero">
                <div className="hero-top-bar">
                  <span>{partida.etapaMataMata || `Rodada ${partida.numeroRodada}`}</span>
                  <span>{formatDate(partida.dataHora)}</span>
                </div>

                <div className="hero-content">
                  <div className="team-display">
                    <img src={partida.mandante?.clubeImagem} alt={partida.mandante?.clubeNome} className="team-logo-lg" />
                    <div className="team-name-lg">{partida.mandante?.clubeNome}</div>
                    <div className="player-badge">
                      <Users size={12} /> {partida.mandante?.jogadorNome}
                    </div>
                  </div>

                  <div className="score-display">
                    {partida.wo ? (
                      <div className="wo-badge">VENCEDOR W.O.</div>
                    ) : (
                      <div className={`status-tag ${partida.realizada ? 'st-finished' : 'st-scheduled'}`}>
                        {partida.realizada ? 'Partida Finalizada' : 'Partida Agendada'}
                      </div>
                    )}

                    <div className="main-score">
                      <span>{partida.realizada || partida.golsMandante !== null ? partida.golsMandante : '-'}</span>
                      <span className="score-divider">:</span>
                      <span>{partida.realizada || partida.golsVisitante !== null ? partida.golsVisitante : '-'}</span>
                    </div>

                    {partida.houvePenaltis && (
                      <div className="penalties-score">
                        Pênaltis: {partida.penaltisMandante} - {partida.penaltisVisitante}
                      </div>
                    )}
                  </div>

                  <div className="team-display">
                    <img src={partida.visitante?.clubeImagem} alt={partida.visitante?.clubeNome} className="team-logo-lg" />
                    <div className="team-name-lg">{partida.visitante?.clubeNome}</div>
                    <div className="player-badge">
                      <Users size={12} /> {partida.visitante?.jogadorNome}
                    </div>
                  </div>
                </div>
              </div>

              <div className="match-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                  {probabilidade && !partida.realizada && (
                    <div className="detail-card">
                      <div className="card-header"><Percent size={20} /> Probabilidade de Vitória</div>

                      <div style={{ padding: '10px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem', fontWeight: 600 }}>
                          <span style={{ color: 'var(--success)' }}>{partida.mandante.clubeNome} {probabilidade.chanceMandante}%</span>
                          <span style={{ color: 'var(--text-gray)' }}>Empate {probabilidade.chanceEmpate}%</span>
                          <span style={{ color: '#ef4444' }}>{partida.visitante.clubeNome} {probabilidade.chanceVisitante}%</span>
                        </div>

                        <div style={{
                          height: 14,
                          width: '100%',
                          background: 'var(--bg-body)',
                          borderRadius: 7,
                          overflow: 'hidden',
                          display: 'flex',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ width: `${probabilidade.chanceMandante}%`, background: 'var(--success)', transition: 'width 1s ease-in-out' }} />
                          <div style={{ width: `${probabilidade.chanceEmpate}%`, background: '#9ca3af', transition: 'width 1s ease-in-out' }} />
                          <div style={{ width: `${probabilidade.chanceVisitante}%`, background: '#ef4444', transition: 'width 1s ease-in-out' }} />
                        </div>

                        <p style={{
                          marginTop: 16,
                          fontSize: '0.9rem',
                          color: 'var(--text-gray)',
                          fontStyle: 'italic',
                          background: 'var(--hover-bg)',
                          padding: '10px',
                          borderRadius: 8,
                          borderLeft: '3px solid var(--primary)'
                        }}>
                          "{probabilidade.analisePreJogo}"
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="detail-card">
                    <div className="card-header"><FileText size={20} /> Informações da Partida</div>
                    <div className="info-row">
                      <div className="info-label"><MapPin size={16} /> Estádio</div>
                      <div className="info-value">{partida.estadio || 'Não definido'}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label"><Clock size={16} /> Duração</div>
                      <div className="info-value">{partida.houveProrrogacao ? 'Prorrogação' : 'Tempo Normal (90 min)'}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label"><Settings size={16} /> Status</div>
                      <div className="info-value">{partida.wo ? 'Decisão por W.O.' : (partida.realizada ? 'Concluída' : 'Aguardando')}</div>
                    </div>
                    {partida.logEventos && (
                      <div style={{ marginTop: 20 }}>
                        <div className="info-label" style={{ marginBottom: 10 }}>Resumo de Eventos</div>
                        <div className="log-terminal">{partida.logEventos}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="detail-card">
                    <div className="card-header"><Banknote size={20} /> Financeiro e Pontuação</div>

                    <div className="info-row">
                      <div className="info-label">{partida.mandante?.clubeSigla} <span className="info-sub">(Receita)</span></div>
                      <div className="info-value" style={{ color: 'var(--success)' }}>+ {formatCurrency(partida.receitaMandante)}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label"><TrendingUp size={14} /> Coeficiente</div>
                      <div className="info-value">{partida.coeficienteMandante || '0.00'}</div>
                    </div>

                    <hr style={{ margin: '10px 0', border: 0, borderTop: '1px dashed var(--border-color)' }} />

                    <div className="info-row">
                      <div className="info-label">{partida.visitante?.clubeSigla} <span className="info-sub">(Receita)</span></div>
                      <div className="info-value" style={{ color: 'var(--success)' }}>+ {formatCurrency(partida.receitaVisitante)}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label"><TrendingUp size={14} /> Coeficiente</div>
                      <div className="info-value">{partida.coeficienteVisitante || '0.00'}</div>
                    </div>

                    <div className="card-header" style={{ marginTop: 20, borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
                      <AlertCircle size={20} /> Cartões
                    </div>

                    <div className="stats-row">
                      <div style={{ fontSize: '0.9rem', width: 40 }}>{partida.mandante?.clubeSigla}</div>
                      <div className="cards-area">
                        {[...Array(partida.cartoesAmarelosMandante || 0)].map((_, i) => <span key={`ym-${i}`} className="card-box c-yellow" />)}
                        {[...Array(partida.cartoesVermelhosMandante || 0)].map((_, i) => <span key={`rm-${i}`} className="card-box c-red" />)}
                      </div>
                    </div>

                    <div className="stats-row">
                      <div style={{ fontSize: '0.9rem', width: 40 }}>{partida.visitante?.clubeSigla}</div>
                      <div className="cards-area">
                        {[...Array(partida.cartoesAmarelosVisitante || 0)].map((_, i) => <span key={`yv-${i}`} className="card-box c-yellow" />)}
                        {[...Array(partida.cartoesVermelhosVisitante || 0)].map((_, i) => <span key={`rv-${i}`} className="card-box c-red" />)}
                      </div>
                    </div>

                    <div className="action-grid" style={{ marginTop: 24 }}>
                      {partida.linkPartida && (
                        <button className="btn-full btn-watch" onClick={() => window.open(partida.linkPartida!, '_blank')}>
                          <Youtube size={18} /> Assistir Partida
                        </button>
                      )}

                      {hasEditPermission() && partida.mandante && partida.visitante && (
                        <button className="btn-full btn-admin" onClick={() => setShowRegistrarPopup(true)}>
                          <Edit3 size={18} /> Registrar Resultado
                        </button>
                      )}

                      {hasReportPermission() && partida.mandante && partida.visitante && (
                        <button className="btn-full btn-report" onClick={() => setShowReportarPopup(true)}>
                          <AlertTriangle size={18} /> Reportar Problema
                        </button>
                      )}

                      <button className="btn-full" onClick={handleShare} style={{ background: 'var(--hover-bg)', color: 'var(--text-gray)' }}>
                        <Share2 size={18} /> Compartilhar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="comments-section">
                <div className="comments-header-area">
                  <MessageSquare size={20} className="text-primary" />
                  <span className="comments-title">Comentários ({comentarios.length})</span>
                </div>

                <div className="comment-input-area">
                  {currentUser ? (
                    <div className="input-box-wrapper">
                      <div 
                        className="user-avatar-comment"
                        style={{ 
                          backgroundImage: `url(${currentUser.imagem})`, 
                          backgroundSize: 'cover' 
                        }}
                      >
                        {!currentUser.imagem && <Users size={20} />}
                      </div>
                      <div className="input-fields-container">
                        <textarea
                          ref={textareaRef}
                          className="comment-textarea"
                          placeholder="Escreva seu comentário..."
                          value={novoComentario}
                          onChange={(e) => setNovoComentario(e.target.value)}
                          maxLength={500}
                          disabled={postComentarioMutation.isPending}
                        />
                        <div className="input-actions">
                          <span className="char-count">{novoComentario.length}/500</span>
                          <button 
                            className="btn-send-comment" 
                            onClick={handleEnviarComentario}
                            disabled={!novoComentario.trim() || postComentarioMutation.isPending}
                          >
                            {postComentarioMutation.isPending ? 'Enviando...' : (
                              <>Enviar <Send size={16} /></>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="login-prompt">
                      <Lock size={18} />
                      <span>Faça login para participar da discussão.</span>
                      <button className="login-btn-inline" onClick={() => setShowLoginPopup(true)}>
                        Entrar
                      </button>
                    </div>
                  )}
                </div>

                <div className="comments-list-container">
                  {isLoadingComentarios ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-gray)' }}>
                      Carregando comentários...
                    </div>
                  ) : comentarios.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-gray)', fontStyle: 'italic' }}>
                      Nenhum comentário ainda. Seja o primeiro!
                    </div>
                  ) : (
                    comentarios.map((comentario) => (
                      <CommentItem 
                        key={comentario.id} 
                        comentario={comentario} 
                        currentUser={currentUser}
                        onDeleteRequest={handleDeleteRequest}
                      />
                    ))
                  )}
                </div>
              </div>

            </>
          )}
        </div>
      </main>

      {commentToDelete && (
        <PopupGeralConf
          title="Confirmar Exclusão"
          message="Tem certeza que deseja apagar este comentário? Esta ação não pode ser desfeita."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          confirmText="Apagar"
          cancelText="Cancelar"
        />
      )}

      {popupInfo.show && (
        <PopupGeral
          title={popupInfo.title}
          message={popupInfo.message}
          type={popupInfo.type}
          onClose={() => setPopupInfo({ ...popupInfo, show: false })}
        />
      )}

      {showLoginPopup && <PopupLogin onClose={() => setShowLoginPopup(false)} onLoginSuccess={setCurrentUser} />}
      {showUserPopup && currentUser && <PopupUser user={currentUser} onClose={() => setShowUserPopup(false)} onLogout={() => { localStorage.removeItem('token'); localStorage.removeItem('user_data'); setCurrentUser(null); setShowUserPopup(false); }} />}
      {showRegistrarPopup && partida && partida.mandante && partida.visitante && (
        <PopupRegistrarPartida
          partida={{
            ...partida,
            dataHora: partida.dataHora || "",
            rodadaId: partida.rodadaId || undefined,
            numeroRodada: partida.numeroRodada || undefined,
            etapaMataMata: partida.etapaMataMata || undefined,
            chaveIndex: partida.chaveIndex || undefined,
            estadio: partida.estadio || undefined,
            linkPartida: partida.linkPartida || undefined,
            logEventos: partida.logEventos || undefined,
            tipoPartida: partida.tipoPartida || undefined,
            coeficienteMandante: partida.coeficienteMandante || undefined,
            coeficienteVisitante: partida.coeficienteVisitante || undefined,
            penaltisMandante: partida.penaltisMandante || undefined,
            penaltisVisitante: partida.penaltisVisitante || undefined,
            golsMandante: partida.golsMandante || 0,
            golsVisitante: partida.golsVisitante || 0,
            cartoesAmarelosMandante: partida.cartoesAmarelosMandante || 0,
            cartoesVermelhosMandante: partida.cartoesVermelhosMandante || 0,
            cartoesAmarelosVisitante: partida.cartoesAmarelosVisitante || 0,
            cartoesVermelhosVisitante: partida.cartoesVermelhosVisitante || 0,
            mandante: {
              nome: partida.mandante.clubeNome,
              psnId: partida.mandante.jogadorNome,
              imgUrl: partida.mandante.clubeImagem
            },
            visitante: {
              nome: partida.visitante.clubeNome,
              psnId: partida.visitante.jogadorNome,
              imgUrl: partida.visitante.clubeImagem
            }
          }}
          onClose={() => setShowRegistrarPopup(false)}
          onSuccess={() => { refetch(); }}
        />
      )}
      {showReportarPopup && partida && partida.mandante && partida.visitante && (
        <PopupReportarPartida
          isOpen={showReportarPopup}
          onClose={() => setShowReportarPopup(false)}
          partidaId={partida.id}
          mandante={partida.mandante.jogadorNome}
          timeMandante={partida.mandante.clubeNome}
          visitante={partida.visitante.jogadorNome}
          timeVisitante={partida.visitante.clubeNome}
        />
      )}
    </div>
  );
}