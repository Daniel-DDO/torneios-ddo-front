import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface JogadorClubeDTO {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string;
  clubeId: string;
  clubeNome: string;
  clubeImagem: string;
  clubeSigla: string;
  temporadaId: string;
  temporadaNome: string;
  golsMarcados: number;
  golsSofridos: number;
  jogos: number;
  pontosCoeficiente: number;
  statusTemporada: string;
  vitorias: number;
  empates: number;
  derrotas: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  balancoFinanceiro: number;
}

type SortDirection = 'asc' | 'desc' | null;
type SortKey = 'clube' | 'jogador' | 'partidas' | 'ved' | 'gp' | 'gc' | 'coeficiente';

const fetchInscritosService = async (temporadaId: string) => {
  const response = await API.get(`/inscricao/temporada/${temporadaId}/resumo`);
  return response.data;
};

export function TelaTorneiosJogadores() {
  const navigate = useNavigate();
  const { temporadaId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');

  const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: SortDirection }>({
    key: null,
    direction: null,
  });

  const { data: inscritos = [], isLoading, isPlaceholderData } = useQuery<JogadorClubeDTO[]>({
    queryKey: ['inscritos', temporadaId],
    queryFn: () => fetchInscritosService(temporadaId || ''),
    enabled: !!temporadaId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';

    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }

    setSortConfig({ key: direction ? key : null, direction });
  };

  const filteredAndSortedInscritos = useMemo(() => {
    const result = inscritos.filter((item) => {
      const term = searchTerm.toLowerCase();
      return item.jogadorNome.toLowerCase().includes(term) || item.clubeNome.toLowerCase().includes(term);
    });

    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const multiplier = sortConfig.direction === 'asc' ? 1 : -1;

        switch (sortConfig.key) {
          case 'clube':
            return a.clubeNome.localeCompare(b.clubeNome) * multiplier;
          case 'jogador':
            return a.jogadorNome.localeCompare(b.jogadorNome) * multiplier;
          case 'partidas':
            return (a.jogos - b.jogos) * multiplier;
          case 'ved':
            if (a.vitorias !== b.vitorias) return (a.vitorias - b.vitorias) * multiplier;
            if (a.empates !== b.empates) return (a.empates - b.empates) * multiplier;
            return (b.derrotas - a.derrotas) * multiplier;
          case 'gp':
            return (a.golsMarcados - b.golsMarcados) * multiplier;
          case 'gc':
            return (a.golsSofridos - b.golsSofridos) * multiplier;
          case 'coeficiente':
            return (a.pontosCoeficiente - b.pontosCoeficiente) * multiplier;
          default:
            return 0;
        }
      });
    }

    return result;
  }, [inscritos, searchTerm, sortConfig]);

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key || !sortConfig.direction) {
      return <ChevronsUpDown size={14} style={{ opacity: 0.3 }} />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={14} style={{ color: 'var(--primary)' }} />
      : <ArrowDown size={14} style={{ color: 'var(--primary)' }} />;
  };

  return (
    <DashboardLayout
      searchPlaceholder="Buscar jogador ou clube..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    >
      <style>{`
        .table-container {
          background-color: var(--bg-card);
          border-radius: var(--radius);
          border: 1px solid var(--border-color);
          overflow: hidden;
          margin-top: 24px;
          box-shadow: var(--shadow-sm);
          position: relative;
        }

        .loading-overlay-smooth {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--primary), transparent);
          background-size: 200% 100%;
          animation: loading-bar 1.5s infinite linear;
          z-index: 10;
        }

        @keyframes loading-bar {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .custom-table {
          width: 100%;
          border-collapse: collapse;
        }

        .custom-table th, .custom-table td {
          padding: 16px 24px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }

        .custom-table th {
          background-color: var(--hover-bg);
          color: var(--text-gray);
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s;
        }

        .custom-table th:hover {
          background-color: var(--border-color);
          color: var(--text-dark);
        }

        .th-content {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .th-content.center {
            justify-content: center;
        }

        .th-content.right {
            justify-content: flex-end;
        }

        .custom-table td {
          color: var(--text-dark);
          font-size: 1rem;
        }

        .custom-table tbody tr {
          transition: background-color 0.2s;
        }

        .custom-table tbody tr:hover {
          background-color: var(--hover-bg);
        }

        .custom-table tr:last-child td {
          border-bottom: none;
        }

        .back-button {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-gray);
            font-size: 0.9rem;
            margin-bottom: 1rem;
            cursor: pointer;
            border: none;
            background: none;
            padding: 0;
        }

        .back-button:hover {
            color: var(--primary);
        }

        .clube-cell {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .clube-logo-mini {
            width: 32px;
            height: 32px;
            object-fit: contain;
        }

        .ved-cell {
            font-size: 0.9rem;
            color: var(--text-gray);
            letter-spacing: 1px;
        }

        @media (max-width: 768px) {
          .custom-table th, .custom-table td { padding: 12px; }
        }
      `}</style>

      <button onClick={() => navigate(`/${temporadaId}/torneios`)} className="back-button">
          <ArrowLeft size={16} /> Voltar para Torneios
      </button>

      <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Jogadores da Temporada</h2>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Lista de inscritos e seus desempenhos gerais</p>
      </div>

      <div className="table-container">
        {isLoading && !inscritos.length ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>Carregando dados...</div>
        ) : (
          <>
          {isPlaceholderData && <div className="loading-overlay-smooth" />}
          <table className="custom-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('clube')}>
                  <div className="th-content">
                      Clube {renderSortIcon('clube')}
                  </div>
                </th>
                <th onClick={() => handleSort('jogador')}>
                  <div className="th-content">
                      Jogador {renderSortIcon('jogador')}
                  </div>
                </th>
                <th onClick={() => handleSort('partidas')}>
                  <div className="th-content center">
                      Partidas {renderSortIcon('partidas')}
                  </div>
                </th>
                <th onClick={() => handleSort('ved')}>
                  <div className="th-content center">
                      V-E-D {renderSortIcon('ved')}
                  </div>
                </th>
                <th onClick={() => handleSort('gp')}>
                  <div className="th-content center">
                      Gols Pró {renderSortIcon('gp')}
                  </div>
                </th>
                <th onClick={() => handleSort('gc')}>
                  <div className="th-content center">
                      Gols Contra {renderSortIcon('gc')}
                  </div>
                </th>
                <th onClick={() => handleSort('coeficiente')}>
                  <div className="th-content right">
                      Coeficiente {renderSortIcon('coeficiente')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedInscritos.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="clube-cell">
                          <img src={item.clubeImagem} alt={item.clubeNome} className="clube-logo-mini" />
                          <span>{item.clubeNome}</span>
                      </div>
                    </td>
                    <td>{item.jogadorNome}</td>
                    <td style={{textAlign: 'center'}}>{item.jogos}</td>
                    <td style={{textAlign: 'center'}}>
                        <span className="ved-cell">
                          {item.vitorias}-{item.empates}-{item.derrotas}
                        </span>
                    </td>
                    <td style={{textAlign: 'center', color: '#10b981'}}>{item.golsMarcados}</td>
                    <td style={{textAlign: 'center', color: '#ef4444'}}>{item.golsSofridos}</td>
                    <td style={{textAlign: 'right', fontWeight: 'bold'}}>{item.pontosCoeficiente.toFixed(3)}</td>
                  </tr>
              ))}
              {filteredAndSortedInscritos.length === 0 && (
                <tr>
                    <td colSpan={7} style={{textAlign: 'center', padding: '30px', color: 'var(--text-secondary)'}}>
                        {searchTerm ? 'Nenhum resultado para a busca' : 'Nenhum jogador inscrito encontrado'}
                    </td>
                </tr>
              )}
            </tbody>
          </table>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}