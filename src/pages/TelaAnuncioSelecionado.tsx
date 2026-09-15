import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CalendarSync,
  ArrowLeft,
  Calendar,
  Info,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface AnuncioDetalhado {
  id: string;
  titulo: string;
  mensagem: string;
  dataPostagem: string;
  tipoMensagem: string;
  imagem?: string;
  corMensagem?: string;
}

export function TelaAnuncioSelecionado() {
  const { anuncioId } = useParams();
  const navigate = useNavigate();

  const [anuncio, setAnuncio] = useState<AnuncioDetalhado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnuncio = async () => {
      if (!anuncioId) return;
      try {
        setLoading(true);
        const response = await API.get(`/anuncios/${anuncioId}`);
        setAnuncio(response.data || response);
      } catch (err) {
        console.error(err);
        navigate('/anuncios'); 
      } finally {
        setLoading(false);
      }
    };

    fetchAnuncio();
  }, [anuncioId, navigate]);

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
          case 'ALERTA': return <AlertTriangle size={18} />;
          case 'EVENTO': return <CalendarSync size={18} />;
          case 'ATUALIZACAO': return <Zap size={18} />;
          default: return <Info size={18} />;
      }
  };

  return (
    <DashboardLayout esconderBusca contentStyle={{ padding: '1rem 2rem' }}>
      <button 
        onClick={() => navigate('/anuncios')}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          marginBottom: '20px',
          fontSize: '1rem',
          padding: 0
        }}
      >
        <ArrowLeft size={20} /> Voltar para Anúncios
      </button>

      {loading || !anuncio ? (
        <div className="tp-hero-skeleton" style={{ height: '300px' }}></div>
      ) : (
        <div className="tp-card" style={{ padding: '0', overflow: 'hidden' }}>
          {anuncio.imagem && (
            <div style={{ 
              width: '100%', 
              height: '350px', 
              backgroundImage: `url(${anuncio.imagem})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderBottom: '1px solid var(--border-color)'
            }}></div>
          )}

          <div style={{ padding: '32px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              marginBottom: '16px', 
              flexWrap: 'wrap'
            }}>
              <span style={{ 
                backgroundColor: anuncio.corMensagem || 'var(--primary)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textTransform: 'uppercase'
              }}>
                 {getIconeTipo(anuncio.tipoMensagem)}
                 {anuncio.tipoMensagem}
              </span>

              <span style={{ 
                backgroundColor: 'var(--bg-body)',
                color: 'var(--text-secondary)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                 <Calendar size={16} />
                 {formatDate(anuncio.dataPostagem)}
              </span>
            </div>

            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '800', 
              color: 'var(--text-dark)', 
              marginBottom: '24px',
              lineHeight: '1.3'
            }}>
              {anuncio.titulo}
            </h1>

            <div style={{ 
              fontSize: '1.1rem', 
              lineHeight: '1.8', 
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-line',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '24px'
            }}>
              {anuncio.mensagem}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}