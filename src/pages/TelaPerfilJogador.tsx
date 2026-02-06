import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Menu, LayoutDashboard, Users, Trophy, Shield, Wallet, Search, 
  ArrowLeft, Gamepad2, Lightbulb, Settings, 
  CheckCircle, Clock, Award, BarChart3, Target, CalendarSync,
  Flag, Ban, TrendingUp, Info, FileText, Star, Swords, Activity
} from 'lucide-react';
import jsPDF from 'jspdf';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

interface InsigniaDefinition {
  id: string;
  nome: string;
  imagem: string;
  descricao: string;
}

interface PlayerInsignia {
  id?: string;
  nome: string;
  imagem?: string;
  descricao?: string;
  cor?: string;
}

interface Achievement {
  idConquista: string;
  idTitulo: string;
  nomeTitulo: string;
  nomeEdicao: string;
  imagemConquista: string;
  idJogador: string;
  nomeJogador: string;
  imagemJogador: string | null;
  idClube: string;
  nomeClube: string;
  siglaClube: string;
  imagemClube: string;
  dataHora: string;
}

interface Player {
  id: string;
  nome: string;
  discord: string;
  finais: number;
  titulos: number;
  golsMarcados: number;
  golsSofridos: number;
  partidasJogadas: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  criacaoConta: string;
  modificacaoConta: string;
  statusJogador: 'ATIVO' | 'INATIVO' | 'SUSPENSO';
  contaReivindicada: boolean;
  cargo: any;
  imagem: string | null;
  descricao: string | null;
  suspensoAte: string | null;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  saldoVirtual: number;
  pontosCoeficiente: number;
  insignias: PlayerInsignia[];
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

interface HistoryData {
  id: string;
  nome: string;
  imagem: string;
  cargo: string;
  totalJogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  aproveitamento: string;
  golsMarcados: number;
  golsSofridos: number;
  saldoGols: number;
  mediaGolsPorJogo: number;
  titulos: number;
  finais: number;
  pontosCoeficiente: number;
}

interface VictimData {
  adversarioId: string;
  adversarioNome: string;
  adversarioDiscord: string;
  adversarioImagem: string | null;
  partidasJogadas: number;
  minhasVitorias: number;
  meusEmpates: number;
  minhasDerrotas: number;
  golsFeitos: number;
  golsSofridos: number;
  saldoGols: number;
  aproveitamento: string;
}

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const fetchInsigniasService = async () => {
    const response = await API.get('/insignia');
    if (Array.isArray(response)) return response;
    if (response.data && Array.isArray(response.data)) return response.data;
    return [];
};

const fetchPlayerAchievementsService = async (playerId: string) => {
    try {
        const response = await API.get(`/conquistas/jogador/${playerId}`);
        return response.data;
    } catch (error) {
        return [];
    }
};

const fetchPlayerVictimsService = async (playerId: string) => {
    try {
        const response = await API.get(`/jogador/${playerId}/patos`);
        return response.data;
    } catch (error) {
        return [];
    }
};

const fetchPlayerMomentoService = async (playerId: string) => {
    try {
        const response = await API.get(`/jogador/${playerId}/momento`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        return [];
    }
};

export function TelaPerfilJogador() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredBadgeId, setHoveredBadgeId] = useState<string | null>(null);

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const { data: insigniasDefinitions = [] } = useQuery({
    queryKey: ['insigniasDefinitions'],
    queryFn: fetchInsigniasService,
    staleTime: 1000 * 60 * 15,
  });

  const { data: achievements = [], isLoading: isLoadingAchievements } = useQuery<Achievement[]>({
    queryKey: ['playerAchievements', id],
    queryFn: () => fetchPlayerAchievementsService(id!),
    enabled: !!id,
  });

  const { data: victims = [], isLoading: isLoadingVictims } = useQuery<VictimData[]>({
    queryKey: ['playerVictims', id],
    queryFn: () => fetchPlayerVictimsService(id!),
    enabled: !!id,
  });

  const { data: momento = [] } = useQuery<string[]>({
    queryKey: ['playerMomento', id],
    queryFn: () => fetchPlayerMomentoService(id!),
    enabled: !!id,
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: any) => {
        map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

  const insigniaDetailsMap = useMemo(() => {
      const map: Record<string, InsigniaDefinition> = {};
      insigniasDefinitions.forEach((def: InsigniaDefinition) => {
          map[def.nome] = def; 
      });
      return map;
  }, [insigniasDefinitions]);

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
    if (id) {
        fetchPlayerDetails(id);
    }
  }, [id]);

  const fetchPlayerDetails = async (playerId: string) => {
    try {
      setLoading(true);
      const data = await API.get(`/jogador/${playerId}`);
      const playerData = (data && (data as any).data) ? (data as any).data : data;
      setPlayer(playerData as Player);
    } catch (error) {
      console.error(error);
      navigate('/jogadores');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setCurrentUser(userData);
    localStorage.setItem('user_data', JSON.stringify(userData));
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        setCurrentUser(null);
        setShowUserPopup(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigate(`/jogadores?busca=${searchTerm}`);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const getPlayerAvatar = () => {
    if (!player?.imagem) return null;
    return avatarMap[player.imagem] || player.imagem;
  };

  const getVictimAvatar = (victim: VictimData) => {
      if (!victim.adversarioImagem) return null;
      if (victim.adversarioImagem.startsWith('http')) return victim.adversarioImagem;
      return avatarMap[victim.adversarioImagem] || victim.adversarioImagem;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return 'D$ ' + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const isSuspended = useMemo(() => {
    if (!player?.suspensoAte) return false;
    return new Date(player.suspensoAte) > new Date();
  }, [player]);

  const getImageDataUrl = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn("Erro ao carregar imagem para o PDF", error);
      return null;
    }
  };

  const handleGenerateHistory = async () => {
    if (!player) return;

    try {
      setPdfLoading(true);
      const response = await API.get(`/jogador/${player.id}/historia`);
      const historyData: HistoryData = response.data;

      const doc = new jsPDF();
      
      const primaryColor = '#4e3eff';
      const secondaryColor = '#1e1e2e';
      const accentColor = '#f59e0b';
      const lightBg = '#f3f4f6';

      doc.setFillColor(secondaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text("RELATÓRIO DE PERFORMANCE", 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("TORNEIOS DDO", 105, 30, { align: 'center' });

      let yPos = 55;
      
      if (historyData.imagem) {
        const imgData = await getImageDataUrl(historyData.imagem);
        if (imgData) {
           doc.addImage(imgData, 'PNG', 15, yPos, 35, 35);
        } else {
           doc.setFillColor(200, 200, 200);
           doc.circle(32.5, yPos + 17.5, 17.5, 'F');
           doc.setTextColor(50, 50, 50);
           doc.setFontSize(20);
           doc.text(historyData.nome.charAt(0), 32.5, yPos + 24, { align: 'center' });
        }
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(historyData.nome.toUpperCase(), 60, yPos + 12);

      doc.setFillColor(primaryColor);
      doc.roundedRect(60, yPos + 20, 50, 10, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(historyData.cargo || 'JOGADOR', 85, yPos + 26.5, { align: 'center' });

      doc.setFillColor(accentColor);
      doc.roundedRect(115, yPos + 20, 40, 10, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`COEF: ${historyData.pontosCoeficiente.toFixed(2)}`, 135, yPos + 26.5, { align: 'center' });

      yPos += 50;

      const drawStatCard = (label: string, value: string | number, x: number, y: number, color = secondaryColor) => {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(220, 220, 220);
          doc.roundedRect(x, y, 40, 30, 2, 2, 'FD');
          
          doc.setTextColor(color);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(String(value), x + 20, y + 14, { align: 'center' });
          
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(label.toUpperCase(), x + 20, y + 24, { align: 'center' });
      };

      doc.setFillColor(lightBg);
      doc.rect(0, yPos - 10, 210, 150, 'F');

      doc.setTextColor(secondaryColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("RESUMO GERAL", 15, yPos + 5);

      let startY = yPos + 15;
      drawStatCard("Total Jogos", historyData.totalJogos, 15, startY);
      drawStatCard("Vitórias", historyData.vitorias, 60, startY, '#10b981');
      drawStatCard("Empates", historyData.empates, 105, startY, '#64748b');
      drawStatCard("Derrotas", historyData.derrotas, 150, startY, '#ef4444');

      startY += 35;
      drawStatCard("Gols Pró", historyData.golsMarcados, 15, startY);
      drawStatCard("Gols Contra", historyData.golsSofridos, 60, startY);
      drawStatCard("Saldo", historyData.saldoGols, 105, startY, historyData.saldoGols >= 0 ? '#10b981' : '#ef4444');
      drawStatCard("Média Gols", historyData.mediaGolsPorJogo.toFixed(2), 150, startY);

      startY += 45;
      doc.text("CONQUISTAS & APROVEITAMENTO", 15, startY - 5);
      
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(15, startY, 85, 40, 2, 2, 'FD');
      doc.setTextColor(secondaryColor);
      doc.setFontSize(22);
      doc.text(historyData.aproveitamento, 57.5, startY + 20, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("APROVEITAMENTO", 57.5, startY + 32, { align: 'center' });

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(105, startY, 40, 40, 2, 2, 'FD');
      doc.setTextColor(accentColor);
      doc.setFontSize(22);
      doc.text(String(historyData.titulos), 125, startY + 20, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("TÍTULOS", 125, startY + 32, { align: 'center' });

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(150, startY, 40, 40, 2, 2, 'FD');
      doc.setTextColor(secondaryColor);
      doc.setFontSize(22);
      doc.text(String(historyData.finais), 170, startY + 20, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("FINAIS", 170, startY + 32, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const today = new Date().toLocaleDateString('pt-BR');
      doc.text(`Documento gerado automaticamente em ${today}`, 105, 280, { align: 'center' });

      doc.save(`historia-${historyData.nome.replace(/\s+/g, '_').toLowerCase()}.pdf`);

    } catch (error) {
      console.error("Erro ao gerar PDF", error);
      alert("Não foi possível gerar a história do jogador no momento.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      <LoadingSpinner isLoading={loading || pdfLoading} />

      <style>{`
        .profile-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            padding-bottom: 40px;
            animation: fadeInUp 0.5s ease-out;
        }

        .btn-back {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 50px;
            color: var(--text-gray);
            font-weight: 500;
            margin-bottom: 24px;
            transition: all 0.2s;
            cursor: pointer;
        }
        .btn-back:hover {
            color: var(--primary);
            border-color: var(--primary);
            transform: translateX(-4px);
        }

        .btn-history {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: rgba(78, 62, 255, 0.1);
            border: 1px solid rgba(78, 62, 255, 0.2);
            border-radius: 8px;
            color: var(--primary);
            font-weight: 600;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 8px;
        }
        .btn-history:hover {
            background: var(--primary);
            color: white;
            transform: translateY(-2px);
        }

        .profile-hero {
            position: relative;
            background: var(--bg-card);
            border-radius: 24px;
            border: 1px solid var(--border-color);
            overflow: visible;
            margin-bottom: 24px;
            box-shadow: var(--shadow-sm);
            padding: 40px;
        }

        .hero-body {
            display: flex;
            align-items: center;
            gap: 30px;
        }

        .avatar-container {
            width: 130px;
            height: 130px;
            border-radius: 30px;
            padding: 5px;
            background: var(--bg-card);
            border: 2px solid var(--border-color);
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            flex-shrink: 0;
        }
        .avatar-img {
            width: 100%;
            height: 100%;
            border-radius: 25px;
            object-fit: cover;
            background-color: var(--hover-bg);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: var(--primary);
            font-weight: 800;
        }

        .user-identity {
            flex: 1;
        }
        .user-name {
            font-size: 2.2rem;
            font-weight: 800;
            color: var(--text-dark);
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
            line-height: 1.1;
        }
        .verified-icon { color: #0ea5e9; }
        
        .user-tags {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }
        .tag-role {
            background: rgba(78, 62, 255, 0.1);
            color: var(--primary);
            padding: 6px 14px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
        }
        .tag-discord {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-gray);
            font-size: 0.9rem;
            font-weight: 500;
            background: var(--hover-bg);
            padding: 6px 14px;
            border-radius: 12px;
        }

        .stats-overview-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 24px;
        }

        .stat-overview-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            position: relative;
            overflow: hidden;
            box-shadow: var(--shadow-sm);
            transition: transform 0.2s;
        }
        .stat-overview-card:hover {
            transform: translateY(-2px);
            border-color: var(--primary);
        }

        .stat-ov-icon-wrapper {
            margin-bottom: 12px;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }

        .stat-ov-value {
            font-size: 1.6rem;
            font-weight: 800;
            color: var(--text-dark);
            line-height: 1;
            margin-bottom: 4px;
        }
        .stat-ov-label {
            font-size: 0.8rem;
            color: var(--text-gray);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .bg-gold { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .bg-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .bg-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .bg-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }

        .content-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 24px;
        }

        .card-box {
            background: var(--bg-card);
            border-radius: 24px;
            border: 1px solid var(--border-color);
            padding: 24px;
            box-shadow: var(--shadow-sm);
            margin-bottom: 24px;
            position: relative;
        }
        .card-box:last-child { margin-bottom: 0; }
        
        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
        }
        .card-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-dark);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .w-d-l-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 30px;
        }
        .wdl-item {
            background: var(--hover-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 16px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .wdl-val {
            font-size: 2rem;
            font-weight: 800;
            line-height: 1;
            margin-bottom: 4px;
        }
        .wdl-lbl {
            font-size: 0.75rem;
            text-transform: uppercase;
            font-weight: 600;
            color: var(--text-gray);
        }
        .val-win { color: #10b981; }
        .val-draw { color: var(--text-gray); }
        .val-loss { color: #ef4444; }

        .progress-section { margin-bottom: 24px; }
        .progress-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-dark);
        }
        .progress-track {
            height: 14px;
            background: var(--hover-bg);
            border-radius: 10px;
            overflow: hidden;
            display: flex;
        }
        .progress-bar { height: 100%; }
        .bar-win { background: #10b981; }
        .bar-draw { background: #cbd5e1; }
        .bar-loss { background: #ef4444; }

        .stats-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px dashed var(--border-color);
        }
        .stats-row:last-child { border-bottom: none; }
        .stat-k { color: var(--text-gray); font-weight: 500; font-size: 0.95rem; }
        .stat-v { color: var(--text-dark); font-weight: 700; }

        .momento-section {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px dashed var(--border-color);
        }
        .momento-label {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-gray);
            text-transform: uppercase;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .momento-row {
            display: flex;
            gap: 8px;
            justify-content: flex-start;
            align-items: center;
        }
        .momento-pill {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 0.8rem;
            color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border: 2px solid var(--bg-card);
        }
        .res-V { background-color: #10b981; }
        .res-E { background-color: #94a3b8; }
        .res-D { background-color: #ef4444; }

        .merged-discipline {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px dashed var(--border-color);
        }
        
        .merged-discipline-header {
             font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-gray);
            text-transform: uppercase;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .discipline-compact {
            display: flex;
            gap: 20px;
        }

        .disc-item-compact {
            display: flex;
            align-items: center;
            gap: 10px;
            background: var(--hover-bg);
            padding: 8px 16px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
        }
        
        .card-icon {
            width: 20px;
            height: 28px;
            border-radius: 4px;
        }
        .icon-yellow { background: #facc15; }
        .icon-red { background: #ef4444; }
        
        .disc-count {
            font-weight: 800;
            color: var(--text-dark);
            font-size: 1.1rem;
        }
        
        .suspension-alert {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #ef4444;
            padding: 12px;
            border-radius: 12px;
            font-size: 0.9rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 12px;
        }

        .badges-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
            gap: 14px;
            position: relative;
        }
        .badge-slot {
            aspect-ratio: 1;
            background: var(--hover-bg);
            border-radius: 14px;
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            cursor: pointer;
            position: relative;
        }
        .badge-slot:hover {
            transform: scale(1.1) translateY(-4px);
            border-color: var(--primary);
            background: var(--bg-card);
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            z-index: 20;
        }
        .badge-icon { width: 65%; height: 65%; object-fit: contain; }
        .badge-count {
            background: var(--hover-bg);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-gray);
        }

        .badge-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            width: 240px;
            background: rgba(20, 20, 30, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 12px;
            color: #fff;
            margin-bottom: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 100;
            pointer-events: none;
            text-align: center;
            animation: fadeIn 0.2s ease-out;
        }
        .badge-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 6px;
            border-style: solid;
            border-color: rgba(20, 20, 30, 0.95) transparent transparent transparent;
        }
        .tooltip-title { font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; color: #fff; }
        .tooltip-desc { font-size: 0.75rem; color: #cbd5e1; line-height: 1.4; }

        .bio-box {
            background: var(--hover-bg);
            padding: 16px;
            border-radius: 16px;
            font-style: italic;
            color: var(--text-gray);
            line-height: 1.6;
        }
        
        .info-list { display: flex; flex-direction: column; gap: 16px; }
        .info-item { display: flex; justify-content: space-between; align-items: center; }
        .info-label { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-gray); }
        .info-value { font-weight: 600; color: var(--text-dark); }
        .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; }
        .status-active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-inactive { background: rgba(100, 116, 139, 0.1); color: #64748b; }

        .achievements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 24px;
            margin-top: 16px;
        }

        .trophy-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            overflow: hidden;
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .trophy-card:hover {
            transform: translateY(-8px);
            border-color: var(--primary);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            z-index: 10;
        }

        .trophy-img-container {
            width: 100%;
            height: 180px;
            background: #000;
            position: relative;
            overflow: hidden;
        }
        
        .trophy-img-container::after {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%);
        }

        .trophy-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s ease;
        }

        .trophy-card:hover .trophy-img {
            transform: scale(1.1);
        }

        .trophy-content {
            padding: 16px 20px;
            flex: 1;
            display: flex;
            flex-direction: column;
            border-top: 1px solid var(--border-color);
        }

        .trophy-title {
            font-size: 1.1rem;
            font-weight: 800;
            color: var(--text-dark);
            margin-bottom: 8px;
            line-height: 1.3;
        }

        .trophy-footer {
            margin-top: auto;
            padding-top: 12px;
            border-top: 1px dashed var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .trophy-club {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-dark);
        }

        .club-icon-sm {
            width: 20px;
            height: 20px;
            object-fit: contain;
        }
        
        .trophy-date {
            font-size: 0.75rem;
            color: var(--text-gray);
            background: var(--hover-bg);
            padding: 4px 8px;
            border-radius: 6px;
        }

        .victims-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
            margin-top: 16px;
        }

        .victim-card {
            background: var(--hover-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            transition: transform 0.2s, border-color 0.2s;
        }

        .victim-card:hover {
            transform: translateY(-4px);
            border-color: var(--primary);
        }

        .victim-header {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .victim-avatar {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            object-fit: cover;
            font-weight: 800;
            color: var(--primary);
            font-size: 1.2rem;
            flex-shrink: 0;
        }

        .victim-identity {
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .victim-name {
            font-weight: 700;
            font-size: 1.1rem;
            color: var(--text-dark);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .victim-discord {
            font-size: 0.8rem;
            color: var(--text-gray);
        }

        .victim-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            background: var(--bg-card);
            padding: 12px;
            border-radius: 12px;
        }

        .v-stat-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .v-stat-val {
            font-weight: 800;
            font-size: 1.2rem;
            color: var(--text-dark);
        }

        .v-stat-lbl {
            font-size: 0.7rem;
            color: var(--text-gray);
            text-transform: uppercase;
            font-weight: 600;
        }

        .win-rate-visual {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .win-rate-header {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--text-dark);
        }

        .win-rate-track {
            height: 8px;
            background: rgba(0,0,0,0.1);
            border-radius: 4px;
            overflow: hidden;
        }

        .win-rate-fill {
            height: 100%;
            background: #10b981;
            border-radius: 4px;
        }

        @media (max-width: 768px) {
            .profile-hero { padding: 24px; }
            .hero-body { flex-direction: column; text-align: center; gap: 20px; }
            .user-name { justify-content: center; }
            .user-tags { justify-content: center; }
            .stats-overview-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
            .content-grid { grid-template-columns: 1fr; }
            .achievements-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
            .victims-grid { grid-template-columns: 1fr; }
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
          <a onClick={() => navigate('/jogadores')} className="nav-item active" style={{cursor: 'pointer'}}>
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
                placeholder="Buscar jogador..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
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
            {player && (
                <div className="profile-wrapper">
                    <button onClick={() => navigate('/jogadores')} className="btn-back">
                        <ArrowLeft size={18} /> Voltar para lista
                    </button>

                    <div className="profile-hero">
                        <div className="hero-body">
                            <div className="avatar-container">
                                {player.imagem ? (
                                    <img src={getPlayerAvatar()!} alt={player.nome} className="avatar-img" />
                                ) : (
                                    <div className="avatar-img">{player.nome.charAt(0)}</div>
                                )}
                            </div>

                            <div className="user-identity">
                                <div className="user-name">
                                    {player.nome}
                                    {player.contaReivindicada && <CheckCircle size={24} className="verified-icon" fill="currentColor" stroke="var(--bg-card)" />}
                                </div>
                                <div className="user-tags">
                                    <span className="tag-role">{player.cargo || 'JOGADOR'}</span>
                                    <span className="tag-discord">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                                        </svg>
                                        {player.discord}
                                    </span>
                                    <button onClick={handleGenerateHistory} className="btn-history" disabled={pdfLoading}>
                                       <FileText size={14} /> 
                                       {pdfLoading ? "Gerando..." : "Gerar História (PDF)"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="stats-overview-grid">
                        <div className="stat-overview-card">
                            <div className="stat-ov-icon-wrapper bg-gold">
                                <Trophy size={20} />
                            </div>
                            <span className="stat-ov-value">{player.titulos}</span>
                            <span className="stat-ov-label">Títulos</span>
                        </div>
                        <div className="stat-overview-card">
                            <div className="stat-ov-icon-wrapper bg-blue">
                                <Target size={20} />
                            </div>
                            <span className="stat-ov-value">{player.finais}</span>
                            <span className="stat-ov-label">Finais Disputadas</span>
                        </div>
                        <div className="stat-overview-card">
                            <div className="stat-ov-icon-wrapper bg-purple">
                                <TrendingUp size={20} />
                            </div>
                            <span className="stat-ov-value">{player.pontosCoeficiente.toFixed(2)}</span>
                            <span className="stat-ov-label">Coeficiente</span>
                        </div>
                        <div className="stat-overview-card">
                            <div className="stat-ov-icon-wrapper bg-green">
                                <Wallet size={20} />
                            </div>
                            <span className="stat-ov-value">{formatCurrency(player.saldoVirtual)}</span>
                            <span className="stat-ov-label">Saldo em Conta</span>
                        </div>
                    </div>

                    <div className="content-grid">
                        <div className="left-col">
                            <div className="card-box">
                                <div className="card-header">
                                    <div className="card-title"><BarChart3 size={20} className="text-purple" /> Resumo Geral</div>
                                </div>
                                
                                <div className="w-d-l-grid">
                                    <div className="wdl-item">
                                        <span className="wdl-val val-win">{player.vitorias}</span>
                                        <span className="wdl-lbl">Vitórias</span>
                                    </div>
                                    <div className="wdl-item">
                                        <span className="wdl-val val-draw">{player.empates}</span>
                                        <span className="wdl-lbl">Empates</span>
                                    </div>
                                    <div className="wdl-item">
                                        <span className="wdl-val val-loss">{player.derrotas}</span>
                                        <span className="wdl-lbl">Derrotas</span>
                                    </div>
                                </div>

                                <div className="progress-section">
                                    <div className="progress-header">
                                        <span>Aproveitamento</span>
                                        <span>
                                            {player.partidasJogadas > 0 
                                                ? Math.round((player.vitorias / player.partidasJogadas) * 100) 
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="progress-track">
                                        <div className="progress-bar bar-win" style={{width: `${(player.vitorias/player.partidasJogadas)*100}%`}}></div>
                                        <div className="progress-bar bar-draw" style={{width: `${(player.empates/player.partidasJogadas)*100}%`}}></div>
                                        <div className="progress-bar bar-loss" style={{width: `${(player.derrotas/player.partidasJogadas)*100}%`}}></div>
                                    </div>
                                </div>

                                <div className="stats-list">
                                    <div className="stats-row">
                                        <span className="stat-k">Partidas Jogadas</span>
                                        <span className="stat-v">{player.partidasJogadas}</span>
                                    </div>
                                    <div className="stats-row">
                                        <span className="stat-k">Gols Marcados</span>
                                        <span className="stat-v">{player.golsMarcados}</span>
                                    </div>
                                    <div className="stats-row">
                                        <span className="stat-k">Gols Sofridos</span>
                                        <span className="stat-v">{player.golsSofridos}</span>
                                    </div>
                                    <div className="stats-row">
                                        <span className="stat-k">Saldo de Gols</span>
                                        <span className="stat-v" style={{color: (player.golsMarcados - player.golsSofridos) >= 0 ? '#10b981' : '#ef4444'}}>
                                            {player.golsMarcados - player.golsSofridos}
                                        </span>
                                    </div>
                                    <div className="stats-row">
                                        <span className="stat-k">Média Gols/Jogo</span>
                                        <span className="stat-v">
                                            {player.partidasJogadas > 0 ? (player.golsMarcados / player.partidasJogadas).toFixed(2) : '0.00'}
                                        </span>
                                    </div>
                                </div>

                                {momento.length > 0 && (
                                    <div className="momento-section">
                                        <div className="momento-label">
                                            <span>Últimas partidas: O jogo mais recente é exibido primeiro, à esquerda.</span>
                                            <Activity size={16} />
                                        </div>
                                        <div className="momento-row">
                                            {[...momento].reverse().map((resultado, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={`momento-pill res-${resultado}`} 
                                                    title={resultado === 'V' ? 'Vitória' : resultado === 'E' ? 'Empate' : 'Derrota'}
                                                >
                                                    {resultado}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="merged-discipline">
                                     <div className="merged-discipline-header">
                                        <Flag size={16} />
                                        <span>Disciplina</span>
                                     </div>
                                     <div className="discipline-compact">
                                         <div className="disc-item-compact">
                                             <div className="card-icon icon-yellow"></div>
                                             <span className="disc-count">{player.cartoesAmarelos} amarelos</span>
                                         </div>
                                         <div className="disc-item-compact">
                                             <div className="card-icon icon-red"></div>
                                             <span className="disc-count">{player.cartoesVermelhos} vermelhos</span>
                                         </div>
                                     </div>
                                     {isSuspended && (
                                        <div className="suspension-alert">
                                            <Ban size={18} />
                                            <span>Suspenso até {formatDate(player.suspensoAte)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="right-col">
                            <div className="card-box">
                                <div className="card-header">
                                    <div className="card-title"><Award size={20} className="text-purple" /> Insígnias</div>
                                    <span style={{fontSize: '0.8rem', color: 'var(--text-gray)'}}>{player.insignias.length} Total</span>
                                </div>
                                
                                {player.insignias.length === 0 ? (
                                    <div style={{textAlign: 'center', padding: '20px', color: 'var(--text-gray)', fontSize: '0.9rem'}}>
                                        Nenhuma insígnia conquistada ainda.
                                    </div>
                                ) : (
                                    <div className="badges-grid">
                                        {player.insignias.map((badge, idx) => {
                                            const def = insigniaDetailsMap[badge.nome];
                                            const imgSrc = def?.imagem || badge.imagem || 'https://via.placeholder.com/64';
                                            const desc = def?.descricao || badge.descricao || badge.nome;
                                            
                                            return (
                                                <div 
                                                    key={idx} 
                                                    className="badge-slot"
                                                    onMouseEnter={() => setHoveredBadgeId(String(idx))}
                                                    onMouseLeave={() => setHoveredBadgeId(null)}
                                                >
                                                    <img src={imgSrc} alt={badge.nome} className="badge-icon" />
                                                    
                                                    {hoveredBadgeId === String(idx) && (
                                                        <div className="badge-tooltip">
                                                            <div className="tooltip-title">{badge.nome}</div>
                                                            <div className="tooltip-desc">{desc}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="card-box">
                                <div className="card-header">
                                    <div className="card-title"><Info size={20} className="text-green" /> Informações</div>
                                </div>
                                <div className="bio-box">
                                    {player.descricao || "Este jogador ainda não escreveu uma biografia."}
                                </div>
                                
                                <div className="info-list" style={{marginTop: '24px'}}>
                                    <div className="info-item">
                                        <span className="info-label"><Clock size={16}/> Membro desde</span>
                                        <span className="info-value">{formatDate(player.criacaoConta)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label"><TrendingUp size={16}/> Última atividade</span>
                                        <span className="info-value">{formatDate(player.modificacaoConta)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label"><Flag size={16}/> Status</span>
                                        <span className={`status-badge ${player.statusJogador === 'ATIVO' ? 'status-active' : 'status-inactive'}`}>
                                            {player.statusJogador}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-box" style={{ marginTop: '24px' }}>
                        <div className="card-header">
                            <div className="card-title"><Swords size={20} className="text-red" style={{color: '#ef4444'}} /> Maiores Vítimas</div>
                        </div>
                        
                        {isLoadingVictims ? (
                             <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-gray)' }}>Carregando dados...</div>
                        ) : victims.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-gray)' }}>
                                Nenhum histórico de dominância encontrado.
                            </div>
                        ) : (
                            <div className="victims-grid">
                                {victims.map((victim) => (
                                    <div key={victim.adversarioId} className="victim-card">
                                        <div className="victim-header">
                                            {getVictimAvatar(victim) ? (
                                                 <img src={getVictimAvatar(victim)!} alt={victim.adversarioNome} className="victim-avatar" />
                                            ) : (
                                                <div className="victim-avatar">{victim.adversarioNome.charAt(0)}</div>
                                            )}
                                            <div className="victim-identity">
                                                <span className="victim-name">{victim.adversarioNome}</span>
                                                <span className="victim-discord">{victim.adversarioDiscord}</span>
                                            </div>
                                        </div>

                                        <div className="victim-stats">
                                            <div className="v-stat-box">
                                                <span className="v-stat-val" style={{color: '#10b981'}}>{victim.minhasVitorias}</span>
                                                <span className="v-stat-lbl">Vitórias</span>
                                            </div>
                                            <div className="v-stat-box">
                                                <span className="v-stat-val">{victim.partidasJogadas}</span>
                                                <span className="v-stat-lbl">Jogos</span>
                                            </div>
                                            <div className="v-stat-box">
                                                <span className="v-stat-val">{victim.golsFeitos}</span>
                                                <span className="v-stat-lbl">GP</span>
                                            </div>
                                            <div className="v-stat-box">
                                                <span className="v-stat-val">{victim.saldoGols > 0 ? `+${victim.saldoGols}` : victim.saldoGols}</span>
                                                <span className="v-stat-lbl">Saldo</span>
                                            </div>
                                        </div>

                                        <div className="win-rate-visual">
                                            <div className="win-rate-header">
                                                <span>Aproveitamento</span>
                                                <span>{victim.aproveitamento}</span>
                                            </div>
                                            <div className="win-rate-track">
                                                <div 
                                                    className="win-rate-fill" 
                                                    style={{ width: victim.aproveitamento }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card-box" style={{ marginTop: '24px' }}>
                         <div className="card-header">
                            <div className="card-title"><Trophy size={20} className="text-orange" /> Galeria de Troféus</div>
                            <span style={{fontSize: '0.9rem', color: 'var(--text-gray)', fontWeight: 600}}>
                                {achievements.length} {achievements.length === 1 ? 'Conquista' : 'Conquistas'}
                            </span>
                        </div>

                        {isLoadingAchievements ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <div style={{ 
                                    width: '30px', 
                                    height: '30px', 
                                    border: '3px solid var(--border-color)', 
                                    borderTopColor: 'var(--primary)', 
                                    borderRadius: '50%', 
                                    margin: '0 auto',
                                    animation: 'spin 0.8s linear infinite'
                                }}></div>
                                <p style={{ marginTop: '10px', color: 'var(--text-gray)', fontSize: '0.9rem' }}>Carregando sala de troféus...</p>
                            </div>
                        ) : achievements.length === 0 ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-gray)' }}>
                                <div style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    background: 'var(--hover-bg)', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    margin: '0 auto 16px auto' 
                                }}>
                                    <Trophy size={40} style={{ opacity: 0.4 }} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '4px' }}>Nenhum título encontrado</h3>
                                <p style={{ fontSize: '0.9rem' }}>Este jogador ainda não levantou nenhuma taça.</p>
                            </div>
                        ) : (
                            <div className="achievements-grid">
                                {achievements.map((ach) => (
                                    <a key={ach.idConquista} className="trophy-card" href={ach.imagemConquista} target="_blank" rel="noopener noreferrer">
                                        <div className="trophy-img-container">
                                            <img src={ach.imagemConquista} alt={ach.nomeTitulo} className="trophy-img" />
                                        </div>
                                        <div className="trophy-content">
                                            <div className="trophy-title">{ach.nomeTitulo}</div>
                                            
                                            <div className="trophy-footer">
                                                <div className="trophy-club">
                                                    {ach.imagemClube ? (
                                                        <img src={ach.imagemClube} alt={ach.siglaClube} className="club-icon-sm" />
                                                    ) : (
                                                        <Shield size={16} />
                                                    )}
                                                    {ach.nomeClube}
                                                </div>
                                                <div className="trophy-date">
                                                    {new Date(ach.dataHora).toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
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