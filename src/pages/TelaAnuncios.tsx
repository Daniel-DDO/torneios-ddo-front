import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarSync,
  Megaphone,
  Calendar,
  AlertTriangle,
  Zap,
  Info
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface Anuncio {
  id: string;
  titulo: string;
  mensagem: string;
  dataPostagem: string;
  tipoMensagem: string;
  imagem?: string;
  corMensagem?: string;
}

export function TelaAnuncios() {
  const navigate = useNavigate();

  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnuncios = async () => {
      try {
        setLoading(true);
        const response = await API.get('/anuncios/recentes');
        if (Array.isArray(response.data)) {
            setAnuncios(response.data);
        } else if (Array.isArray(response)) {
            setAnuncios(response);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnuncios();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getIconeTipo = (tipo: string) => {
      switch(tipo) {
          case 'ALERTA': return <AlertTriangle size={16} />;
          case 'EVENTO': return <CalendarSync size={16} />;
          case 'ATUALIZACAO': return <Zap size={16} />;
          default: return <Info size={16} />;
      }
  };

  return (
    <DashboardLayout esconderBusca contentStyle={{ padding: '1rem 2rem' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Megaphone size={28} color="var(--primary)" />
          Quadro de Avisos
        </h2>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="tp-hero-skeleton" style={{ height: '150px' }}></div>
          ))}
        </div>
      ) : anuncios.length === 0 ? (
        <div className="tp-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-gray)' }}>
          <h3>Nenhum anúncio recente</h3>
          <p>No momento não há novos comunicados.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {anuncios.map((anuncio) => (
            <div 
              key={anuncio.id} 
              className="tp-card" 
              style={{ 
                padding: '24px', 
                borderLeft: `5px solid ${anuncio.corMensagem || 'var(--primary)'}`,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
              onClick={() => navigate(`/anuncios/${anuncio.id}`)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    backgroundColor: anuncio.corMensagem ? `${anuncio.corMensagem}20` : 'rgba(37, 99, 235, 0.1)',
                    color: anuncio.corMensagem || 'var(--primary)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textTransform: 'uppercase',
                    border: `1px solid ${anuncio.corMensagem ? anuncio.corMensagem : 'transparent'}`
                  }}>
                     {getIconeTipo(anuncio.tipoMensagem)}
                     {anuncio.tipoMensagem}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    {anuncio.titulo}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-gray)' }}>
                  <Calendar size={14} />
                  {formatDate(anuncio.dataPostagem)}
                </div>
              </div>

              <div style={{ 
                color: 'var(--text-secondary)', 
                lineHeight: '1.5', 
                fontSize: '0.95rem',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {anuncio.mensagem}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}