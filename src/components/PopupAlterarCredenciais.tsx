import React, { useState } from 'react';
import { API } from '../services/api';
import './PopupAlterarCredenciais.css';

interface PopupAlterarCredenciaisProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PopupAlterarCredenciais: React.FC<PopupAlterarCredenciaisProps> = ({ onClose, onSuccess }) => {
  const [fadeout, setFadeout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!senhaAtual) {
      setError('A senha atual é obrigatória para confirmar as alterações.');
      return;
    }

    if (!novoEmail && !novaSenha) {
      setError('Preencha pelo menos um campo para alterar (Email ou Nova Senha).');
      return;
    }

    if (novaSenha) {
      if (novaSenha.length < 8) {
        setError('A nova senha deve ter no mínimo 8 caracteres.');
        return;
      }
      if (novaSenha !== confirmarNovaSenha) {
        setError('A confirmação da senha não confere.');
        return;
      }
    }

    setLoading(true);

    try {
      await API.put('/jogador/me/credenciais', {
        senhaAtual,
        novoEmail: novoEmail || undefined,
        novaSenha: novaSenha || undefined
      });
      
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Erro ao atualizar credenciais.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content credenciais-popup-width">
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={`popup-body-animate ${fadeout ? 'fade-out-content' : ''}`}>
          
          <div className="popup-header-clean">
            <div className="icon-badge-wrapper credenciais-badge">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                 <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                 <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
               </svg>
            </div>
            <h2 className="popup-title">Segurança</h2>
            <p className="popup-subtitle">Atualize seu email ou senha</p>
          </div>

          <form onSubmit={handleSubmit} className="popup-scrollable-area custom-scrollbar form-layout">
            
            <div className="form-section">
                <label className="form-label">Novo Email</label>
                <input 
                    type="email" 
                    className="form-input"
                    placeholder="exemplo@email.com"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                />
                <span className="field-hint">Deixe em branco se não quiser alterar.</span>
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
                <label className="form-label">Confirmar Nova Senha</label>
                <input 
                    type="password" 
                    className="form-input"
                    placeholder="Repita a nova senha"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    disabled={!novaSenha}
                />
            </div>

            <div className="alert-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <p>Para sua segurança, informe sua senha atual para salvar as alterações.</p>
            </div>

            <div className="form-section required-section">
                <label className="form-label">Senha Atual <span className="req">*</span></label>
                <input 
                    type="password" 
                    className="form-input input-highlight"
                    placeholder="Digite sua senha atual"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                />
            </div>

            {error && <div className="reivindicar-error-msg">{error}</div>}
          </form>

          <div className="actions-footer">
            <div className="footer-left">
            </div>

            <div className="footer-right">
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
                  disabled={loading || !senhaAtual}
              >
                  {loading ? <div className="btn-spinner"></div> : 'Salvar Alterações'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PopupAlterarCredenciais;