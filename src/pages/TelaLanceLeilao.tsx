import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Menu, 
  LayoutDashboard, 
  Users, 
  Shield, 
  Trophy, 
  Star, 
  CalendarSync, 
  Gamepad2, 
  Wallet, 
  Settings, 
  Search, 
  Bell, 
  Lightbulb, 
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Info,
  StarHalf,
  ChevronLeft,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupGeral from '../components/PopupGeral';
import LoadingSpinner from '../components/LoadingSpinner';

interface ClubeDTO {
  id: string;
  nome: string;
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
}

interface PageResponse<T> {
  conteudo: T[];
  paginaAtual: number;
  totalPaginas: number;
  totalElementos: number;
  tamanhoPagina: number;
  ultimaPagina: boolean;
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

interface ItemLanceLocal {
    clube: ClubeDTO;
    valor: number;
    prioridade: number;
}

interface Leilao {
    id: string;
    ativo: boolean;
}

interface PopupState {
    open: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

export function TelaLanceLeilao() {
  const navigate = useNavigate();
  const { temporadaId } = useParams();
  const queryClient = useQueryClient();
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const [leilaoId, setLeilaoId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [meusLances, setMeusLances] = useState<ItemLanceLocal[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const [popup, setPopup] = useState<PopupState>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showPopup = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setPopup({ open: true, title, message, type });
  };

  const closePopup = () => {
    setPopup(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setCurrentUser({
          ...parsed,
          finais: parsed.finais || 0,
          titulos: parsed.titulos || 0,
          golsMarcados: parsed.golsMarcados || 0,
          partidasJogadas: parsed.partidasJogadas || 0
      });
    }
  }, []);

  useEffect(() => {
    const fetchActiveLeilao = async () => {
        if (!temporadaId) return;
        try {
            const response = await API.get(`/api/leiloes/temporada/${temporadaId}`);
            const active = response.data.find((l: Leilao) => l.ativo);
            if (active) {
                setLeilaoId(active.id);
            } else {
                showPopup("Atenção", "Não há leilão ativo nesta temporada.", "warning");
                setTimeout(() => navigate(`/${temporadaId}/torneios/leilao`), 2000);
            }
        } catch (error) {
            console.error(error);
        }
    };
    fetchActiveLeilao();
  }, [temporadaId, navigate]);

  useEffect(() => {
    const fetchMeusLances = async () => {
        if (!leilaoId || !currentUser) return;
        try {
            const response = await API.get(`/api/leiloes/${leilaoId}/meus-lances`);
            if (response.data && Array.isArray(response.data)) {
                const lancesMapeados: ItemLanceLocal[] = response.data.map((dto: any) => ({
                    clube: {
                        id: dto.clubeId,
                        nome: dto.nomeClube,
                        imagem: dto.imagemClube,
                        lanceMinimo: dto.lanceMinimo,
                        estrelas: 0, 
                        titulos: 0,
                        valorAvaliado: 0,
                        estadio: '',
                        ligaClube: '',
                        sigla: '',
                        corPrimaria: '',
                        corSecundaria: '',
                        ativo: true
                    },
                    valor: dto.valor,
                    prioridade: dto.prioridade
                }));
                
                lancesMapeados.sort((a, b) => a.prioridade - b.prioridade);
                setMeusLances(lancesMapeados);
            }
        } catch (error) {
            console.error(error);
        }
    };
    fetchMeusLances();
  }, [leilaoId, currentUser]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const {
    data: clubesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery<PageResponse<ClubeDTO>>({
    queryKey: ['clubes-mercado'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await API.get(`/clube/clubes?page=${pageParam}&size=20&sort=estrelas,desc`);
      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.ultimaPagina ? undefined : lastPage.paginaAtual + 1,
  });

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  useEffect(() => {
    const element = observerTarget.current;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0 });
    if (element) observer.observe(element);
    return () => { if (element) observer.unobserve(element); };
  }, [handleObserver]);

  const handleAddClube = (clube: ClubeDTO) => {
    if (meusLances.length >= 5) {
        showPopup("Limite Atingido", "Você só pode selecionar no máximo 5 clubes.", "warning");
        return;
    }
    if (meusLances.some(l => l.clube.id === clube.id)) {
        return;
    }

    const novoLance: ItemLanceLocal = {
        clube,
        valor: clube.lanceMinimo,
        prioridade: meusLances.length + 1
    };

    setMeusLances([...meusLances, novoLance]);
  };

  const handleRemoveClube = (clubeId: string) => {
    const novosLances = meusLances
        .filter(l => l.clube.id !== clubeId)
        .map((lance, index) => ({
            ...lance,
            prioridade: index + 1
        }));
    setMeusLances(novosLances);
  };

  const handleMoveClube = (index: number, direction: number) => {
    const newLances = [...meusLances];
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= newLances.length) return;

    [newLances[index], newLances[targetIndex]] = [newLances[targetIndex], newLances[index]];

    const lancesReordenados = newLances.map((lance, idx) => ({
      ...lance,
      prioridade: idx + 1
    }));

    setMeusLances(lancesReordenados);
  };

  const handleUpdateValor = (clubeId: string, novoValor: number) => {
    setMeusLances(prev => prev.map(l => 
        l.clube.id === clubeId ? { ...l, valor: novoValor } : l
    ));
  };

  const handleBlurValor = (clubeId: string, valorAtual: number, valorMinimo: number) => {
    if (valorAtual < valorMinimo) {
        handleUpdateValor(clubeId, valorMinimo);
    }
  };

  const handleSubmitLances = async () => {
    if (!currentUser) return;
    if (!leilaoId) {
        showPopup("Erro", "ID do leilão não encontrado.", "error");
        return;
    }
    if (meusLances.length === 0) {
        showPopup("Atenção", "Selecione pelo menos 1 clube para dar lance.", "warning");
        return;
    }

    const maxBid = meusLances.reduce((max, l) => l.valor > max ? l.valor : max, 0);
    if (maxBid > currentUser.saldoVirtual) {
        showPopup("Saldo Insuficiente", "Seu maior lance excede seu saldo disponível.", "error");
        return;
    }
    
    const belowMinBid = meusLances.find(l => l.valor < l.clube.lanceMinimo);
    if (belowMinBid) {
         showPopup("Valor Inválido", `O lance para o ${belowMinBid.clube.nome} está abaixo do mínimo permitido de ${formatMoney(belowMinBid.clube.lanceMinimo)}.`, "error");
         handleUpdateValor(belowMinBid.clube.id, belowMinBid.clube.lanceMinimo);
         return;
    }

    setSubmitting(true);

    const payload = {
        leilaoId: leilaoId,
        preferencias: meusLances.map(l => ({
            clubeId: l.clube.id,
            valor: l.valor,
            prioridade: l.prioridade
        }))
    };

    try {
        await API.post('/api/leiloes/lance', payload);
        showPopup("Sucesso", "Seus lances foram registrados com sucesso!", "success");
        setTimeout(() => {
            navigate(`/${temporadaId}/torneios/leilao`);
        }, 2000);
    } catch (error: any) {
        let msg = "Erro ao enviar lances.";
        
        if (error.response) {
            if (error.response.data && error.response.data.message) {
                msg = error.response.data.message;
            } else if (typeof error.response.data === 'string') {
                msg = error.response.data;
            }
        }
        
        showPopup("Não foi possível realizar o lance", msg, "error");
        queryClient.invalidateQueries({ queryKey: ['clubes-mercado'] });
    } finally {
        setSubmitting(false);
    }
  };

  const formatMoney = (value: number) => {
    return `D$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderStars = (estrelas: number) => {
      const stars = [];
      const floorStars = Math.floor(estrelas);
      const hasHalfStar = estrelas % 1 >= 0.5;

      for (let i = 0; i < 5; i++) {
          if (i < floorStars) {
              stars.push(<Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />);
          } else if (i === floorStars && hasHalfStar) {
              stars.push(
                <div key={i} style={{position: 'relative', width: '14px', height: '14px'}}>
                    <StarHalf size={14} fill="#f59e0b" color="#f59e0b" style={{position: 'absolute', left: 0, top: 0, zIndex: 1}} />
                    <Star size={14} color="#e5e7eb" style={{position: 'absolute', left: 0, top: 0}} />
                </div>
              );
          } else {
              stars.push(<Star key={i} size={14} fill="none" color="#e5e7eb" />);
          }
      }
      return <div style={{display: 'flex', gap: '2px'}}>{stars}</div>;
  };

  const saldoDisponivel = currentUser?.saldoVirtual || 0;

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
        <style>{`
            .lance-layout {
                display: grid;
                grid-template-columns: 1fr 380px;
                gap: 24px;
                padding: 24px 32px;
                height: calc(100vh - 80px);
                overflow: hidden;
            }
            .market-column {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
            }
            .market-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                gap: 16px;
                overflow-y: auto;
                padding-right: 8px;
                padding-bottom: 40px;
                flex: 1;
            }
            .clube-card {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 16px;
                padding: 16px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                transition: all 0.2s;
                position: relative;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            }
            .clube-card:hover {
                transform: translateY(-2px);
                border-color: var(--primary);
                box-shadow: 0 8px 16px rgba(0,0,0,0.08);
            }
            .clube-card.selected {
                border: 2px solid #10b981;
                background: rgba(16, 185, 129, 0.05);
            }
            .clube-img {
                width: 60px;
                height: 60px;
                object-fit: contain;
                margin-bottom: 4px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
            }
            .back-btn-custom {
                background: transparent;
                border: none;
                color: var(--text-gray);
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                cursor: pointer;
                padding: 10px 16px;
                border-radius: 12px;
                transition: all 0.2s ease;
            }
            .back-btn-custom:hover {
                background: var(--hover-bg);
                color: var(--primary);
                transform: translateX(-4px);
            }
            .cart-column {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 16px;
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            }
            .cart-header {
                padding: 20px;
                border-bottom: 1px solid var(--border-color);
                background: var(--bg-body);
            }
            .cart-items {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .cart-item {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 12px;
                display: flex;
                gap: 12px;
                align-items: flex-start;
                transition: 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            }
            .cart-item:hover {
                border-color: var(--primary);
            }
            .cart-item-info {
                flex: 1;
                width: 100%;
            }
            .cart-input-wrapper {
                position: relative;
                margin-top: 8px;
            }
            .cart-input {
                width: 100%;
                padding: 8px 8px 8px 32px;
                border-radius: 8px;
                border: 1px solid var(--border-color);
                background: var(--bg-body);
                color: var(--text-dark);
                font-weight: 600;
                font-size: 0.95rem;
                outline: none;
                transition: 0.2s;
            }
            .cart-input:focus {
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(78, 62, 255, 0.1);
            }
            .cart-input.error {
                border-color: #ef4444;
                color: #ef4444;
                background: rgba(239, 68, 68, 0.05);
            }
            .cart-footer {
                padding: 20px;
                border-top: 1px solid var(--border-color);
                background: var(--bg-body);
            }
            .priority-badge {
                width: 26px;
                height: 26px;
                background: var(--primary);
                color: white;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.85rem;
                font-weight: 700;
                flex-shrink: 0;
            }
            .order-controls {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                margin-right: 4px;
            }
            .order-btn {
                border: none;
                background: transparent;
                padding: 0;
                display: flex;
                transition: color 0.2s;
            }
            .order-btn:disabled {
                color: var(--border-color);
                cursor: default;
            }
            .cart-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--text-gray);
                text-align: center;
                padding: 20px;
                opacity: 0.7;
            }
            @media (max-width: 1024px) {
                .lance-layout {
                    grid-template-columns: 1fr;
                    height: auto;
                    padding: 16px;
                    overflow-y: auto;
                }
                .cart-column {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 50vh;
                    border-radius: 20px 20px 0 0;
                    z-index: 100;
                    box-shadow: 0 -10px 40px rgba(0,0,0,0.2);
                    border-top: 1px solid var(--primary);
                }
                .market-grid {
                    padding-bottom: 50vh;
                    overflow: visible;
                }
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
          <a onClick={() => navigate('/')} className="nav-item" style={{cursor: 'pointer'}}><LayoutDashboard size={20} /> Dashboard</a>
          <a onClick={() => navigate('/jogadores')} className="nav-item" style={{cursor: 'pointer'}}><Users size={20} /> Jogadores</a>
          <a onClick={() => navigate('/clubes')} className="nav-item" style={{cursor: 'pointer'}}><Shield size={20} /> Clubes</a>
          <a onClick={() => navigate('/competicoes')} className="nav-item" style={{cursor: 'pointer'}}><Trophy size={20} /> Competições</a>
          <a onClick={() => navigate('/titulos')} className="nav-item" style={{cursor: 'pointer'}}><Star size={20} /> Títulos</a>
          <a onClick={() => navigate('/temporadas')} className="nav-item active" style={{cursor: 'pointer'}}><CalendarSync size={20} /> Temporadas</a>
          <div className="nav-separator"></div>
          <a onClick={() => navigate('/partidas')} className="nav-item" style={{cursor: 'pointer'}}><Gamepad2 size={20} /> Partidas</a>
           <a onClick={() => navigate('/minha-conta')} className="nav-item" style={{cursor: 'pointer'}}><Wallet size={20} /> Minha conta</a>
          <a onClick={() => navigate('/suporte')} className="nav-item" style={{cursor: 'pointer'}}><Settings size={20} /> Suporte</a>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-header compact">
          <div className="left-header">
            <button className="toggle-btn menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <div className="search-bar">
              <Search size={20} />
              <input 
                type="text" 
                placeholder="Buscar time..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
              <Lightbulb size={20} />
            </button>
            <button className="icon-btn"><Bell size={20} /></button>
            
            {currentUser ? (
              <div 
                className="user-avatar-mini" 
                onClick={() => setShowUserPopup(true)}
                style={{
                    backgroundImage: currentUser.imagem ? `url(${currentUser.imagem})` : 'none',
                    backgroundSize: 'cover',
                    backgroundColor: currentUser.imagem ? 'transparent' : 'var(--primary)',
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
                <button className="login-btn-header" onClick={() => setShowLoginPopup(true)}>Login</button>
            )}
          </div>
        </header>

        <div className="lance-layout">
            <div className="market-column">
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <button onClick={() => navigate(`/${temporadaId}/torneios/leilao`)} className="back-btn-custom">
                        <ChevronLeft size={20} />
                        Voltar
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                        <Wallet size={18} color="#10b981" />
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.1}}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Saldo Disponível</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.95rem' }}>{formatMoney(saldoDisponivel)}</span>
                        </div>
                    </div>
                </div>

                <div className="market-grid custom-scrollbar">
                    {clubesData?.pages.map((page) => (
                        page.conteudo
                            .filter(clube => clube.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((clube) => {
                                const isSelected = meusLances.some(l => l.clube.id === clube.id);
                                return (
                                    <div key={clube.id} className={`clube-card ${isSelected ? 'selected' : ''}`}>
                                        {isSelected && (
                                            <div style={{ position: 'absolute', top: 10, right: 10, background: '#10b981', borderRadius: '50%', padding: '2px' }}>
                                                <CheckCircle2 size={16} color="white" />
                                            </div>
                                        )}
                                        <img src={clube.imagem} alt={clube.nome} className="clube-img" />
                                        <div style={{ textAlign: 'center', width: '100%' }}>
                                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)' }}>{clube.nome}</h4>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                                {renderStars(clube.estrelas)}
                                            </div>

                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', background: 'var(--bg-body)', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
                                                Min: <span style={{fontWeight: 700}}>{formatMoney(clube.lanceMinimo)}</span>
                                            </div>
                                        </div>
                                        {!isSelected && (
                                            <button 
                                                className="t-btn" 
                                                style={{ width: '100%', marginTop: '8px', fontSize: '0.85rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                                onClick={() => handleAddClube(clube)}
                                                disabled={meusLances.length >= 5}
                                            >
                                                <Plus size={16} /> Dar Lance
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                    ))}
                    <div ref={observerTarget} style={{ height: '40px', width: '100%' }}>
                        {isFetchingNextPage && <LoadingSpinner isLoading={true} />}
                    </div>
                </div>
            </div>

            <div className="cart-column">
                <div className="cart-header">
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}>
                        <div style={{background: 'var(--primary)', padding: '6px', borderRadius: '8px', display: 'flex'}}>
                            <DollarSign size={18} color="white" />
                        </div>
                        Meus Lances
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)', fontWeight: 400, marginLeft: 'auto' }}>
                            {meusLances.length}/5
                        </span>
                    </h3>
                    <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-gray)', display: 'flex', gap: '8px', alignItems: 'start', background: 'var(--hover-bg)', padding: '8px', borderRadius: '8px' }}>
                        <Info size={16} style={{flexShrink: 0, marginTop: '2px'}} />
                        <span>Defina o valor e a prioridade dos times. O saldo só é debitado se vencer.</span>
                    </div>
                </div>

                <div className="cart-items custom-scrollbar">
                    {meusLances.length === 0 ? (
                        <div className="cart-empty">
                            <div style={{background: 'var(--bg-body)', padding: '20px', borderRadius: '50%', marginBottom: '16px'}}>
                                <DollarSign size={32} color="var(--border-color)" />
                            </div>
                            <p style={{fontWeight: 600, color: 'var(--text-dark)'}}>Nenhum lance ainda</p>
                            <p style={{fontSize: '0.85rem'}}>Selecione times no mercado ao lado para começar suas negociações.</p>
                        </div>
                    ) : (
                        meusLances.map((lance, index) => {
                            const isError = lance.valor > saldoDisponivel;
                            return (
                                <div key={lance.clube.id} className="cart-item">
                                    <div className="order-controls">
                                        <button 
                                            className="order-btn" 
                                            onClick={() => handleMoveClube(index, -1)} 
                                            disabled={index === 0}
                                        >
                                            <ChevronUp size={16} />
                                        </button>
                                        <div className="priority-badge">{lance.prioridade}º</div>
                                        <button 
                                            className="order-btn" 
                                            onClick={() => handleMoveClube(index, 1)} 
                                            disabled={index === meusLances.length - 1}
                                        >
                                            <ChevronDown size={16} />
                                        </button>
                                    </div>

                                    <div className="cart-item-info">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                <img src={lance.clube.imagem} alt="" style={{width: '24px', height: '24px'}} />
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{lance.clube.nome}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveClube(lance.clube.id)}
                                                style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}
                                                title="Remover lance"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="cart-input-wrapper">
                                            <DollarSign size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-gray)', zIndex: 1 }} />
                                            <input 
                                                type="number" 
                                                className={`cart-input ${isError ? 'error' : ''}`}
                                                value={lance.valor}
                                                onChange={(e) => handleUpdateValor(lance.clube.id, Number(e.target.value))}
                                                onBlur={(e) => handleBlurValor(lance.clube.id, Number(e.target.value), lance.clube.lanceMinimo)}
                                                min={lance.clube.lanceMinimo}
                                                placeholder="Valor do lance"
                                            />
                                        </div>
                                        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '4px'}}>
                                            <span style={{fontSize: '0.7rem', color: 'var(--text-gray)'}}>Min: {formatMoney(lance.clube.lanceMinimo)}</span>
                                            {isError && (
                                                <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 600 }}>
                                                    Saldo insuficiente
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="cart-footer">
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-gray)'}}>
                        <span>Total de Lances:</span>
                        <span style={{fontWeight: 700, color: 'var(--text-dark)'}}>{meusLances.length}</span>
                    </div>

                    <button 
                        className="t-btn" 
                        style={{ width: '100%', justifyContent: 'center', height: '48px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '1rem' }}
                        disabled={meusLances.length === 0 || submitting || meusLances.some(l => l.valor > saldoDisponivel)}
                        onClick={handleSubmitLances}
                    >
                        {submitting ? <LoadingSpinner isLoading={true} /> : 'Confirmar Lances'}
                    </button>
                </div>
            </div>
        </div>
      </main>

      {showLoginPopup && (
        <PopupLogin 
          onClose={() => setShowLoginPopup(false)} 
          onLoginSuccess={(user) => {
              setCurrentUser({
                ...user,
                finais: 0,
                titulos: 0,
                golsMarcados: 0,
                partidasJogadas: 0
              });
              setShowLoginPopup(false);
          }} 
        />
      )}

      {showUserPopup && currentUser && (
        <PopupUser 
          user={currentUser}
          onClose={() => setShowUserPopup(false)}
          onLogout={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user_data');
            setCurrentUser(null);
            setShowUserPopup(false);
            navigate('/');
          }}
        />
      )}

      {popup.open && (
        <PopupGeral 
            onClose={closePopup}
            title={popup.title}
            message={popup.message}
            type={popup.type}
        />
      )}
    </div>
  );
}