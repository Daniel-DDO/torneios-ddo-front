import { useState, useEffect } from 'react';
import { X, Trophy, Shield, Users, ArrowRight, ArrowLeft, Search, AlertCircle, Crown } from 'lucide-react';
import { API } from '../services/api';
import './PopupCopaReal.css';

interface InscricaoDTO {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  clubeId: string;
  clubeNome: string;
  clubeImagem: string;
}

interface PopupCopaRealProps {
  faseId: string;
  temporadaId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PopupCopaReal({ faseId, temporadaId, onClose, onSuccess }: PopupCopaRealProps) {
  const [loading, setLoading] = useState(false);
  const [fadeout, setFadeout] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  
  const [elite, setElite] = useState<InscricaoDTO[]>([]);
  const [intermediario, setIntermediario] = useState<InscricaoDTO[]>([]);
  const [resto, setResto] = useState<InscricaoDTO[]>([]);

  useEffect(() => {
    const carregarInscritos = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/inscricao/temporada/${temporadaId}`);
        const dados = Array.isArray(response.data) ? response.data : (response.data?.content || []);
        setResto(dados);
      } catch (err) {
        setError("Erro ao carregar lista de jogadores.");
      } finally {
        setLoading(false);
      }
    };

    if (temporadaId) {
      carregarInscritos();
    }
  }, [temporadaId]);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => onClose(), 300);
  };

  const moverJogador = (
    item: InscricaoDTO, 
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
    else if (origem === 'INTER') setIntermediario(prev => prev.filter(p => p.id !== item.id));
    else setResto(prev => prev.filter(p => p.id !== item.id));

    if (destino === 'ELITE') setElite(prev => [...prev, item]);
    else if (destino === 'INTER') setIntermediario(prev => [...prev, item]);
    else setResto(prev => [...prev, item]);
  };

  const handleSubmit = async () => {
    if (elite.length !== 8 || intermediario.length !== 8) {
      setError("Preencha exatamente 8 times na Elite e 8 no Intermediário.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        faseId,
        idsElite: elite.map(p => p.id),
        idsIntermediarios: intermediario.map(p => p.id),
        idsResto: resto.map(p => p.id)
      };

      await API.post('/api/fases/gerar-copa-real', payload);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao gerar Copa Real.");
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
      <div className="popup-content copa-real-mode">
        <button className="popup-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="popup-header-fixed">
          <div className="icon-badge-wrapper fase-badge">
            <Trophy size={28} />
          </div>
          <h2 className="popup-title">Distribuição Copa Real</h2>
          <p className="popup-subtitle">Defina os participantes da Elite, Intermediário e Resto</p>
        </div>

        <div className="popup-body-scroll">
          <div className="copa-real-columns">
            
            <div className="column-pote elite">
              <div className="pote-header elite">
                <Crown size={18} />
                <span>Elite ({elite.length}/8)</span>
              </div>
              <div className="pote-list custom-scrollbar">
                {elite.map(p => (
                  <div key={p.id} className="player-card card-elite">
                    <div className="card-content">
                      {p.clubeImagem && <img src={p.clubeImagem} alt="" className="escudo-img" />}
                      <div className="card-info">
                        <span className="player-name">{p.jogadorNome}</span>
                        <span className="club-name">{p.clubeNome}</span>
                      </div>
                    </div>
                    <button className="move-btn" onClick={() => moverJogador(p, 'ELITE', 'INTER')}>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                ))}
                {Array.from({ length: 8 - elite.length }).map((_, i) => (
                  <div key={i} className="empty-slot">Vazio</div>
                ))}
              </div>
            </div>

            <div className="column-pote inter">
              <div className="pote-header inter">
                <Shield size={18} />
                <span>Intermediário ({intermediario.length}/8)</span>
              </div>
              <div className="pote-list custom-scrollbar">
                {intermediario.map(p => (
                  <div key={p.id} className="player-card card-inter">
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
                {Array.from({ length: 8 - intermediario.length }).map((_, i) => (
                  <div key={i} className="empty-slot">Vazio</div>
                ))}
              </div>
            </div>

            <div className="column-pote resto">
              <div className="pote-header resto">
                <Users size={18} />
                <span>Resto ({filteredResto.length})</span>
              </div>
              <div className="cr-search-container">
                <Search size={16} className="cr-search-icon"/>
                <input 
                  type="text" 
                  className="cr-search-input"
                  placeholder="Buscar jogador ou clube..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="pote-list custom-scrollbar">
                {filteredResto.map(p => (
                  <div key={p.id} className="player-card">
                    <button className="move-btn" onClick={() => moverJogador(p, 'RESTO', 'INTER')}>
                      <ArrowLeft size={16} />
                    </button>
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