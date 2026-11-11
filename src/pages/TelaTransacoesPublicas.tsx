import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, Landmark, AlertCircle } from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Espelha TransacaoPublicaDTO do back (tipo = enum TipoTransacao serializado como string)
interface TransacaoPublica {
  id: number;
  jogadorId: string;
  jogadorNome: string;
  tipo: string;
  valor: number;
  motivo: string | null;
  dataHora: string;
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  first: boolean;
  last: boolean;
}

const PAGE_SIZE = 20;

const fetchTransacoes = async (page: number): Promise<PageResponse<TransacaoPublica>> => {
  const response = await API.get('/transactions', { params: { page, size: PAGE_SIZE } });
  return response.data;
};

const formatMoeda = (valor?: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor ?? 0);

const formatDataHora = (s?: string) => {
  if (!s) return '-';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
};

const formatTipo = (tipo?: string) => (tipo ? tipo.replace(/_/g, ' ') : '');

export function TelaTransacoesPublicas() {
  const navigate = useNavigate();
  const { isMobile } = useAppContext();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError, isFetching } = useQuery<PageResponse<TransacaoPublica>>({
    queryKey: ['transacoesPublicas', page],
    queryFn: () => fetchTransacoes(page),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  });

  const termo = searchTerm.trim().toLowerCase();
  const transacoes = (data?.content ?? []).filter(
    (t) =>
      !termo ||
      (t.jogadorNome ?? '').toLowerCase().includes(termo) ||
      (t.motivo ?? '').toLowerCase().includes(termo) ||
      (t.tipo ?? '').toLowerCase().includes(termo)
  );
  const totalPages = data?.totalPages ?? 0;

  return (
    <DashboardLayout
      searchPlaceholder="Buscar nesta página..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      contentStyle={{ padding: '1rem 2rem' }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: 'var(--text-gray)', cursor: 'pointer', marginBottom: '16px', fontSize: '0.9rem' }}
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Landmark className="text-primary" size={28} />
          <div>
            <h1 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 700, color: 'var(--text-dark)' }}>Transações Públicas</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Últimas movimentações financeiras da comunidade</span>
          </div>
        </div>

        <div className="tp-card" style={{ overflow: 'hidden', opacity: isFetching && !isLoading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
          {isLoading ? (
            <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
              <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
            </div>
          ) : isError ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-gray)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={32} />
              <p>Não foi possível carregar as transações.</p>
            </div>
          ) : transacoes.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-gray)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={32} />
              <p>Nenhuma transação encontrada.</p>
            </div>
          ) : (
            transacoes.map((t) => {
              const negativo = (t.valor ?? 0) < 0;
              return (
                <div
                  key={t.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.95rem', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      onClick={() => navigate(`/jogador/${t.jogadorId}`)}
                    >
                      {t.jogadorNome}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)', marginTop: '2px' }}>
                      {t.motivo || formatTipo(t.tipo)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-gray)', marginTop: '2px' }}>
                      {formatDataHora(t.dataHora)}
                    </div>
                  </div>
                  {!isMobile && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', background: 'rgba(78, 62, 255, 0.1)', color: 'var(--primary)' }}>
                      {formatTipo(t.tipo)}
                    </span>
                  )}
                  <div style={{ fontWeight: 700, whiteSpace: 'nowrap', color: negativo ? '#ff4757' : 'var(--success)' }}>
                    {formatMoeda(t.valor)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '20px' }}>
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)', background: 'var(--card-bg)', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, display: 'flex' }}
            >
              <ChevronLeft size={18} color="var(--text-dark)" />
            </button>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)' }}>
              Página {page + 1} de {totalPages}
            </span>
            <button
              disabled={data?.last ?? true}
              onClick={() => setPage((p) => p + 1)}
              style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)', background: 'var(--card-bg)', cursor: data?.last ? 'not-allowed' : 'pointer', opacity: data?.last ? 0.4 : 1, display: 'flex' }}
            >
              <ChevronRight size={18} color="var(--text-dark)" />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}