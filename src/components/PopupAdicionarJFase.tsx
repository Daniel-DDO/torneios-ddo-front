import React, { useState, useEffect } from 'react';
import { API } from '../services/api';
import { UserPlus, Search, Info, X, Check } from 'lucide-react';
import './PopupAdicionarJFase.css';

interface InscritoDTO {
  id: string;
  nomeJogador: string;
  nomeClube: string;
  urlLogoClube: string;
}

interface PopupAdicionarJFaseProps {
  faseId: string;
  temporadaId: string;
  onClose: () => void;
  onSubmit: () => void;
}

const PopupAdicionarJFase: React.FC<PopupAdicionarJFaseProps> = ({ faseId, temporadaId, onClose, onSubmit }) => {
  const [fadeout, setFadeout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [inscritos, setInscritos] = useState<InscritoDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    const fetchInscritos = async () => {
      try {
        const response = await API.get(`/inscricao/temporada/${temporadaId}`);
        const data = Array.isArray(response.data) ? response.data : [];
        setInscritos(data);
      } catch (err) {
        setError("Erro ao carregar lista de inscritos.");
      } finally {
        setFetching(false);
      }
    };
    fetchInscritos();
  }, [temporadaId]);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSubmit = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');

    try {
      await API.post('/participacao-fase/add', {
        faseId,
        jogadorClubeId: selectedId
      });
      onSubmit();
      handleClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao adicionar participante.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredInscritos = (inscritos || []).filter(i => {
    const nome = i?.nomeJogador?.toLowerCase() || "";
    const clube = i?.nomeClube?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return nome.includes(term) || clube.includes(term);
  });

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content add-jfase-width">
        <button className="popup-close-btn" onClick={handleClose}>
          <X size={18} />
        </button>

        <div className={`popup-body-animate ${fadeout ? 'fade-out-content' : ''}`}>
          <header className="popup-header-clean">
            <div className="icon-badge-wrapper credenciais-badge">
              <UserPlus size={28} />
            </div>
            <h2 className="popup-title">Adicionar Jogador</h2>
            <p className="popup-subtitle">Selecione um inscrito da temporada para esta fase</p>
          </header>

          <main className="popup-scrollable-area custom-scrollbar">
            <div className="form-layout">
              
              <div className="alert-box">
                <Info size={18} style={{ flexShrink: 0 }} />
                <p>Apenas jogadores inscritos na <strong>Temporada</strong> podem ser adicionados.</p>
              </div>

              <div className="form-section">
                <label className="form-label">Buscar Participante</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} className="input-icon-left" />
                  <input 
                    type="text" 
                    className="form-input input-with-icon" 
                    placeholder="Nome do jogador ou clube..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="inscritos-grid custom-scrollbar">
                {fetching ? (
                  <div className="list-status">Carregando...</div>
                ) : filteredInscritos.length > 0 ? (
                  filteredInscritos.map((item) => (
                    <div 
                      key={item.id} 
                      className={`inscrito-card ${selectedId === item.id ? 'selected' : ''}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div className="inscrito-logo">
                        {item.urlLogoClube ? <img src={item.urlLogoClube} alt="Clube" /> : <UserPlus size={20} />}
                      </div>
                      <div className="inscrito-details">
                        <span className="p-name">{item.nomeJogador || "Sem Nome"}</span>
                        <span className="p-club">{item.nomeClube || "Sem Clube"}</span>
                      </div>
                      {selectedId === item.id && <Check size={18} className="check-icon" />}
                    </div>
                  ))
                ) : (
                  <div className="list-status">Nenhum jogador encontrado.</div>
                )}
              </div>

              {error && <div className="reivindicar-error-msg">{error}</div>}
            </div>
          </main>

          <footer className="actions-footer">
            <div className="footer-left">
               <span className="field-hint">{inscritos.length} jogadores disponíveis</span>
            </div>
            <div className="footer-right">
              <button className="btn-base btn-secondary" onClick={handleClose}>Cancelar</button>
              <button 
                className="btn-base btn-primary" 
                onClick={handleSubmit} 
                disabled={loading || !selectedId}
              >
                {loading ? <div className="btn-spinner"></div> : 'Adicionar'}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PopupAdicionarJFase;