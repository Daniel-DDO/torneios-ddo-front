import { useState, useEffect } from 'react';
import { X, Trophy, Shield, Users, ArrowRight, ArrowLeft, Search, AlertCircle, Crown } from 'lucide-react';
import { API } from '../services/api';
import './PopupCopaReal.css';

interface ParticipanteDTO {
  id: string;
  jogadorNome: string;
  clubeNome: string;
  clubeImagem: string;
  posicaoClassificacao?: number;
}

interface PopupCopaRealProps {
  faseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PopupCopaReal({ faseId, onClose, onSuccess }: PopupCopaRealProps) {
  const [loading, setLoading] = useState(false);
  const [fadeout, setFadeout] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  
  const [elite, setElite] = useState<ParticipanteDTO[]>([]);
  const [intermediario, setIntermediario] = useState<ParticipanteDTO[]>([]);
  const [resto, setResto] = useState<ParticipanteDTO[]>([]);

  useEffect(() => {
    const carregarJogadores = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/participacao-fase/fase-a/${faseId}`);
        const dados = response.data;

        const formatados: ParticipanteDTO[] = dados.map((item: any) => ({
          id: item.id,
          jogadorNome: item.jogadorNome,
          clubeNome: item.clubeNome,
          clubeImagem: item.clubeImagem,
          posicaoClassificacao: item.posicaoClassificacao
        }));

        setResto(formatados);

      } catch (err) {
        console.error(err);
        setError('Erro ao carregar jogadores da fase anterior.');
      } finally {
        setLoading(false);
      }
    };

    if (faseId) {
      carregarJogadores();
    }
  }, [faseId]);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => onClose(), 300);
  };

  const moverJogador = (
    item: ParticipanteDTO, 
    origem: 'ELITE' | 'INTER' | 'RESTO', 
    destino: 'ELITE' | 'INTER' | 'RESTO'
  ) => {
    setError('');

    if (destino === 'ELITE' && elite.length >= 8) {
      setError("A Elite já está cheia (máx 8).");
      return;
    }
    if (destino === 'INTER' && intermediario.length >= 8) {
      setError("O Intermediário já está cheio (máx 8).");
      return;
    }

    if (origem === 'ELITE') setElite(prev => prev.filter(p => p.id !== item.id));
    if (origem === 'INTER') setIntermediario(prev => prev.filter(p => p.id !== item.id));
    if (origem === 'RESTO') setResto(prev => prev.filter(p => p.id !== item.id));

    if (destino === 'ELITE') {
      setElite(prev => {
        if (prev.some(p => p.id === item.id)) return prev;
        return [...prev, item];
      });
    }
    if (destino === 'INTER') {
      setIntermediario(prev => {
        if (prev.some(p => p.id === item.id)) return prev;
        return [...prev, item];
      });
    }
    if (destino === 'RESTO') {
      setResto(prev => {
        if (prev.some(p => p.id === item.id)) return prev;
        return [...prev, item];
      });
    }
  };

  const handleSubmit = async () => {
    if (elite.length !== 8 || intermediario.length !== 8) {
      setError("Preencha exatamente 8 times na Elite e 8 no Intermediário.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        faseId: faseId,
        idsElite: elite.map(p => p.id),
        idsIntermediarios: intermediario.map(p => p.id),
        idsResto: resto.map(p => p.id)
      };

      await API.post('/api/fases/gerar-copa-real', payload);
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || "Erro ao gerar Copa Real.");
    } finally {
      setLoading(false);
    }
  };

  const filteredResto = resto.filter(p => {
    const nome = (p.jogadorNome || '').toLowerCase();
    const clube = (p.clubeNome || '').toLowerCase();
    const busca = searchTerm.toLowerCase();
    return nome.includes(busca) || clube.includes(busca);
  });

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className={`popup-content-large ${fadeout ? 'scale-out' : ''}`}>
        
        <div className="popup-header">
          <div className="header-title">
            <Trophy className="header-icon" size={24} />
            <h2>Distribuição Copa Real</h2>
          </div>
          <button className="close-btn" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="copa-real-container">
          
          <div className="column elite-col">
            <div className="col-header">
              <Crown className="col-icon" size={20} color="#FFD700" />
              <h3>Elite ({elite.length}/8)</h3>
            </div>
            <div className="player-list">
              {elite.map(p => (
                <div key={p.id} className="player-card elite-card">
                  <div className="card-content">
                    {p.clubeImagem && <img src={p.clubeImagem} alt="" className="escudo-img" />}
                    <div className="card-info">
                      <span className="player-name">{p.jogadorNome}</span>
                      <span className="club-name">{p.clubeNome}</span>
                    </div>
                  </div>
                  <div className="actions">
                    <button className="move-btn" onClick={() => moverJogador(p, 'ELITE', 'INTER')} title="Mover para Intermediário">
                      <ArrowRight size={16} />
                    </button>
                    <button className="move-btn" onClick={() => moverJogador(p, 'ELITE', 'RESTO')} title="Mover para Resto">
                      <ArrowRight size={16} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                  </div>
                </div>
              ))}
              {elite.length < 8 && Array.from({ length: 8 - elite.length }).map((_, i) => (
                <div key={`empty-elite-${i}`} className="empty-placeholder" style={{padding: '10px', minHeight: '40px'}}>Vazio</div>
              ))}
            </div>
          </div>

          <div className="column inter-col">
            <div className="col-header">
              <Shield className="col-icon" size={20} color="#C0C0C0" />
              <h3>Intermediário ({intermediario.length}/8)</h3>
            </div>
            <div className="player-list">
              {intermediario.map(p => (
                <div key={p.id} className="player-card inter-card">
                  <button className="move-btn" onClick={() => moverJogador(p, 'INTER', 'ELITE')}>
                    <ArrowLeft size={16} />
                  </button>
                  <div className="card-content">
                    {p.clubeImagem && <img src={p.clubeImagem} alt="" className="escudo-img" />}
                    <div className="card-info">
                      <span className="player-name">{p.jogadorNome}</span>
                      <span className="club-name">{p.clubeNome}</span>
                    </div>
                  </div>
                  <button className="move-btn" onClick={() => moverJogador(p, 'INTER', 'RESTO')}>
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}
              {intermediario.length < 8 && Array.from({ length: 8 - intermediario.length }).map((_, i) => (
                <div key={`empty-inter-${i}`} className="empty-placeholder" style={{padding: '10px', minHeight: '40px'}}>Vazio</div>
              ))}
            </div>
          </div>

          <div className="column resto-col">
            <div className="col-header">
              <Users className="col-icon" size={20} />
              <h3>Resto ({filteredResto.length})</h3>
            </div>
            
            <div className="search-box-container">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar jogador..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="player-list-scroll">
              <div className="player-list">
                {filteredResto.map(p => (
                  <div key={p.id} className="player-card resto-card">
                    <div style={{display:'flex', gap:'4px'}}>
                      <button className="move-btn" onClick={() => moverJogador(p, 'RESTO', 'ELITE')} title="Mover para Elite">
                         <Crown size={14} />
                      </button>
                      <button className="move-btn" onClick={() => moverJogador(p, 'RESTO', 'INTER')}>
                        <ArrowLeft size={16} />
                      </button>
                    </div>
                    <div className="card-content">
                      {p.clubeImagem && <img src={p.clubeImagem} alt="" className="escudo-img" />}
                      <div className="card-info">
                        <span className="player-name">{p.jogadorNome}</span>
                        <span className="club-name">{p.clubeNome}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredResto.length === 0 && !loading && (
                   <div style={{ padding: '15px', textAlign: 'center', color: 'var(--pnf-text-secondary)', fontSize: '0.9rem' }}>
                     Nenhum participante encontrado.
                   </div>
                )}
              </div>
            </div>

          </div>
        </div>

        <div className="popup-footer-fixed">
          {error && (
            <div className="error-banner">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          <button 
            className="submit-fase-btn" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <div className="popup-spinner-small"></div> : 'Confirmar e Gerar'}
          </button>
        </div>
      </div>
    </div>
  );
}