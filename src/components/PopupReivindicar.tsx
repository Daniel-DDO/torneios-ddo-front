import React, { useState, useEffect } from 'react';
import { API } from '../services/api';
import './PopupReivindicar.css';
import './PopupAutorizar.css';

interface ReivindicarData {
  discord: string;
  codigo: string;
  novoEmail: string;
  novaSenha: string;
}

interface JogadorBusca {
  id: string;
  discord: string;
  nome: string;
  imagem?: string;
}

interface PopupReivindicarProps {
  onClose: () => void;
  onSubmit: (data: ReivindicarData) => void;
}

const SmartAvatar: React.FC<{ src?: string | null; alt: string }> = ({ src, alt }) => {
  const [finalUrl, setFinalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setFinalUrl(null);
      return;
    }

    if (src.startsWith('http') || src.startsWith('data:')) {
      setFinalUrl(src);
    } else {
      API.get(`/api/avatares/${src}`)
        .then(response => {
          const data = response.data;
          if (data && data.url) {
            setFinalUrl(data.url);
          }
        })
        .catch(() => setFinalUrl(null));
    }
  }, [src]);

  if (finalUrl) {
    return <img src={finalUrl} alt={alt} />;
  }

  return <span>{alt.charAt(0).toUpperCase()}</span>;
};

const PopupReivindicar: React.FC<PopupReivindicarProps> = ({ onClose, onSubmit }) => {
  const [fadeout, setFadeout] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [suggestions, setSuggestions] = useState<JogadorBusca[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    discord: '',
    codigo: '',
    novoEmail: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (formData.discord.length >= 3) {
        buscarJogadores(formData.discord);
      } else if (formData.discord.length < 3) {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.discord]);

  const buscarJogadores = async (termo: string) => {
    setIsSearching(true);
    try {
      const response = await API.get(`/jogador/buscar-autocomplete?termo=${termo}`);
      const data = (response && response.data) ? response.data : response;
      if (Array.isArray(data)) {
        setSuggestions(data);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error(error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectPlayer = (player: JogadorBusca) => {
    setFormData(prev => ({
      ...prev,
      discord: player.discord
    }));
    setSuggestions([]);
  };

  const getPasswordStatusClass = () => {
    if (!formData.confirmarSenha) return '';
    return formData.novaSenha === formData.confirmarSenha ? 'input-success' : 'input-error';
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!formData.discord || !formData.codigo || !formData.novaSenha || !formData.confirmarSenha) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (formData.novoEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.novoEmail)) {
        setError("Por favor, insira um endereço de e-mail válido.");
        return;
      }
    }

    if (formData.novaSenha.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (formData.novaSenha !== formData.confirmarSenha) {
      setError("As senhas não coincidem!");
      return;
    }

    setLoading(true);

    const dataToSend: ReivindicarData = {
        discord: formData.discord,
        codigo: formData.codigo,
        novoEmail: formData.novoEmail,
        novaSenha: formData.novaSenha
    };

    try {
        await API.post('/jogador/reivindicar', dataToSend);
        onSubmit(dataToSend);
        handleClose();
    } catch (err: any) {
        const msg = err.response?.data?.message || "Erro ao reivindicar conta. Verifique os dados.";
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content reivindicar-popup-width">
        
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="popup-header-fixed">
          <div className="icon-badge-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <polyline points="17 11 19 13 23 9"></polyline>
            </svg>
          </div>
          <h2 className="popup-title">Reivindicar Conta</h2>
          <p className="popup-subtitle">Vincule seus dados para acessar o painel</p>
        </div>

        <div className="popup-body-scroll custom-scrollbar">
          
          <div className="info-box">
            <div className="info-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <p>
              Para obter o <strong>Código de Segurança</strong>, contate um administrador via Discord.
            </p>
          </div>

          <div className="reivindicar-form">
            <div className="form-row-split">
              <div className="form-group relative-container" style={{ flex: 1 }}>
                <label htmlFor="discord">Discord <span className="required-star">*</span></label>
                <div className="input-icon-wrap">
                  <input 
                    className="reivindicar-input"
                    type="text" 
                    id="discord"
                    name="discord"
                    placeholder="SeuUser"
                    value={formData.discord}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                  <div className="search-icon-right">
                    {isSearching && <div className="spinner-mini"></div>}
                  </div>
                </div>

                {suggestions.length > 0 && (
                  <div className="suggestions-list">
                    {suggestions.map((player) => (
                      <div 
                        key={player.id} 
                        className="suggestion-item"
                        onClick={() => handleSelectPlayer(player)}
                      >
                        <div className="sug-avatar">
                          <SmartAvatar src={player.imagem} alt={player.nome} />
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

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="codigo">Código de Segurança <span className="required-star">*</span></label>
                <input 
                  className="reivindicar-input"
                  type="text" 
                  id="codigo"
                  name="codigo"
                  placeholder="Cole o código"
                  value={formData.codigo}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="novoEmail">Email de Acesso <span className="optional-badge">Opcional</span></label>
              <input 
                className="reivindicar-input"
                type="text" 
                id="novoEmail"
                name="novoEmail"
                placeholder="exemplo@email.com"
                value={formData.novoEmail}
                onChange={handleChange}
              />
            </div>

            <div className="form-row-split">
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="novaSenha">Nova Senha <span className="required-star">*</span></label>
                <div className="password-wrapper">
                  <input 
                    className="reivindicar-input password-field"
                    type={showPassword ? "text" : "password"}
                    id="novaSenha"
                    name="novaSenha"
                    placeholder="Min 8 caracteres"
                    value={formData.novaSenha}
                    onChange={handleChange}
                  />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="confirmarSenha">Confirmar Senha <span className="required-star">*</span></label>
                <div className="password-wrapper">
                  <input 
                    className={`reivindicar-input password-field ${getPasswordStatusClass()}`}
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmarSenha"
                    name="confirmarSenha"
                    placeholder="Repita a senha"
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                  />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="reivindicar-error-msg">{error}</div>}
          </div>
        </div>

        <div className="popup-footer-fixed">
           <button type="button" className="submit-claim-btn" onClick={handleSubmit} disabled={loading}>
             {loading ? <div className="popup-spinner-small"></div> : 'Confirmar e Acessar'}
           </button>
        </div>

      </div>
    </div>
  );
};

export default PopupReivindicar;