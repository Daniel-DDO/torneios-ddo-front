import React, { useState } from 'react';
import { API } from '../services/api';
import { Dices, CheckCircle2, X, Info } from 'lucide-react';
import './PopupSorteio.css';

interface PopupSorteioProps {
  faseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PopupSorteio: React.FC<PopupSorteioProps> = ({ faseId, onClose, onSuccess }) => {
  const [fadeout, setFadeout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleConfirmSorteio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await API.post(`/api/fases/${faseId}/gerar`);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erro ao realizar sorteio. Verifique se já existem resultados.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content sorteio-popup-width">
        
        <button className="popup-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="popup-header-fixed">
            <div className={`icon-badge-wrapper ${success ? 'success-badge-bg' : 'season-badge'}`}>
               {success ? <CheckCircle2 size={32} /> : <Dices size={32} />}
            </div>
            <h2 className="popup-title">{success ? 'Sucesso!' : 'Sortear Fase'}</h2>
            <p className="popup-subtitle">
              {success ? 'Os confrontos foram gerados' : 'Gere a estrutura de jogos automaticamente'}
            </p>
        </div>

        <div className="popup-body-scroll custom-scrollbar">
            
            <div className="info-box">
                <div className="info-icon">
                    <Info size={20} />
                </div>
                <p>
                    {success 
                      ? 'A fase foi atualizada com as novas partidas e rodadas.' 
                      : 'Esta ação irá remover sorteios anteriores que não possuam resultados registrados.'}
                </p>
            </div>

            {error && <div className="temporada-error-msg">{error}</div>}

            {loading && (
              <div className="sorteio-status-container">
                <div className="popup-spinner-blue"></div>
                <span>Processando algoritmos...</span>
              </div>
            )}
        </div>

        <div className="popup-footer-fixed">
            {!success && (
              <button 
                type="button" 
                onClick={handleConfirmSorteio} 
                className="submit-season-btn" 
                disabled={loading}
              >
                {loading ? <div className="popup-spinner-small"></div> : 'Confirmar Sorteio'}
              </button>
            )}
            {success && (
              <button type="button" className="submit-season-btn success-btn">
                Concluído
              </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default PopupSorteio;