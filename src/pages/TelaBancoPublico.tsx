import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../services/api';
import {
  Landmark,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldOff,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

// ---------- Tipos (espelhando os DTOs públicos do backend) ----------

type StatusEmprestimo = 'EM_ANDAMENTO' | 'QUITADO';

interface EmprestimoPublico {
  jogadorId: string;
  jogadorNome: string;
  jogadorDiscord: string;
  jogadorImagem: string | null;
  valorSolicitado: number;
  valorTotalComJuros: number;
  valorPago: number;
  valorRestante: number;
  quantidadeParcelas: number;
  parcelasPagas: number;
  status: StatusEmprestimo;
  dataContratacao: string;
}

interface PageResponse<T> {
  content: T[];
  number: number;
  totalPages: number;
  totalElements: number;
  size: number;
  last: boolean;
}

interface StatusNome {
  jogadorId: string;
  nome: string;
  discord: string;
  imagem: string | null;
  negativado: boolean;
  jaFoiNegativadoAlgumaVez: boolean;
  dataNegativacao: string | null;
  dataQuitacaoNegativacao: string | null;
}

const TAMANHO_PAGINA = 10;

// ---------- Componente ----------

export function TelaBancoPublico() {
  const navigate = useNavigate();
  const { currentUser } = useAppContext();

  const [pagina, setPagina] = useState<PageResponse<EmprestimoPublico> | null>(null);
  const [nomesSujos, setNomesSujos] = useState<StatusNome[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingPagina, setLoadingPagina] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarNomesSujos = useCallback(async () => {
    try {
      const res = await API.get('/api/emprestimos/nomes-sujos');
      setNomesSujos(res.data);
    } catch {
      setNomesSujos([]);
    }
  }, []);

  const carregarPagina = useCallback(async (page: number) => {
    setLoadingPagina(true);
    setErro(null);
    try {
      const res = await API.get('/api/emprestimos/publico', {
        params: { page, size: TAMANHO_PAGINA },
      });
      setPagina(res.data);
    } catch (e) {
      console.error('Erro ao carregar empréstimos públicos:', e);
      setErro('Não foi possível carregar a lista de empréstimos.');
    } finally {
      setLoadingPagina(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarNomesSujos();
  }, [carregarNomesSujos]);

  useEffect(() => {
    carregarPagina(paginaAtual);
  }, [paginaAtual, carregarPagina]);

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

  const irParaSituacao = (jogadorId: string) => navigate(`/banco/jogador/${jogadorId}`);

  return (
    <DashboardLayout esconderBusca contentStyle={{ padding: '1rem 0rem' }}>
      <style>{`
        .banco-page {
          padding: 2rem 3rem;
          display: flex;
          justify-content: center;
        }

        .banco-container {
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
          margin-bottom: 0.5rem;
        }

        .card-subtitle {
          font-size: 0.85rem;
          color: var(--text-gray);
          margin-bottom: 1.5rem;
        }

        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
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

        .btn-secondary:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .btn-secondary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .emprestimo-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding: 1rem 0;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
        }

        .emprestimo-item:last-child { border-bottom: none; }

        .emprestimo-item:hover .jogador-nome {
          color: var(--primary);
        }

        .jogador-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .jogador-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          background: var(--bg-main);
          border: 1px solid var(--border-color);
        }

        .jogador-textos {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .jogador-nome {
          font-weight: 600;
          color: var(--text-dark);
          transition: color 0.15s;
        }

        .jogador-discord {
          font-size: 0.78rem;
          color: var(--text-gray);
        }

        .emprestimo-valores {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .emprestimo-valor-total {
          font-weight: 700;
          color: var(--text-dark);
        }

        .emprestimo-progresso {
          font-size: 0.78rem;
          color: var(--text-gray);
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
        }

        .status-pill.quitado {
          background: rgba(0, 200, 100, 0.12);
          color: var(--success);
        }

        .status-pill.andamento {
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

        .nome-sujo-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
        }

        .nome-sujo-item:last-child { border-bottom: none; }

        .nome-sujo-item:hover .jogador-nome {
          color: #e74c3c;
        }

        .empty-state {
          text-align: center;
          color: var(--text-gray);
          padding: 2rem 0;
        }

        .banner-explicativo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 1rem 1.25rem;
          border-radius: var(--radius);
          font-size: 0.85rem;
          color: var(--text-gray);
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          margin-bottom: 1.5rem;
        }
      `}</style>

      <div className="banco-page">
        <div className="banco-container">

          {/* Cabeçalho + atalho pro empréstimo do próprio usuário */}
          <div className="card">
            <div className="header-row">
              <div>
                <div className="card-title">
                  <Landmark size={22} />
                  Banco — Transparência
                </div>
                <div className="card-subtitle" style={{ marginBottom: 0 }}>
                  Todo mundo pode ver quem pegou empréstimo, de quanto e quanto já foi pago.
                </div>
              </div>

              {currentUser && (
                <button className="btn-primary" onClick={() => navigate('/emprestimos')}>
                  <Wallet size={18} />
                  Meu empréstimo
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Nomes sujos */}
          <div className="card">
            <div className="card-title">
              <ShieldOff size={22} color="#e74c3c" />
              Nomes negativados agora
            </div>
            <div className="card-subtitle">
              Jogadores com o nome sujo por não terem conseguido pagar alguma parcela em dia.
            </div>

            {nomesSujos.length === 0 ? (
              <div className="empty-state">Ninguém está negativado no momento. 🎉</div>
            ) : (
              nomesSujos.map((j) => (
                <div className="nome-sujo-item" key={j.jogadorId} onClick={() => irParaSituacao(j.jogadorId)}>
                  <div className="jogador-info">
                    {j.imagem && <img className="jogador-avatar" src={j.imagem} alt={j.nome} />}
                    <div className="jogador-textos">
                      <span className="jogador-nome">{j.nome}</span>
                      <span className="jogador-discord">{j.discord}</span>
                    </div>
                  </div>
                  <span className="status-pill andamento">
                    <AlertCircle size={12} />
                    Negativado desde {formatDate(j.dataNegativacao)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Lista pública de empréstimos */}
          <div className="card">
            <div className="card-title">
              <Calendar size={22} />
              Empréstimos concedidos
            </div>
            <div className="card-subtitle">
              Clique em um jogador pra ver a situação financeira completa dele.
            </div>

            {loading ? (
              <div className="empty-state">
                <Loader2 className="animate-spin" size={26} />
                <p style={{ marginTop: '0.75rem' }}>Carregando...</p>
              </div>
            ) : erro ? (
              <div className="empty-state">
                <AlertCircle size={26} color="#e74c3c" />
                <p style={{ marginTop: '0.75rem' }}>{erro}</p>
              </div>
            ) : !pagina || pagina.content.length === 0 ? (
              <div className="empty-state">Nenhum empréstimo foi concedido ainda.</div>
            ) : (
              <>
                <div style={{ opacity: loadingPagina ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                  {pagina.content.map((emp) => (
                    <div
                      className="emprestimo-item"
                      key={`${emp.jogadorId}-${emp.dataContratacao}`}
                      onClick={() => irParaSituacao(emp.jogadorId)}
                    >
                      <div className="jogador-info">
                        {emp.jogadorImagem && (
                          <img className="jogador-avatar" src={emp.jogadorImagem} alt={emp.jogadorNome} />
                        )}
                        <div className="jogador-textos">
                          <span className="jogador-nome">{emp.jogadorNome}</span>
                          <span className="jogador-discord">
                            {emp.jogadorDiscord} · {formatDate(emp.dataContratacao)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="emprestimo-valores">
                          <span className="emprestimo-valor-total">{formatCurrency(emp.valorTotalComJuros)}</span>
                          <span className="emprestimo-progresso">
                            {emp.parcelasPagas}/{emp.quantidadeParcelas} pagas · falta {formatCurrency(emp.valorRestante)}
                          </span>
                        </div>

                        <span className={`status-pill ${emp.status === 'QUITADO' ? 'quitado' : 'andamento'}`}>
                          {emp.status === 'QUITADO' ? <CheckCircle2 size={12} /> : null}
                          {emp.status === 'QUITADO' ? 'Quitado' : 'Em andamento'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pagination-row">
                  <button
                    className="btn-secondary"
                    disabled={paginaAtual === 0 || loadingPagina}
                    onClick={() => setPaginaAtual((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </button>
                  <span className="pagination-label">
                    Página {pagina.number + 1} de {Math.max(1, pagina.totalPages)}
                  </span>
                  <button
                    className="btn-secondary"
                    disabled={pagina.last || loadingPagina}
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
    </DashboardLayout>
  );
}