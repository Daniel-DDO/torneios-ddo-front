import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CreditCard
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface Transacao {
  id: number;
  tipo: 'CREDITO' | 'DEBITO';
  valor: number;
  saldoAnterior: number;
  saldoPosterior: number;
  motivo: string;
  responsavel: string;
  dataHora: string;
}

interface PageableResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
}

const fetchTransacoesService = async (id: string, page: number): Promise<PageableResponse<Transacao>> => {
  const response = await API.get(`/jogador/${id}/transacoes`, {
    params: {
      page,
      size: 10,
      sort: 'dataHora,desc'
    }
  });
  return response.data;
};

export function TelaMinhasTransacoes() {
  const navigate = useNavigate();
  const { currentUser, isMobile, abrirLogin } = useAppContext();
  const [page, setPage] = useState(0);

  const { data: transacoesPage, isLoading: isLoadingTransacoes } = useQuery<PageableResponse<Transacao>>({
    queryKey: ['transacoes', currentUser?.id, page],
    queryFn: () => fetchTransacoesService(currentUser!.id, page),
    enabled: !!currentUser,
    placeholderData: keepPreviousData
  });

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    return `D$ ${formatted}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <DashboardLayout esconderBusca contentStyle={{ padding: '1rem 2rem' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
                onClick={() => navigate('/minha-conta')}
                style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: 'var(--text-dark)'
                }}
            >
                <ChevronLeft size={20} />
            </button>
            <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Histórico Financeiro</h1>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginTop: '4px' }}>Acompanhe suas movimentações de saldo</p>
            </div>
        </div>

        {currentUser && (
            <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #3a2db3 100%)',
                padding: '16px 24px',
                borderRadius: '12px',
                color: 'white',
                display: isMobile ? 'none' : 'block',
                boxShadow: '0 4px 15px rgba(78, 62, 255, 0.3)'
            }}>
                <span style={{ fontSize: '0.85rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>Saldo Atual</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>{formatCurrency(currentUser.saldoVirtual)}</span>
            </div>
        )}
      </div>

      {!currentUser ? (
         <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)'
         }}>
            <Wallet size={48} style={{ color: 'var(--text-gray)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '8px' }}>Login Necessário</h3>
            <p style={{ color: 'var(--text-gray)', marginBottom: '20px' }}>Faça login para visualizar seu histórico financeiro.</p>
            <button
              onClick={abrirLogin}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Fazer Login
            </button>
         </div>
      ) : (
        <div className="tp-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: '600' }}>DATA</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: '600' }}>TIPO</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: '600' }}>MOTIVO</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: '600' }}>VALOR</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: '600' }}>SALDO ANTERIOR</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: '600' }}>SALDO POSTERIOR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingTransacoes ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td colSpan={6} style={{ padding: '20px' }}>
                                        <div className="tp-hero-skeleton" style={{ height: '20px', width: '100%' }}></div>
                                    </td>
                                </tr>
                            ))
                        ) : transacoesPage?.content.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-gray)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                        <CreditCard size={32} />
                                        Nenhuma transação encontrada.
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            transacoesPage?.content.map((transacao) => (
                                <tr key={transacao.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Calendar size={14} className="text-gray-400" />
                                            {formatDateTime(transacao.dataHora)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            background: transacao.tipo === 'CREDITO' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: transacao.tipo === 'CREDITO' ? '#10b981' : '#ef4444'
                                        }}>
                                            {transacao.tipo === 'CREDITO' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                                            {transacao.tipo}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: '500' }}>
                                        {transacao.motivo}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '0.9rem', fontWeight: '600', color: transacao.tipo === 'CREDITO' ? '#10b981' : '#ef4444' }}>
                                        {transacao.tipo === 'CREDITO' ? '+' : '-'}{formatCurrency(transacao.valor)}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '0.9rem', color: 'var(--text-gray)' }}>
                                        {formatCurrency(transacao.saldoAnterior)}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: '600' }}>
                                        {formatCurrency(transacao.saldoPosterior)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {transacoesPage && transacoesPage.totalPages > 1 && (
                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)', marginRight: '10px' }}>
                        Página {(transacoesPage.number || 0) + 1} de {transacoesPage.totalPages}
                    </span>
                    <button
                        disabled={transacoesPage.first}
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: transacoesPage.first ? 'rgba(0,0,0,0.05)' : 'var(--card-bg)',
                            color: transacoesPage.first ? 'var(--text-gray)' : 'var(--text-dark)',
                            cursor: transacoesPage.first ? 'default' : 'pointer'
                        }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        disabled={transacoesPage.last}
                        onClick={() => setPage(p => p + 1)}
                        style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: transacoesPage.last ? 'rgba(0,0,0,0.05)' : 'var(--card-bg)',
                            color: transacoesPage.last ? 'var(--text-gray)' : 'var(--text-dark)',
                            cursor: transacoesPage.last ? 'default' : 'pointer'
                        }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
      )}
    </DashboardLayout>
  );
}