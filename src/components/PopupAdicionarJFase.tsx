import React, { useState, useEffect } from 'react';
import { API } from '../services/api';
import { UserPlus, Search, Info, X, Check } from 'lucide-react';
import './PopupAdicionarJFase.css';

interface JogadorClubeDTO {
  id: string;
  jogadorNome: string;
  clubeNome: string;
  clubeImagem: string;
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
  const [inscritos, setInscritos] = useState<JogadorClubeDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const filteredInscritos = (inscritos || []).filter(i => {
    const nome = i?.jogadorNome?.toLowerCase() || "";
    const clube = i?.clubeNome?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return nome.includes(term) || clube.includes(term);
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredInscritos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInscritos.map(i => i.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    setError('');

    try {
      await Promise.all(
        selectedIds.map(id => 
          API.post('/participacao-fase/add', {
            faseId,
            jogadorClubeId: id
          })
        )
      );
      onSubmit();
      handleClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao adicionar participantes.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
            <h2 className="popup-title">Adicionar Jogadores</h2>
            <p className="popup-subtitle">Selecione os inscritos da temporada para esta fase</p>
          </header>

          <main className="popup-scrollable-area custom-scrollbar">
            <div className="form-layout">
              
              <div className="alert-box">
                <Info size={18} style={{ flexShrink: 0 }} />
                <p>Selecione um ou mais jogadores inscritos na <strong>Temporada</strong>.</p>
              </div>

              <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Buscar Participantes</label>
                  {filteredInscritos.length > 0 && (
                    <button 
                      type="button" 
                      className="field-hint" 
                      onClick={handleSelectAll}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      {selectedIds.length === filteredInscritos.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </button>
                  )}
                </div>
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
                      className={`inscrito-card ${selectedIds.includes(item.id) ? 'selected' : ''}`}
                      onClick={() => toggleSelection(item.id)}
                    >
                      <div className="inscrito-logo">
                        {item.clubeImagem ? <img src={item.clubeImagem} alt="Clube" /> : <UserPlus size={20} />}
                      </div>
                      <div className="inscrito-details">
                        <span className="p-name">{item.jogadorNome || "Sem Nome"}</span>
                        <span className="p-club">{item.clubeNome || "Sem Clube"}</span>
                      </div>
                      {selectedIds.includes(item.id) && <Check size={18} className="check-icon" />}
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
               <span className="field-hint">{selectedIds.length} selecionados</span>
            </div>
            <div className="footer-right">
              <button className="btn-base btn-secondary" onClick={handleClose}>Cancelar</button>
              <button 
                className="btn-base btn-primary" 
                onClick={handleSubmit} 
                disabled={loading || selectedIds.length === 0}
              >
                {loading ? <div className="btn-spinner"></div> : `Adicionar (${selectedIds.length})`}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PopupAdicionarJFase;