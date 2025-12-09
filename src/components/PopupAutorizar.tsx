import React, { useState, useEffect } from 'react';
import { API } from '../services/api';
import './PopupAutorizar.css';

interface JogadorBusca {
  id: string;
  discord: string;
  nome: string;
  imagem?: string;
}

interface PopupAutorizarProps {
  adminId: string;
  onClose: () => void;
}

const PopupAutorizar: React.FC<PopupAutorizarProps> = ({ adminId, onClose }) => {
  const [fadeout, setFadeout] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<JogadorBusca[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<JogadorBusca | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => onClose(), 300);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 3 && !selectedPlayer) {
        buscarJogadores(searchTerm);
      } else if (searchTerm.length < 3) {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedPlayer]);

  const buscarJogadores = async (termo: string) => {
    setIsSearching(true);
    try {
      const data = await API.get(`/jogador/buscar-autocomplete?termo=${termo}`) as any;
      setSuggestions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlayer = (player: JogadorBusca) => {
    setSelectedPlayer(player);
    setSearchTerm(player.discord);
    setSuggestions([]);
    setErrorMsg(null);
  };

  const clearSelection = () => {
    setSelectedPlayer(null);
    setSearchTerm('');
    setSuggestions([]);
    setGeneratedCode(null);
    setErrorMsg(null);
  };

  const handleGerarCodigo = async () => {
    if (!selectedPlayer) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await API.post('/jogador/gerar-codigo', {
        adminId: adminId,
        jogadorId: selectedPlayer.id
      }) as any;
      
      setGeneratedCode(data);

    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao gerar código";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content autorizar-popup-width">
        
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={`popup-body-animate ${fadeout ? 'fade-out-content' : ''}`}>
          
          <div className="popup-header-clean">
            <div className="icon-badge-wrapper-auth">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                 <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                 <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
               </svg>
            </div>
            <h2 className="popup-title">Gerar Acesso</h2>
            <p className="popup-subtitle">Autorize um jogador a reivindicar sua conta</p>
          </div>

          {!generatedCode ? (
            <div className="auth-search-container">
                <div className="form-group relative-container">
                    <label>Buscar Jogador (Discord)</label>
                    <div className="input-icon-wrap">
                        <input 
                            type="text" 
                            className="autorizar-input"
                            placeholder="Digite o discord (ex: indiomala...)"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (selectedPlayer && e.target.value !== selectedPlayer.discord) {
                                    setSelectedPlayer(null);
                                }
                            }}
                            disabled={isLoading}
                        />
                         <div className="search-icon-right">
                            {isSearching ? <div className="spinner-mini"></div> : (
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            )}
                        </div>
                    </div>

                    {suggestions.length > 0 && !selectedPlayer && (
                        <div className="suggestions-list">
                            {suggestions.map((player) => (
                                <div 
                                    key={player.id} 
                                    className="suggestion-item"
                                    onClick={() => handleSelectPlayer(player)}
                                >
                                    <div className="sug-avatar">
                                        {player.imagem ? <img src={player.imagem} alt="" /> : player.nome.charAt(0)}
                                    </div>
                                    <div className="sug-info">
                                        <span className="sug-discord">{player.discord}</span>
                                        <span className="sug-name">{player.nome}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedPlayer && (
                    <div className="selected-player-card">
                        <div className="sp-content">
                            <span className="sp-label">Selecionado:</span>
                            <span className="sp-value">{selectedPlayer.nome}</span>
                        </div>
                        <button className="sp-remove" onClick={clearSelection}>Trocar</button>
                    </div>
                )}

                {errorMsg && <div className="auth-error-msg">{errorMsg}</div>}

                <button 
                    className="submit-auth-btn"
                    disabled={!selectedPlayer || isLoading}
                    onClick={handleGerarCodigo}
                >
                    {isLoading ? <div className="spinner-small-white"></div> : 'Gerar Código de Segurança'}
                </button>
            </div>
          ) : (
            <div className="code-result-container">
                <div className="success-icon-anim">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <h3>Código Gerado!</h3>
                <p>Envie este código para <strong>{selectedPlayer?.discord}</strong></p>

                <div className="code-display-box" onClick={copyToClipboard}>
                    <span className="the-code">{generatedCode}</span>
                    <button className="copy-btn" title="Copiar">
                        {copySuccess ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        )}
                    </button>
                </div>
                {copySuccess && <span className="copy-feedback">Copiado!</span>}

                <button className="reset-auth-btn" onClick={clearSelection}>
                    Autorizar Outro Jogador
                </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PopupAutorizar;