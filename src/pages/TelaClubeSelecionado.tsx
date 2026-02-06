import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Menu, LayoutDashboard, Users, Trophy, Shield, Wallet, Search, 
  ArrowLeft, Gamepad2, Lightbulb, Settings, 
  CheckCircle, CalendarSync, Star, MapPin, DollarSign, 
  Activity, Info, StarHalf, TrendingUp, Landmark
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

interface TituloDefinition {
  id: string;
  nome: string;
  valor: number;
  descricao: string;
  imagem: string;
  imagemGerarPost: string;
}

interface ClubAchievement {
  id: string;
  titulo: TituloDefinition;
  dataConquista: string;
  nomeEdicao: string;
  imagem: string;
}

interface Club {
  id: string;
  nome: string;
  nomeExtenso: string | null;
  estadio: string;
  imagem: string;
  ligaClube: string;
  sigla: string;
  corPrimaria: string;
  corSecundaria: string;
  ativo: boolean;
  estrelas: number;
  titulos: number;
  valorAvaliado: number;
  lanceMinimo: number;
  conquistas: ClubAchievement[];
}

interface UserData {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  cargo: string;
  saldoVirtual: number;
  finais?: number;
  titulos?: number;
  golsMarcados?: number;
  partidasJogadas?: number;
}

export function TelaClubeSelecionado() {
  const navigate = useNavigate();
  const { clubeId } = useParams();

  const [clube, setClube] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    
    if (clubeId) {
        fetchClubDetails(clubeId);
    } else {
        setLoading(false); 
    }
  }, [clubeId]);

  const fetchClubDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await API.get(`/clube/${id}`);
      const clubData = (response && (response as any).data) ? (response as any).data : response;
      setClube(clubData as Club);
    } catch (error) {
      console.error(error);
      navigate('/clubes');
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

  const formatCurrency = (value: number) => {
    return 'D$ ' + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const hexToRgba = (hex: string, alpha: number) => {
    let c: any;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return `rgba(0,0,0,${alpha})`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) {
            stars.push(<Star key={i} size={20} fill="#f59e0b" color="#f59e0b" strokeWidth={0} />);
        } else if (rating >= i - 0.5) {
            stars.push(<StarHalf key={i} size={20} fill="#f59e0b" color="#f59e0b" strokeWidth={0} />);
        } else {
            stars.push(<Star key={i} size={20} color="#e5e7eb" strokeWidth={1.5} />);
        }
    }
    return stars;
  };

  const groupedAchievements = useMemo(() => {
    if (!clube || !clube.conquistas) return [];

    const groups: Record<string, { count: number, titulo: TituloDefinition }> = {};

    clube.conquistas.forEach(conquista => {
        const tituloId = conquista.titulo.id;
        if (!groups[tituloId]) {
            groups[tituloId] = {
                count: 0,
                titulo: conquista.titulo
            };
        }
        groups[tituloId].count += 1;
    });

    return Object.values(groups).sort((a, b) => b.titulo.valor - a.titulo.valor);
  }, [clube]);

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      <LoadingSpinner isLoading={loading} />

      <style>{`
        .profile-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            padding-bottom: 60px;
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

        .club-hero {
            position: relative;
            background: var(--bg-card);
            border-radius: 24px;
            border: 1px solid var(--border-color);
            overflow: hidden;
            margin-bottom: 24px;
            box-shadow: var(--shadow-sm);
            padding: 40px;
            transition: all 0.3s ease;
        }
        
        .hero-body {
            display: flex;
            align-items: center;
            gap: 30px;
            position: relative;
            z-index: 2;
        }

        .club-logo-container {
            width: 160px;
            height: 160px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border: 4px solid rgba(255,255,255,0.5);
            backdrop-filter: blur(5px);
        }
        
        .club-logo {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
        }

        .club-identity {
            flex: 1;
        }

        .club-name-wrapper {
            margin-bottom: 12px;
        }
        
        .club-name-full {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--text-dark);
            line-height: 1.1;
            display: none;
        }
        
        .club-name-short {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--text-dark);
            line-height: 1.1;
            display: block;
        }

        @media (min-width: 992px) {
            .club-name-full { display: block; }
            .club-name-short { display: none; }
        }

        .club-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
        }

        .club-badge {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-dark);
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .info-grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
        }

        .section-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 24px;
            box-shadow: var(--shadow-sm);
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .card-header-icon {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
            font-weight: 700;
            color: var(--text-gray);
            font-size: 0.9rem;
            text-transform: uppercase;
        }

        .big-value {
            font-size: 2rem;
            font-weight: 800;
            color: var(--text-dark);
            line-height: 1;
            margin-bottom: 8px;
        }

        .sub-value {
            font-size: 0.9rem;
            color: var(--text-gray);
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid var(--border-color);
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .financial-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
        }

        .financial-card {
            background: linear-gradient(135deg, var(--bg-card) 0%, var(--hover-bg) 100%);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 30px;
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .trophies-section {
            background: var(--bg-card);
            border-radius: 24px;
            border: 1px solid var(--border-color);
            padding: 30px;
        }

        .trophies-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 16px;
        }

        .trophies-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }

        .trophy-group-card {
            background: var(--hover-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            position: relative;
            transition: all 0.3s ease;
            overflow: hidden;
        }

        .trophy-group-card:hover {
            transform: translateY(-5px);
            background: var(--bg-card);
            box-shadow: var(--shadow-md);
            border-color: var(--primary);
        }

        .trophy-count-badge {
            position: absolute;
            top: 15px;
            right: 15px;
            background: var(--primary);
            color: white;
            font-weight: 800;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            z-index: 2;
        }

        .trophy-img-lg {
            width: 120px;
            height: 120px;
            object-fit: contain;
            filter: drop-shadow(0 8px 16px rgba(0,0,0,0.15));
            transition: transform 0.3s ease;
            margin-bottom: 16px;
        }

        .trophy-group-card:hover .trophy-img-lg {
            transform: scale(1.1);
        }

        .empty-gallery {
            text-align: center;
            padding: 60px 20px;
            background: var(--hover-bg);
            border-radius: 20px;
            border: 2px dashed var(--border-color);
            color: var(--text-gray);
        }

        @media (max-width: 900px) {
            .info-grid-3 { grid-template-columns: 1fr; }
            .financial-row { grid-template-columns: 1fr; }
            .hero-body { flex-direction: column; text-align: center; }
            .club-meta { justify-content: center; }
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
          <a onClick={() => navigate('/clubes')} className="nav-item active" style={{cursor: 'pointer'}}>
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
                  backgroundImage: currentUser.imagem ? `url(${currentUser.imagem})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {!currentUser.imagem && currentUser.nome.charAt(0)}
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
            {clube && (
                <div className="profile-wrapper">
                    <button onClick={() => navigate('/clubes')} className="btn-back">
                        <ArrowLeft size={18} /> Voltar para Clubes
                    </button>

                    <div 
                        className="club-hero" 
                        style={{
                            background: `linear-gradient(135deg, ${hexToRgba(clube.corPrimaria || '#ffffff', 0.15)} 0%, ${hexToRgba(clube.corSecundaria || '#000000', 0.05)} 100%)`,
                            borderTop: `4px solid ${clube.corPrimaria || 'transparent'}`
                        }}
                    >
                        <div className="hero-body">
                            <div className="club-logo-container">
                                <img src={clube.imagem} alt={clube.nome} className="club-logo" />
                            </div>

                            <div className="club-identity">
                                <div className="club-name-wrapper">
                                    <h1 className="club-name-full">
                                        {clube.nomeExtenso || clube.nome}
                                    </h1>
                                    <h1 className="club-name-short">
                                        {clube.nome}
                                    </h1>
                                </div>
                                <div className="club-meta">
                                    <div className="club-badge" style={{color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)'}}>
                                        <div style={{display: 'flex', gap: '2px'}}>
                                            {renderStars(clube.estrelas)}
                                        </div>
                                        <span style={{marginLeft: '6px', fontWeight: 700}}>{clube.estrelas.toFixed(1)}</span>
                                    </div>
                                    <span className="club-badge">
                                        <Trophy size={16} className="text-purple" />
                                        {clube.ligaClube}
                                    </span>
                                    <span className="club-badge">
                                        {clube.ativo ? (
                                            <span style={{color: '#10b981', display:'flex', alignItems:'center', gap:'6px'}}>
                                                <CheckCircle size={16}/> Ativo
                                            </span>
                                        ) : (
                                            <span style={{color: '#ef4444', display:'flex', alignItems:'center', gap:'6px'}}>
                                                <Activity size={16}/> Inativo
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="financial-row">
                        <div className="financial-card">
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '15px', 
                                background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <TrendingUp size={32} />
                            </div>
                            <div>
                                <div style={{fontSize: '0.9rem', color: 'var(--text-gray)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '5px'}}>Valor de Mercado</div>
                                <div style={{fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-dark)'}}>
                                    {formatCurrency(clube.valorAvaliado)}
                                </div>
                            </div>
                        </div>

                        <div className="financial-card">
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '15px', 
                                background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <DollarSign size={32} />
                            </div>
                            <div>
                                <div style={{fontSize: '0.9rem', color: 'var(--text-gray)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '5px'}}>Lance Mínimo</div>
                                <div style={{fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-dark)'}}>
                                    {formatCurrency(clube.lanceMinimo)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="info-grid-3">
                        <div className="section-card">
                            <div className="card-header-icon">
                                <Info size={18} /> Informações Gerais
                            </div>
                            <div className="detail-row">
                                <span style={{color: 'var(--text-gray)'}}>Sigla</span>
                                <span style={{fontWeight: 700, color: 'var(--text-dark)'}}>{clube.sigla}</span>
                            </div>
                            <div className="detail-row">
                                <span style={{color: 'var(--text-gray)'}}>Liga</span>
                                <span style={{fontWeight: 700, color: 'var(--text-dark)'}}>{clube.ligaClube}</span>
                            </div>
                            <div className="detail-row">
                                <span style={{color: 'var(--text-gray)'}}>Cores</span>
                                <div style={{display: 'flex', gap: '8px'}}>
                                    <div style={{width: '24px', height: '24px', borderRadius: '50%', backgroundColor: clube.corPrimaria, border: '1px solid var(--border-color)'}}></div>
                                    {clube.corSecundaria && (
                                        <div style={{width: '24px', height: '24px', borderRadius: '50%', backgroundColor: clube.corSecundaria, border: '1px solid var(--border-color)'}}></div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="section-card">
                            <div className="card-header-icon">
                                <Landmark size={18} /> Estádio
                            </div>
                            <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
                                <MapPin size={48} style={{opacity: 0.1, marginBottom: '10px'}} />
                                <div style={{fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '5px'}}>
                                    {clube.estadio}
                                </div>
                                <span style={{fontSize: '0.8rem', color: 'var(--text-gray)'}}>Casa Oficial</span>
                            </div>
                        </div>

                        <div className="section-card">
                            <div className="card-header-icon">
                                <Trophy size={18} /> Títulos Oficiais
                            </div>
                            <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
                                <div className="big-value" style={{color: '#f59e0b', fontSize: '3.5rem'}}>
                                    {clube.titulos}
                                </div>
                                <span className="sub-value">Troféus Conquistados</span>
                            </div>
                        </div>
                    </div>

                    <div className="trophies-section">
                        <div className="trophies-header">
                            <div style={{fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <Trophy size={24} className="text-orange" /> 
                                Galeria de Conquistas
                            </div>
                            <div style={{
                                padding: '6px 12px', background: 'var(--hover-bg)', 
                                borderRadius: '20px', fontSize: '0.9rem', fontWeight: 700
                            }}>
                                {clube.conquistas.length} Título{clube.conquistas.length !== 1 && 's'}
                            </div>
                        </div>

                        {groupedAchievements.length === 0 ? (
                            <div className="empty-gallery">
                                <Trophy size={48} style={{opacity: 0.3, marginBottom: '16px'}} />
                                <h3>Sala de Troféus Vazia</h3>
                                <p>Este clube ainda não possui conquistas registradas.</p>
                            </div>
                        ) : (
                            <div className="trophies-grid">
                                {groupedAchievements.map((group) => (
                                    <div key={group.titulo.id} className="trophy-group-card">
                                        <div className="trophy-count-badge">
                                            x{group.count}
                                        </div>
                                        
                                        <img 
                                            src={group.titulo.imagem} 
                                            alt={group.titulo.nome} 
                                            className="trophy-img-lg"
                                        />
                                        
                                        <div style={{fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px', lineHeight: 1.3}}>
                                            {group.titulo.nome}
                                        </div>
                                        <div style={{fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                                            {group.titulo.descricao}
                                        </div>

                                        <div style={{marginTop: 'auto', width: '100%', paddingTop: '12px', borderTop: '1px dashed var(--border-color)'}}>
                                            <span style={{fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(var(--primary-rgb), 0.1)', padding: '4px 10px', borderRadius: '6px'}}>
                                                {group.titulo.valor} Pontos
                                            </span>
                                        </div>
                                    </div>
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
            id: currentUser.id,
            nome: currentUser.nome,
            discord: currentUser.discord,
            imagem: currentUser.imagem,
            cargo: currentUser.cargo,
            saldoVirtual: currentUser.saldoVirtual,
            finais: currentUser.finais || 0,
            titulos: currentUser.titulos || 0,
            golsMarcados: currentUser.golsMarcados || 0,
            partidasJogadas: currentUser.partidasJogadas || 0
          }}
          onClose={() => setShowUserPopup(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}