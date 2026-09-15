import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Wand2, ImageOff } from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface ConquistaResumo {
  id: string;
  tituloNome: string;
  tituloImagem: string | null;
  nomeEdicao: string;
  jogadorNome: string;
  clubeNome: string;
  imagem: string | null;
  dataConquista: string;
}

type StatusGeracao = 'idle' | 'gerando' | 'sucesso' | 'erro';

const fetchConquistasService = async (): Promise<ConquistaResumo[]> => {
  const response = await API.get('/titulos/conquistas');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

export function TelaConquistasAdm() {
  const { currentUser, isAdmin } = useAppContext();
  const isAuthorized = isAdmin && ['PROPRIETARIO', 'DIRETOR'].includes(currentUser?.cargo ?? '');
  const [termoBusca, setTermoBusca] = useState('');
  const [statusPorConquista, setStatusPorConquista] = useState<Record<string, StatusGeracao>>({});

  const {
    data: conquistas = [],
    isLoading: carregandoConquistas,
    refetch: refetchConquistas
  } = useQuery({
    queryKey: ['conquistas-admin'],
    queryFn: fetchConquistasService,
    enabled: isAuthorized,
    staleTime: 1000 * 60,
  });

  const conquistasFiltradas = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    if (!termo) return conquistas;

    return conquistas.filter((c: ConquistaResumo) =>
      c.jogadorNome.toLowerCase().includes(termo) ||
      c.clubeNome.toLowerCase().includes(termo) ||
      c.tituloNome.toLowerCase().includes(termo) ||
      c.nomeEdicao.toLowerCase().includes(termo)
    );
  }, [conquistas, termoBusca]);


  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleGerarArte = async (conquistaId: string) => {
    setStatusPorConquista(prev => ({ ...prev, [conquistaId]: 'gerando' }));

    try {
      await API.post(`/titulos/conquistas/${conquistaId}/forcar-arte`);
      setStatusPorConquista(prev => ({ ...prev, [conquistaId]: 'sucesso' }));
      setTimeout(() => {
        refetchConquistas();
        setStatusPorConquista(prev => ({ ...prev, [conquistaId]: 'idle' }));
      }, 4000);
    } catch (error) {
      setStatusPorConquista(prev => ({ ...prev, [conquistaId]: 'erro' }));
      setTimeout(() => {
        setStatusPorConquista(prev => ({ ...prev, [conquistaId]: 'idle' }));
      }, 4000);
    }
  };

  const textoBotao = (status: StatusGeracao) => {
    if (status === 'gerando') return 'Gerando...';
    if (status === 'sucesso') return 'Enviado!';
    if (status === 'erro') return 'Falhou, tentar de novo';
    return 'Gerar arte';
  };

  if (!isAuthorized) {
    return <LoadingSpinner isLoading={true} />;
  }

  return (
    <DashboardLayout esconderBusca contentStyle={{ padding: '1rem 2rem' }}>
      <LoadingSpinner isLoading={carregandoConquistas} />

      <style>{`
        .page-content {
          padding: 2rem 3rem;
        }

        .admin-header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .conquistas-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            gap: 16px;
            flex-wrap: wrap;
        }

        .conquistas-search {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 8px 14px;
            min-width: 280px;
            color: var(--text-gray);
        }

        .conquistas-search input {
            border: none;
            outline: none;
            background: transparent;
            color: var(--text-dark);
            width: 100%;
            font-size: 0.9rem;
        }

        .conquistas-lista {
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .conquista-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .conquista-thumb {
            width: 56px;
            height: 56px;
            border-radius: 10px;
            object-fit: cover;
            background: var(--bg-hover, rgba(0,0,0,0.05));
            flex-shrink: 0;
        }

        .conquista-thumb-placeholder {
            width: 56px;
            height: 56px;
            border-radius: 10px;
            background: var(--bg-hover, rgba(0,0,0,0.05));
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-gray);
            flex-shrink: 0;
        }

        .conquista-info {
            flex: 1;
            min-width: 0;
        }

        .conquista-titulo-nome {
            font-weight: 700;
            color: var(--text-dark);
            font-size: 1rem;
        }

        .conquista-detalhe {
            color: var(--text-gray);
            font-size: 0.85rem;
            margin-top: 2px;
        }

        .conquista-acao {
            flex-shrink: 0;
        }

        .btn-gerar-arte {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: var(--radius);
            padding: 10px 16px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
            white-space: nowrap;
        }

        .btn-gerar-arte:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .btn-gerar-arte.status-erro {
            background: #d9534f;
        }

        .btn-gerar-arte.status-sucesso {
            background: #2e9e5b;
        }

        .conquistas-vazio {
            text-align: center;
            padding: 3rem 1rem;
            color: var(--text-gray);
        }

        @media (max-width: 900px) {
            .page-content { padding: 1rem; }
            .conquista-card { flex-wrap: wrap; }
        }
      `}</style>

        <>
          <div className="admin-header-section">
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Conquistas</h2>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                Gerencie as artes de campeão geradas para cada conquista.
              </p>
            </div>
          </div>

          <div className="conquistas-toolbar">
            <div className="conquistas-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por jogador, clube ou título..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
            </div>
          </div>

          {carregandoConquistas && <LoadingSpinner isLoading={true} />}

          {!carregandoConquistas && conquistasFiltradas.length === 0 && (
            <div className="conquistas-vazio">Nenhuma conquista encontrada.</div>
          )}

          {!carregandoConquistas && conquistasFiltradas.length > 0 && (
            <div className="conquistas-lista">
              {conquistasFiltradas.map((conquista: ConquistaResumo) => {
                const status = statusPorConquista[conquista.id] || 'idle';
                return (
                  <div className="conquista-card" key={conquista.id}>
                    {conquista.imagem ? (
                      <img className="conquista-thumb" src={conquista.imagem} alt={conquista.tituloNome} />
                    ) : (
                      <div className="conquista-thumb-placeholder">
                        <ImageOff size={22} />
                      </div>
                    )}

                    <div className="conquista-info">
                      <div className="conquista-titulo-nome">
                        {conquista.tituloNome} — {conquista.nomeEdicao}
                      </div>
                      <div className="conquista-detalhe">
                        {conquista.jogadorNome} · {conquista.clubeNome} · {formatarData(conquista.dataConquista)}
                      </div>
                    </div>

                    <div className="conquista-acao">
                      <button
                        className={`btn-gerar-arte ${status === 'erro' ? 'status-erro' : ''} ${status === 'sucesso' ? 'status-sucesso' : ''}`}
                        disabled={status === 'gerando'}
                        onClick={() => handleGerarArte(conquista.id)}
                      >
                        <Wand2 size={16} />
                        {textoBotao(status)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      </DashboardLayout>
  );
}