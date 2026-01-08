import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, MapPin } from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';

interface TeamData {
  id: string;
  jogadorNome: string;
  clubeNome: string;
  clubeImagem: string;
  clubeSigla: string;
}

type TipoPartidaEnum = 
  | 'FASE_DE_GRUPOS'
  | 'PONTOS_CORRIDOS'
  | 'MATA_MATA_UNICO'
  | 'MATA_MATA_IDA'
  | 'MATA_MATA_VOLTA'
  | 'DISPUTA_TERCEIRO_LUGAR'
  | 'FINAL_UNICA'
  | 'FINAL_IDA'
  | 'FINAL_VOLTA';

interface MatchDetail {
  id: string;
  tipoPartida: TipoPartidaEnum;
  realizada: boolean;
  dataHora: string | null;
  estadio: string | null;
  mandante: TeamData | null;
  visitante: TeamData | null;
  golsMandante: number | null;
  golsVisitante: number | null;
  penaltisMandante?: number | null;
  penaltisVisitante?: number | null;
  houvePenaltis: boolean;
}

const MATCH_ORDER: Record<string, number> = {
  'MATA_MATA_IDA': 1,
  'FINAL_IDA': 1,
  'MATA_MATA_VOLTA': 2,
  'FINAL_VOLTA': 2,
  'MATA_MATA_UNICO': 3,
  'FINAL_UNICA': 3,
  'DISPUTA_TERCEIRO_LUGAR': 4
};

export function TelaBracketJogos() {
  const { temporadaId, torneioId, faseId, etapa, chaveIndex } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (faseId && etapa && chaveIndex) {
      const loadMatches = async () => {
        try {
          setLoading(true);
          const response = await API.get(`/api/bracket/${faseId}/chave/${etapa}/${chaveIndex}`);
          
          const sortedMatches = (response.data as MatchDetail[]).sort((a, b) => {
            const orderA = MATCH_ORDER[a.tipoPartida] || 99;
            const orderB = MATCH_ORDER[b.tipoPartida] || 99;
            return orderA - orderB;
          });

          setMatches(sortedMatches);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      loadMatches();
    }
  }, [faseId, etapa, chaveIndex]);

  const handlePartidaClick = (partidaId: string) => {
    navigate(`/${temporadaId}/torneio/${torneioId}/fase/${faseId}/bracket/${etapa}/${chaveIndex}/partida/${partidaId}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data a definir';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMatchLabel = (tipo: TipoPartidaEnum) => {
    switch (tipo) {
      case 'MATA_MATA_IDA':
      case 'FINAL_IDA':
        return 'Jogo de Ida';
      case 'MATA_MATA_VOLTA':
      case 'FINAL_VOLTA':
        return 'Jogo de Volta';
      case 'FINAL_UNICA':
        return 'Grande Final';
      case 'MATA_MATA_UNICO':
        return 'Jogo Único';
      case 'DISPUTA_TERCEIRO_LUGAR':
        return 'Disputa de 3º Lugar';
      default:
        return 'Partida';
    }
  };

  const renderPenalties = (match: MatchDetail) => {
    if (!match.houvePenaltis || match.penaltisMandante === null) return null;
    
    return (
      <div style={{ 
        marginTop: '8px', 
        fontSize: '0.85rem', 
        color: 'var(--text-gray)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: '4px 12px',
        borderRadius: '10px'
      }}>
        <span>({match.penaltisMandante})</span>
        <span style={{ fontSize: '0.7rem' }}>Pênaltis</span>
        <span>({match.penaltisVisitante})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 size={48} className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }}>
      <header style={{
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 40px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button 
          onClick={() => navigate(-1)} 
          className="btn-back-custom"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-dark)',
            padding: '10px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div style={{ marginLeft: '24px', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Detalhes do Confronto</h1>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)' }}>
              {etapa?.replace(/_/g, ' ')} • Chave #{chaveIndex}
            </span>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        
        {matches.length === 0 && (
            <div className="empty-state">Nenhuma partida encontrada para este confronto.</div>
        )}

        {matches.map((match) => (
          <div 
            key={match.id} 
            className="details-sectionMatch" 
            onClick={() => handlePartidaClick(match.id)}
            style={{ 
              marginBottom: '30px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-color)',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '6px',
                backgroundColor: match.realizada ? 'var(--success)' : 'var(--primary)'
            }} />

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '15px',
              borderBottom: '1px dashed var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                    fontWeight: 800, 
                    color: 'var(--primary)', 
                    textTransform: 'uppercase', 
                    fontSize: '0.8rem',
                    letterSpacing: '0.5px',
                    backgroundColor: 'rgba(78, 62, 255, 0.1)',
                    padding: '6px 12px',
                    borderRadius: '8px'
                }}>
                    {getMatchLabel(match.tipoPartida)}
                </span>
                {match.realizada && (
                    <span style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--success)', 
                        fontWeight: 700, 
                        border: '1px solid var(--success)',
                        padding: '4px 8px', 
                        borderRadius: '6px' 
                    }}>
                        FINALIZADO
                    </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: 'var(--text-gray)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> {formatDate(match.dataHora)}
                </span>
                {match.estadio && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} /> {match.estadio}
                  </span>
                )}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '10px 0'
            }}>
              
              <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                {match.mandante ? (
                  <>
                    <div style={{ position: 'relative' }}>
                        <img 
                        src={match.mandante.clubeImagem} 
                        alt={match.mandante.clubeNome} 
                        style={{ width: '90px', height: '90px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} 
                        />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: '1.2' }}>{match.mandante.jogadorNome}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginTop: '4px' }}>{match.mandante.clubeNome}</div>
                    </div>
                  </>
                ) : (
                    <span style={{ color: 'var(--text-gray)' }}>Aguardando definição</span>
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px'
              }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '20px', 
                    fontSize: '3rem', 
                    fontWeight: 900,
                    backgroundColor: 'var(--bg-body)',
                    padding: '15px 40px',
                    borderRadius: '24px',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-2px'
                }}>
                    <span style={{ color: match.realizada ? 'var(--text-dark)' : 'var(--text-gray)' }}>
                        {match.realizada && match.golsMandante !== null ? match.golsMandante : '-'}
                    </span>
                    <span style={{ color: 'var(--border-color)', fontSize: '2rem', fontWeight: 300 }}>:</span>
                    <span style={{ color: match.realizada ? 'var(--text-dark)' : 'var(--text-gray)' }}>
                        {match.realizada && match.golsVisitante !== null ? match.golsVisitante : '-'}
                    </span>
                </div>
                {renderPenalties(match)}
              </div>

              <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                {match.visitante ? (
                  <>
                     <div style={{ position: 'relative' }}>
                        <img 
                        src={match.visitante.clubeImagem} 
                        alt={match.visitante.clubeNome} 
                        style={{ width: '90px', height: '90px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} 
                        />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: '1.2' }}>{match.visitante.jogadorNome}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginTop: '4px' }}>{match.visitante.clubeNome}</div>
                    </div>
                  </>
                ) : (
                    <span style={{ color: 'var(--text-gray)' }}>Aguardando definição</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}