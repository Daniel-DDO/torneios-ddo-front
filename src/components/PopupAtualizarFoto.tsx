import React, { useState, useEffect } from 'react';
import { API } from '../services/api';
import './PopupAtualizarFoto.css';

interface PopupAtualizarFotoProps {
  onClose: () => void;
  onUpdateSuccess: (novaUrl: string) => void;
}

const PopupAtualizarFoto: React.FC<PopupAtualizarFotoProps> = ({ onClose, onUpdateSuccess }) => {
  const [fadeout, setFadeout] = useState(false);
  const [loadingAvatares, setLoadingAvatares] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatares, setAvatares] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatares = async () => {
      try {
        const response = await API.get('/api/avatares');
        setAvatares(response.data);
      } catch (err) {
        setError('Não foi possível carregar a galeria de avatares.');
      } finally {
        setLoadingAvatares(false);
      }
    };

    fetchAvatares();
  }, []);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSelect = (url: string) => {
    setSelectedAvatar(url);
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedAvatar) {
      setError('Por favor, selecione uma imagem.');
      return;
    }

    setSaving(true);
    try {
      // Endpoint sugerido para o backend salvar a foto
      await API.put('/jogador/foto', { imagem: selectedAvatar });
      
      onUpdateSuccess(selectedAvatar);
      handleClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao atualizar a foto.";
      setError(msg);
      setSaving(false);
    }
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content foto-popup-width">
        
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={`popup-body-animate ${fadeout ? 'fade-out-content' : ''}`}>
          
          <div className="popup-header-clean">
            <div className="icon-badge-wrapper">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="30" height="30">
                 <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                 <circle cx="12" cy="13" r="4"></circle>
               </svg>
            </div>
            <h2 className="popup-title">Alterar Foto</h2>
            <p className="popup-subtitle">Escolha um avatar da nossa galeria</p>
          </div>

          {loadingAvatares ? (
            <div className="loading-container">
                <div className="popup-spinner-large"></div>
                <p>Carregando galeria...</p>
            </div>
          ) : (
            <>
                <div className="avatar-grid-container custom-scrollbar">
                    {avatares.map((url, index) => (
                        <div 
                            key={index} 
                            className={`avatar-item ${selectedAvatar === url ? 'selected' : ''}`}
                            onClick={() => handleSelect(url)}
                        >
                            <img src={url} alt={`Avatar ${index}`} loading="lazy" />
                            {selectedAvatar === url && (
                                <div className="check-overlay">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="20" height="20">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="avatar-count-info">
                    {avatares.length} avatares disponíveis
                </div>
            </>
          )}

          {error && <div className="reivindicar-error-msg">{error}</div>}

          <div className="actions-footer">
            <button className="btn-cancel" onClick={handleClose}>Cancelar</button>
            <button 
                className="submit-claim-btn btn-save-photo" 
                onClick={handleSubmit}
                disabled={saving || loadingAvatares || !selectedAvatar}
            >
                {saving ? <div className="popup-spinner-small"></div> : 'Salvar Alteração'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PopupAtualizarFoto;