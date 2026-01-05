import React, { useState, useEffect, useRef } from 'react';
import { API } from '../services/api';
import { Loader2, User, ShieldAlert, Copy, Check, Search } from 'lucide-react';
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
          console.error(err);
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
      console.error(err);
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
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content admin-popup-width">
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={`popup-body-animate ${fadeout ? 'fade-out-content' : ''}`}>
          
          <div className="popup-header-clean">
            <div className="icon-badge-wrapper admin-badge">
               <ShieldAlert size={28} />
            </div>
            <h2 className="popup-title">Área Administrativa</h2>
            <p className="popup-subtitle">Consulta de PIN de Segurança</p>
          </div>

          <div className="popup-scrollable-area custom-scrollbar form-layout">
            
            {!retrievedPin ? (
              <>
                <div className="form-section relative-section">
                    <label className="form-label">Buscar Jogador</label>
                    <div className="input-icon-wrapper">
                      <Search size={18} className="input-icon" />
                      <input 
                          type="text" 
                          className="form-input with-icon"
                          placeholder="Nome ou Discord..."
                          value={discordTerm}
                          onChange={(e) => {
                            setDiscordTerm(e.target.value);
                            if (selectedPlayer) setSelectedPlayer(null);
                          }}
                          disabled={!hasPermission}
                          autoFocus
                      />
                      {searchLoading && <Loader2 className="input-loader animate-spin" size={16} />}
                    </div>
                    
                    {showSuggestions && (
                      <div className="suggestions-list custom-scrollbar">
                        {searchResults.length > 0 ? (
                          searchResults.map((player) => (
                            <div 
                              key={player.id} 
                              className="suggestion-item"
                              onMouseDown={() => handleSelectPlayer(player)}
                            >
                              <div className="sugg-avatar">
                                <User size={16} />
                              </div>
                              <div className="sugg-info">
                                <span className="sugg-name">{player.nome}</span>
                                <span className="sugg-discord">@{player.discord}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="suggestion-empty">Nenhum jogador encontrado</div>
                        )}
                      </div>
                    )}
                </div>

                {error && <div className="reivindicar-error-msg">{error}</div>}
              </>
            ) : (
              <div className="pin-result-container">
                <div className="pin-display-card">
                  <span className="pin-label">PIN DO JOGADOR</span>
                  <div className="pin-value-row">
                    <span className="pin-value">{retrievedPin}</span>
                    <button className="copy-btn" onClick={handleCopyPin} title="Copiar PIN">
                      {copied ? <Check size={20} color="#10b981" /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                <div className="admin-warning-box">
                  <strong>Atenção!</strong>
                  <p>
                    Olá administrador <span>{currentUser.nome}</span>, envie esse PIN apenas para o 
                    <span className="highlight-discord"> @{selectedPlayer?.discord}</span>.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="actions-footer">
            {!retrievedPin ? (
              <>
                <button 
                    type="button"
                    className="btn-base btn-secondary" 
                    onClick={handleClose}
                    disabled={loading}
                >
                    Cancelar
                </button>
                
                <button 
                    type="button"
                    className="btn-base btn-primary" 
                    onClick={handleConsultar}
                    disabled={loading || !selectedPlayer || !hasPermission}
                >
                    {loading ? <div className="btn-spinner"></div> : 'Consultar PIN'}
                </button>
              </>
            ) : (
              <>
                 <button 
                    type="button"
                    className="btn-base btn-secondary" 
                    onClick={handleReset}
                >
                    Nova Consulta
                </button>
                <button 
                    type="button"
                    className="btn-base btn-primary" 
                    onClick={handleClose}
                >
                    Fechar
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PopupRecSenhaAdm;