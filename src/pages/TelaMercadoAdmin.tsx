import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  Percent,
  Building2,
  Clock,
  ShieldAlert,
  Sparkles,
  Lock
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupGeral from '../components/PopupGeral';
import PopupMultiplicarMercado from '../components/PopupMultiplicarMercado';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface MercadoStatusDTO {
  ultimaExecucao: string | null;
  ultimaExecucaoComSucesso: string | null;
  ultimaVariacaoUsdAplicada: number | null;
  ultimaCotacaoUsd: number | null;
  clubesAtualizadosUltimaExecucao: number | null;
  ultimaExecucaoComErro: boolean;
  ultimoErro: string | null;
  ultimaExecucaoIpca: string | null;
  ultimaVariacaoIpcaAplicada: number | null;
}

const fetchStatusMercado = async (): Promise<MercadoStatusDTO> => {
  const response = await API.get('/clube/mercado/status');
  return response.data;
};

export function TelaMercadoAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAppContext();

  const [showMultiplicarTodosPopup, setShowMultiplicarTodosPopup] = useState(false);
  const [showMultiplicarClubePopup, setShowMultiplicarClubePopup] = useState(false);

  const [popupInfo, setPopupInfo] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ show: false, title: '', message: '', type: 'info' });

  const temAcesso = !!currentUser && ['DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo);
  const ehProprietario = currentUser?.cargo === 'PROPRIETARIO';

  const { data: status, isLoading, isError, refetch, isFetching } = useQuery<MercadoStatusDTO>({
    queryKey: ['mercado-status'],
    queryFn: fetchStatusMercado,
    enabled: temAcesso,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false
  });

  const forcarAtualizacaoMutation = useMutation({
    mutationFn: async () => {
      const response = await API.post('/clube/mercado/forcar-atualizacao');
      return response.data as MercadoStatusDTO;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['mercado-status'], data);
      setPopupInfo({
        show: true,
        title: 'Mercado atualizado',
        message: data.ultimaExecucaoComErro
          ? 'A atualização rodou, mas terminou com erro. Confira os detalhes no card de status.'
          : 'A cotação foi consultada e os valores dos clubes foram reajustados com sucesso.',
        type: data.ultimaExecucaoComErro ? 'warning' : 'success'
      });
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      setPopupInfo({
        show: true,
        title: 'Erro',
        message: status === 403
          ? 'Apenas o Proprietário pode forçar a atualização do mercado.'
          : 'Não foi possível forçar a atualização do mercado agora.',
        type: 'error'
      });
    }
  });

  const formatPercent = (val: number | null) => {
    if (val === null || val === undefined) return '—';
    const sinal = val > 0 ? '+' : '';
    return `${sinal}${val.toFixed(2).replace('.', ',')}%`;
  };

  const formatDateTime = (val: string | null) => {
    if (!val) return 'Nunca executado';
    return new Date(val).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const tendenciaUsd = status?.ultimaVariacaoUsdAplicada
    ? (status.ultimaVariacaoUsdAplicada > 0 ? 'alta' : status.ultimaVariacaoUsdAplicada < 0 ? 'baixa' : 'estavel')
    : 'estavel';

  const handleMultiplicarSucesso = (mensagem: string) => {
    setShowMultiplicarTodosPopup(false);
    setShowMultiplicarClubePopup(false);
    refetch();
    setPopupInfo({
      show: true,
      title: 'Sucesso',
      message: mensagem,
      type: 'success'
    });
  };

  return (
    <DashboardLayout esconderBusca>
      <style>{`
        .mercado-header-card {
          background: linear-gradient(135deg, var(--bg-card) 0%, var(--hover-bg) 100%);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 28px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .mercado-header-title {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .mercado-icon-badge {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 8px 16px rgba(16, 185, 129, 0.25);
        }

        .mercado-header-title h1 {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-dark);
          margin: 0;
        }

        .mercado-header-title p {
          font-size: 0.9rem;
          color: var(--text-gray);
          margin: 2px 0 0 0;
        }

        .btn-refresh-status {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-body);
          border: 1px solid var(--border-color);
          color: var(--text-dark);
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-refresh-status:hover { border-color: var(--primary); color: var(--primary); }
        .btn-refresh-status .spin { animation: spin 0.8s linear infinite; }

        .mercado-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .mercado-stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 22px;
        }

        .mercado-stat-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-gray);
          margin-bottom: 12px;
        }

        .mercado-stat-value {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-dark);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mercado-stat-sub {
          font-size: 0.8rem;
          color: var(--text-gray);
          margin-top: 6px;
        }

        .trend-up { color: #10b981; }
        .trend-down { color: #ef4444; }
        .trend-flat { color: var(--text-gray); }

        .mercado-error-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #b91c1c;
          padding: 16px 20px;
          border-radius: 14px;
          margin-bottom: 24px;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .mercado-actions-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 24px;
        }

        .mercado-actions-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-dark);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 14px;
          margin-bottom: 20px;
        }

        .mercado-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }

        .mercado-action-btn {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: flex-start;
          text-align: left;
          background: var(--bg-body);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 18px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mercado-action-btn:hover:not(:disabled) {
          border-color: var(--primary);
          transform: translateY(-3px);
          box-shadow: var(--shadow-sm);
        }

        .mercado-action-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .mercado-action-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .mercado-action-title {
          font-weight: 700;
          color: var(--text-dark);
          font-size: 0.95rem;
        }

        .mercado-action-desc {
          font-size: 0.8rem;
          color: var(--text-gray);
          line-height: 1.4;
        }

        .mercado-action-lock {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          padding: 3px 10px;
          border-radius: 20px;
          margin-top: 2px;
        }

        .access-denied-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
          color: var(--text-gray);
        }
        .access-denied-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--hover-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: #ef4444;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .mercado-header-card { padding: 20px; }
        }
      `}</style>

        <div>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none',
              color: 'var(--text-gray)', marginBottom: 20, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600
            }}
          >
            <ArrowLeft size={18} /> Voltar
          </button>

          {!temAcesso ? (
            <div className="access-denied-wrapper">
              <div className="access-denied-icon"><Lock size={32} /></div>
              <h3 style={{ color: 'var(--text-dark)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>
                Acesso restrito
              </h3>
              <p style={{ maxWidth: 380 }}>
                Esta área é exclusiva para membros com cargo de Diretor ou Proprietário.
              </p>
            </div>
          ) : (
            <>
              <div className="mercado-header-card">
                <div className="mercado-header-title">
                  <div className="mercado-icon-badge"><DollarSign size={26} /></div>
                  <div>
                    <h1>Mercado Financeiro</h1>
                    <p>Cotação do dólar, IPCA e reajuste do valor de mercado dos clubes</p>
                  </div>
                </div>

                <button className="btn-refresh-status" onClick={() => refetch()} disabled={isFetching}>
                  <RefreshCw size={16} className={isFetching ? 'spin' : ''} />
                  Atualizar status
                </button>
              </div>

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-gray)' }}>Carregando status do mercado...</div>
              ) : isError || !status ? (
                <div className="mercado-error-banner">
                  <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                  <span>Não foi possível carregar o status do mercado no momento.</span>
                </div>
              ) : (
                <>
                  {status.ultimaExecucaoComErro && (
                    <div className="mercado-error-banner">
                      <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>
                        <strong>A última execução automática falhou.</strong>
                        {status.ultimoErro && <> Detalhe: {status.ultimoErro}</>}
                      </span>
                    </div>
                  )}

                  <div className="mercado-grid">
                    <div className="mercado-stat-card">
                      <div className="mercado-stat-label"><DollarSign size={14} /> Cotação USD atual</div>
                      <div className="mercado-stat-value">
                        {status.ultimaCotacaoUsd !== null ? `R$ ${status.ultimaCotacaoUsd.toFixed(4).replace('.', ',')}` : '—'}
                      </div>
                      <div className="mercado-stat-sub">Usada no último reajuste cambial</div>
                    </div>

                    <div className="mercado-stat-card">
                      <div className="mercado-stat-label"><Percent size={14} /> Variação cambial aplicada</div>
                      <div className={`mercado-stat-value ${tendenciaUsd === 'alta' ? 'trend-up' : tendenciaUsd === 'baixa' ? 'trend-down' : 'trend-flat'}`}>
                        {tendenciaUsd === 'alta' ? <TrendingUp size={22} /> : tendenciaUsd === 'baixa' ? <TrendingDown size={22} /> : <Minus size={22} />}
                        {formatPercent(status.ultimaVariacaoUsdAplicada)}
                      </div>
                      <div className="mercado-stat-sub">Reflete a última variação do dólar aplicada aos clubes</div>
                    </div>

                    <div className="mercado-stat-card">
                      <div className="mercado-stat-label"><Building2 size={14} /> Clubes atualizados</div>
                      <div className="mercado-stat-value">{status.clubesAtualizadosUltimaExecucao ?? '—'}</div>
                      <div className="mercado-stat-sub">Na última execução do job de câmbio</div>
                    </div>

                    <div className="mercado-stat-card">
                      <div className="mercado-stat-label"><Clock size={14} /> Última execução (câmbio)</div>
                      <div className="mercado-stat-value" style={{ fontSize: '1.05rem' }}>
                        {formatDateTime(status.ultimaExecucao)}
                      </div>
                      <div className="mercado-stat-sub">
                        {status.ultimaExecucaoComSucesso
                          ? `Sucesso em ${formatDateTime(status.ultimaExecucaoComSucesso)}`
                          : 'Ainda sem execução bem-sucedida'}
                      </div>
                    </div>

                    <div className="mercado-stat-card">
                      <div className="mercado-stat-label"><Sparkles size={14} /> IPCA — última aplicação</div>
                      <div className="mercado-stat-value" style={{ fontSize: '1.05rem' }}>
                        {formatDateTime(status.ultimaExecucaoIpca)}
                      </div>
                      <div className="mercado-stat-sub">
                        Variação aplicada: {formatPercent(status.ultimaVariacaoIpcaAplicada)}
                      </div>
                    </div>
                  </div>

                  <div className="mercado-actions-card">
                    <div className="mercado-actions-header">
                      <ShieldAlert size={20} style={{ color: 'var(--primary)' }} />
                      Ações administrativas
                    </div>

                    <div className="mercado-actions-grid">
                      <button
                        className="mercado-action-btn"
                        onClick={() => forcarAtualizacaoMutation.mutate()}
                        disabled={forcarAtualizacaoMutation.isPending}
                      >
                        <div className="mercado-action-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                          <RefreshCw size={20} className={forcarAtualizacaoMutation.isPending ? 'spin' : ''} />
                        </div>
                        <span className="mercado-action-title">
                          {forcarAtualizacaoMutation.isPending ? 'Atualizando...' : 'Forçar Atualização Agora'}
                        </span>
                        <span className="mercado-action-desc">
                          Dispara manualmente a consulta da cotação do dólar e reajusta os valores de todos os clubes, sem esperar a meia-noite.
                        </span>
                        {!ehProprietario && (
                          <span className="mercado-action-lock"><Lock size={11} /> Apenas Proprietário</span>
                        )}
                      </button>

                      <button
                        className="mercado-action-btn"
                        onClick={() => setShowMultiplicarTodosPopup(true)}
                      >
                        <div className="mercado-action-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                          <TrendingUp size={20} />
                        </div>
                        <span className="mercado-action-title">Multiplicar Valores de Todos</span>
                        <span className="mercado-action-desc">
                          Aplica um multiplicador manual sobre o valor de mercado de todos os clubes cadastrados de uma vez.
                        </span>
                        {!ehProprietario && (
                          <span className="mercado-action-lock"><Lock size={11} /> Apenas Proprietário</span>
                        )}
                      </button>

                      <button
                        className="mercado-action-btn"
                        onClick={() => setShowMultiplicarClubePopup(true)}
                      >
                        <div className="mercado-action-icon" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
                          <Building2 size={20} />
                        </div>
                        <span className="mercado-action-title">Multiplicar Valor de um Clube</span>
                        <span className="mercado-action-desc">
                          Busque um clube específico e aplique um multiplicador manual apenas sobre o valor de mercado dele.
                        </span>
                        {!ehProprietario && (
                          <span className="mercado-action-lock"><Lock size={11} /> Apenas Proprietário</span>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

      {popupInfo.show && (
        <PopupGeral
          title={popupInfo.title}
          message={popupInfo.message}
          type={popupInfo.type}
          onClose={() => setPopupInfo({ ...popupInfo, show: false })}
        />
      )}

      {showMultiplicarTodosPopup && (
        <PopupMultiplicarMercado
          modo="todos"
          onClose={() => setShowMultiplicarTodosPopup(false)}
          onSuccess={handleMultiplicarSucesso}
        />
      )}

      {showMultiplicarClubePopup && (
        <PopupMultiplicarMercado
          modo="clube"
          onClose={() => setShowMultiplicarClubePopup(false)}
          onSuccess={handleMultiplicarSucesso}
        />
      )}
    </DashboardLayout>
  );
}