import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, LayoutDashboard, Users, Trophy, Shield, Wallet, Search, 
  ArrowLeft, Gamepad2, Lightbulb, Settings, 
  CalendarSync, Star, Calculator, 
  Info, Banknote, Percent,
  Activity, Scale
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import { BotaoNotificacao } from '../components/BotaoNotificacao';

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
}

interface ParametrosCoeficiente {
    tetoGols: number;
    pontosVitoria: number;
    pontosEmpate: number;
    pontosGoleada: number;
    pontosCleanSheet: number;
    pontosDerrota: number;
    penalidadePorAmarelo: number;
    limiteAmarelosSemPunicao: number;
    penalidadePorVermelho: number;
    penalidadePorGolSofrido: number;
    divisorNivelTime: number;
    pontuacaoMinima: number;
    pontuacaoMaxima: number;
}

interface TransparenciaResponse {
    economico: ParametrosEconomicos;
    coeficiente: ParametrosCoeficiente;
}

export function TelaTransparencia() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<TransparenciaResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [simulacao, setSimulacao] = useState({
      nomeMandante: 'Meu Time',
      nomeVisitante: 'Adversário',
      minhasEstrelas: 3.0,
      estrelasAdversario: 3.0,
      golsPro: 0,
      golsContra: 0,
      cartoesAmarelos: 0,
      cartoesVermelhos: 0,
      pesoCompeticao: 100,
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
      setDados(data);
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

  const resultados = useMemo(() => {
    if (!dados?.economico || !dados?.coeficiente) return null;
    
    const eco = dados.economico;
    const coef = dados.coeficiente;
    const s = simulacao;

    let resultadoJogo: 'VITORIA' | 'EMPATE' | 'DERROTA';
    if (s.golsPro > s.golsContra) resultadoJogo = 'VITORIA';
    else if (s.golsPro === s.golsContra) resultadoJogo = 'EMPATE';
    else resultadoJogo = 'DERROTA';

    const custoOperacional = (s.minhasEstrelas * s.minhasEstrelas) * eco.custoBaseEstrela;
    const somaEstrelas = s.minhasEstrelas + s.estrelasAdversario;
    let receitaBilheteria = somaEstrelas * eco.valorPorEstrelaBilheteria;

    const diferencaGols = s.golsContra - s.golsPro;
    let valorPunicaoGoleada = 0;

    if (resultadoJogo === 'DERROTA' && diferencaGols >= 4) {
        valorPunicaoGoleada = receitaBilheteria * eco.fatorPunicaoGoleada;
        receitaBilheteria = receitaBilheteria - valorPunicaoGoleada;
    }

    let receitaPremiacao = 0;
    if (resultadoJogo === 'VITORIA') receitaPremiacao = eco.premioVitoria;
    else if (resultadoJogo === 'EMPATE') receitaPremiacao = eco.premioEmpate;

    let bonusZebra = 0;
    if (resultadoJogo !== 'DERROTA' && s.estrelasAdversario > s.minhasEstrelas) {
        const diferencaEstrelas = s.estrelasAdversario - s.minhasEstrelas;
        bonusZebra = diferencaEstrelas * eco.bonusZebraPorEstrela;
    }

    const receitaTotal = eco.cotaTvFixa + receitaBilheteria + receitaPremiacao + bonusZebra;
    const lucroBruto = receitaTotal - custoOperacional;
    const pesoEfetivoEco = Math.max(s.pesoCompeticao, eco.percentualMinimoCompeticao) / 100;
    const lucroLiquido = lucroBruto * pesoEfetivoEco;

    const pontosGols = Math.min(s.golsPro, coef.tetoGols);
    
    let pontosResultado = 0;
    if (resultadoJogo === 'VITORIA') pontosResultado = coef.pontosVitoria;
    else if (resultadoJogo === 'EMPATE') pontosResultado = coef.pontosEmpate;
    
    const pontosGoleada = (s.golsPro - s.golsContra > 3) ? coef.pontosGoleada : 0;
    const pontosCleanSheet = (s.golsContra === 0) ? coef.pontosCleanSheet : 0;

    const positivos = pontosGols + pontosResultado + pontosGoleada + pontosCleanSheet;

    const pontosDerrota = (resultadoJogo === 'DERROTA') ? coef.pontosDerrota : 0;
    
    const excessoAmarelos = Math.max(0, s.cartoesAmarelos - coef.limiteAmarelosSemPunicao);
    const punicaoAmarelos = excessoAmarelos * coef.penalidadePorAmarelo;
    const punicaoVermelhos = s.cartoesVermelhos * coef.penalidadePorVermelho;
    const punicaoGolsSofridos = s.golsContra * coef.penalidadePorGolSofrido;

    const negativos = pontosDerrota + punicaoAmarelos + punicaoVermelhos + punicaoGolsSofridos;

    const multiplicadorNegativos = 1.0 + (s.minhasEstrelas - 1.0) / coef.divisorNivelTime;
    const negativosAjustados = negativos * multiplicadorNegativos;

    const pesoTorneio = s.pesoCompeticao / 100.0;
    
    let pontosTotais = (positivos + negativosAjustados) * pesoTorneio;

    pontosTotais = Math.max(pontosTotais, coef.pontuacaoMinima);
    pontosTotais = Math.min(pontosTotais, coef.pontuacaoMaxima);

    return {
        economia: {
            lucroLiquido,
            detalhes: {
                cotaTv: eco.cotaTvFixa,
                bilheteria: receitaBilheteria,
                premiacao: receitaPremiacao,
                zebra: bonusZebra,
                custo: custoOperacional,
                punicao: valorPunicaoGoleada,
                pesoAplicado: pesoEfetivoEco
            }
        },
        coeficiente: {
            final: pontosTotais,
            positivos,
            negativos: negativosAjustados,
            detalhes: {
                gols: pontosGols,
                resultado: pontosResultado,
                cleanSheet: pontosCleanSheet,
                bonusGoleada: pontosGoleada
            }
        }
    };
  }, [dados, simulacao]);

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

        .section-header {
            font-size: 1.3rem;
            font-weight: 800;
            margin: 40px 0 20px 0;
            color: var(--text-dark);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .table-container {
            background: var(--bg-card);
            border-radius: 16px;
            border: 1px solid var(--border-color);
            overflow: hidden;
            margin-bottom: 30px;
            box-shadow: var(--shadow-sm);
        }

        .custom-table {
            width: 100%;
            border-collapse: collapse;
        }

        .custom-table th {
            background: var(--hover-bg);
            padding: 16px 24px;
            text-align: left;
            font-weight: 700;
            color: var(--text-gray);
            text-transform: uppercase;
            font-size: 0.85rem;
            border-bottom: 1px solid var(--border-color);
        }

        .custom-table td {
            padding: 16px 24px;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-dark);
            font-size: 0.95rem;
        }

        .custom-table tr:last-child td {
            border-bottom: none;
        }

        .custom-table tr:hover td {
            background: rgba(var(--primary-rgb), 0.02);
        }

        .val-highlight {
            font-weight: 700;
            color: var(--primary);
        }

        .val-highlight.negative { color: #ef4444; }

        .simulator-grid {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 30px;
            align-items: start;
        }

        .sim-input-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 30px;
            box-shadow: var(--shadow-sm);
        }

        .teams-comparison {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 30px;
            align-items: flex-start;
            margin-top: 20px;
        }

        .team-col {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .vs-divider {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding-top: 60px;
            font-weight: 900;
            color: var(--border-color);
            font-size: 2rem;
            opacity: 0.5;
        }

        .input-block {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .input-label {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-gray);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .big-input {
            width: 100%;
            padding: 14px;
            font-size: 1.1rem;
            font-weight: 600;
            text-align: center;
            background: var(--hover-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            color: var(--text-dark);
            transition: all 0.2s;
        }

        .big-input:focus {
            border-color: var(--primary);
            outline: none;
            background: var(--bg-card);
        }

        .score-display {
            font-size: 3.5rem;
            font-weight: 900;
            background: transparent;
            border: none;
            width: 100%;
            text-align: center;
            color: var(--text-dark);
            border-bottom: 2px solid var(--border-color);
            padding: 10px 0;
        }

        .score-display:focus {
            outline: none;
            border-color: var(--primary);
        }

        .range-block {
            background: var(--hover-bg);
            padding: 12px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .results-panel {
            display: flex;
            flex-direction: column;
            gap: 20px;
            position: sticky;
            top: 30px;
        }

        .res-card {
            background: var(--bg-card);
            border-radius: 20px;
            padding: 30px;
            border: 1px solid var(--border-color);
            position: relative;
            overflow: hidden;
            box-shadow: var(--shadow-sm);
        }

        .res-card.eco { border-top: 6px solid #10b981; }
        .res-card.rank { border-top: 6px solid #3b82f6; }

        .res-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            font-weight: 800;
            font-size: 1.2rem;
            color: var(--text-dark);
        }

        .res-main-value {
            font-size: 2.8rem;
            font-weight: 900;
            margin-bottom: 20px;
            line-height: 1;
        }

        .breakdown-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 0.95rem;
            color: var(--text-gray);
            border-bottom: 1px dashed var(--border-color);
            padding-bottom: 8px;
        }

        .breakdown-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }

        .breakdown-val {
            font-weight: 700;
            color: var(--text-dark);
        }

        .positive { color: #10b981; }
        .negative { color: #ef4444; }

        @media (max-width: 900px) {
            .simulator-grid { grid-template-columns: 1fr; }
            .teams-comparison { grid-template-columns: 1fr; gap: 40px; }
            .vs-divider { display: none; }
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
            <div className="transparency-wrapper">
                <button onClick={() => navigate('/')} className="btn-back" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50px',
                    color: 'var(--text-gray)', fontWeight: 500, marginBottom: '24px', cursor: 'pointer'
                }}>
                    <ArrowLeft size={18} /> Voltar ao Dashboard
                </button>

                <div className="hero-banner">
                    <Scale className="hero-icon-bg" />
                    <h1 className="page-title">Central de Transparência</h1>
                    <p className="page-desc">
                        Consulte as tabelas oficiais de regras e utilize nosso simulador integrado para projetar os resultados financeiros e técnicos do seu clube.
                    </p>
                </div>

                {dados?.economico && dados?.coeficiente && (
                    <>
                        <div className="section-header">
                            <Info size={24} className="text-primary" /> Parâmetros do Sistema
                        </div>

                        <div className="table-container">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th colSpan={3} style={{fontSize: '1rem', borderBottom: '2px solid var(--border-color)'}}>
                                            <Banknote size={18} style={{display: 'inline', verticalAlign: 'middle', marginRight: '8px'}} />
                                            Regras Econômicas
                                        </th>
                                    </tr>
                                    <tr>
                                        <th>Item</th>
                                        <th>Valor</th>
                                        <th>Detalhes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Cota de TV Fixa</td>
                                        <td className="val-highlight">{formatCurrency(dados.economico.cotaTvFixa)}</td>
                                        <td>Valor garantido por partida realizada.</td>
                                    </tr>
                                    <tr>
                                        <td>Bilheteria</td>
                                        <td className="val-highlight">{formatCurrency(dados.economico.valorPorEstrelaBilheteria)}</td>
                                        <td>Multiplicado pela soma das estrelas em campo.</td>
                                    </tr>
                                    <tr>
                                        <td>Prêmio Vitória</td>
                                        <td className="val-highlight">{formatCurrency(dados.economico.premioVitoria)}</td>
                                        <td>Empate rende {formatCurrency(dados.economico.premioEmpate)}.</td>
                                    </tr>
                                    <tr>
                                        <td>Custo Operacional</td>
                                        <td className="val-highlight negative">{formatCurrency(dados.economico.custoBaseEstrela)}</td>
                                        <td>Base de custo por estrela ao quadrado.</td>
                                    </tr>
                                    <tr>
                                        <td>Bônus Zebra</td>
                                        <td className="val-highlight">{formatCurrency(dados.economico.bonusZebraPorEstrela)}</td>
                                        <td>Por diferença de estrela (se vencer/empatar).</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="table-container">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th colSpan={3} style={{fontSize: '1rem', borderBottom: '2px solid var(--border-color)'}}>
                                            <Activity size={18} style={{display: 'inline', verticalAlign: 'middle', marginRight: '8px'}} />
                                            Regras de Ranking (Coeficiente)
                                        </th>
                                    </tr>
                                    <tr>
                                        <th>Critério</th>
                                        <th>Pontos</th>
                                        <th>Regra</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Vitória / Empate</td>
                                        <td className="val-highlight">+{dados.coeficiente.pontosVitoria} / +{dados.coeficiente.pontosEmpate}</td>
                                        <td>Resultado base da partida.</td>
                                    </tr>
                                    <tr>
                                        <td>Gols Pró</td>
                                        <td className="val-highlight">Até {dados.coeficiente.tetoGols}</td>
                                        <td>1 ponto por gol (limitado ao teto).</td>
                                    </tr>
                                    <tr>
                                        <td>Bônus Performance</td>
                                        <td className="val-highlight">+{dados.coeficiente.pontosGoleada} / +{dados.coeficiente.pontosCleanSheet}</td>
                                        <td>Para Goleada (dif &gt; 3) e Clean Sheet.</td>
                                    </tr>
                                    <tr>
                                        <td>Derrota</td>
                                        <td className="val-highlight negative">{dados.coeficiente.pontosDerrota}</td>
                                        <td>Penalidade fixa por derrota.</td>
                                    </tr>
                                    <tr>
                                        <td>Punição Cartões</td>
                                        <td className="val-highlight negative">{dados.coeficiente.penalidadePorVermelho} / {dados.coeficiente.penalidadePorAmarelo}</td>
                                        <td>Por Vermelho / Por Amarelo (acima de {dados.coeficiente.limiteAmarelosSemPunicao}).</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="section-header">
                            <Calculator size={24} className="text-primary" /> Simulador de Partida
                        </div>

                        <div className="simulator-grid">
                            {/* AREA DE INPUTS */}
                            <div className="sim-input-card">
                                <div className="input-block">
                                    <div className="input-label">Peso da Competição: {simulacao.pesoCompeticao}%</div>
                                    <div className="range-block">
                                        <Percent size={18} className="text-gray" />
                                        <input 
                                            type="range" min="0" max="100" step="5" style={{flex: 1}}
                                            value={simulacao.pesoCompeticao}
                                            onChange={(e) => setSimulacao({...simulacao, pesoCompeticao: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>

                                <div className="teams-comparison">
                                    {/* COLUNA MEU TIME */}
                                    <div className="team-col">
                                        <div className="input-block">
                                            <div className="input-label">Seu Time</div>
                                            <input 
                                                type="text" 
                                                className="big-input" 
                                                value={simulacao.nomeMandante}
                                                onChange={(e) => setSimulacao({...simulacao, nomeMandante: e.target.value})}
                                            />
                                        </div>

                                        <div className="input-block">
                                            <div className="input-label">Gols</div>
                                            <input 
                                                type="number" min="0"
                                                className="score-display"
                                                value={simulacao.golsPro}
                                                onChange={(e) => setSimulacao({...simulacao, golsPro: Math.max(0, Number(e.target.value))})}
                                            />
                                        </div>

                                        <div className="input-block">
                                            <div className="input-label">Estrelas: {simulacao.minhasEstrelas.toFixed(1)}</div>
                                            <div className="range-block">
                                                <Star size={18} className="text-gray" />
                                                <input 
                                                    type="range" min="0.5" max="5" step="0.5" style={{flex: 1}}
                                                    value={simulacao.minhasEstrelas}
                                                    onChange={(e) => setSimulacao({...simulacao, minhasEstrelas: Number(e.target.value)})}
                                                />
                                            </div>
                                        </div>

                                        <div style={{display: 'flex', gap: '15px'}}>
                                            <div className="input-block" style={{flex: 1}}>
                                                <div className="input-label" style={{color: '#f59e0b'}}>Amarelos</div>
                                                <div className="range-block" style={{padding: '8px'}}>
                                                    <input 
                                                        type="number" min="0" style={{width: '100%', background: 'transparent', border: 'none', textAlign: 'center', fontWeight: 'bold'}}
                                                        value={simulacao.cartoesAmarelos}
                                                        onChange={(e) => setSimulacao({...simulacao, cartoesAmarelos: Math.max(0, Number(e.target.value))})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="input-block" style={{flex: 1}}>
                                                <div className="input-label" style={{color: '#ef4444'}}>Vermelhos</div>
                                                <div className="range-block" style={{padding: '8px'}}>
                                                    <input 
                                                        type="number" min="0" style={{width: '100%', background: 'transparent', border: 'none', textAlign: 'center', fontWeight: 'bold'}}
                                                        value={simulacao.cartoesVermelhos}
                                                        onChange={(e) => setSimulacao({...simulacao, cartoesVermelhos: Math.max(0, Number(e.target.value))})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="vs-divider">X</div>

                                    {/* COLUNA ADVERSÁRIO */}
                                    <div className="team-col">
                                        <div className="input-block">
                                            <div className="input-label">Adversário</div>
                                            <input 
                                                type="text" 
                                                className="big-input" 
                                                value={simulacao.nomeVisitante}
                                                onChange={(e) => setSimulacao({...simulacao, nomeVisitante: e.target.value})}
                                            />
                                        </div>

                                        <div className="input-block">
                                            <div className="input-label">Gols</div>
                                            <input 
                                                type="number" min="0"
                                                className="score-display"
                                                value={simulacao.golsContra}
                                                onChange={(e) => setSimulacao({...simulacao, golsContra: Math.max(0, Number(e.target.value))})}
                                            />
                                        </div>

                                        <div className="input-block">
                                            <div className="input-label">Estrelas: {simulacao.estrelasAdversario.toFixed(1)}</div>
                                            <div className="range-block">
                                                <Star size={18} className="text-gray" />
                                                <input 
                                                    type="range" min="0.5" max="5" step="0.5" style={{flex: 1}}
                                                    value={simulacao.estrelasAdversario}
                                                    onChange={(e) => setSimulacao({...simulacao, estrelasAdversario: Number(e.target.value)})}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div style={{marginTop: 'auto', padding: '15px', background: 'var(--hover-bg)', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--text-gray)', textAlign: 'center'}}>
                                            Configure apenas os dados do seu time para ver os resultados.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AREA DE RESULTADOS */}
                            <div className="results-panel">
                                {resultados && (
                                    <>
                                        <div className="res-card eco">
                                            <div className="res-header" style={{color: '#10b981'}}>
                                                <Banknote size={24} /> Financeiro
                                            </div>
                                            <div className="res-main-value" style={{color: resultados.economia.lucroLiquido >= 0 ? '#10b981' : '#ef4444'}}>
                                                {formatCurrency(resultados.economia.lucroLiquido)}
                                            </div>
                                            
                                            <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '15px'}}>
                                                <div className="breakdown-row">
                                                    <span>Receita Bruta</span>
                                                    <span className="breakdown-val positive">
                                                        +{formatCurrency(resultados.economia.detalhes.cotaTv + resultados.economia.detalhes.bilheteria + resultados.economia.detalhes.premiacao + resultados.economia.detalhes.zebra)}
                                                    </span>
                                                </div>
                                                <div className="breakdown-row">
                                                    <span>Custo Operacional</span>
                                                    <span className="breakdown-val negative">-{formatCurrency(resultados.economia.detalhes.custo)}</span>
                                                </div>
                                                {resultados.economia.detalhes.punicao > 0 && (
                                                    <div className="breakdown-row">
                                                        <span>Punição Goleada</span>
                                                        <span className="breakdown-val negative">-{formatCurrency(resultados.economia.detalhes.punicao)}</span>
                                                    </div>
                                                )}
                                                <div style={{marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-gray)', textAlign: 'right'}}>
                                                    Fator Peso: {(resultados.economia.detalhes.pesoAplicado * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                        </div>

                                        <div className="res-card rank">
                                            <div className="res-header" style={{color: '#3b82f6'}}>
                                                <Activity size={24} /> Ranking
                                            </div>
                                            <div className="res-main-value" style={{color: resultados.coeficiente.final >= 0 ? '#3b82f6' : '#ef4444'}}>
                                                {resultados.coeficiente.final.toFixed(2)} <span style={{fontSize: '1rem', fontWeight: 400}}>pts</span>
                                            </div>

                                            <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '15px'}}>
                                                <div className="breakdown-row">
                                                    <span>Pontos Positivos</span>
                                                    <span className="breakdown-val positive">+{resultados.coeficiente.positivos.toFixed(1)}</span>
                                                </div>
                                                <div className="breakdown-row">
                                                    <span>Penalidades (Ajustadas)</span>
                                                    <span className="breakdown-val negative">{resultados.coeficiente.negativos.toFixed(1)}</span>
                                                </div>
                                                <div style={{fontSize: '0.75rem', marginTop: '10px', color: 'var(--text-gray)', textAlign: 'center'}}>
                                                    Limites: {dados?.coeficiente.pontuacaoMinima} a {dados?.coeficiente.pontuacaoMaxima}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{padding: '15px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-color)', fontSize: '0.85rem', color: 'var(--text-gray)'}}>
                                            <Info size={16} style={{display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom'}} />
                                            <strong>Nota:</strong> {dados.economico.explicacaoFatorCompeticao}
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