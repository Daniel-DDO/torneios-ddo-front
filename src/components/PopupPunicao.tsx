import React, { useState } from 'react';
import { API } from '../services/api';
import './PopupPunicao.css';

interface PopupPunicaoProps {
    target: {
        id: string;
        nome: string;
        clube: string;
    };
    onClose: () => void;
    onSuccess: (dados: any) => void;
}

const PopupPunicao: React.FC<PopupPunicaoProps> = ({ target, onClose, onSuccess }) => {
    const [fadeout, setFadeout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        pontos: '',
        motivo: ''
    });

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setError('');

        if (!formData.pontos || !formData.motivo) {
            setError('Todos os campos são obrigatórios.');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                participacaoFaseId: target.id, 
                pontos: Number(formData.pontos),
                motivo: formData.motivo
            };

            const response = await API.post('/api/punicoes', payload);
            
            setFadeout(true);
            setTimeout(() => {
                onSuccess(response.data);
                onClose();
            }, 300);
        } catch (err: any) {
            console.error("Erro punição:", err);
            const msg = err.response?.data?.erro || err.response?.data?.message || "Erro ao aplicar punição.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`ppu-overlay ${fadeout ? 'ppu-fade-out' : ''}`}>
            <div className="ppu-content">
                <button className="ppu-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="ppu-header">
                    <div className="ppu-icon-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <h2 className="ppu-title">
                        Aplicar Punição
                    </h2>
                </div>

                <div className="ppu-body ppu-scrollbar">
                    <div className="ppu-form">
                        <div className="ppu-form-group">
                            <label>Alvo da Punição</label>
                            <div className="ppu-selected-item-card" style={{cursor: 'default'}}>
                                <div className="ppu-selected-info">
                                    <span style={{fontWeight: 700}}>{target.nome}</span>
                                    <span style={{fontSize: '0.9rem', color: '#666', marginLeft: '8px'}}>{target.clube}</span>
                                </div>
                            </div>
                        </div>

                        <div className="ppu-form-group">
                            <label>Pontos (Penalidade)</label>
                            <input
                                type="number"
                                name="pontos"
                                className="ppu-input"
                                value={formData.pontos}
                                onChange={handleChange}
                                placeholder="Ex: 10"
                            />
                        </div>

                        <div className="ppu-form-group">
                            <label>Motivo</label>
                            <input
                                type="text"
                                name="motivo"
                                className="ppu-input"
                                value={formData.motivo}
                                onChange={handleChange}
                                placeholder="Descreva o motivo da punição"
                            />
                        </div>

                        {error && <div className="ppu-error-msg">{error}</div>}
                    </div>
                </div>

                <div className="ppu-footer">
                    <button 
                        type="button" 
                        className="ppu-btn"
                        onClick={handleSubmit} 
                        disabled={loading}
                    >
                        {loading ? <div className="ppu-spinner"></div> : 'Confirmar Punição'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupPunicao;