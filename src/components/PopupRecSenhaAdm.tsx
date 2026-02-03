import React, { useState, useEffect, useRef } from 'react';
import { API } from '../services/api';
import './PopupRecSenhaAdm.css';

interface UserData {
  id: string;
  nome: string;
  cargo: 'PROPRIETARIO' | 'DIRETOR' | 'ADMINISTRADOR' | 'JOGADOR';
}

interface PopupRecSenhaAdmProps {
  currentUser: UserData;
  onClose: () => void;
}

interface PlayerResult {
  id: string;
  nome: string;
  discord: string;
}

const PopupRecSenhaAdm: React.FC<PopupRecSenhaAdmProps> = ({ currentUser, onClose }) => {
  const [fadeout, setFadeout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState(false);

  const [discordTerm, setDiscordTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerResult | null>(null);
  const [searchResults, setSearchResults] = useState<PlayerResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [retrievedPin, setRetrievedPin] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const allowedRoles = ['DIRETOR', 'PROPRIETARIO'];
    if (allowedRoles.includes(currentUser.cargo)) {
      setHasPermission(true);
    } else {
      setError('Apenas DIRETOR ou PROPRIETÁRIO podem consultar PINs.');
    }
  }, [currentUser]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (discordTerm.length >= 3 && (!selectedPlayer || discordTerm !== selectedPlayer.discord)) {
      setSearchLoading(true);
      setShowSuggestions(true);
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await API.get('/jogador/search', {
            params: { termo: discordTerm }
          });
          setSearchResults(response.data || []);
        } catch (err) {
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 500);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, [discordTerm, selectedPlayer]);

  const handleSelectPlayer = (player: PlayerResult) => {
    setDiscordTerm(player.discord);
    setSelectedPlayer(player);
    setShowSuggestions(false);
    setError('');
  };

  const clearSelection = () => {
    setSelectedPlayer(null);
    setDiscordTerm('');
    setSearchResults([]);
    setRetrievedPin(null);
    setError('');
  };

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleConsultar = async () => {
    if (!hasPermission) return;
    if (!selectedPlayer) {
      setError('Selecione um jogador para consultar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await API.get('/jogador/pin', {
        params: {
          adminId: currentUser.id,
          jogadorId: selectedPlayer.id
        }
      });
      
      setRetrievedPin(response.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao consultar PIN.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPin = () => {
    if (retrievedPin) {
      navigator.clipboard.writeText(retrievedPin.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setRetrievedPin(null);
    setSelectedPlayer(null);
    setDiscordTerm('');
    setError('');
  };

  return (
    <div className={`precsenadm-overlay ${fadeout ? 'precsenadm-fade-out' : ''}`}>
      <div className="precsenadm-content">
        <button className="precsenadm-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="precsenadm-header">
            <div className="precsenadm-icon-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
            </div>
            <h2 className="precsenadm-title">Área Administrativa</h2>
            <p className="precsenadm-subtitle">Consulta de PIN de Segurança</p>
        </div>

        <div className="precsenadm-body precsenadm-scrollbar">
            
            {!retrievedPin ? (
              <div className="precsenadm-search-container">
                
                <div className="precsenadm-form-group">
                    <label>Buscar Jogador</label>
                    <div className="precsenadm-input-wrap">
                      <input 
                          type="text" 
                          className="precsenadm-input"
                          placeholder="Nome ou Discord..."
                          value={discordTerm}
                          onChange={(e) => {
                            setDiscordTerm(e.target.value);
                            if (selectedPlayer && e.target.value !== selectedPlayer.discord) {
                                setSelectedPlayer(null);
                            }
                          }}
                          disabled={!hasPermission}
                          autoFocus
                      />
                      <div className="precsenadm-search-icon">
                        {searchLoading ? <div className="precsenadm-spinner-blue"></div> : (
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        )}
                      </div>
                    </div>
                    
                    {showSuggestions && (
                      <div className="precsenadm-suggestions-list precsenadm-scrollbar">
                        {searchResults.length > 0 ? (
                          searchResults.map((player) => (
                            <div 
                              key={player.id} 
                              className="precsenadm-suggestion-item"
                              onMouseDown={() => handleSelectPlayer(player)}
                            >
                              <div className="precsenadm-sug-avatar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                              </div>
                              <div className="precsenadm-sug-info">
                                <span className="precsenadm-sug-name">{player.nome}</span>
                                <span className="precsenadm-sug-discord">@{player.discord}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="precsenadm-empty">Nenhum jogador encontrado</div>
                        )}
                      </div>
                    )}
                </div>

                {selectedPlayer && (
                    <div className="precsenadm-selected-card">
                        <div className="precsenadm-sp-content">
                            <span className="precsenadm-sp-label">Selecionado:</span>
                            <span className="precsenadm-sp-value">{selectedPlayer.nome}</span>
                        </div>
                        <button className="precsenadm-sp-remove" onClick={clearSelection}>Trocar</button>
                    </div>
                )}

                {error && <div className="precsenadm-error-msg">{error}</div>}
              </div>
            ) : (
              <div className="precsenadm-pin-result">
                <div className="precsenadm-pin-box">
                  <span className="precsenadm-pin-label">PIN DO JOGADOR</span>
                  <div className="precsenadm-pin-row">
                    <span className="precsenadm-pin-value">{retrievedPin}</span>
                    <button className="precsenadm-copy-btn" onClick={handleCopyPin} title="Copiar PIN">
                      {copied ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="precsenadm-warning-box">
                  <strong>Atenção!</strong>
                  <p>
                    Olá {currentUser.nome}, envie esse PIN apenas para o 
                    <span className="precsenadm-highlight"> @{selectedPlayer?.discord}</span>.
                  </p>
                </div>
              </div>
            )}
        </div>

        <div className="precsenadm-footer">
            {!retrievedPin ? (
              <>
                <button 
                    type="button"
                    className="precsenadm-btn secondary" 
                    onClick={handleClose}
                    disabled={loading}
                >
                    Cancelar
                </button>
                
                <button 
                    type="button"
                    className="precsenadm-btn" 
                    onClick={handleConsultar}
                    disabled={loading || !selectedPlayer || !hasPermission}
                >
                    {loading ? <div className="precsenadm-spinner"></div> : 'Consultar PIN'}
                </button>
              </>
            ) : (
              <>
                 <button 
                    type="button"
                    className="precsenadm-btn secondary" 
                    onClick={handleReset}
                >
                    Nova Consulta
                </button>
                <button 
                    type="button"
                    className="precsenadm-btn" 
                    onClick={handleClose}
                >
                    Fechar
                </button>
              </>
            )}
        </div>

      </div>
    </div>
  );
};

export default PopupRecSenhaAdm;