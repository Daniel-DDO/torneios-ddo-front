import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  ArrowLeft,
  Award
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface CompeticaoDetalheDTO {
  id: string;
  nome: string;
  imagem: string;
  divisao: string;
  valor: number;
  descricao: string;
  tituloId: string | null;
  tituloNome: string | null;
  tituloImagem: string | null;
}

const fetchCompeticaoPorIdService = async (id: string): Promise<CompeticaoDetalheDTO | null> => {
  try {
    const response = await API.get(`/competicao/${id}`);
    const data = (response && (response as any).data) ? (response as any).data : response;
    return data as CompeticaoDetalheDTO;
  } catch (error) {
    console.error('Erro ao buscar competição', error);
    return null;
  }
};

export function TelaCompeticaoSelecionada() {
  const navigate = useNavigate();
  const { competicaoId } = useParams();

  const { data: competicao, isLoading: loading } = useQuery<CompeticaoDetalheDTO | null>({
    queryKey: ['competicao', competicaoId],
    queryFn: () => fetchCompeticaoPorIdService(competicaoId || ''),
    enabled: !!competicaoId,
    staleTime: 1000 * 60 * 5,
  });

  const { getAvatarUrl } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const competicaoImagemUrl = competicao?.imagem
    ? getAvatarUrl(competicao.imagem)
    : null;

  const tituloImagemUrl = competicao?.tituloImagem
    ? getAvatarUrl(competicao.tituloImagem)
    : null;

  return (
    <DashboardLayout
      searchPlaceholder="Buscar competição..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    >

      <LoadingSpinner isLoading={loading} />

      <style>{`
        .page-content {
          padding: 2rem 3rem;
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

        .competicao-header-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 32px;
          display: flex;
          align-items: center;
          gap: 32px;
          box-shadow: var(--shadow-sm);
        }

        .competicao-avatar-grande {
          width: 120px;
          height: 120px;
          border-radius: 20px;
          background: var(--hover-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary);
          border: 2px solid var(--border-color);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          flex-shrink: 0;
        }

        .competicao-info-principal {
          flex: 1;
        }

        .competicao-nome {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-dark);
          margin-bottom: 8px;
        }

        .competicao-descricao {
          color: var(--text-gray);
          font-size: 0.95rem;
          line-height: 1.5;
          max-width: 700px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 24px;
        }

        .stat-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 20px 24px;
          box-shadow: var(--shadow-sm);
        }

        .stat-card-label {
          font-size: 0.8rem;
          color: var(--text-gray);
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .stat-card-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .titulo-card {
          margin-top: 24px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .titulo-avatar {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          background: var(--hover-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          border: 2px solid var(--border-color);
          flex-shrink: 0;
        }

        .titulo-label {
          font-size: 0.8rem;
          color: var(--text-gray);
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .titulo-nome {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--text-gray);
        }

        @media (max-width: 768px) {
          .page-content { padding: 1rem; }
          .competicao-header-card { flex-direction: column; text-align: center; }
        }
      `}</style>

        <>
            <button onClick={() => navigate('/competicoes')} className="back-button">
                <ArrowLeft size={16} /> Voltar para Competições
            </button>

            {!loading && !competicao && (
              <div className="empty-state">Competição não encontrada.</div>
            )}

            {!loading && competicao && (
              <>
                <div className="competicao-header-card">
                  {competicaoImagemUrl ? (
                    <div className="competicao-avatar-grande" style={{backgroundImage: `url(${competicaoImagemUrl})`}}></div>
                  ) : (
                    <div className="competicao-avatar-grande">
                      {competicao.nome.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="competicao-info-principal">
                    <div className="competicao-nome">{competicao.nome}</div>
                    <div className="competicao-descricao">
                      {competicao.descricao || 'Sem descrição cadastrada para esta competição.'}
                    </div>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-card-label">Divisão</div>
                    <div className="stat-card-value">{competicao.divisao || '-'}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label">Valor (Peso)</div>
                    <div className="stat-card-value">{competicao.valor ?? '-'}</div>
                  </div>
                </div>

                {competicao.tituloId && (
                  <div className="titulo-card">
                    {tituloImagemUrl ? (
                      <div className="titulo-avatar" style={{backgroundImage: `url(${tituloImagemUrl})`}}></div>
                    ) : (
                      <div className="titulo-avatar">
                        <Award size={28} color="var(--primary)" />
                      </div>
                    )}
                    <div>
                      <div className="titulo-label">
                        <Award size={14} /> Título vinculado
                      </div>
                      <div className="titulo-nome">{competicao.tituloNome}</div>
                    </div>
                  </div>
                )}
              </>
            )}
        </>

      </DashboardLayout>
  );
}