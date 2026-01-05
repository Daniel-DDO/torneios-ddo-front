import React, { useState, useEffect, useRef } from 'react';
import { API } from '../services/api';
import { Loader2, User, Lock, KeyRound } from 'lucide-react';
import './PopupRecuperarSenha.css';

interface PopupRecuperarSenhaProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface PlayerResult {
  id: string;
  nome: string;
  discord: string;
  imagem?: string;
}

const PopupRecuperarSenha: React.FC<PopupRecuperarSenhaProps> = ({ onClose, onSuccess }) => {
  const [fadeout, setFadeout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [discordTerm, setDiscordTerm] = useState('');
  const [selectedDiscord, setSelectedDiscord] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pin, setPin] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (discordTerm.length >= 3 && discordTerm !== selectedDiscord) {
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
  }, [discordTerm, selectedDiscord]);

  const handleSelectPlayer = (player: PlayerResult) => {
    setDiscordTerm(player.discord);
    setSelectedDiscord(player.discord);
    setShowSuggestions(false);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPin(value);
  };

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedDiscord) {
      setError('Por favor, selecione um jogador através da busca.');
      return;
    }

    if (!pin) {
      setError('O PIN de segurança é obrigatório.');
      return;
    }

    if (!novaSenha || !confirmarNovaSenha) {
      setError('Preencha os campos de senha.');
      return;
    }

    if (novaSenha.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setError('A confirmação da senha não confere.');
      return;
    }

    setLoading(true);

    try {
      await API.post('/jogador/recuperar-senha', {
        discord: selectedDiscord,
        pin: parseInt(pin, 10),
        novaSenha
      });
      
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Erro ao recuperar senha. Verifique o PIN.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content recovering-popup-width">
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={`popup-body-animate ${fadeout ? 'fade-out-content' : ''}`}>
          
          <div className="popup-header-clean">
            <div className="icon-badge-wrapper recovering-badge">
               <Lock size={28} />
            </div>
            <h2 className="popup-title">Recuperar Acesso</h2>
            <p className="popup-subtitle">Informe seu Discord e PIN de segurança</p>
          </div>

          <form onSubmit={handleSubmit} className="popup-scrollable-area custom-scrollbar form-layout">
            
            <div className="form-section relative-section">
                <label className="form-label">Buscar Jogador (Discord/Nome)</label>
                <div className="input-icon-wrapper">
                  <User size={18} className="input-icon" />
                  <input 
                      type="text" 
                      className="form-input with-icon"
                      placeholder="Digite para buscar..."
                      value={discordTerm}
                      onChange={(e) => {
                        setDiscordTerm(e.target.value);
                        if (selectedDiscord && e.target.value !== selectedDiscord) {
                          setSelectedDiscord('');
                        }
                      }}
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
                            {player.nome.charAt(0).toUpperCase()}
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

            <div className="form-section">
                <label className="form-label">PIN de Segurança</label>
                <div className="input-icon-wrapper">
                  <KeyRound size={18} className="input-icon" />
                  <input 
                      type="text" 
                      inputMode="numeric"
                      className="form-input with-icon"
                      placeholder="Apenas números"
                      value={pin}
                      onChange={handlePinChange}
                      maxLength={15}
                  />
                </div>
            </div>

            <div className="form-divider"></div>

            <div className="form-section">
                <label className="form-label">Nova Senha</label>
                <input 
                    type="password" 
                    className="form-input"
                    placeholder="Mínimo 8 caracteres"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                />
            </div>

            <div className="form-section">
                <label className="form-label">Confirmar Senha</label>
                <input 
                    type="password" 
                    className="form-input"
                    placeholder="Repita a nova senha"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                />
            </div>

            {error && <div className="reivindicar-error-msg">{error}</div>}
          </form>

          <div className="actions-footer">
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
                onClick={handleSubmit}
                disabled={loading || !selectedDiscord || !pin || !novaSenha}
            >
                {loading ? <div className="btn-spinner"></div> : 'Redefinir Senha'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PopupRecuperarSenha;