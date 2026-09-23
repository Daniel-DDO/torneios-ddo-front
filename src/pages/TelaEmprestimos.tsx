import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../services/api';
import {
  Landmark,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import PopupGeral from '../components/PopupGeral';
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

interface SimulacaoEmprestimo {
  valorSolicitado: number;
  quantidadeParcelas: number;
  percentualJuros: number;
  valorTotalComJuros: number;
  valorParcela: number;
  totalJuros: number;
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

const OPCOES_PARCELAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// ---------- Componente ----------

export function TelaEmprestimos() {
  const navigate = useNavigate();
  const { currentUser, abrirLogin } = useAppContext();

  const [elegibilidade, setElegibilidade] = useState<ElegibilidadeEmprestimo | null>(null);
  const [emprestimoAtivo, setEmprestimoAtivo] = useState<Emprestimo | null>(null);
  const [historico, setHistorico] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [valorSimulacao, setValorSimulacao] = useState('');
  const [parcelasSimulacao, setParcelasSimulacao] = useState('4');
  const [simulacao, setSimulacao] = useState<SimulacaoEmprestimo | null>(null);
  const [simulando, setSimulando] = useState(false);

  const [solicitando, setSolicitando] = useState(false);
  const [pagandoParcelaId, setPagandoParcelaId] = useState<string | null>(null);
  const [forcandoRecebimento, setForcandoRecebimento] = useState(false);

  const [popup, setPopup] = useState<{ title: string; message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const isProprietario = currentUser?.cargo === 'PROPRIETARIO';

  const carregarDados = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setErro(null);
    try {
      const [elegRes, historicoRes] = await Promise.all([
        API.get(`/api/emprestimos/${currentUser.id}/elegibilidade`),
        API.get(`/api/emprestimos/${currentUser.id}/historico`),
      ]);
      setElegibilidade(elegRes.data);
      setHistorico(historicoRes.data);

      try {
        const ativoRes = await API.get(`/api/emprestimos/${currentUser.id}/ativo`);
        setEmprestimoAtivo(ativoRes.data);
      } catch {
        setEmprestimoAtivo(null);
      }
    } catch (e) {
      setErro('Não foi possível carregar seus dados de empréstimo.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

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

  const handleSimular = async () => {
    const valor = Number(valorSimulacao);
    const parcelas = Number(parcelasSimulacao);
    if (!valor || valor <= 0 || !parcelas || parcelas <= 0) return;

    setSimulando(true);
    setSimulacao(null);
    try {
      const res = await API.get('/api/emprestimos/simular', {
        params: { valor, parcelas },
      });
      setSimulacao(res.data);
    } catch (e: any) {
      setPopup({
        title: 'Erro na simulação',
        message: e?.response?.data?.message || e?.response?.data || 'Não foi possível simular o empréstimo.',
        type: 'error',
      });
    } finally {
      setSimulando(false);
    }
  };

  const handleSolicitar = async () => {
    if (!currentUser || !simulacao) return;
    setSolicitando(true);
    try {
      await API.post('/api/emprestimos', {
        jogadorId: currentUser.id,
        valorSolicitado: simulacao.valorSolicitado,
        quantidadeParcelas: simulacao.quantidadeParcelas,
      });
      setPopup({
        title: 'Empréstimo solicitado!',
        message: 'Seu empréstimo foi aprovado e o valor já está disponível no seu saldo.',
        type: 'success',
      });
      setSimulacao(null);
      setValorSimulacao('');
      await carregarDados();
    } catch (e: any) {
      setPopup({
        title: 'Não foi possível solicitar',
        message: e?.response?.data?.message || e?.response?.data || 'Erro ao solicitar o empréstimo.',
        type: 'error',
      });
    } finally {
      setSolicitando(false);
    }
  };

  const handlePagarAntecipado = async (parcelaId: string) => {
    setPagandoParcelaId(parcelaId);
    try {
      await API.post(`/api/emprestimos/parcelas/${parcelaId}/pagar-antecipado`);
      setPopup({
        title: 'Parcela paga!',
        message: 'A parcela foi quitada antecipadamente com sucesso.',
        type: 'success',
      });
      await carregarDados();
    } catch (e: any) {
      setPopup({
        title: 'Erro ao pagar',
        message: e?.response?.data?.message || e?.response?.data || 'Não foi possível pagar essa parcela.',
        type: 'error',
      });
    } finally {
      setPagandoParcelaId(null);
    }
  };

  const handleForcarRecebimento = async () => {
    if (!currentUser) return;
    setForcandoRecebimento(true);
    try {
      const res = await API.post('/api/emprestimos/admin/forcar-recebimento', null, {
        params: { idAdmin: currentUser.id },
      });
      setPopup({
        title: 'Recebimento forçado',
        message: typeof res.data === 'string' ? res.data : 'Parcelas do dia processadas.',
        type: 'success',
      });
      await carregarDados();
    } catch (e: any) {
      setPopup({
        title: 'Erro ao forçar recebimento',
        message: e?.response?.data?.message || e?.response?.data || 'Não foi possível processar as parcelas de hoje.',
        type: 'error',
      });
    } finally {
      setForcandoRecebimento(false);
    }
  };

  if (!currentUser) {
    return (
      <>
        <DashboardLayout esconderBusca>
          <div />
        </DashboardLayout>
        <PopupGeral
          title="Login Necessário"
          message="Faça login para visualizar seus empréstimos."
          type="warning"
          buttonText="Fazer Login"
          onClose={() => navigate('/')}
          onConfirm={() => {
            navigate('/');
            abrirLogin();
          }}
        />
      </>
    );
  }

  return (
    <DashboardLayout esconderBusca contentStyle={{ padding: '1rem 0rem' }}>
      <style>{`
        .emprestimos-page {
          padding: 2rem 3rem;
          display: flex;
          justify-content: center;
        }

        .emprestimos-container {
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

        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .card-subtitle {
          font-size: 0.85rem;
          color: var(--text-gray);
          margin: -1rem 0 1.5rem;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .stat-value.money { color: var(--success); }

        .stat-label {
          font-size: 0.8rem;
          color: var(--text-gray);
          text-transform: uppercase;
          letter-spacing: 0.5px;
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

        .status-banner.elegivel {
          background: rgba(0, 200, 100, 0.1);
          color: var(--success);
        }

        .status-banner.inelegivel {
          background: rgba(255, 80, 80, 0.1);
          color: #e74c3c;
        }

        .negativado-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 1rem 1.25rem;
          border-radius: var(--radius);
          font-weight: 600;
          margin-bottom: 1.5rem;
          background: rgba(255, 150, 0, 0.1);
          color: #e67e22;
        }

        .form-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .form-group {
          flex: 1;
          min-width: 160px;
        }

        .form-group label {
          display: block;
          font-size: 0.85rem;
          color: var(--text-gray);
          margin-bottom: 6px;
        }

        .form-group input, .form-group select {
          width: 100%;
          padding: 10px 12px;
          border-radius: var(--radius);
          border: 1px solid var(--border-color);
          background: var(--bg-main);
          color: var(--text-dark);
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
          transition: opacity 0.2s;
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

        .btn-secondary:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

        .historico-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 1rem 0;
          border-bottom: 1px solid var(--border-color);
        }

        .historico-item:last-child { border-bottom: none; }

        .admin-card {
          border: 1px solid rgba(255, 80, 80, 0.3);
          background: rgba(255, 80, 80, 0.05);
        }

        .empty-state {
          text-align: center;
          color: var(--text-gray);
          padding: 2rem 0;
        }
      `}</style>

      <div className="emprestimos-page">
        <div className="emprestimos-container">

          <div className="header-row">
            <div className="card-title" style={{ marginBottom: 0 }}>
              <Landmark size={22} />
              Meu Empréstimo
            </div>
            <button className="btn-secondary" onClick={() => navigate('/banco')}>
              Ver banco público
              <ArrowRight size={14} />
            </button>
          </div>

          {loading && (
            <div className="card empty-state">
              <Loader2 className="animate-spin" size={28} />
              <p style={{ marginTop: '0.75rem' }}>Carregando seus dados de empréstimo...</p>
            </div>
          )}

          {!loading && erro && (
            <div className="card empty-state">
              <AlertCircle size={28} color="#e74c3c" />
              <p style={{ marginTop: '0.75rem' }}>{erro}</p>
            </div>
          )}

          {!loading && !erro && (
            <>
              {/* Empréstimo ativo */}
              {emprestimoAtivo ? (
                <div className="card">
                  <div className="card-title">
                    <Landmark size={22} />
                    Empréstimo ativo
                  </div>
                  <div className="card-subtitle">
                    {emprestimoAtivo.parcelasPagas}/{emprestimoAtivo.quantidadeParcelas} parcelas pagas · juros de {emprestimoAtivo.percentualJuros}%
                  </div>

                  <div className="stats-row">
                    <div className="stat-box">
                      <div className="stat-value money">{formatCurrency(emprestimoAtivo.valorSolicitado)}</div>
                      <div className="stat-label">Valor solicitado</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-value">{formatCurrency(emprestimoAtivo.valorTotalComJuros)}</div>
                      <div className="stat-label">Total com juros</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-value">{formatCurrency(emprestimoAtivo.valorParcela)}</div>
                      <div className="stat-label">Valor de cada parcela</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    {emprestimoAtivo.parcelas
                      ?.slice()
                      .sort((a, b) => a.numeroParcela - b.numeroParcela)
                      .map((parcela) => (
                        <div className="parcela-row" key={parcela.id}>
                          <div className="parcela-info">
                            <span className="parcela-numero">
                              Parcela {parcela.numeroParcela}/{emprestimoAtivo.quantidadeParcelas}
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
                              <>
                                <span className="parcela-status pendente">Pendente</span>
                                <button
                                  className="btn-secondary"
                                  disabled={pagandoParcelaId === parcela.id}
                                  onClick={() => handlePagarAntecipado(parcela.id)}
                                >
                                  {pagandoParcelaId === parcela.id ? 'Pagando...' : 'Pagar antecipado'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Elegibilidade + simulação, só aparece se não tem empréstimo ativo */}
                  {elegibilidade && (
                    <div className="card">
                      <div className="card-title">
                        <TrendingUp size={22} />
                        Solicitar empréstimo
                      </div>

                      <div className={`status-banner ${elegibilidade.elegivel ? 'elegivel' : 'inelegivel'}`}>
                        {elegibilidade.elegivel ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        {elegibilidade.motivo}
                      </div>

                      <div className="stats-row">
                        <div className="stat-box">
                          <div className="stat-value money">
                            {elegibilidade.elegivel ? formatCurrency(elegibilidade.limiteMaximo) : '-'}
                          </div>
                          <div className="stat-label">Limite máximo</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{formatCurrency(elegibilidade.saldoAtual)}</div>
                          <div className="stat-label">Seu saldo atual</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{elegibilidade.partidasJogadas}</div>
                          <div className="stat-label">Partidas jogadas</div>
                        </div>
                      </div>

                      {elegibilidade.elegivel && (
                        <>
                          <div className="form-row" style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                              <label>Valor desejado</label>
                              <input
                                type="number"
                                min={0}
                                max={elegibilidade.limiteMaximo}
                                value={valorSimulacao}
                                onChange={(e) => setValorSimulacao(e.target.value)}
                                placeholder="Ex: 500000"
                              />
                            </div>
                            <div className="form-group">
                              <label>Parcelas</label>
                              <select
                                value={parcelasSimulacao}
                                onChange={(e) => setParcelasSimulacao(e.target.value)}
                              >
                                {OPCOES_PARCELAS.map((n) => (
                                  <option key={n} value={n}>{n}x</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <button
                            className="btn-primary"
                            onClick={handleSimular}
                            disabled={simulando || !valorSimulacao}
                          >
                            {simulando ? 'Simulando...' : 'Simular'}
                          </button>

                          {simulacao && (
                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                              <div className="stats-row">
                                <div className="stat-box">
                                  <div className="stat-value">{simulacao.percentualJuros}%</div>
                                  <div className="stat-label">Juros</div>
                                </div>
                                <div className="stat-box">
                                  <div className="stat-value">{formatCurrency(simulacao.valorParcela)}</div>
                                  <div className="stat-label">Valor da parcela</div>
                                </div>
                                <div className="stat-box">
                                  <div className="stat-value">{formatCurrency(simulacao.totalJuros)}</div>
                                  <div className="stat-label">Total de juros</div>
                                </div>
                                <div className="stat-box">
                                  <div className="stat-value money">{formatCurrency(simulacao.valorTotalComJuros)}</div>
                                  <div className="stat-label">Total a pagar</div>
                                </div>
                              </div>

                              <button
                                className="btn-primary"
                                style={{ marginTop: '1rem', width: '100%' }}
                                onClick={handleSolicitar}
                                disabled={solicitando}
                              >
                                {solicitando ? 'Solicitando...' : `Confirmar empréstimo de ${formatCurrency(simulacao.valorSolicitado)}`}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Histórico */}
              <div className="card">
                <div className="card-title">
                  <Calendar size={22} />
                  Histórico de empréstimos
                </div>

                {historico.length === 0 ? (
                  <div className="empty-state">Nenhum empréstimo anterior encontrado.</div>
                ) : (
                  historico.map((emp) => (
                    <div className="historico-item" key={emp.id}>
                      <div className="parcela-info">
                        <span className="parcela-numero">{formatCurrency(emp.valorSolicitado)} em {emp.quantidadeParcelas}x</span>
                        <span className="parcela-data">
                          <Calendar size={12} /> Solicitado em {formatDate(emp.dataContratacao)}
                        </span>
                      </div>
                      <span className={`parcela-status ${emp.status === 'QUITADO' ? 'paga' : 'pendente'}`}>
                        {emp.status === 'QUITADO' ? <CheckCircle2 size={16} /> : null}
                        {emp.status === 'QUITADO' ? 'Quitado' : 'Em andamento'}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Admin: forçar recebimento */}
              {isProprietario && (
                <div className="card admin-card">
                  <div className="card-title">
                    <ShieldAlert size={22} color="#e74c3c" />
                    Área do Proprietário
                  </div>
                  <p style={{ color: 'var(--text-gray)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Cobra na força as parcelas com vencimento hoje, caso o job agendado não tenha rodado.
                    Não antecipa nem atrasa nada.
                  </p>
                  <button
                    className="btn-primary"
                    style={{ background: '#e74c3c' }}
                    onClick={handleForcarRecebimento}
                    disabled={forcandoRecebimento}
                  >
                    {forcandoRecebimento ? 'Processando...' : 'Forçar recebimento do dia'}
                  </button>
                </div>
              )}
            </>
          )}
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