import React, { useState } from 'react';
import { API } from '../services/api';
import './PopupNovaTemporada.css';

interface TemporadaData {
  nome: string;
  dataInicio: string;
  dataFim: string;
}

interface PopupNovaTemporadaProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const PopupNovaTemporada: React.FC<PopupNovaTemporadaProps> = ({ onClose, onSubmit }) => {
  const [fadeout, setFadeout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<TemporadaData>({
    nome: '',
    dataInicio: '',
    dataFim: ''
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nome || !formData.dataInicio || !formData.dataFim) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (new Date(formData.dataFim) < new Date(formData.dataInicio)) {
      setError("A data final não pode ser anterior à data inicial.");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post('/temporada/criar', formData);
      onSubmit(response.data);
      handleClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao criar temporada. Verifique os dados.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content temporada-popup-width">
        
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="popup-header-fixed">
            <div className="icon-badge-wrapper season-badge">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                 <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                 <line x1="16" y1="2" x2="16" y2="6"></line>
                 <line x1="8" y1="2" x2="8" y2="6"></line>
                 <line x1="3" y1="10" x2="21" y2="10"></line>
               </svg>
            </div>
            <h2 className="popup-title">Nova Temporada</h2>
            <p className="popup-subtitle">Defina o período e nome da nova etapa</p>
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
                    Ao criar uma nova temporada, ela será definida como ativa.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="nova-temporada-form" id="form-temporada">
                <div className="form-group">
                    <label htmlFor="nome">Nome da Temporada <span className="required-star">*</span></label>
                    <input 
                        className="nova-temporada-input"
                        type="text" 
                        id="nome"
                        name="nome"
                        placeholder="Ex: Temporada 01/2026"
                        value={formData.nome}
                        onChange={handleChange}
                        autoComplete="off"
                        required
                    />
                </div>

                <div className="form-row-split">
                    <div className="form-group">
                        <label htmlFor="dataInicio">Data Início <span className="required-star">*</span></label>
                        <input 
                            className="nova-temporada-input"
                            type="date" 
                            id="dataInicio"
                            name="dataInicio"
                            value={formData.dataInicio}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="dataFim">Data Fim <span className="required-star">*</span></label>
                        <input 
                            className="nova-temporada-input"
                            type="date" 
                            id="dataFim"
                            name="dataFim"
                            value={formData.dataFim}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {error && <div className="temporada-error-msg">{error}</div>}
            </form>
        </div>

        <div className="popup-footer-fixed">
            <button type="submit" form="form-temporada" className="submit-season-btn" disabled={loading}>
                {loading ? <div className="popup-spinner-small"></div> : 'Criar Temporada'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default PopupNovaTemporada;