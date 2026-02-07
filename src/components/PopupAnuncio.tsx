import React, { useState } from 'react';
import { API } from '../services/api';
import './PopupAnuncio.css';

interface PopupAnuncioProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface AnuncioRequest {
  titulo: string;
  mensagem: string;
  tipoMensagem: string;
  imagem: string;
  dataPostagem: string;
  corMensagem: string;
}

const PopupAnuncio: React.FC<PopupAnuncioProps> = ({ onClose, onSuccess }) => {
  const [fadeout, setFadeout] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  const [formData, setFormData] = useState<AnuncioRequest>({
    titulo: '',
    mensagem: '',
    tipoMensagem: 'INFORMATIVO',
    imagem: '',
    dataPostagem: new Date().toISOString(),
    corMensagem: '#2563eb'
  });

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => onClose(), 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.titulo || !formData.mensagem) {
      setErrorMsg("Título e mensagem são obrigatórios.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const payload = {
        ...formData,
        dataPostagem: new Date().toISOString()
    };

    try {
      await API.post('/anuncios', payload);
      setSuccessMsg(true);
      if (onSuccess) onSuccess();
      setTimeout(() => handleClose(), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao criar anúncio.";
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className={`poan-overlay ${fadeout ? 'poan-fade-out' : ''}`}>
      <div className="poan-content">
        
        <button className="poan-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="poan-header">
            <div className="poan-icon-badge">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36">
                 <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
               </svg>
            </div>
            <h2 className="poan-title">Novo Anúncio</h2>
            <p className="poan-subtitle">Publique uma mensagem para o servidor</p>
        </div>

        <div className="poan-body poan-scrollbar">
            {!successMsg ? (
                <div className="poan-form-container">
                    
                    <div className="poan-form-group">
                        <label>Título</label>
                        <input 
                            type="text" 
                            name="titulo"
                            className="poan-input"
                            placeholder="Ex: Manutenção Programada"
                            value={formData.titulo}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="poan-row">
                        <div className="poan-form-group half">
                            <label>Tipo</label>
                            <select 
                                name="tipoMensagem" 
                                className="poan-input poan-select"
                                value={formData.tipoMensagem}
                                onChange={handleChange}
                                disabled={isLoading}
                            >
                                <option value="INFORMATIVO">Informativo</option>
                                <option value="ALERTA">Alerta</option>
                                <option value="EVENTO">Evento</option>
                                <option value="ATUALIZACAO">Atualização</option>
                            </select>
                        </div>
                        <div className="poan-form-group half">
                             <label>Cor do Destaque</label>
                             <div className="poan-color-wrapper">
                                <input 
                                    type="color" 
                                    name="corMensagem"
                                    className="poan-input-color"
                                    value={formData.corMensagem}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                                <span className="poan-color-label">{formData.corMensagem}</span>
                             </div>
                        </div>
                    </div>

                    <div className="poan-form-group">
                        <label>Mensagem</label>
                        <textarea 
                            name="mensagem"
                            className="poan-input poan-textarea"
                            placeholder="Digite o conteúdo do anúncio..."
                            value={formData.mensagem}
                            onChange={handleChange}
                            disabled={isLoading}
                            rows={5}
                        />
                    </div>

                    <div className="poan-form-group">
                        <label>Imagem (URL Opcional)</label>
                        <input 
                            type="text" 
                            name="imagem"
                            className="poan-input"
                            placeholder="https://..."
                            value={formData.imagem}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>

                    {errorMsg && <div className="poan-error-msg">{errorMsg}</div>}
                </div>
            ) : (
                <div className="poan-success-result">
                    <div className="poan-success-anim">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <h3>Anúncio Publicado!</h3>
                    <p>Sua mensagem foi enviada com sucesso.</p>
                </div>
            )}
        </div>

        <div className="poan-footer">
            {!successMsg && (
                <button 
                    className="poan-btn"
                    disabled={isLoading}
                    onClick={handleSubmit}
                >
                    {isLoading ? <div className="poan-spinner"></div> : 'Publicar Anúncio'}
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default PopupAnuncio;