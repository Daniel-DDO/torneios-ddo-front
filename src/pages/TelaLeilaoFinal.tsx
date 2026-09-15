import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface Leilao {
  id: string;
  descricao: string;
  temporadaId: string;
  ativo: boolean;
}

interface ResultadoOficialDTO {
  nomeClube: string;
  imagemClube: string;
  nomeJogador: string;
  valorPago: number;
}

const fetchLeiloesPorTemporadaService = async (temporadaId: string) => {
  const response = await API.get(`/api/leiloes/temporada/${temporadaId}`);
  return response.data;
};

const fetchResultadosOficiais = async (leilaoId: string) => {
  const response = await API.get(`/api/leiloes/${leilaoId}/resultado-oficial`);
  return response.data;
};

export function TelaLeilaoFinal() {
  const navigate = useNavigate();
  const { temporadaId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: leiloes = [] } = useQuery<Leilao[]>({
    queryKey: ['leiloes', temporadaId],
    queryFn: () => fetchLeiloesPorTemporadaService(temporadaId || ''),
    enabled: !!temporadaId,
  });

  const leilaoId = useMemo(() => {
    if (Array.isArray(leiloes) && leiloes.length > 0) {
        return leiloes[0].id;
    }
    return null;
  }, [leiloes]);

  const { data: resultadosOficiais = [], isLoading: isLoadingOficiais } = useQuery<ResultadoOficialDTO[]>({
    queryKey: ['resultados-oficiais', leilaoId],
    queryFn: () => fetchResultadosOficiais(leilaoId!),
    enabled: !!leilaoId
  });

  const formatMoney = (value: number) => {
    return `D$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <DashboardLayout
      searchPlaceholder="Buscar clube ou jogador..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      contentStyle={{ padding: '1rem 2rem' }}
    >
      <style>{`
        .table-container {
            background: var(--bg-card);
            border-radius: 16px;
            border: 1px solid var(--border-color);
            overflow: hidden;
            box-shadow: var(--shadow-sm);
        }
        .custom-table {
            width: 100%;
            border-collapse: collapse;
        }
        .custom-table th {
            text-align: left;
            padding: 14px 20px;
            background: var(--hover-bg);
            color: var(--text-gray);
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            border-bottom: 1px solid var(--border-color);
        }
        .custom-table td {
            padding: 14px 20px;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-dark);
            vertical-align: middle;
        }
        .custom-table tr:last-child td {
            border-bottom: none;
        }
        .custom-table tr:hover {
            background: var(--hover-bg);
        }
        .clube-row-img {
            width: 40px;
            height: 40px;
            object-fit: contain;
            margin-right: 12px;
        }
        .back-btn-custom {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            padding: 10px 20px;
            border-radius: 12px;
            color: var(--text-gray);
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 24px;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-sm);
        }
        .back-btn-custom:hover {
            background: var(--hover-bg);
            color: var(--primary);
            border-color: var(--primary);
            transform: translateX(-4px);
        }
        @media (max-width: 1024px) {
            .panels-grid { grid-template-columns: 1fr; }
        }
      `}</style>

        <div>
            <button onClick={() => navigate(`/${temporadaId}/torneios/leilao`)} className="back-btn-custom">
                <ChevronLeft size={18} /> Voltar para o Leilão
            </button>

            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={28} color="var(--primary)" />
                    Resultado Oficial
                </h2>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', margin: '4px 0 0' }}>
                    Confira a lista final de clubes e seus respectivos donos.
                </p>
            </div>

            {isLoadingOficiais ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                    <LoadingSpinner isLoading={true} />
                    <p style={{marginTop: 10}}>Carregando resultados oficiais...</p>
                </div>
            ) : resultadosOficiais.length > 0 ? (
                <div className="table-container">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Clube</th>
                                <th>Jogador Vencedor</th>
                                <th style={{ textAlign: 'right' }}>Valor Pago</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resultadosOficiais
                                .filter(item => 
                                    item.nomeClube.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    item.nomeJogador.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .sort((a, b) => b.valorPago - a.valorPago)
                                .map((item, index) => (
                                <tr key={`${item.nomeClube}-${index}`}>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center'}}>
                                            <img src={item.imagemClube} alt={item.nomeClube} className="clube-row-img" />
                                            <div style={{ fontWeight: 600 }}>{item.nomeClube}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                            <div style={{
                                                width: 24, height: 24, borderRadius: '50%', background: 'var(--hover-bg)', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--primary)'
                                            }}>
                                                {item.nomeJogador.charAt(0)}
                                            </div>
                                            <span style={{fontWeight: 500}}>{item.nomeJogador}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                            {formatMoney(item.valorPago)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
                    <AlertCircle size={48} color="var(--border-color)" style={{marginBottom: 16}} />
                    <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Nenhum resultado disponível</h3>
                    <p style={{ fontSize: '0.9rem' }}>O resultado oficial ainda não foi divulgado.</p>
                </div>
            )}
        </div>
    </DashboardLayout>
  );
}