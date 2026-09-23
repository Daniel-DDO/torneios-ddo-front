import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../services/api';
import {
  TrendingUp,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Minus,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import PopupGeral from '../components/PopupGeral';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

// ---------- Tipos ----------

interface InflacaoMercado {
  aplicada: boolean;
  motivo: string;
  mediaSaldoJogadores: number;
  medianaSaldoJogadores: number;
  indicadorAtual: number;
  indicadorAnterior: number | null;
  crescimentoPercentual: number | null; // fração, ex: 0.08 = 8%
  multiplicadorAplicado: number | null; // ex: 1.04
  clubesAtualizados: number | null;
  dataCalculo: string;
}

interface ClubeLeilao {
  id: string;
  nome: string;
  sigla: string;
  imagem: string | null;
  ligaClube: string;
  valorAvaliado: number;
  lanceMinimo: number;
}

interface PageResponse<T> {
  content: T[];
  number: number;
  totalPages: number;
  totalElements: number;
  size: number;
  last: boolean;
}

// Mesma regra do backend (InflacaoMercadoService): piso mínimo do valorAvaliado
const VALOR_PISO_CLUBE = 40000;
const TAMANHO_PAGINA = 15;

// ---------- Componente ----------

export function TelaInflacaoClubes() {
  const navigate = useNavigate();
  const { currentUser } = useAppContext();

  const [simulacao, setSimulacao] = useState<InflacaoMercado | null>(null);
  const [clubes, setClubes] = useState<PageResponse<ClubeLeilao> | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(0);

  const [loadingSimulacao, setLoadingSimulacao] = useState(true);
  const [loadingClubes, setLoadingClubes] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [aplicando, setAplicando] = useState(false);
  const [pedirConfirmacao, setPedirConfirmacao] = useState(false);
  const [popup, setPopup] = useState<{ title: string; message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const isProprietario = currentUser?.cargo === 'PROPRIETARIO';

  const carregarSimulacao = useCallback(async () => {
    setLoadingSimulacao(true);
    setErro(null);
    try {
      const res = await API.get('/clube/mercado/inflacao/simular');
      setSimulacao(res.data);
    } catch (e) {
      console.error('Erro ao simular inflação:', e);
      setErro('Não foi possível calcular a simulação de inflação.');
    } finally {
      setLoadingSimulacao(false);
    }
  }, []);

  const carregarClubes = useCallback(async (page: number) => {
    setLoadingClubes(true);
    try {
      const res = await API.get('/clube/leilao/todos', {
        params: { page, size: TAMANHO_PAGINA, sort: 'valorAvaliado,desc' },
      });
      setClubes(res.data);
    } catch (e) {
      console.error('Erro ao carregar clubes:', e);
    } finally {
      setLoadingClubes(false);
    }
  }, []);

  useEffect(() => {
    if (isProprietario) carregarSimulacao();
  }, [isProprietario, carregarSimulacao]);

  useEffect(() => {
    if (isProprietario) carregarClubes(paginaAtual);
  }, [isProprietario, paginaAtual, carregarClubes]);

  const formatCurrency = (value: number | null | undefined) => {
    const val = value ?? 0;
    return 'D$ ' + val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPercent = (fracao: number | null | undefined) => {
    if (fracao === null || fracao === undefined) return '-';
    const pct = fracao * 100;
    const sinal = pct > 0 ? '+' : '';
    return `${sinal}${pct.toFixed(2)}%`;
  };

  // Calcula localmente o "depois" de cada clube com o mesmo multiplicador
  // que o backend usaria — evita ter que buscar isso do servidor pra cada
  // clube, já que o resultado é 100% determinístico a partir do multiplicador.
  const calcularDepois = (valorAvaliadoAtual: number) => {
    const multiplicador = simulacao?.multiplicadorAplicado ?? 1;
    const bruto = valorAvaliadoAtual * multiplicador;
    const valorAvaliadoDepois = Math.max(VALOR_PISO_CLUBE, bruto);
    const lanceMinimoDepois = valorAvaliadoDepois * 0.5;
    const atingiuPiso = bruto < VALOR_PISO_CLUBE;
    return { valorAvaliadoDepois, lanceMinimoDepois, atingiuPiso };
  };

  const haveraInflacao = !!simulacao?.multiplicadorAplicado && simulacao.multiplicadorAplicado > 1;

  const handleSimular = async () => {
    setPedirConfirmacao(false);
    await carregarSimulacao();
  };

  const handleAplicar = async () => {
    setAplicando(true);
    try {
      const res = await API.post('/clube/mercado/inflacao/aplicar');
      const resultado: InflacaoMercado = res.data;

      setPopup({
        title: resultado.aplicada ? 'Inflação aplicada!' : 'Nada foi alterado',
        message: resultado.motivo,
        type: resultado.aplicada ? 'success' : 'warning',
      });

      // Recarrega os dois: a simulação nova já reflete os valores atualizados,
      // evitando aplicar o multiplicador antigo uma segunda vez na tabela.
      await Promise.all([carregarSimulacao(), carregarClubes(paginaAtual)]);
    } catch (e: any) {
      const data = e?.response?.data;
      const mensagem = typeof data === 'string' ? data : data?.message;
      setPopup({
        title: 'Erro ao aplicar',
        message: mensagem || 'Não foi possível aplicar a inflação.',
        type: 'error',
      });
    } finally {
      setAplicando(false);
      setPedirConfirmacao(false);
    }
  };

  // Enquanto o usuário ainda carrega, evita o flash de "Acesso restrito"
  if (!currentUser) {
    return <LoadingSpinner isLoading={true} />;
  }

  if (!isProprietario) {
    return (
      <DashboardLayout esconderBusca>
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <ShieldAlert size={40} color="#e74c3c" />
          <h3 style={{ marginTop: '1rem' }}>Acesso restrito</h3>
          <p style={{ color: 'var(--text-gray)' }}>Somente o PROPRIETARIO pode acessar a inflação de mercado.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout esconderBusca contentStyle={{ padding: '1rem 0rem' }}>
      <style>{`
        @keyframes inflacao-spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: inflacao-spin 1s linear infinite; }

        .inflacao-page {
          padding: 2rem 3rem;
          display: flex;
          justify-content: center;
        }

        .inflacao-container {
          width: 100%;
          max-width: 1000px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 2rem;
          box-shadow: var(--shadow-sm);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
        }

        .card-subtitle {
          font-size: 0.85rem;
          color: var(--text-gray);
          margin-bottom: 1.5rem;
        }

        .btn-voltar {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--text-gray);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          padding: 0;
          align-self: flex-start;
        }

        .btn-voltar:hover { color: var(--text-dark); }

        .status-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 1rem 1.25rem;
          border-radius: var(--radius);
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .status-banner.cresceu {
          background: rgba(0, 200, 100, 0.1);
          color: var(--success);
        }

        .status-banner.parado {
          background: rgba(150, 150, 150, 0.1);
          color: var(--text-gray);
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
        }

        .stat-box {
          background: var(--bg-main);
          padding: 1.25rem;
          border-radius: var(--radius);
          text-align: center;
          border: 1px solid var(--border-color);
        }

        .stat-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .stat-value.money { color: var(--success); }
        .stat-value.highlight { color: var(--primary); }

        .stat-label {
          font-size: 0.78rem;
          color: var(--text-gray);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: var(--radius);
          border: none;
          background: var(--primary);
          color: white;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius);
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-dark);
          font-weight: 600;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .btn-secondary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .tabela-clubes {
          width: 100%;
          border-collapse: collapse;
        }

        .tabela-clubes th {
          text-align: left;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-gray);
          padding: 0.6rem 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .tabela-clubes th.numero { text-align: right; }

        .tabela-clubes td {
          padding: 0.7rem 0.5rem;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.88rem;
          vertical-align: middle;
        }

        .tabela-clubes tr:last-child td { border-bottom: none; }

        .clube-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .clube-avatar {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          object-fit: cover;
          background: var(--bg-main);
          border: 1px solid var(--border-color);
        }

        .clube-nome {
          font-weight: 600;
          color: var(--text-dark);
        }

        .clube-sigla {
          font-size: 0.75rem;
          color: var(--text-gray);
        }

        .valor-antes {
          color: var(--text-gray);
          text-align: right;
        }

        .valor-depois {
          font-weight: 700;
          color: var(--text-dark);
          text-align: right;
        }

        .valor-depois.subiu { color: var(--success); }

        .diff-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(0, 200, 100, 0.12);
          color: var(--success);
          white-space: nowrap;
        }

        .diff-badge.zero {
          background: rgba(150, 150, 150, 0.12);
          color: var(--text-gray);
        }

        .diff-badge.piso {
          background: rgba(255, 180, 0, 0.14);
          color: #d69e00;
        }

        .pagination-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .pagination-label {
          font-size: 0.85rem;
          color: var(--text-gray);
        }

        .empty-state {
          text-align: center;
          color: var(--text-gray);
          padding: 2rem 0;
        }

        .footer-aplicar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        @media (max-width: 900px) {
          .inflacao-page { padding: 1rem; }
        }

        @media (max-width: 700px) {
          .tabela-clubes th:nth-child(4), .tabela-clubes td:nth-child(4) { display: none; }
        }
      `}</style>

      <div className="inflacao-page">
        <div className="inflacao-container">

          <button className="btn-voltar" onClick={() => navigate('/admin')}>
            <ArrowLeft size={16} />
            Voltar pro painel admin
          </button>

          {/* Resumo da simulação */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ marginBottom: 0 }}>
                <TrendingUp size={22} />
                Inflação de mercado
              </div>
              <button
                className="btn-secondary"
                onClick={handleSimular}
                disabled={loadingSimulacao || aplicando}
              >
                <RefreshCw size={15} className={loadingSimulacao ? 'animate-spin' : ''} />
                {loadingSimulacao ? 'Simulando...' : 'Simular'}
              </button>
            </div>
            <div className="card-subtitle">
              Quanto mais dinheiro em circulação (média + mediana do saldo dos jogadores), mais os clubes valem.
              Só metade desse crescimento é repassada pro preço, com teto de 15% por execução.
            </div>

            {loadingSimulacao ? (
              <div className="empty-state">
                <Loader2 className="animate-spin" size={26} />
                <p style={{ marginTop: '0.75rem' }}>Calculando...</p>
              </div>
            ) : erro ? (
              <div className="empty-state">
                <AlertCircle size={26} color="#e74c3c" />
                <p style={{ marginTop: '0.75rem' }}>{erro}</p>
              </div>
            ) : simulacao && (
              <>
                <div className={`status-banner ${haveraInflacao ? 'cresceu' : 'parado'}`}>
                  {haveraInflacao ? <ArrowUpRight size={20} /> : <Minus size={20} />}
                  {simulacao.motivo}
                </div>

                <div className="stats-row">
                  <div className="stat-box">
                    <div className="stat-value money">{formatCurrency(simulacao.mediaSaldoJogadores)}</div>
                    <div className="stat-label">Média de saldo</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value money">{formatCurrency(simulacao.medianaSaldoJogadores)}</div>
                    <div className="stat-label">Mediana de saldo</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{formatCurrency(simulacao.indicadorAtual)}</div>
                    <div className="stat-label">Indicador atual</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">
                      {simulacao.indicadorAnterior !== null ? formatCurrency(simulacao.indicadorAnterior) : '-'}
                    </div>
                    <div className="stat-label">Indicador anterior</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{formatPercent(simulacao.crescimentoPercentual)}</div>
                    <div className="stat-label">Crescimento</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value highlight">
                      {simulacao.multiplicadorAplicado !== null
                        ? formatPercent(simulacao.multiplicadorAplicado - 1)
                        : '-'}
                    </div>
                    <div className="stat-label">Inflação repassada</div>
                  </div>
                </div>

                <div className="footer-aplicar">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>
                    A tabela abaixo mostra o "antes e depois" de cada clube com esse multiplicador.
                  </span>
                  {!pedirConfirmacao ? (
                    <button
                      className="btn-primary"
                      onClick={() => setPedirConfirmacao(true)}
                      disabled={aplicando}
                    >
                      Aplicar inflação
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', color: '#d69e00', fontWeight: 600 }}>
                        Confirma? Essa ação não tem volta fácil.
                      </span>
                      <button className="btn-secondary" onClick={() => setPedirConfirmacao(false)} disabled={aplicando}>
                        Cancelar
                      </button>
                      <button className="btn-primary" style={{ background: '#e74c3c' }} onClick={handleAplicar} disabled={aplicando}>
                        {aplicando ? 'Aplicando...' : 'Sim, aplicar agora'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Antes e depois por clube */}
          <div className="card">
            <div className="card-title">
              Clubes — antes e depois
            </div>
            <div className="card-subtitle">
              Calculado localmente com o multiplicador da simulação (mesma regra do backend: piso de {formatCurrency(VALOR_PISO_CLUBE)}).
            </div>

            {loadingClubes && !clubes ? (
              <div className="empty-state">
                <Loader2 className="animate-spin" size={26} />
              </div>
            ) : !clubes || clubes.content.length === 0 ? (
              <div className="empty-state">Nenhum clube cadastrado.</div>
            ) : (
              <>
                <div style={{ overflowX: 'auto', opacity: loadingClubes ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                  <table className="tabela-clubes">
                    <thead>
                      <tr>
                        <th>Clube</th>
                        <th className="numero">Valor avaliado (antes)</th>
                        <th className="numero">Valor avaliado (depois)</th>
                        <th className="numero">Lance mínimo (depois)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clubes.content.map((clube) => {
                        const { valorAvaliadoDepois, lanceMinimoDepois, atingiuPiso } = calcularDepois(clube.valorAvaliado);
                        const subiu = valorAvaliadoDepois > clube.valorAvaliado;

                        return (
                          <tr key={clube.id}>
                            <td>
                              <div className="clube-info">
                                {clube.imagem && <img className="clube-avatar" src={clube.imagem} alt={clube.nome} />}
                                <div>
                                  <div className="clube-nome">{clube.nome}</div>
                                  <div className="clube-sigla">{clube.sigla}</div>
                                </div>
                              </div>
                            </td>
                            <td className="valor-antes">{formatCurrency(clube.valorAvaliado)}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                <span className={`valor-depois ${subiu ? 'subiu' : ''}`}>
                                  {formatCurrency(valorAvaliadoDepois)}
                                </span>
                                {atingiuPiso ? (
                                  <span className="diff-badge piso">Piso mínimo</span>
                                ) : subiu ? (
                                  <span className="diff-badge">
                                    <ArrowUpRight size={11} />
                                    {formatPercent((valorAvaliadoDepois - clube.valorAvaliado) / clube.valorAvaliado)}
                                  </span>
                                ) : (
                                  <span className="diff-badge zero">Sem mudança</span>
                                )}
                              </div>
                            </td>
                            <td className="valor-antes" style={{ textAlign: 'right' }}>
                              {formatCurrency(lanceMinimoDepois)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pagination-row">
                  <button
                    className="btn-secondary"
                    disabled={paginaAtual === 0 || loadingClubes}
                    onClick={() => setPaginaAtual((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </button>
                  <span className="pagination-label">
                    Página {clubes.number + 1} de {Math.max(1, clubes.totalPages)} · {clubes.totalElements} clubes
                  </span>
                  <button
                    className="btn-secondary"
                    disabled={clubes.last || loadingClubes}
                    onClick={() => setPaginaAtual((p) => p + 1)}
                  >
                    Próxima
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {popup && (
        <PopupGeral
          title={popup.title}
          message={popup.message}
          type={popup.type}
          buttonText="OK"
          onClose={() => setPopup(null)}
          onConfirm={() => setPopup(null)}
        />
      )}
    </DashboardLayout>
  );
}