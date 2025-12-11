import React, { useState } from 'react';
import { API } from '../services/api';
import './PopupCadastrarJogador.css';

interface JogadorRequest {
  nome: string;
  discord: string;
}

interface PopupCadastrarJogadorProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const PopupCadastrarJogador: React.FC<PopupCadastrarJogadorProps> = ({ onClose, onSuccess }) => {
  const [fadeout, setFadeout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState<JogadorRequest>({
    nome: '',
    discord: ''
  });

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setSuccessMsg('');

    if (!formData.nome.trim() || !formData.discord.trim()) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      await API.post('/jogador/cadastrar', formData);
      setSuccessMsg('Jogador cadastrado com sucesso!');
      
      if (onSuccess) onSuccess();

      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao cadastrar jogador.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content cadastrar-popup-width">
        
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="popup-header-fixed">
            <div className="icon-badge-wrapper-cad">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                 <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                 <circle cx="8.5" cy="7" r="4"></circle>
                 <line x1="20" y1="8" x2="20" y2="14"></line>
                 <line x1="23" y1="11" x2="17" y2="11"></line>
               </svg>
            </div>
            <h2 className="popup-title">Cadastrar Jogador</h2>
            <p className="popup-subtitle">Adicione um novo membro ao sistema</p>
        </div>

        <div className="popup-body-scroll custom-scrollbar">
            <div className="cadastrar-form">
                <div className="form-group">
                    <label htmlFor="nome">Nome do Jogador <span className="required-star">*</span></label>
                    <input 
                        className="cadastrar-input"
                        type="text" 
                        id="nome"
                        name="nome"
                        placeholder="Ex: Daniel Silva"
                        value={formData.nome}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="discord">Discord <span className="required-star">*</span></label>
                    <input 
                        className="cadastrar-input"
                        type="text" 
                        id="discord"
                        name="discord"
                        placeholder="Ex: danielddo"
                        value={formData.discord}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>

                {error && <div className="cadastrar-error-msg">{error}</div>}
                {successMsg && <div className="cadastrar-success-msg">{successMsg}</div>}
            </div>
        </div>

        <div className="popup-footer-fixed">
            <button 
                type="button" 
                className="submit-cad-btn" 
                onClick={handleSubmit} 
                disabled={loading || !!successMsg}
            >
                {loading ? <div className="popup-spinner-small"></div> : 'Confirmar Cadastro'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default PopupCadastrarJogador;