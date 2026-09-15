import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Trophy,
  Plus,
  ArrowLeft,
  ArrowLeftRight
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import PopupNovaFase from '../components/PopupNovaFase';
import PopupConcederTitulo from '../components/PopupConcederTitulo';
import PopupTrocarJogadorTorneio from '../components/PopupTrocarJogadorTorneio';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface FaseTorneioDTO {
  id: string;
  nome: string;
  ordem: number;
  torneioId: string;
  torneioNome: string;
  tipoTorneio: string;
  numeroRodadas: number | null;
  faseInicialMataMata: string | null;
  temJogoVolta: boolean | null;
}

const fetchFasesPorTorneioService = async (torneioId: string) => {
  const response = await API.get(`/fase-torneio/torneio/${torneioId}`);
  return response.data;
};

export function TelaTorneiosFases() {
  const navigate = useNavigate();
  const { torneioId, temporadaId } = useParams();
  const queryClient = useQueryClient();
  const { currentUser } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: fases = [], isLoading } = useQuery<FaseTorneioDTO[]>({
    queryKey: ['fases', torneioId],
    queryFn: () => fetchFasesPorTorneioService(torneioId || ''),
    enabled: !!torneioId,
  });

  const [showNovaFasePopup, setShowNovaFasePopup] = useState(false);
  const [showConcederPopup, setShowConcederPopup] = useState(false);
  const [showTrocarJogadorTorneioPopup, setShowTrocarJogadorTorneioPopup] = useState(false);
  const handleNovaFaseSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ['fases', torneioId] });
  };

  const handleTrocarJogadorTorneioSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['fases', torneioId] });
  };

  const filteredFases = fases.filter((fase) => {
    const term = searchTerm.toLowerCase();
    return fase.nome.toLowerCase().includes(term);
  });

  const formatTipoTorneio = (tipo: string) => {
    switch (tipo) {
        case 'GRUPOS': return 'Fase de Grupos';
        case 'PONTOS_CORRIDOS': return 'Pontos Corridos';
        case 'MATA_MATA': return 'Mata-Mata';
        case 'JOGO_UNICO': return 'Jogo Único';
        default: return tipo;
    }
  };

  const getDetalhesFase = (fase: FaseTorneioDTO) => {
    if (fase.tipoTorneio === 'PONTOS_CORRIDOS' || fase.tipoTorneio === 'GRUPOS') {
        return `${fase.numeroRodadas} Rodadas`;
    }
    if (fase.tipoTorneio === 'MATA_MATA') {
        return `${fase.faseInicialMataMata} ${fase.temJogoVolta ? '(Ida e Volta)' : '(Jogo Único)'}`;
    }
    return '-';
  };

  return (
    <DashboardLayout
      searchPlaceholder="Buscar fase..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      contentStyle={{ padding: '0rem 0rem' }}
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

        .badge-type {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            background-color: var(--hover-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
        }

        @media (max-width: 768px) {
          .page-content { padding: 1rem; }
          .custom-table th, .custom-table td { padding: 12px; }
        }
      `}</style>

      <div className="page-content">
            <button onClick={() => navigate(`/${temporadaId}/torneios`)} className="back-button">
                <ArrowLeft size={16} /> Voltar para Torneios
            </button>

            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Fases do Torneio</h2>
                    <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Gerencie as etapas deste torneio</p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    {currentUser?.cargo === 'PROPRIETARIO' && (
                        <button 
                          className="t-btn" 
                          onClick={() => setShowTrocarJogadorTorneioPopup(true)}
                          style={{
                              background: '#7c3aed', 
                              color: 'white', 
                              border: 'none', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px'
                          }}
                        >
                            <ArrowLeftRight size={18} /> Substituir Jogador (neste torneio)
                        </button>
                    )}

                    {currentUser?.cargo === 'PROPRIETARIO' && (
                        <button 
                          className="t-btn" 
                          onClick={() => setShowConcederPopup(true)}
                          style={{
                              background: '#d97706', 
                              color: 'white', 
                              border: 'none', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px'
                          }}
                        >
                            <Trophy size={18} /> Conceder Título
                        </button>
                    )}

                    {currentUser && ['DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo) && (
                        <button 
                          className="t-btn" 
                          onClick={() => setShowNovaFasePopup(true)}
                          style={{
                              background: 'var(--primary)', 
                              color: 'white', 
                              border: 'none', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px'
                          }}
                        >
                            <Plus size={18} /> Nova Fase
                        </button>
                    )}
                </div>
            </div>

            <div className="table-container">
              {isLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>Carregando fases...</div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{width: '80px', textAlign: 'center'}}>Ordem</th>
                      <th>Nome da Fase</th>
                      <th>Tipo</th>
                      <th>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFases.map((fase) => (
                        <tr key={fase.id} onClick={() => navigate(`/${temporadaId}/torneio/${torneioId}/fase/${fase.id}`)}>
                          <td style={{textAlign: 'center', fontWeight: 'bold'}}>{fase.ordem}</td>
                          <td>{fase.nome}</td>
                          <td>
                              <span className="badge-type">{formatTipoTorneio(fase.tipoTorneio)}</span>
                          </td>
                          <td style={{color: 'var(--text-gray)'}}>
                              {getDetalhesFase(fase)}
                          </td>
                        </tr>
                    ))}
                    {filteredFases.length === 0 && (
                      <tr>
                          <td colSpan={4} style={{textAlign: 'center', padding: '30px', color: 'var(--text-secondary)'}}>
                              Nenhuma fase encontrada
                          </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
        </div>

      {showNovaFasePopup && (
        <PopupNovaFase 
          onClose={() => setShowNovaFasePopup(false)} 
          onSubmit={handleNovaFaseSubmit} 
        />
      )}

      {showConcederPopup && (
        <PopupConcederTitulo
            onClose={() => setShowConcederPopup(false)}
            temporadaId={temporadaId || ''}
            nomeTemporada={temporadaId || ''}
        />
      )}

      {showTrocarJogadorTorneioPopup && (
        <PopupTrocarJogadorTorneio
            temporadaId={temporadaId || ''}
            torneioId={torneioId || ''}
            onClose={() => setShowTrocarJogadorTorneioPopup(false)}
            onSuccess={handleTrocarJogadorTorneioSuccess}
        />
      )}
    </DashboardLayout>
  );
}