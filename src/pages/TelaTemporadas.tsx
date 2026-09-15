import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupNovaTemporada from '../components/PopupNovaTemporada';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface Season {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  ativa: boolean;
}

// Segue o mesmo formato de paginação usado nas demais telas (ex: clubes,
// jogadores): conteudo/paginaAtual/totalPaginas/ultimaPagina — e não
// conteudo/numero/ultima como estava antes, o que fazia "ultima" nunca
// bater com o campo real do back e travava a paginação sempre na página 1.
interface PaginacaoResponse<T> {
  conteudo: T[];
  paginaAtual: number;
  totalPaginas: number;
  totalElementos: number;
  tamanho: number;
  ultimaPagina: boolean;
}

const fetchSeasonsService = async (pagina: number, tamanho: number, busca: string) => {
  const params = new URLSearchParams();
  params.set('pagina', String(pagina));
  params.set('tamanho', String(tamanho));
  if (busca.trim()) {
    params.set('busca', busca.trim());
  }
  const response = await API.get(`/temporada/all?${params.toString()}`);
  return response.data as PaginacaoResponse<Season>;
};

export function TelaTemporadas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isAdmin, isMobile } = useAppContext();

  const [pagina, setPagina] = useState(0);
  const [tamanho] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagina(0);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const { data: seasonsPage, isLoading } = useQuery<PaginacaoResponse<Season>>({
    queryKey: ['temporadas', pagina, tamanho, debouncedSearch],
    queryFn: () => fetchSeasonsService(pagina, tamanho, debouncedSearch),
    placeholderData: (previousData) => previousData,
  });

  const seasons = seasonsPage?.conteudo ?? [];
  const totalPaginas = seasonsPage?.totalPaginas ?? 0;
  const ultima = seasonsPage?.ultimaPagina ?? true;

  const [showNovaTemporadaPopup, setShowNovaTemporadaPopup] = useState(false);

  const handleNovaTemporadaSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ['temporadas'] });
  };


  const getSeasonStatus = (startStr: string, endStr: string) => {
    const now = new Date();
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (now >= start && now <= end) {
        return { label: 'ATUAL', className: 'status-atual' };
    } else if (now > end) {
        return { label: 'PASSADO', className: 'status-passado' };
    } else {
        return { label: 'EM BREVE', className: 'status-breve' };
    }
  };

  return (
    <DashboardLayout
      searchPlaceholder="Buscar temporada..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      contentStyle={{ padding: isMobile ? '1rem' : '1rem 2rem' }}
    >
      <style>{`
        .page-content {
          padding: 2rem 3rem;
        }

        .table-container {
          background-color: var(--bg-card);
          border-radius: var(--radius);
          border: 1px solid var(--border-color);
          overflow: hidden;
          margin-top: 24px;
          box-shadow: var(--shadow-sm);
          min-height: 300px;
          display: flex;
          flex-direction: column;
        }

        .custom-table {
          width: 100%;
          border-collapse: collapse;
        }

        .custom-table th, .custom-table td {
          padding: 16px 24px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        .custom-table th {
          background-color: var(--hover-bg);
          color: var(--text-gray);
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
        }

        .custom-table td {
          color: var(--text-dark);
          font-size: 1rem;
        }

        .custom-table tbody tr {
          transition: background-color 0.2s;
          cursor: pointer;
        }

        .custom-table tbody tr:hover {
          background-color: var(--hover-bg);
        }

        .custom-table tr:last-child td {
          border-bottom: none;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .status-atual {
          background-color: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .status-passado {
          background-color: var(--border-color);
          color: var(--text-gray);
        }

        .status-breve {
          background-color: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        .state-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            color: var(--text-secondary);
        }

        .spinner-icon {
            animation: spin 1s linear infinite;
            margin-bottom: 12px;
            color: var(--primary);
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid var(--border-color);
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background-color: transparent;
          color: var(--text-dark);
          cursor: pointer;
        }

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-label {
          font-size: 0.9rem;
          color: var(--text-gray);
        }

        @media (max-width: 768px) {
          .page-content { padding: 1rem; }
          .custom-table th, .custom-table td { padding: 12px; }
        }
      `}</style>

      <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Temporadas</h2>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Gerencie as temporadas do torneio</p>
            </div>
            {currentUser && isAdmin && currentUser.cargo === 'PROPRIETARIO' && (
                <button 
                  className="t-btn" 
                  onClick={() => setShowNovaTemporadaPopup(true)}
                  style={{background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                    <Plus size={18} /> Nova Temporada
                </button>
            )}
            </div>

            <div className="table-container">
              {isLoading ? (
                <div className="state-container">
                    <Loader2 size={32} className="spinner-icon" />
                    <p>Buscando temporadas...</p>
                </div>
              ) : seasons.length > 0 ? (
                <>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Início</th>
                        <th>Fim</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasons.map((season) => {
                        const statusInfo = getSeasonStatus(season.dataInicio, season.dataFim);
                        return (
                            <tr 
                                key={season.id} 
                                onClick={() => navigate(`/${season.id}/torneios`)}
                            >
                              <td>{season.nome}</td>
                              <td>{new Date(season.dataInicio).toLocaleDateString('pt-BR')}</td>
                              <td>{new Date(season.dataFim).toLocaleDateString('pt-BR')}</td>
                              <td>
                                <span className={`status-badge ${statusInfo.className}`}>
                                  {statusInfo.label}
                                </span>
                              </td>
                            </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="pagination-bar">
                    <span className="pagination-label">
                      Página {pagina + 1} de {Math.max(totalPaginas, 1)}
                    </span>
                    <button
                      className="pagination-btn"
                      disabled={pagina === 0}
                      onClick={() => setPagina((p) => Math.max(p - 1, 0))}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      className="pagination-btn"
                      disabled={ultima}
                      onClick={() => setPagina((p) => p + 1)}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="state-container">
                    <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Nenhuma temporada encontrada</p>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Tente ajustar sua busca ou adicione uma nova.</p>
                </div>
              )}
            </div>
        </div>

      {showNovaTemporadaPopup && (
        <PopupNovaTemporada 
          onClose={() => setShowNovaTemporadaPopup(false)} 
          onSubmit={handleNovaTemporadaSubmit}
        />
      )}
    </DashboardLayout>
  );
}