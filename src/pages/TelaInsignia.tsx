import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  Medal,
  ArrowLeft,
  Award
} from 'lucide-react';
import { API } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface Insignia {
  id: string;
  nome: string;
  imagem: string;
  descricao: string;
}

const fetchInsigniasService = async () => {
  const response = await API.get('/insignia');
  return response.data || [];
};

export function TelaInsignia() {
  const navigate = useNavigate();
  useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: insignias = [], isLoading } = useQuery<Insignia[]>({
    queryKey: ['insignias'],
    queryFn: fetchInsigniasService,
    staleTime: 1000 * 60 * 30,
  });

  const filteredInsignias = useMemo(() => {
    if (!searchTerm) return insignias;
    return insignias.filter(ins =>
      ins.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [insignias, searchTerm]);

  return (
    <DashboardLayout
      searchPlaceholder="Buscar insígnias..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      contentStyle={{ padding: '1rem 2rem' }}
    >
      <style>{`
        .tp-insignia-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .tp-insignia-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }

        .tp-insignia-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 28px 20px;
        }

        .tp-insignia-img-container {
          width: 88px;
          height: 88px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 6px 10px rgba(0,0,0,0.12));
          transition: transform 0.3s;
        }

        .tp-insignia-card:hover .tp-insignia-img-container {
          transform: scale(1.08);
        }

        .tp-insignia-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .tp-insignia-name {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 6px;
        }

        .tp-insignia-desc {
          font-size: 0.9rem;
          color: var(--text-gray);
          line-height: 1.5;
        }

        .tp-insignia-empty {
          grid-column: 1 / -1;
        }
      `}</style>

      <div className="tp-insignia-header">
        <button onClick={() => navigate(-1)} className="icon-btn">
          <ArrowLeft size={18} />
        </button>
        <Award className="text-primary" size={22} />
        Galeria de Insígnias
      </div>

      {isLoading ? (
        <div className="tp-card tp-insignia-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-gray)' }}>
          <Loader2 className="animate-spin text-primary" size={32} />
          <p style={{ marginTop: '14px', fontSize: '0.9rem' }}>Carregando insígnias...</p>
        </div>
      ) : (
        <div className="tp-insignia-grid">
          {filteredInsignias.length > 0 ? (
            filteredInsignias.map((insignia) => (
              <div key={insignia.id} className="tp-card tp-insignia-card">
                <div className="tp-insignia-img-container">
                  <img src={insignia.imagem} alt={insignia.nome} className="tp-insignia-img" />
                </div>
                <h3 className="tp-insignia-name">{insignia.nome}</h3>
                <p className="tp-insignia-desc">{insignia.descricao}</p>
              </div>
            ))
          ) : (
            <div className="tp-card tp-insignia-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-gray)' }}>
              <Medal size={40} style={{ opacity: 0.3, marginBottom: '14px' }} />
              <p style={{ fontSize: '0.9rem' }}>Nenhuma insígnia encontrada.</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}