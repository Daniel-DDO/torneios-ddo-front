import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { 
  ChevronLeft,
  ChevronRight,
  Medal,
  Crown
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface JogadorRanking {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  cargo: string;
  saldo: number;
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

const fetchRankingFinanceiroService = async (page: number): Promise<PageableResponse<JogadorRanking>> => {
  const response = await API.get('/jogador/ranking-financeiro', {
    params: {
      page,
      size: 20
    }
  });
  return response.data;
};

export function TelaRankingFinanceiro() {
  const navigate = useNavigate();
  const { currentUser, getAvatarUrl } = useAppContext();
  const [page, setPage] = useState(0);

  const { data: rankingPage, isLoading: isLoadingRanking } = useQuery<PageableResponse<JogadorRanking>>({
    queryKey: ['rankingFinanceiro', page],
    queryFn: () => fetchRankingFinanceiroService(page),
    placeholderData: keepPreviousData 
  });

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    return `D$ ${formatted}`;
  };

  const getPosicaoIcon = (index: number, pageNum: number) => {
    const globalIndex = index + (pageNum * 20);
    if (globalIndex === 0) return <Crown size={20} color="#FFD700" fill="#FFD700" />;
    if (globalIndex === 1) return <Medal size={20} color="#C0C0C0" fill="#C0C0C0" />;
    if (globalIndex === 2) return <Medal size={20} color="#CD7F32" fill="#CD7F32" />;
    return <span style={{ fontWeight: 'bold', color: 'var(--text-gray)', width: '20px', textAlign: 'center' }}>{globalIndex + 1}º</span>;
  };

  return (
    <DashboardLayout esconderBusca contentStyle={{ padding: '0rem 0rem' }}>
      
      <div className="page-content" style={{ animation: 'fadeInUp 0.6s ease-out', paddingBottom: '40px' }}>
          
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                    onClick={() => navigate('/jogadores')}
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
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Ranking Financeiro</h1>
                    <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginTop: '4px' }}>Os magnatas do DDO</p>
                </div>
            </div>
          </div>

          <div className="tp-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
                            <th style={{ padding: '16px', textAlign: 'center', width: '60px' }}>#</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: '600' }}>JOGADOR</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: '600' }}>CARGO</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: '600' }}>SALDO VIRTUAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingRanking ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td colSpan={4} style={{ padding: '20px' }}>
                                        <div className="tp-hero-skeleton" style={{ height: '30px', width: '100%' }}></div>
                                    </td>
                                </tr>
                            ))
                        ) : rankingPage?.content.map((jogador, index) => (
                            <tr 
                                key={jogador.id} 
                                style={{ 
                                    borderBottom: '1px solid var(--border-color)',
                                    background: currentUser?.id === jogador.id ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        {getPosicaoIcon(index, rankingPage.pageable.pageNumber)}
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div 
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--primary)',
                                                backgroundImage: getAvatarUrl(jogador.imagem) ? `url(${getAvatarUrl(jogador.imagem)})` : 'none',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                flexShrink: 0,
                                                border: currentUser?.id === jogador.id ? '2px solid var(--primary)' : 'none'
                                            }}
                                        >
                                            {!jogador.imagem && jogador.nome.charAt(0)}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ 
                                                fontWeight: '600', 
                                                color: 'var(--text-dark)',
                                                fontSize: '0.95rem'
                                            }}>
                                                {jogador.nome}
                                            </span>
                                            <span style={{ 
                                                fontSize: '0.8rem', 
                                                color: 'var(--text-gray)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <span style={{ opacity: 0.7 }}>#</span> {jogador.discord}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        background: 'rgba(0,0,0,0.05)',
                                        color: 'var(--text-gray)',
                                        textTransform: 'uppercase'
                                    }}>
                                        {jogador.cargo.replace('_', ' ')}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <span style={{ 
                                        fontWeight: '700', 
                                        color: '#10b981',
                                        fontSize: '1rem'
                                    }}>
                                        {formatCurrency(jogador.saldo)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {rankingPage && rankingPage.totalPages > 1 && (
                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)', marginRight: '10px' }}>
                        Página {(rankingPage.pageable.pageNumber || 0) + 1} de {rankingPage.totalPages}
                    </span>
                    <button 
                        disabled={rankingPage.first}
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: rankingPage.first ? 'rgba(0,0,0,0.05)' : 'var(--card-bg)',
                            color: rankingPage.first ? 'var(--text-gray)' : 'var(--text-dark)',
                            cursor: rankingPage.first ? 'default' : 'pointer'
                        }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button 
                        disabled={rankingPage.last}
                        onClick={() => setPage(p => p + 1)}
                        style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: rankingPage.last ? 'rgba(0,0,0,0.05)' : 'var(--card-bg)',
                            color: rankingPage.last ? 'var(--text-gray)' : 'var(--text-dark)',
                            cursor: rankingPage.last ? 'default' : 'pointer'
                        }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
          </div>

      </div>
    </DashboardLayout>
  );
}