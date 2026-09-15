import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Shield,  
  ArrowLeft,
  Calendar,
  ExternalLink,
  Flame,
  Swords,
  AlertTriangle,
  Crown,
  Target
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface NoticiaDetalhada {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'TITANS' | 'ZEBRA' | 'GOLEADA' | 'DECISAO' | 'BATALHA' | 'JOGO_QUENTE';
  linkPartida: string;
  dataCriacao: string;
}

const NEWS_CONFIG = {
  TITANS: {
    label: 'Choque de Titãs',
    icon: <Swords size={20} />,
    color: '#FFD700',
    image: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=1000&auto=format&fit=crop'
  },
  ZEBRA: {
    label: 'Zebra Histórica',
    icon: <AlertTriangle size={20} />,
    color: '#ff4757',
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=1000&auto=format&fit=crop'
  },
  GOLEADA: {
    label: 'Goleada',
    icon: <Target size={20} />,
    color: '#2ed573',
    image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=1000&auto=format&fit=crop'
  },
  DECISAO: {
    label: 'Decisão',
    icon: <Crown size={20} />,
    color: '#ffa502',
    image: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=1000&auto=format&fit=crop'
  },
  BATALHA: {
    label: 'Batalha',
    icon: <Shield size={20} />,
    color: '#747d8c',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=1000&auto=format&fit=crop'
  },
  JOGO_QUENTE: {
    label: 'Jogo Quente',
    icon: <Flame size={20} />,
    color: '#ff6b81',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop'
  }
};

export function TelaNoticiaSelecionada() {
  const navigate = useNavigate();
  const { noticiaId } = useParams();
  const { isMobile } = useAppContext();
  
  const [noticia, setNoticia] = useState<NoticiaDetalhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchNoticia = async () => {
      if (!noticiaId) return;
      try {
        setLoading(true);
        const response = await API.get(`/api/noticias/${noticiaId}`);
        setNoticia(response.data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNoticia();
  }, [noticiaId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(date);
  };

  const getNewsConfig = (tipo: string) => {
    return NEWS_CONFIG[tipo as keyof typeof NEWS_CONFIG] || NEWS_CONFIG.JOGO_QUENTE;
  };

  return (
    <DashboardLayout esconderBusca>
      
        <div>
          
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={() => navigate(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-gray)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 500
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-gray)'}
            >
              <ArrowLeft size={20} /> Voltar
            </button>
          </div>

          {loading ? (
             <div className="tp-hero-skeleton" style={{ height: '400px' }}></div>
          ) : error || !noticia ? (
            <div className="tp-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-gray)' }}>
              <h3>Notícia não encontrada</h3>
              <p>O conteúdo que você procura pode ter sido removido.</p>
            </div>
          ) : (
            (() => {
              const config = getNewsConfig(noticia.tipo);
              return (
                <div className="tp-card" style={{ padding: '0', overflow: 'hidden', maxWidth: '900px', margin: '0 auto' }}>
                  <div style={{
                    height: '320px',
                    width: '100%',
                    position: 'relative',
                    backgroundImage: `url(${config.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
                    }}></div>

                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      padding: '30px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: config.color,
                        color: '#fff',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        marginBottom: '16px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        {config.icon} {config.label}
                      </div>

                      <h1 style={{
                        color: 'white',
                        fontSize: isMobile ? '1.8rem' : '2.5rem',
                        fontWeight: '800',
                        lineHeight: 1.2,
                        marginBottom: '12px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                      }}>
                        {noticia.titulo}
                      </h1>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '0.9rem'
                      }}>
                        <Calendar size={16} />
                        {formatDate(noticia.dataCriacao)}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: isMobile ? '24px' : '40px' }}>
                    <p style={{
                      fontSize: '1.1rem',
                      lineHeight: '1.8',
                      color: 'var(--text-dark)',
                      marginBottom: '40px',
                      whiteSpace: 'pre-line'
                    }}>
                      {noticia.mensagem}
                    </p>

                    {noticia.linkPartida && (
                      <div style={{
                        padding: '24px',
                        backgroundColor: 'var(--hover-bg)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}>
                        <div>
                          <h4 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1rem', marginBottom: '4px' }}>Quer ver como foi?</h4>
                          <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                            Confira todos os detalhes, estatísticas e lances desta partida.
                          </p>
                        </div>
                        
                        <a 
                          href={noticia.linkPartida}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 15px rgba(78, 62, 255, 0.2)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(78, 62, 255, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(78, 62, 255, 0.2)';
                          }}
                        >
                          Ver Partida <ExternalLink size={18} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
    </DashboardLayout>
  );
}