import { useState, useEffect, useMemo, useRef } from 'react';
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
  Bell, 
  Gamepad2, 
  Star,
  Lightbulb,
  CalendarSync,
  Crown,
  TrendingUp,
  Target,
  Medal,
  Calendar,
  ChevronRight,
  ArrowRight,
  Zap,
  Newspaper,
  ChevronLeft,
  Megaphone,
  AlertCircle
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupReivindicar from '../components/PopupReivindicar';
import PopupRecuperarSenha from '../components/PopupRecuperarSenha';
import PopupNotificacao from '../components/PopupNotificacao';

interface Conquista {
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

interface Torneio {
  id: number;
  nome: string;
  descricao: string;
  status: 'em_andamento' | 'inscricoes_abertas' | 'finalizado' | 'disponivel';
  imagem?: string;
  botao_texto?: string;
  link_destino?: string;
}

interface Player {
  id: string;
  nome: string;
  discord: string;
  pontosCoeficiente: number;
  imagem?: string;
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

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  link: string;
  tipo: string;
  lida: boolean;
  dataCriacao: string;
}

interface Noticia {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  linkPartida: string;
  dataCriacao: string;
}

interface Anuncio {
  id: string;
  titulo: string;
  mensagem: string;
  dataPostagem: string;
  tipoMensagem: string;
  imagem: string;
  corMensagem: string;
}

const fetchAvatarsService = async () => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const fetchTopPlayersService = async () => {
  const response = await API.get('/jogador/by-coeficiente-10');
  return response.data || [];
};

const fetchConquistasRecentesService = async () => {
  const response = await API.get('/conquistas/recentes');
  return response.data || [];
};

const fetchMinhasNotificacoesService = async () => {
  const response = await API.get('/api/notificacoes/minhas');
  return response.data || [];
};

const fetchNoticiasService = async () => {
  const response = await API.get('/api/noticias');
  return response.data || [];
};

const fetchAnunciosService = async () => {
  const response = await API.get('/anuncios/recentes');
  return response.data || [];
};

export function TorneiosPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showRecuperarSenhaPopup, setShowRecuperarSenhaPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [trophyHover, setTrophyHover] = useState(false);
  const [showReivindicarPopup, setShowReivindicarPopup] = useState(false);
  const [showNotificacaoPopup, setShowNotificacaoPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const newsScrollRef = useRef<HTMLDivElement>(null);
  
  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const { data: topPlayers = [], isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['topPlayers'],
    queryFn: fetchTopPlayersService,
    staleTime: 1000 * 60 * 5, 
  });

  const { data: conquistas = [], isLoading: isLoadingConquistas } = useQuery<Conquista[]>({
    queryKey: ['conquistasRecentes'],
    queryFn: fetchConquistasRecentesService,
    staleTime: 1000 * 60 * 2,
  });

  const { 
    data: notificacoes = [], 
    isError: isNotificacoesError, 
    error: notificacoesError 
  } = useQuery<Notificacao[]>({
    queryKey: ['notificacoesMinhas'],
    queryFn: fetchMinhasNotificacoesService,
    enabled: !!currentUser, 
    retry: false, 
    refetchOnWindowFocus: false,
  });

  const { data: noticias = [] } = useQuery<Noticia[]>({
    queryKey: ['noticias'],
    queryFn: fetchNoticiasService,
    staleTime: 1000 * 60 * 5,
  });

  const { data: anuncios = [] } = useQuery<Anuncio[]>({
    queryKey: ['anuncios'],
    queryFn: fetchAnunciosService,
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (isNotificacoesError && currentUser) {
      const err = notificacoesError as any;
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        setCurrentUser(null);
        window.location.reload();
      }
    }
  }, [isNotificacoesError, notificacoesError, currentUser]);

  const temNotificacaoNaoLida = useMemo(() => {
    return notificacoes.some(n => !n.lida);
  }, [notificacoes]);

  const destaque = useMemo(() => {
    if (!conquistas || conquistas.length === 0) return null;
    
    const ultimaConquista = conquistas[0];
    const dataConquista = new Date(ultimaConquista.dataHora);
    const dataAtual = new Date();
    
    const diffTime = Math.abs(dataAtual.getTime() - dataConquista.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays > 10) {
      return null;
    }

    return ultimaConquista;
  }, [conquistas]);

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: Avatar) => {
        map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return topPlayers;
    return topPlayers.filter(player => 
      player.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.discord.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [topPlayers, searchTerm]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user_data');
      }
    }

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize(); 

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

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

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const scrollNews = (direction: 'left' | 'right') => {
    if (newsScrollRef.current) {
      const containerWidth = newsScrollRef.current.clientWidth;
      if (direction === 'left') {
        newsScrollRef.current.scrollBy({ left: -containerWidth, behavior: 'smooth' });
      } else {
        newsScrollRef.current.scrollBy({ left: containerWidth, behavior: 'smooth' });
      }
    }
  };

  const getCurrentUserAvatar = () => {
    if (!currentUser?.imagem) return null;
    return avatarMap[currentUser.imagem] || currentUser.imagem;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    return formatDate(dateString);
  };

  const torneios: Torneio[] = [
    {
      id: 1,
      nome: 'Liga Real DDO',
      descricao: 'A elite do futebol virtual em disputa.',
      status: 'em_andamento',
      imagem: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Ver Temporadas',
      link_destino: '/temporadas'
    },
    {
      id: 2,
      nome: 'Portal da Transparência',
      descricao: 'Simule o motor de partidas.',
      status: 'disponivel',
      imagem: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Estadio_Santiago_Bernab%C3%A9u_Madrid.jpg?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Acessar Portal',
      link_destino: '/transparencia'
    },
    {
      id: 3,
      nome: 'Mercado da Bola',
      descricao: 'Valor de mercado de clubes.',
      status: 'disponivel',
      imagem: 'https://lh7-us.googleusercontent.com/OTAj3_arkkVj7wlDpWovqngMbuVUHQxEbvgJ7P-YU_mfZzr11Lp7K2630V2hFARaXYnOi6lIlyLIK2xpjyaTY3UZ6-u3hRX90RY4SheZQ2Gpf5vGIgvlxAoddvr2FXNKM37tQ_GTyxtqkQCD3kUk8UA?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Ver Mercado',
      link_destino: '/mercado'
    },
    {
      id: 4,
      nome: 'Galeria de Insígnias',
      descricao: 'Conquistas e medalhas disponíveis.',
      status: 'disponivel',
      imagem: 'https://images.unsplash.com/photo-1611606063065-ee7946f0787a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Ver Insígnias',
      link_destino: '/insignias'
    },
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_andamento': return 'Ao Vivo';
      case 'inscricoes_abertas': return 'Aberto';
      case 'finalizado': return 'Finalizado';
      case 'disponivel': return 'Novidade';
      default: return status;
    }
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={{zIndex: 100}}>
        <div className="logo-area">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
               <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/>
            </svg>
          </div>
          <span className="logo-text">Torneios <span>DDO</span></span>
        </div>

        <nav className="nav-menu">
          <a onClick={() => handleNavigate('/')} className="nav-item active" style={{cursor: 'pointer'}}>
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a onClick={() => handleNavigate('/jogadores')} className="nav-item" style={{cursor: 'pointer'}}>
            <Users size={20} /> Jogadores
          </a>
          <a onClick={() => handleNavigate('/clubes')} className="nav-item" style={{cursor: 'pointer'}}>
            <Shield size={20} /> Clubes
          </a>
          <a onClick={() => handleNavigate('/competicoes')} className="nav-item" style={{cursor: 'pointer'}}>
            <Trophy size={20} /> Competições
          </a>
          <a onClick={() => handleNavigate('/titulos')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Star size={20} /> Títulos
          </a>
          <a onClick={() => handleNavigate('/temporadas')} className="nav-item" style={{cursor: 'pointer'}}>
            <CalendarSync size={20} /> Temporadas
          </a>
          <div className="nav-separator"></div>
          <a onClick={() => handleNavigate('/partidas')} className="nav-item" style={{cursor: 'pointer'}}>
            <Gamepad2 size={20} /> Partidas
          </a>
           <a onClick={() => handleNavigate('/minha-conta')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Wallet size={20} /> Minha conta
          </a>
          <a onClick={() => handleNavigate('/suporte')} className="nav-item" style={{ cursor: 'pointer' }}>
            <Settings size={20} /> Suporte
          </a>
        </nav>
      </aside>

      {isMobile && sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
              />
            </div>
          </div>
          
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
              <Lightbulb size={20} />
            </button>
            <button 
              className="icon-btn" 
              onClick={() => setShowNotificacaoPopup(true)}
              style={{ position: 'relative' }}
            >
                <Bell size={20} />
                {currentUser && temNotificacaoNaoLida && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#ff4757',
                    borderRadius: '50%',
                    border: '1px solid var(--header-bg, #fff)'
                  }}></span>
                )}
            </button>
            
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
              <>
                <button
                  onClick={() => setShowReivindicarPopup(true)}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-dark)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginLeft: '10px'
                  }}
                >
                  Reivindicar Conta
                </button>
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
              </>
            )}
          </div>
        </header>

        <div className="page-content" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
          
          {isLoadingConquistas ? (
            <div className="tp-hero-skeleton"></div>
          ) : (
            <>
              {destaque ? (
                <div className="tp-hero-container tp-hero-champion">
                  <div style={{
                    position:'absolute', 
                    top: '-50%', 
                    left:'-20%', 
                    width:'200%', 
                    height:'200%', 
                    background:'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 60%)', 
                    animation: 'tp-fade-in 3s infinite alternate',
                    pointerEvents: 'none'
                  }}></div>
                  
                  <div className="tp-hero-content">
                    <div style={{
                      display:'inline-flex', 
                      alignItems:'center', 
                      gap:'8px', 
                      background:'rgba(255,215,0,0.15)', 
                      color:'#ffd700', 
                      padding:'6px 14px', 
                      borderRadius:'30px', 
                      fontSize:'0.75rem', 
                      fontWeight:'600', 
                      marginBottom:'16px', 
                      border:'1px solid rgba(255,215,0,0.3)',
                      letterSpacing: '0.5px'
                    }}>
                      <Crown size={14} fill="currentColor" /> NOVO CAMPEÃO
                    </div>
                    
                    <h1 style={{
                      fontSize: isMobile ? '2rem' : '3rem', 
                      fontWeight:'900', 
                      marginBottom:'10px', 
                      lineHeight: 1.1,
                      background:'linear-gradient(to right, #fff, #ffd700)', 
                      WebkitBackgroundClip:'text', 
                      WebkitTextFillColor:'transparent',
                      letterSpacing: '-1px'
                    }}>
                      {destaque.nomeTitulo}
                    </h1>
                    
                    <div style={{
                      fontSize:'1.6rem', 
                      color:'white', 
                      fontWeight:'500', 
                      marginBottom:'24px', 
                      display:'flex', 
                      alignItems:'center', 
                      gap:'16px'
                    }}>
                      {destaque.nomeJogador}
                      <span style={{
                        background:'rgba(255,255,255,0.1)', 
                        padding:'4px 12px', 
                        borderRadius:'8px', 
                        fontSize:'1rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontWeight: '400'
                      }}>
                        {destaque.siglaClube}
                      </span>
                    </div>

                    <div style={{display:'flex', gap:'20px', color:'rgba(255,255,255,0.8)', fontSize:'0.9rem', fontWeight: 400}}>
                      <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                        <Medal size={16} className="text-yellow-400" /> {destaque.nomeClube}
                      </div>
                      <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                        <Calendar size={16} /> {formatDate(destaque.dataHora)}
                      </div>
                    </div>

                    <button style={{
                      marginTop:'32px', 
                      background:'#ffd700', 
                      color:'black', 
                      border:'none', 
                      padding:'12px 28px', 
                      borderRadius:'10px', 
                      fontWeight:'600', 
                      cursor:'pointer', 
                      display:'flex', 
                      alignItems:'center', 
                      gap:'8px', 
                      boxShadow:'0 0 20px rgba(255,215,0,0.2)',
                      transition: 'transform 0.2s',
                      fontSize: '0.95rem'
                    }} 
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    onClick={() => navigate('/titulos')}>
                      Ver Detalhes <ChevronRight size={18} />
                    </button>
                    {!currentUser && (
                        <button style={{
                      marginTop:'10px', 
                      background:'#ffd700', 
                      color:'black', 
                      border:'none', 
                      padding:'12px 28px', 
                      borderRadius:'10px', 
                      fontWeight:'600', 
                      cursor:'pointer', 
                      display:'flex', 
                      alignItems:'center', 
                      gap:'8px', 
                      boxShadow:'0 0 20px rgba(255,215,0,0.2)',
                      transition: 'transform 0.2s',
                      fontSize: '0.95rem'
                    }} 
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'} onClick={() => setShowRecuperarSenhaPopup(true)}>
                          Recuperar Senha
                        </button>
                    )}
                    
                  </div>

                  <div 
                    className="tp-hero-visual" 
                    onMouseEnter={() => setTrophyHover(true)}
                    onMouseLeave={() => setTrophyHover(false)}
                    style={{cursor: 'pointer'}}
                  >
                    <img 
                      src={destaque.imagemConquista} 
                      alt="Troféu" 
                      style={{
                        height:'100%', 
                        objectFit:'contain', 
                        zIndex:2, 
                        filter:'drop-shadow(0 0 30px rgba(255,215,0,0.3))',
                        transform: trophyHover ? 'scale(1.15) rotate(-2deg)' : 'scale(1.05)',
                        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }} 
                    />
                    <img src={destaque.imagemClube} alt="Escudo" style={{
                      position:'absolute', 
                      bottom:'0', 
                      right:'-10px', 
                      width:'80px', 
                      height:'80px', 
                      objectFit:'contain', 
                      zIndex:3, 
                      background:'rgba(255,255,255,0.15)', 
                      backdropFilter:'blur(5px)', 
                      borderRadius:'50%', 
                      padding:'10px', 
                      border:'1px solid rgba(255,255,255,0.2)',
                      transition: 'transform 0.4s ease',
                      transform: trophyHover ? 'scale(1.1)' : 'scale(1)'
                    }} />
                  </div>
                </div>
              ) : (
                <div className="tp-hero-container tp-hero-default">
                  <div style={{
                    position:'absolute', 
                    top: '-50%', 
                    left:'-20%', 
                    width:'200%', 
                    height:'200%', 
                    background:'radial-gradient(circle, rgba(78,62,255,0.2) 0%, transparent 60%)', 
                    pointerEvents:'none',
                    animation: 'tp-fade-in 4s infinite alternate'
                  }}></div>
                  
                  <div className="tp-hero-content">
                    <div style={{
                      display:'inline-flex', 
                      alignItems:'center', 
                      gap:'6px', 
                      background:'rgba(255,71,87,0.15)', 
                      color:'#ff4757', 
                      padding:'6px 12px', 
                      borderRadius:'20px', 
                      fontSize:'0.75rem', 
                      fontWeight:'600', 
                      marginBottom:'16px', 
                      border:'1px solid rgba(255,71,87,0.2)'
                    }}>
                      <span style={{width:'6px', height:'6px', background:'currentColor', borderRadius:'50%'}}></span> TEMPORADA 2026
                    </div>
                    
                    <h1 style={{
                      fontSize: isMobile ? '2rem' : '2.8rem', 
                      fontWeight:'700', 
                      marginBottom:'12px', 
                      lineHeight: 1.1,
                      color: 'white'
                    }}>
                      Domine o Campo<br/>Virtual
                    </h1>
                    <p style={{
                      fontSize:'1rem', 
                      color:'rgba(255,255,255,0.7)', 
                      marginBottom:'28px', 
                      lineHeight:1.5,
                      maxWidth: '480px'
                    }}>
                      Participe dos torneios mais competitivos, suba no ranking e conquiste a glória na comunidade DDO.
                    </p>
                    
                    {!currentUser ? (
                      <div style={{display:'flex', gap:'12px'}}>
                        <button style={{
                          background:'#4e3eff', 
                          color:'white', 
                          border:'none', 
                          padding:'12px 24px', 
                          borderRadius:'10px', 
                          fontWeight:'500', 
                          cursor:'pointer', 
                          display:'flex', 
                          alignItems:'center', 
                          gap:'8px',
                          boxShadow: '0 4px 15px rgba(78, 62, 255, 0.3)'
                        }} 
                        onClick={() => setShowReivindicarPopup(true)}>
                          Entrar na Arena <ArrowRight size={18} />
                        </button>
                        <button style={{
                          background:'rgba(255,255,255,0.08)', 
                          color:'white', 
                          border:'1px solid rgba(255,255,255,0.1)', 
                          padding:'12px 24px', 
                          borderRadius:'10px', 
                          fontWeight:'500', 
                          cursor:'pointer', 
                          display:'flex', 
                          alignItems:'center', 
                          gap:'8px'
                        }} 
                        onClick={() => setShowRecuperarSenhaPopup(true)}>
                          Recuperar Senha
                        </button>
                      </div>
                    ) : (
                      <button style={{
                        background:'#4e3eff', 
                        color:'white', 
                        border:'none', 
                        padding:'12px 24px', 
                        borderRadius:'10px', 
                        fontWeight:'500', 
                        cursor:'pointer', 
                        display:'flex', 
                        alignItems:'center', 
                        gap:'8px',
                        boxShadow: '0 4px 15px rgba(78, 62, 255, 0.3)'
                      }}
                      onClick={() => navigate('/competicoes')}>
                        Ir para Competições <Target size={18} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {noticias.length > 0 && (
            <div className="news-carousel-section" style={{ marginTop: '24px', position: 'relative' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '12px',
                padding: '0 4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                  <Newspaper size={20} className="text-primary" />
                  Destaques e Notícias
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => scrollNews('left')} style={{ 
                    padding: '6px', borderRadius: '50%', border: '1px solid var(--border-color)', 
                    background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <ChevronLeft size={18} color="var(--text-dark)" />
                  </button>
                  <button onClick={() => scrollNews('right')} style={{ 
                    padding: '6px', borderRadius: '50%', border: '1px solid var(--border-color)', 
                    background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <ChevronRight size={18} color="var(--text-dark)" />
                  </button>
                </div>
              </div>

              <div 
                ref={newsScrollRef}
                style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  overflowX: 'auto', 
                  paddingBottom: '10px',
                  scrollBehavior: 'smooth',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {noticias.map((noticia) => (
                  <div 
                    key={noticia.id} 
                    onClick={() => navigate(`/noticias/${noticia.id}`)}
                    style={{ 
                      flex: isMobile ? '0 0 100%' : '0 0 calc((100% - 32px) / 3)',
                      minWidth: isMobile ? '100%' : '0',
                      background: 'var(--card-bg)', 
                      borderRadius: '12px', 
                      padding: '16px', 
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.08)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: '700', 
                          textTransform: 'uppercase', 
                          padding: '3px 8px', 
                          borderRadius: '4px', 
                          background: noticia.tipo === 'JOGO_QUENTE' ? 'rgba(255, 71, 87, 0.1)' : 'rgba(78, 62, 255, 0.1)',
                          color: noticia.tipo === 'JOGO_QUENTE' ? '#ff4757' : 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {noticia.tipo === 'JOGO_QUENTE' && <Zap size={10} fill="currentColor" />}
                          {noticia.tipo.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{formatTimeAgo(noticia.dataCriacao)}</span>
                      </div>
                      <h4 style={{ 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        color: 'var(--text-dark)', 
                        marginBottom: '8px',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: '2',
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {noticia.titulo}
                      </h4>
                      <p style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-gray)', 
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: '3',
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {noticia.mensagem}
                      </p>
                    </div>
                    <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: '500', color: 'var(--primary)' }}>
                      Ler completa <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="tp-dashboard-grid" style={{ 
            animation: 'fadeInUp 0.8s ease-out', 
            marginTop: '10px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '20px'
          }}>
            
            <div className="left-section" style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display:'flex', 
                alignItems:'center', 
                justifyContent: 'space-between',
                marginBottom:'20px'
              }}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'1.25rem', fontWeight:'600', color:'var(--text-dark)'}}>
                  <Gamepad2 className="text-primary" size={24} /> 
                  Navegar
                </div>
              </div>

              <div className="tp-tournaments-grid" style={{ 
                marginBottom: '40px',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px'
              }}>
                {torneios.map(torneio => (
                  <div key={torneio.id} className="tp-card" style={{display:'flex', flexDirection:'column', height:'100%'}}>
                    <div style={{
                      height:'140px', 
                      backgroundImage:`url(${torneio.imagem})`, 
                      backgroundSize:'cover', 
                      backgroundPosition:'center', 
                      position:'relative'
                    }}>
                      <div style={{
                        position:'absolute', 
                        inset:0, 
                        background:'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)', 
                        padding:'12px', 
                        display:'flex', 
                        flexDirection:'column', 
                        justifyContent:'flex-end'
                      }}>
                        <div style={{position:'absolute', top:'12px', right:'12px'}}>
                           <span style={{
                             padding:'4px 10px', 
                             borderRadius:'6px', 
                             background:'rgba(255,255,255,0.95)', 
                             color:'black', 
                             fontSize:'0.7rem', 
                             fontWeight:'600',
                             boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                             textTransform: 'uppercase'
                           }}>
                            {getStatusLabel(torneio.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{padding:'20px', flex:1, display:'flex', flexDirection:'column'}}>
                      <h4 style={{fontSize:'1.05rem', fontWeight:'600', marginBottom:'6px', color:'var(--text-dark)'}}>{torneio.nome}</h4>
                      <p style={{fontSize:'0.9rem', color:'var(--text-gray)', marginBottom:'16px', lineHeight:1.4, flex:1}}>{torneio.descricao}</p>
                      
                      <button 
                        style={{
                          width:'100%', 
                          padding:'10px', 
                          borderRadius:'10px', 
                          border:'1px solid var(--border-color)', 
                          background:'transparent', 
                          color:'var(--text-dark)', 
                          fontWeight:'500', 
                          fontSize:'0.9rem',
                          cursor:'pointer', 
                          transition:'0.2s',
                          display:'flex',
                          alignItems:'center',
                          justifyContent:'center',
                          gap:'6px'
                        }}
                        onClick={() => torneio.link_destino && navigate(torneio.link_destino)}
                        onMouseOver={(e) => { 
                          e.currentTarget.style.borderColor = 'var(--primary)'; 
                          e.currentTarget.style.color = 'var(--primary)'; 
                          e.currentTarget.style.background = 'rgba(78, 62, 255, 0.05)';
                        }}
                        onMouseOut={(e) => { 
                          e.currentTarget.style.borderColor = 'var(--border-color)'; 
                          e.currentTarget.style.color = 'var(--text-dark)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {torneio.botao_texto}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {anuncios && anuncios.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{
                    display:'flex', 
                    alignItems:'center', 
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      display:'flex', 
                      alignItems:'center', 
                      gap:'10px', 
                      fontSize:'1.25rem', 
                      fontWeight:'600', 
                      color:'var(--text-dark)'
                    }}>
                      <Megaphone className="text-primary" size={24} /> 
                      Quadro de Avisos
                    </div>

                    <button 
                      onClick={() => navigate('/anuncios')} 
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      Ver anúncios <ArrowRight size={16} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {anuncios.map(anuncio => (
                      <div key={anuncio.id} className="tp-card" style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        overflow: 'hidden',
                        minHeight: '200px',
                        borderLeft: `4px solid ${anuncio.corMensagem || 'var(--primary)'}`
                      }}>
                        <div style={{
                          flex: isMobile ? 'none' : '0 0 40%',
                          minHeight: isMobile ? '160px' : 'auto',
                          backgroundImage: `url(${anuncio.imagem})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative'
                        }}>
                          <div style={{
                             position: 'absolute',
                             inset: 0,
                             background: 'linear-gradient(90deg, transparent 50%, var(--bg-card) 100%)',
                             display: isMobile ? 'none' : 'block'
                          }}></div>
                           <div style={{
                             position: 'absolute',
                             inset: 0,
                             background: 'linear-gradient(0deg, var(--bg-card) 0%, transparent 50%)',
                             display: isMobile ? 'block' : 'none'
                          }}></div>
                        </div>
                        <div style={{
                          flex: 1,
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          zIndex: 1
                        }}>
                          <div style={{
                             display: 'flex',
                             alignItems: 'center',
                             gap: '8px',
                             marginBottom: '10px'
                          }}>
                            <span style={{
                              backgroundColor: `${anuncio.corMensagem}20`,
                              color: anuncio.corMensagem,
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              textTransform: 'uppercase'
                            }}>
                              {anuncio.tipoMensagem}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                              {formatDate(anuncio.dataPostagem)}
                            </span>
                          </div>
                          <h3 style={{
                            fontSize: '1.4rem',
                            fontWeight: '700',
                            color: 'var(--text-dark)',
                            marginBottom: '10px',
                            lineHeight: 1.2
                          }}>
                            {anuncio.titulo}
                          </h3>
                          <p style={{
                            fontSize: '0.95rem',
                            color: 'var(--text-gray)',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-line'
                          }}>
                            {anuncio.mensagem}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="right-section" style={{
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px',
              width: isMobile ? '100%' : '350px'
            }}>
              <div className="tp-ranking-panel" style={{
                display: 'flex', 
                flexDirection: 'column', 
                height: isMobile ? 'auto' : 'calc(100vh - 120px)',
                maxHeight: isMobile ? '500px' : 'none',
                minHeight: '520px', 
                position: isMobile ? 'static' : 'sticky', 
                top: '100px'
              }}>
                <div className="tp-ranking-header" style={{padding: '20px', borderBottom: '1px solid var(--border-color)'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <TrendingUp className="text-primary" size={22} />
                    <div>
                      <h3 style={{fontSize:'1.1rem', fontWeight:'700', color:'var(--text-dark)'}}>Top 10 Ranking</h3>
                      <span style={{fontSize:'0.8rem', fontWeight:'400', color:'var(--text-gray)'}}>Coeficiente Geral</span>
                    </div>
                  </div>
                </div>

                <div className="tp-ranking-list" style={{flex: 1, overflowY: 'auto'}}>
                  {isLoadingPlayers ? (
                    <div style={{padding:'40px', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', color:'var(--text-gray)'}}>
                      <div className="animate-spin" style={{width:'24px', height:'24px', border:'2px solid var(--primary)', borderTopColor:'transparent', borderRadius:'50%'}}></div>
                    </div>
                  ) : filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player, index) => {
                      const avatarUrl = player.imagem ? avatarMap[player.imagem] : null;
                      const posClass = index === 0 ? 'tp-pos-1' : index === 1 ? 'tp-pos-2' : index === 2 ? 'tp-pos-3' : 'tp-pos-n';
                      
                      return (
                        <div key={player.id} className="tp-rank-item" style={{padding: '14px 20px'}}>
                          <div className={`tp-rank-pos ${posClass}`} style={{fontSize: '0.85rem', width: '28px', height: '28px'}}>
                            {index + 1}
                          </div>
                          
                          <div style={{position:'relative'}}>
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={player.nome} style={{width:'40px', height:'40px', borderRadius:'12px', marginRight:'14px', objectFit:'cover', background:'var(--border-color)'}} />
                            ) : (
                              <div style={{width:'40px', height:'40px', borderRadius:'12px', marginRight:'14px', background:'var(--border-color)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'600', color:'var(--text-gray)', fontSize:'1rem'}}>
                                {player.nome.charAt(0)}
                              </div>
                            )}
                          </div>

                          <div style={{flex:1, overflow:'hidden', marginRight:'10px'}}>
                            <div style={{fontWeight:'600', fontSize:'0.95rem', color:'var(--text-dark)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                              {player.nome}
                            </div>
                            <div style={{fontSize:'0.75rem', color:'var(--text-gray)'}}>
                              @{player.discord}
                            </div>
                          </div>

                          <div style={{
                            background:'rgba(78, 62, 255, 0.08)', 
                            color:'var(--primary)', 
                            padding:'6px 10px', 
                            borderRadius:'8px', 
                            fontWeight:'700', 
                            fontSize:'0.85rem',
                            minWidth: '55px',
                            textAlign: 'center'
                          }}>
                            {player.pontosCoeficiente.toFixed(1)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{padding:'30px', textAlign:'center', color:'var(--text-gray)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
                       <AlertCircle size={32} />
                       <p>Nenhum jogador encontrado.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

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

      {showReivindicarPopup && (
      <PopupReivindicar 
        onClose={() => setShowReivindicarPopup(false)}
        onSubmit={(data) => {
          console.log("Dados para Reivindicar:", data);
          setShowReivindicarPopup(false);
        }}
      />
    )}

    {showRecuperarSenhaPopup && (
        <PopupRecuperarSenha 
          onClose={() => setShowRecuperarSenhaPopup(false)}
          onSuccess={() => {
            setShowRecuperarSenhaPopup(false);
            alert("Senha redefinida com sucesso!");
          }}
        />
    )}

    {showNotificacaoPopup && (
        <PopupNotificacao 
          onClose={() => setShowNotificacaoPopup(false)}
        />
    )}
    </div>
  );
}