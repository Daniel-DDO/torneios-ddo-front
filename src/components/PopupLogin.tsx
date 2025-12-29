import React, { useState } from 'react';
import { API } from '../services/api';
import './PopupLogin.css';

interface PopupLoginProps {
  onClose: () => void;
  onLoginSuccess: (userData: any) => void;
}

const PopupLogin: React.FC<PopupLoginProps> = ({ onClose, onLoginSuccess }) => {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fadeout, setFadeout] = useState(false);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!login || !senha) {
      setError('Preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      const response = await API.post('/jogador/login', {
        login: login,
        senha: senha
      });

      const data = response.data;

      localStorage.setItem('token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.jogador));

      setFadeout(true);
      setTimeout(() => {
        onLoginSuccess(data.jogador);
        onClose();
      }, 300);

    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao realizar login.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content login-popup-width">
        
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="popup-header-fixed">
          <div className="icon-badge-wrapper">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
               <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
               <circle cx="12" cy="7" r="4"></circle>
             </svg>
          </div>
          <h2 className="popup-title">Bem-vindo</h2>
          <p className="popup-subtitle">Faça login para gerenciar sua carreira</p>
        </div>

        <div className="popup-body-scroll custom-scrollbar">
          <div className="reivindicar-form" onKeyDown={handleKeyDown}>
            
            <div className="form-group">
                <label htmlFor="login">Login <span className="required-star">*</span></label>
                <div className="input-icon-wrap">
                  <input 
                    className="reivindicar-input"
                    type="text" 
                    id="login"
                    placeholder="Discord ou E-mail"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    autoFocus
                  />
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="senha">Senha <span className="required-star">*</span></label>
                <div className="password-wrapper">
                    <input 
                      className="reivindicar-input password-field"
                      type={showPassword ? 'text' : 'password'}
                      id="senha"
                      placeholder="Sua senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
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

            {error && <div className="reivindicar-error-msg">{error}</div>}
          </div>
        </div>

        <div className="popup-footer-fixed">
           <button type="button" className="submit-claim-btn" onClick={handleSubmit} disabled={loading}>
             {loading ? <div className="popup-spinner-small"></div> : 'ENTRAR NA CONTA'}
           </button>
        </div>

      </div>
    </div>
  );
};

export default PopupLogin;