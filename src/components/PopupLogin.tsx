import React, { useState } from 'react';
import './PopupLogin.css';
import { API } from '../services/api';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const themeColor = 'var(--primary, #007bff)';

  const popupContentStyle = {
    borderColor: themeColor,
    boxShadow: `0 0 20px ${themeColor}40`
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content login-popup-width" style={popupContentStyle}>
        
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={`popup-body-animate ${fadeout ? 'fade-out-content' : ''}`}>
          
          <div className="popup-header-fixed">
            <div className="popup-club-image-wrapper login-icon-wrapper" style={{ borderColor: themeColor }}>
               <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40" color={themeColor}>
                 <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm6 10v8H6v-8h12zm-9-2V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9z"/>
               </svg>
            </div>
            <h2 className="popup-club-name">Bem-vindo</h2>
            <span className="popup-club-league-badge">Faça seu Login</span>
          </div>

          <div className="popup-body-scroll custom-scrollbar">
              <form onSubmit={handleSubmit} className="login-form">
                
                <div className="login-input-group">
                    <label>Login</label>
                    <input 
                        type="text" 
                        placeholder="Seu discord ou email"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        className="login-input"
                        required
                    />
                </div>

                <div className="login-input-group">
                    <label>Senha</label>
                    <div className="password-wrapper">
                        <input 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className="login-input password-input"
                            required
                        />
                        <button 
                            type="button" 
                            className="password-toggle-btn" 
                            onClick={togglePasswordVisibility}
                            title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                            {showPassword ? (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M1 1l22 22"></path>
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {error && <div className="login-error-msg">{error}</div>}

                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? <div className="popup-spinner-small"></div> : 'ENTRAR NA CONTA'}
                </button>

              </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PopupLogin;