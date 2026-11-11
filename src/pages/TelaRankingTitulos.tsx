import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, AlertCircle, ArrowLeft } from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Espelha RankingTitulosDTO do back
interface RankingTitulo {
  posicao: number;
  id: string;
  nome: string;
  titulos: number;
  finais: number;
}

const fetchRankingTitulos = async (): Promise<RankingTitulo[]> => {
  const response = await API.get('/players/top-titles');
  return response.data || [];
};

export function TelaRankingTitulos() {
  const navigate = useNavigate();
  const { isMobile } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const { data = [], isLoading, isError } = useQuery<RankingTitulo[]>({
    queryKey: ['rankingTitulos'],
    queryFn: fetchRankingTitulos,
    staleTime: 1000 * 60 * 5,
  });

  const filtrado = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return data;
    return data.filter((r) => r.nome.toLowerCase().includes(termo));
  }, [data, searchTerm]);

  return (
    <DashboardLayout
      searchPlaceholder="Buscar jogador..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      contentStyle={{ padding: '1rem 2rem' }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: 'var(--text-gray)', cursor: 'pointer', marginBottom: '16px', fontSize: '0.9rem' }}
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Trophy className="text-primary" size={28} />
          <div>
            <h1 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 700, color: 'var(--text-dark)' }}>Ranking de Títulos</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Top 10 jogadores com mais títulos</span>
          </div>
        </div>

        <div className="tp-card" style={{ overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
              <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
            </div>
          ) : isError ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-gray)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={32} />
              <p>Não foi possível carregar o ranking.</p>
            </div>
          ) : filtrado.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-gray)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={32} />
              <p>Nenhum jogador encontrado.</p>
            </div>
          ) : (
            filtrado.map((r) => {
              const posClass = r.posicao === 1 ? 'tp-pos-1' : r.posicao === 2 ? 'tp-pos-2' : r.posicao === 3 ? 'tp-pos-3' : 'tp-pos-n';
              return (
                <div
                  key={r.id}
                  className="tp-rank-item"
                  style={{ padding: '14px 20px', cursor: 'pointer' }}
                  onClick={() => navigate(`/jogador/${r.id}`)}
                >
                  <div className={`tp-rank-pos ${posClass}`} style={{ fontSize: '0.85rem', width: '28px', height: '28px' }}>
                    {r.posicao}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden', margin: '0 10px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nome}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Medal size={12} /> {r.finais} {r.finais === 1 ? 'final' : 'finais'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 215, 0, 0.12)', color: '#c99a00', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Trophy size={14} /> {r.titulos}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}