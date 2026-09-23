import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../services/api';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Landmark,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Wallet,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

// ---------- Tipos (espelhando os DTOs reais do backend) ----------

interface ElegibilidadeEmprestimo {
  elegivel: boolean;
  motivo: string;
  limiteMaximo: number;
  saldoMinimoExigido: number | null;
  saldoAtual: number;
  partidasJogadas: number;
}

interface Parcela {
  id: string;
  emprestimoId: string;
  numeroParcela: number;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  paga: boolean;
  pagaComSaldoNegativo: boolean;
}

type StatusEmprestimo = 'EM_ANDAMENTO' | 'QUITADO';

interface Emprestimo {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  valorSolicitado: number;
  percentualJuros: number;
  valorTotalComJuros: number;
  valorParcela: number;
  quantidadeParcelas: number;
  parcelasPagas: number;
  status: StatusEmprestimo;
  dataContratacao: string;
  dataQuitacao: string | null;
  parcelas: Parcela[];
}

interface SituacaoJogador {
  jogadorId: string;
  nome: string;
  discord: string;
  imagem: string | null;
  negativado: boolean;
  jaFoiNegativadoAlgumaVez: boolean;
  dataNegativacao: string | null;
  dataQuitacaoNegativacao: string | null;
  elegibilidade: ElegibilidadeEmprestimo;
  emprestimoAtivo: Emprestimo | null;
}

// ---------- Componente ----------

export function TelaSituacaoJogador() {
  const { jogadorId } = useParams<{ jogadorId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAppContext();

  const [situacao, setSituacao] = useState<SituacaoJogador | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!jogadorId) return;
    setLoading(true);
    setErro(null);
    try {
      const res = await API.get(`/api/emprestimos/${jogadorId}/situacao`);
      setSituacao(res.data);
    } catch (e) {
      console.error('Erro ao carregar situação do jogador:', e);
      setErro('Não foi possível carregar a situação desse jogador.');
    } finally {
      setLoading(false);
    }
  }, [jogadorId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const formatCurrency = (value: number | null | undefined) => {
    const val = value ?? 0;
    return 'D$ ' + val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const ehVocePessoalmente = currentUser?.id === jogadorId;

  return (
    <DashboardLayout esconderBusca contentStyle={{ padding: '1rem 0rem' }}>
      <style>{`
        .situacao-page {
          padding: 2rem 3rem;
          display: flex;
          justify-content: center;
        }

        .situacao-container {
          width: 100%;
          max-width: 900px;
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

        .card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-dark);
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
        }

        .btn-voltar:hover { color: var(--text-dark); }

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

        .perfil-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .perfil-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          background: var(--bg-main);
          border: 1px solid var(--border-color);
        }

        .perfil-nome {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .perfil-discord {
          font-size: 0.85rem;
          color: var(--text-gray);
        }

        .status-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 1rem 1.25rem;
          border-radius: var(--radius);
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .status-banner.limpo {
          background: rgba(0, 200, 100, 0.1);
          color: var(--success);
        }

        .status-banner.sujo {
          background: rgba(255, 80, 80, 0.1);
          color: #e74c3c;
        }

        .status-banner.elegivel {
          background: rgba(0, 200, 100, 0.1);
          color: var(--success);
        }

        .status-banner.inelegivel {
          background: rgba(255, 150, 0, 0.1);
          color: #d69e00;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
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

        .stat-label {
          font-size: 0.78rem;
          color: var(--text-gray);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .parcela-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.9rem 0;
          border-bottom: 1px solid var(--border-color);
        }

        .parcela-row:last-child { border-bottom: none; }

        .parcela-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .parcela-numero {
          font-weight: 600;
          color: var(--text-dark);
        }

        .parcela-data {
          font-size: 0.8rem;
          color: var(--text-gray);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .parcela-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .parcela-status.paga { color: var(--success); }
        .parcela-status.paga-negativado { color: #e67e22; }
        .parcela-status.pendente { color: var(--text-gray); }

        .empty-state {
          text-align: center;
          color: var(--text-gray);
          padding: 2rem 0;
        }
      `}</style>

      <div className="situacao-page">
        <div className="situacao-container">

          <button className="btn-voltar" onClick={() => navigate('/banco')}>
            <ArrowLeft size={16} />
            Voltar pro banco
          </button>

          {loading && (
            <div className="card empty-state">
              <Loader2 className="animate-spin" size={28} />
              <p style={{ marginTop: '0.75rem' }}>Carregando situação do jogador...</p>
            </div>
          )}

          {!loading && erro && (
            <div className="card empty-state">
              <AlertTriangle size={28} color="#e74c3c" />
              <p style={{ marginTop: '0.75rem' }}>{erro}</p>
            </div>
          )}

          {!loading && !erro && situacao && (
            <>
              {/* Cabeçalho do jogador + status de nome */}
              <div className="card">
                <div className="perfil-header">
                  {situacao.imagem && (
                    <img className="perfil-avatar" src={situacao.imagem} alt={situacao.nome} />
                  )}
                  <div>
                    <div className="perfil-nome">{situacao.nome}</div>
                    <div className="perfil-discord">{situacao.discord}</div>
                  </div>

                  {ehVocePessoalmente && (
                    <button
                      className="btn-primary"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => navigate('/emprestimos')}
                    >
                      <Wallet size={18} />
                      Ir para meu empréstimo
                    </button>
                  )}
                </div>

                <div className={`status-banner ${situacao.negativado ? 'sujo' : 'limpo'}`}>
                  {situacao.negativado ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                  {situacao.negativado
                    ? `Nome sujo desde ${formatDate(situacao.dataNegativacao)}`
                    : 'Nome limpo'}
                </div>

                {!situacao.negativado && situacao.jaFoiNegativadoAlgumaVez && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                    Já ficou negativado antes — saiu dessa situação em {formatDate(situacao.dataQuitacaoNegativacao)}.
                  </p>
                )}
              </div>

              {/* Elegibilidade atual */}
              <div className="card">
                <div className="card-title">
                  <ShieldCheck size={22} />
                  Elegibilidade para empréstimo
                </div>

                <div className={`status-banner ${situacao.elegibilidade.elegivel ? 'elegivel' : 'inelegivel'}`}>
                  {situacao.elegibilidade.elegivel ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                  {situacao.elegibilidade.motivo}
                </div>

                <div className="stats-row">
                  <div className="stat-box">
                    <div className="stat-value money">
                      {situacao.elegibilidade.elegivel ? formatCurrency(situacao.elegibilidade.limiteMaximo) : '-'}
                    </div>
                    <div className="stat-label">Limite máximo</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{formatCurrency(situacao.elegibilidade.saldoAtual)}</div>
                    <div className="stat-label">Saldo atual</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{situacao.elegibilidade.partidasJogadas}</div>
                    <div className="stat-label">Partidas jogadas</div>
                  </div>
                </div>
              </div>

              {/* Empréstimo ativo, se tiver */}
              <div className="card">
                <div className="card-title">
                  <Landmark size={22} />
                  Empréstimo em andamento
                </div>

                {!situacao.emprestimoAtivo ? (
                  <div className="empty-state">Esse jogador não tem empréstimo em andamento no momento.</div>
                ) : (
                  <>
                    <div className="stats-row">
                      <div className="stat-box">
                        <div className="stat-value money">{formatCurrency(situacao.emprestimoAtivo.valorSolicitado)}</div>
                        <div className="stat-label">Valor solicitado</div>
                      </div>
                      <div className="stat-box">
                        <div className="stat-value">{formatCurrency(situacao.emprestimoAtivo.valorTotalComJuros)}</div>
                        <div className="stat-label">Total com juros</div>
                      </div>
                      <div className="stat-box">
                        <div className="stat-value">
                          {situacao.emprestimoAtivo.parcelasPagas}/{situacao.emprestimoAtivo.quantidadeParcelas}
                        </div>
                        <div className="stat-label">Parcelas pagas</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      {situacao.emprestimoAtivo.parcelas
                        ?.slice()
                        .sort((a, b) => a.numeroParcela - b.numeroParcela)
                        .map((parcela) => (
                          <div className="parcela-row" key={parcela.id}>
                            <div className="parcela-info">
                              <span className="parcela-numero">
                                Parcela {parcela.numeroParcela}/{situacao.emprestimoAtivo!.quantidadeParcelas}
                              </span>
                              <span className="parcela-data">
                                <Calendar size={12} />
                                {parcela.paga
                                  ? `Paga em ${formatDate(parcela.dataPagamento)}`
                                  : `Vencimento: ${formatDate(parcela.dataVencimento)}`}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <span style={{ fontWeight: 600 }}>{formatCurrency(parcela.valor)}</span>
                              {parcela.paga ? (
                                <span className={`parcela-status ${parcela.pagaComSaldoNegativo ? 'paga-negativado' : 'paga'}`}>
                                  {parcela.pagaComSaldoNegativo ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                                  {parcela.pagaComSaldoNegativo ? 'Paga (saldo negativo)' : 'Paga'}
                                </span>
                              ) : (
                                <span className="parcela-status pendente">Pendente</span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}