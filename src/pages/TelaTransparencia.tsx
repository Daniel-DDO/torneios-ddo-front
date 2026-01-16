import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, LayoutDashboard, Users, Trophy, Shield, Wallet, Search, 
  Bell, ArrowLeft, Gamepad2, Lightbulb, Settings, 
  CalendarSync, Star, Calculator, 
  AlertTriangle, Info, Coins, Banknote, Percent
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';

interface UserData {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  cargo: string;
  saldoVirtual: number;
}

interface ParametrosEconomicos {
    cotaTvFixa: number;
    valorPorEstrelaBilheteria: number;
    premioVitoria: number;
    premioEmpate: number;
    custoBaseEstrela: number;
    bonusZebraPorEstrela: number;
    fatorPunicaoGoleada: number;
    percentualMinimoCompeticao: number;
    explicacaoFatorCompeticao: string;
    premioBaseCampeao?: number;
    premioBaseVice?: number;
}

export function TelaTransparencia() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [parametros, setParametros] = useState<ParametrosEconomicos | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [simulacao, setSimulacao] = useState({
      minhasEstrelas: 3.0,
      estrelasAdversario: 3.0,
      golsPro: 2,
      golsContra: 1,
      pesoCompeticao: 100,
      cartoesAmarelos: 0, 
      cartoesVermelhos: 0
  });

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
    fetchParametros();
  }, []);

  const fetchParametros = async () => {
    try {
      setLoading(true);
      const response = await API.get('/torneio/transparencia');
      const data = (response && (response as any).data) ? (response as any).data : response;
      setParametros(data);
    } catch (error) {
      console.error(error);
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

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const formatCurrency = (value: number) => {
    return 'D$ ' + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const resultadoSimulado = useMemo(() => {
    if (!parametros) return null;

    const {
        cotaTvFixa, valorPorEstrelaBilheteria, premioVitoria, premioEmpate,
        custoBaseEstrela, bonusZebraPorEstrela, fatorPunicaoGoleada, percentualMinimoCompeticao
    } = parametros;

    const {
        minhasEstrelas, estrelasAdversario, golsPro, golsContra, pesoCompeticao
    } = simulacao;

    let resultado: 'VITORIA' | 'EMPATE' | 'DERROTA';
    if (golsPro > golsContra) resultado = 'VITORIA';
    else if (golsPro === golsContra) resultado = 'EMPATE';
    else resultado = 'DERROTA';

    const custoOperacional = (minhasEstrelas * minhasEstrelas) * custoBaseEstrela;

    const somaEstrelas = minhasEstrelas + estrelasAdversario;
    let receitaBilheteria = somaEstrelas * valorPorEstrelaBilheteria;

    const diferencaGols = golsContra - golsPro;
    let tevePunicaoGoleada = false;
    let valorPunicao = 0;

    if (resultado === 'DERROTA' && diferencaGols >= 4) {
        valorPunicao = receitaBilheteria * fatorPunicaoGoleada;
        receitaBilheteria = receitaBilheteria - valorPunicao;
        tevePunicaoGoleada = true;
    }

    let receitaPremiacao = 0;
    if (resultado === 'VITORIA') receitaPremiacao = premioVitoria;
    else if (resultado === 'EMPATE') receitaPremiacao = premioEmpate;

    let bonusZebra = 0;
    if (resultado !== 'DERROTA' && estrelasAdversario > minhasEstrelas) {
        const diferencaEstrelas = estrelasAdversario - minhasEstrelas;
        bonusZebra = diferencaEstrelas * bonusZebraPorEstrela;
    }

    const receitaTotalBruta = cotaTvFixa + receitaBilheteria + receitaPremiacao + bonusZebra;
    const lucroBruto = receitaTotalBruta - custoOperacional;

    const pesoEfetivo = Math.max(pesoCompeticao, percentualMinimoCompeticao) / 100;
    const lucroLiquidoFinal = lucroBruto * pesoEfetivo;

    return {
        resultado,
        custoOperacional,
        receitaBilheteria,
        receitaPremiacao,
        bonusZebra,
        cotaTv: cotaTvFixa,
        tevePunicaoGoleada,
        valorPunicao,
        lucroBruto,
        pesoEfetivo,
        lucroLiquidoFinal
    };

  }, [parametros, simulacao]);

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      <LoadingSpinner isLoading={loading} />

      <style>{`
        .transparency-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            padding-bottom: 60px;
            animation: fadeInUp 0.5s ease-out;
        }

        .hero-banner {
            background: linear-gradient(135deg, var(--bg-card) 0%, var(--hover-bg) 100%);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 40px;
            margin-bottom: 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
            box-shadow: var(--shadow-sm);
        }

        .hero-icon-bg {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.03;
            font-size: 20rem;
            pointer-events: none;
            color: var(--text-dark);
        }

        .page-title {
            font-size: 2.2rem;
            font-weight: 800;
            margin-bottom: 12px;
            background: linear-gradient(90deg, var(--primary) 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            position: relative;
        }

        .page-desc {
            font-size: 1.1rem;
            color: var(--text-gray);
            max-width: 700px;
            margin: 0 auto;
            line-height: 1.6;
        }

        .params-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .param-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 24px;
            transition: transform 0.2s, box-shadow 0.2s;
            position: relative;
            overflow: hidden;
        }

        .param-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-md);
            border-color: var(--primary);
        }

        .param-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            color: var(--text-gray);
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .param-value {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--text-dark);
            margin-bottom: 8px;
        }

        .param-info {
            font-size: 0.85rem;
            color: var(--text-gray);
            line-height: 1.4;
        }

        .simulator-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            align-items: start;
        }

        .simulator-controls {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 30px;
            box-shadow: var(--shadow-sm);
        }

        .sim-title {
            font-size: 1.4rem;
            font-weight: 700;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .control-group {
            margin-bottom: 24px;
        }

        .control-label {
            display: block;
            margin-bottom: 10px;
            font-weight: 600;
            color: var(--text-gray);
            font-size: 0.9rem;
        }

        .range-wrapper {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .range-input {
            flex: 1;
            height: 6px;
            border-radius: 3px;
            background: var(--border-color);
            outline: none;
            -webkit-appearance: none;
        }

        .range-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--primary);
            cursor: pointer;
            border: 2px solid var(--bg-card);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .number-display {
            background: var(--hover-bg);
            padding: 6px 12px;
            border-radius: 8px;
            font-weight: 700;
            min-width: 60px;
            text-align: center;
            border: 1px solid var(--border-color);
        }

        .score-inputs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 24px;
        }

        .score-box {
            background: var(--hover-bg);
            padding: 15px;
            border-radius: 12px;
            text-align: center;
        }

        .score-input-field {
            width: 100%;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            padding: 10px;
            border-radius: 8px;
            font-size: 1.5rem;
            font-weight: 800;
            text-align: center;
            color: var(--text-dark);
        }

        .receipt-card {
            background: var(--bg-card);
            border: 1px dashed var(--border-color);
            border-radius: 24px;
            padding: 30px;
            position: relative;
        }

        .receipt-header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px dashed var(--border-color);
        }

        .receipt-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-size: 0.95rem;
        }

        .receipt-row.total {
            border-top: 2px dashed var(--border-color);
            padding-top: 16px;
            margin-top: 16px;
            font-weight: 800;
            font-size: 1.2rem;
            color: var(--primary);
        }

        .receipt-row.subtotal {
            font-weight: 700;
            color: var(--text-dark);
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid var(--border-color);
        }

        .negative { color: #ef4444; }
        .positive { color: #10b981; }
        .neutral { color: var(--text-gray); }

        .explanation-box {
            margin-top: 20px;
            background: rgba(59, 130, 246, 0.05);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 12px;
            padding: 15px;
            font-size: 0.85rem;
            color: var(--text-dark);
            display: flex;
            gap: 10px;
        }

        @media (max-width: 900px) {
            .simulator-section { grid-template-columns: 1fr; }
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
            <div className="transparency-wrapper">
                <button onClick={() => navigate('/')} className="btn-back" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50px',
                    color: 'var(--text-gray)', fontWeight: 500, marginBottom: '24px', cursor: 'pointer'
                }}>
                    <ArrowLeft size={18} /> Voltar ao Dashboard
                </button>

                <div className="hero-banner">
                    <Banknote className="hero-icon-bg" />
                    <h1 className="page-title">Portal da Transparência Econômica</h1>
                    <p className="page-desc">
                        Entenda como funciona a economia do Torneios DDO. Todos os valores de partidas são calculados automaticamente baseados nos parâmetros abaixo.
                    </p>
                </div>

                {parametros && (
                    <>
                        <div className="params-grid">
                            <div className="param-card">
                                <div className="param-header">
                                    <Coins size={20} className="text-blue" />
                                    Cota de TV Fixa
                                </div>
                                <div className="param-value">{formatCurrency(parametros.cotaTvFixa)}</div>
                                <div className="param-info">Valor fixo garantido a todos os clubes por partida realizada.</div>
                            </div>

                            <div className="param-card">
                                <div className="param-header">
                                    <Users size={20} className="text-green" />
                                    Bilheteria (Por Estrela)
                                </div>
                                <div className="param-value">{formatCurrency(parametros.valorPorEstrelaBilheteria)}</div>
                                <div className="param-info">Multiplicado pela soma das estrelas dos dois times em campo.</div>
                            </div>

                            <div className="param-card">
                                <div className="param-header">
                                    <Trophy size={20} className="text-orange" />
                                    Prêmio Vitória
                                </div>
                                <div className="param-value">{formatCurrency(parametros.premioVitoria)}</div>
                                <div className="param-info">Bônus pago ao vencedor da partida (Empate: {formatCurrency(parametros.premioEmpate)}).</div>
                            </div>

                            <div className="param-card">
                                <div className="param-header">
                                    <AlertTriangle size={20} className="text-red" />
                                    Custo Operacional Base
                                </div>
                                <div className="param-value">{formatCurrency(parametros.custoBaseEstrela)}</div>
                                <div className="param-info">Custo = (Suas Estrelas)² × {formatCurrency(parametros.custoBaseEstrela)}. Times maiores gastam mais.</div>
                            </div>
                        </div>

                        <div className="simulator-section">
                            <div className="simulator-controls">
                                <div className="sim-title">
                                    <Calculator size={24} className="text-primary" />
                                    Simulador de Partida
                                </div>

                                <div className="score-inputs">
                                    <div className="score-box">
                                        <div className="control-label">Seu Time</div>
                                        <div style={{marginBottom: '10px'}}>
                                            <label style={{fontSize: '0.8rem', color: 'var(--text-gray)'}}>Gols</label>
                                            <input 
                                                type="number" 
                                                className="score-input-field"
                                                value={simulacao.golsPro}
                                                onChange={(e) => setSimulacao({...simulacao, golsPro: Number(e.target.value)})}
                                                min="0"
                                            />
                                        </div>
                                        <div style={{display:'flex', gap: '10px'}}>
                                            <div>
                                                <label style={{fontSize: '0.7rem', color: 'var(--text-gray)'}}>Amarelos</label>
                                                <input type="number" className="score-input-field" style={{fontSize: '1rem', padding: '5px'}} 
                                                    value={simulacao.cartoesAmarelos} onChange={(e) => setSimulacao({...simulacao, cartoesAmarelos: Number(e.target.value)})} min="0" />
                                            </div>
                                            <div>
                                                <label style={{fontSize: '0.7rem', color: 'var(--text-gray)'}}>Vermelhos</label>
                                                <input type="number" className="score-input-field" style={{fontSize: '1rem', padding: '5px'}} 
                                                    value={simulacao.cartoesVermelhos} onChange={(e) => setSimulacao({...simulacao, cartoesVermelhos: Number(e.target.value)})} min="0" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="score-box" style={{opacity: 0.8}}>
                                        <div className="control-label">Adversário</div>
                                        <div style={{marginBottom: '10px'}}>
                                            <label style={{fontSize: '0.8rem', color: 'var(--text-gray)'}}>Gols</label>
                                            <input 
                                                type="number" 
                                                className="score-input-field"
                                                value={simulacao.golsContra}
                                                onChange={(e) => setSimulacao({...simulacao, golsContra: Number(e.target.value)})}
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="control-group">
                                    <div className="control-label">Suas Estrelas: {simulacao.minhasEstrelas.toFixed(1)}</div>
                                    <div className="range-wrapper">
                                        <Star size={18} className="text-gray" />
                                        <input 
                                            type="range" 
                                            min="0.5" 
                                            max="5.0" 
                                            step="0.5" 
                                            className="range-input"
                                            value={simulacao.minhasEstrelas}
                                            onChange={(e) => setSimulacao({...simulacao, minhasEstrelas: Number(e.target.value)})}
                                        />
                                        <div className="number-display">{simulacao.minhasEstrelas.toFixed(1)}</div>
                                    </div>
                                </div>

                                <div className="control-group">
                                    <div className="control-label">Estrelas do Adversário: {simulacao.estrelasAdversario.toFixed(1)}</div>
                                    <div className="range-wrapper">
                                        <Star size={18} className="text-gray" />
                                        <input 
                                            type="range" 
                                            min="0.5" 
                                            max="5.0" 
                                            step="0.5" 
                                            className="range-input"
                                            value={simulacao.estrelasAdversario}
                                            onChange={(e) => setSimulacao({...simulacao, estrelasAdversario: Number(e.target.value)})}
                                        />
                                        <div className="number-display">{simulacao.estrelasAdversario.toFixed(1)}</div>
                                    </div>
                                </div>

                                <div className="control-group">
                                    <div className="control-label">Peso da Competição: {simulacao.pesoCompeticao}%</div>
                                    <div className="range-wrapper">
                                        <Percent size={18} className="text-gray" />
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            step="5" 
                                            className="range-input"
                                            value={simulacao.pesoCompeticao}
                                            onChange={(e) => setSimulacao({...simulacao, pesoCompeticao: Number(e.target.value)})}
                                        />
                                        <div className="number-display">{simulacao.pesoCompeticao}%</div>
                                    </div>
                                </div>
                            </div>

                            <div className="receipt-card">
                                <div className="receipt-header">
                                    <h3 style={{fontSize: '1.2rem', fontWeight: 700}}>Extrato Estimado</h3>
                                    <span style={{color: 'var(--text-gray)', fontSize: '0.9rem'}}>Resultado: {resultadoSimulado?.resultado}</span>
                                </div>

                                {resultadoSimulado && (
                                    <>
                                        <div className="receipt-row">
                                            <span className="neutral">Cota TV Fixa</span>
                                            <span className="positive">+ {formatCurrency(resultadoSimulado.cotaTv)}</span>
                                        </div>
                                        <div className="receipt-row">
                                            <span className="neutral">Bilheteria ({simulacao.minhasEstrelas + simulacao.estrelasAdversario} estrelas)</span>
                                            <span className="positive">+ {formatCurrency(resultadoSimulado.receitaBilheteria)}</span>
                                        </div>
                                        {resultadoSimulado.tevePunicaoGoleada && (
                                            <div className="receipt-row">
                                                <span className="negative">Punição Goleada (40%)</span>
                                                <span className="negative">- {formatCurrency(resultadoSimulado.valorPunicao)}</span>
                                            </div>
                                        )}
                                        {resultadoSimulado.receitaPremiacao > 0 && (
                                            <div className="receipt-row">
                                                <span className="neutral">Prêmio {resultadoSimulado.resultado}</span>
                                                <span className="positive">+ {formatCurrency(resultadoSimulado.receitaPremiacao)}</span>
                                            </div>
                                        )}
                                        {resultadoSimulado.bonusZebra > 0 && (
                                            <div className="receipt-row">
                                                <span className="neutral">Bônus Zebra (Dif. {simulacao.estrelasAdversario - simulacao.minhasEstrelas} est)</span>
                                                <span className="positive">+ {formatCurrency(resultadoSimulado.bonusZebra)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="receipt-row">
                                            <span className="neutral">Custo Operacional ({simulacao.minhasEstrelas}² stars)</span>
                                            <span className="negative">- {formatCurrency(resultadoSimulado.custoOperacional)}</span>
                                        </div>

                                        <div className="receipt-row subtotal">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(resultadoSimulado.lucroBruto)}</span>
                                        </div>

                                        <div className="receipt-row">
                                            <span className="neutral">Fator Competição</span>
                                            <span className="neutral">x {(resultadoSimulado.pesoEfetivo * 100).toFixed(0)}%</span>
                                        </div>

                                        <div className="receipt-row total">
                                            <span>LUCRO LÍQUIDO</span>
                                            <span className={resultadoSimulado.lucroLiquidoFinal >= 0 ? 'positive' : 'negative'}>
                                                {formatCurrency(resultadoSimulado.lucroLiquidoFinal)}
                                            </span>
                                        </div>

                                        <div className="explanation-box">
                                            <Info size={24} className="text-blue" style={{flexShrink: 0}} />
                                            <div>
                                                <strong>Nota:</strong> {parametros.explicacaoFatorCompeticao}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
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
            id: currentUser.id,
            nome: currentUser.nome,
            discord: currentUser.discord,
            imagem: currentUser.imagem,
            cargo: currentUser.cargo,
            saldoVirtual: currentUser.saldoVirtual,
            finais: 0,
            titulos: 0,
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