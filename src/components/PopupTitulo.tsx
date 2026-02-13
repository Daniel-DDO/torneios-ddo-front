import React, { useState } from 'react';
import { API } from '../services/api';
import './PopupTitulo.css';

interface TituloRequest {
    nome: string;
    valor: number | string;
    descricao: string;
    imagem: string;
    imagemGerarPost: string;
    ativo: boolean;
}

interface PopupTituloProps {
    onClose: () => void;
    onSuccess: (dados: any) => void;
}

const PopupTitulo: React.FC<PopupTituloProps> = ({ onClose, onSuccess }) => {
    const [fadeout, setFadeout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState<TituloRequest>({
        nome: '',
        valor: '',
        descricao: '',
        imagem: '',
        imagemGerarPost: '',
        ativo: true
    });

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
             const checked = (e.target as HTMLInputElement).checked;
             setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
             setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async () => {
        setError('');

        if (!formData.nome.trim()) {
            setError('O nome do título é obrigatório.');
            return;
        }

        if (!formData.imagem.trim()) {
            setError('A URL da imagem (ícone) é obrigatória.');
            return;
        }

        const valorInt = typeof formData.valor === 'string' ? parseInt(formData.valor) : formData.valor;
        if (valorInt === undefined || isNaN(valorInt) || valorInt === null) {
            setError('O valor do título é obrigatório.');
            return;
        }

        setLoading(true);

        const payload = {
            ...formData,
            valor: valorInt
        };

        try {
            const response = await API.post('/titulos', payload);
            setFadeout(true);
            setTimeout(() => {
                onSuccess(response.data);
                onClose();
            }, 300);
        } catch (err: any) {
            const msg = err.response?.data?.erro || err.response?.data?.message || "Erro ao criar título.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`pt-overlay ${fadeout ? 'pt-fade-out' : ''}`}>
            <div className="pt-content">
                <button className="pt-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="pt-header">
                    <div className="pt-icon-badge">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                           <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </div>
                    <h2 className="pt-title">
                        Novo Título
                    </h2>
                </div>

                <div className="pt-body pt-scrollbar">
                    <div className="pt-form">
                        <div className="pt-form-row">
                            <div className="pt-form-group" style={{flex: 2}}>
                                <label>Nome do Título</label>
                                <input
                                    type="text"
                                    name="nome"
                                    className="pt-input"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    placeholder="Ex: Campeão da Copa"
                                    autoFocus
                                />
                            </div>
                            <div className="pt-form-group" style={{flex: 1}}>
                                <label>Valor</label>
                                <input
                                    type="number"
                                    name="valor"
                                    className="pt-input"
                                    value={formData.valor}
                                    onChange={handleChange}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="pt-form-group">
                            <label>URL do Ícone</label>
                            <input
                                type="text"
                                name="imagem"
                                className="pt-input"
                                value={formData.imagem}
                                onChange={handleChange}
                                placeholder="https://... (PNG/SVG)"
                            />
                        </div>

                        <div className="pt-form-group">
                            <label>Background (Post Campeão)</label>
                            <input
                                type="text"
                                name="imagemGerarPost"
                                className="pt-input"
                                value={formData.imagemGerarPost}
                                onChange={handleChange}
                                placeholder="https://... (Opcional)"
                            />
                        </div>

                        <div className="pt-form-group">
                            <label>Descrição</label>
                            <textarea
                                name="descricao"
                                className="pt-textarea"
                                value={formData.descricao}
                                onChange={handleChange}
                                placeholder="Detalhes sobre a conquista..."
                            />
                        </div>

                        <div className="pt-checkbox-wrapper">
                            <input 
                                type="checkbox" 
                                id="ativoCheck"
                                name="ativo"
                                className="pt-checkbox"
                                checked={formData.ativo}
                                onChange={handleChange}
                            />
                            <label htmlFor="ativoCheck" style={{cursor: 'pointer'}}>Título Ativo</label>
                        </div>

                        {error && <div className="pt-error-msg">{error}</div>}
                    </div>
                </div>

                <div className="pt-footer">
                    <button 
                        type="button" 
                        className="pt-btn"
                        onClick={handleSubmit} 
                        disabled={loading}
                    >
                        {loading ? <div className="pt-spinner"></div> : 'Criar Título'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupTitulo;