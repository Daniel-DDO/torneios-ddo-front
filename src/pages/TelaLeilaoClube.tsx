import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, DollarSign, Clock, Award, ChevronLeft
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface Leilao {
  id: string;
  ativo: boolean;
}

interface ItemRankingDTO {
  nomeJogador: string;
  valorOfertado: number;
  prioridadeEscolhida: number;
  dataLance: string;
}

interface DisputaClubeDTO {
  clubeId: string;
  clubeNome: string;
  imagemClube: string;
  totalInteressados: number;
  ranking: ItemRankingDTO[];
}

const fetchLeiloesPorTemporadaService = async (temporadaId: string) => {
  const response = await API.get(`/api/leiloes/temporada/${temporadaId}`);
  return response.data;
};

const fetchDisputaClube = async (leilaoId: string, clubeId: string) => {
  const response = await API.get(`/api/leiloes/${leilaoId}/disputa/${clubeId}`);
  return response.data;
};

export function TelaLeilaoClube() {
  const navigate = useNavigate();
  const { temporadaId, clubeId } = useParams();
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

  const { data: disputa, isLoading } = useQuery<DisputaClubeDTO>({
    queryKey: ['disputa-clube', leilaoId, clubeId],
    queryFn: () => fetchDisputaClube(leilaoId!, clubeId || ''),
    enabled: !!leilaoId && !!clubeId,
    refetchInterval: 5000 
  });

  const formatMoney = (value: number) => {
    return `D$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDataHoraBrasilia = (dateString: string) => {
    if (!dateString) return '';
    const safeDateString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    try {
      const date = new Date(safeDateString);
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <DashboardLayout
      searchPlaceholder="Buscar..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      contentStyle={{ padding: '1rem 2rem' }}
    >
      <style>{`
        .clube-header-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 30px;
            display: flex;
            align-items: center;
            gap: 24px;
            margin-bottom: 30px;
            box-shadow: var(--shadow-sm);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            animation: fadeInUp 0.6s ease-out forwards;
        }
        .clube-header-card:hover {
            box-shadow: var(--shadow-md);
            border-color: var(--primary);
            transform: translateY(-2px);
        }
        .clube-header-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 6px;
            height: 100%;
            background: var(--primary);
        }
        .clube-big-img {
            width: 90px;
            height: 90px;
            object-fit: contain;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
            transition: transform 0.3s;
        }
        .clube-header-card:hover .clube-big-img {
            transform: scale(1.05);
        }
        .clube-title h2 {
            font-size: 2rem;
            font-weight: 800;
            margin: 0 0 8px 0;
            color: var(--text-dark);
            letter-spacing: -0.5px;
        }
        .stat-badge {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            padding: 8px 16px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 0.9rem;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .ranking-table-container {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: var(--shadow-sm);
            animation: fadeInUp 0.8s ease-out forwards;
        }
        .ranking-row {
            display: grid;
            grid-template-columns: 80px 2fr 1fr 1.5fr 1.5fr;
            align-items: center;
            padding: 18px 30px;
            border-bottom: 1px solid var(--border-color);
            transition: all 0.2s;
        }
        .ranking-row:last-child {
            border-bottom: none;
        }
        .ranking-row:hover {
            background: var(--hover-bg);
        }
        .ranking-header {
            background: var(--bg-body);
            font-weight: 700;
            color: var(--text-gray);
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .pos-badge {
            width: 36px;
            height: 36px;
            border-radius: 12px;
            background: var(--bg-body);
            color: var(--text-gray);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-sm);
        }
        .pos-1 { background: #FFD700; color: #fff; border-color: #eab308; box-shadow: 0 4px 10px rgba(234, 179, 8, 0.3); }
        .pos-2 { background: #C0C0C0; color: #fff; border-color: #9ca3af; }
        .pos-3 { background: #CD7F32; color: #fff; border-color: #fdba74; }
        .priority-tag {
            background: var(--primary);
            color: white;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 700;
            box-shadow: 0 2px 6px rgba(78, 62, 255, 0.2);
        }
        .value-highlight {
            font-weight: 800;
            color: #10b981;
            font-size: 1.1rem;
            font-family: 'Inter', monospace;
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
        @media (max-width: 768px) {
            .ranking-row {
                grid-template-columns: 50px 1fr 1fr;
                gap: 10px;
                padding: 15px;
            }
            .ranking-header {
                display: none;
            }
            .ranking-row > div:nth-child(3) {
                display: none; 
            }
            .ranking-row > div:nth-child(4) {
                display: none;
            }
            .clube-header-card {
                flex-direction: column;
                text-align: center;
                padding: 20px;
            }
        }
      `}</style>

        <div>
            <button 
                onClick={() => navigate(`/${temporadaId}/torneios/leilao`)} 
                className="back-btn-custom"
            >
                <ChevronLeft size={18} /> Voltar para o Leilão
            </button>

            {isLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-gray)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div className="tp-hero-skeleton" style={{width: '100px', height: '100px', borderRadius: '50%'}}></div>
                    <p>Carregando detalhes...</p>
                </div>
            ) : !disputa ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-gray)' }}>Disputa não encontrada ou leilão inativo.</div>
            ) : (
                <>
                    <div className="clube-header-card">
                        <img src={disputa.imagemClube} alt={disputa.clubeNome} className="clube-big-img" />
                        <div className="clube-title">
                            <h2>{disputa.clubeNome}</h2>
                            <div className="stat-badge">
                                <Users size={16} />
                                {disputa.totalInteressados} Interessados na disputa
                            </div>
                        </div>
                    </div>

                    <div className="ranking-table-container">
                        <div className="ranking-row ranking-header">
                            <div>Pos</div>
                            <div>Jogador</div>
                            <div style={{textAlign: 'center'}}>Prioridade</div>
                            <div>Data do Lance</div>
                            <div style={{textAlign: 'right'}}>Valor</div>
                        </div>

                        {disputa.ranking && disputa.ranking.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-gray)' }}>
                                <div style={{background: 'var(--hover-bg)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'}}>
                                    <DollarSign size={24} color="var(--text-gray)" />
                                </div>
                                Nenhum lance registrado para este clube ainda.
                            </div>
                        ) : (
                            disputa.ranking?.map((item, index) => (
                                <div key={index} className="ranking-row">
                                    <div>
                                        <div className={`pos-badge pos-${index + 1}`}>
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {item.nomeJogador}
                                        {index === 0 && <Award size={18} color="#f59e0b" fill="#f59e0b" />}
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <span className="priority-tag">{item.prioridadeEscolhida}ª Opção</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-gray)' }}>
                                        <Clock size={14} />
                                        {formatDataHoraBrasilia(item.dataLance)}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className="value-highlight">{formatMoney(item.valorOfertado)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    </DashboardLayout>
  );
}