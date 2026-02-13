import React, { useState } from 'react';
import { API } from '../services/api';
import './PopupCompeticao.css';

interface CompeticaoForm {
    nome: string;
    imagem: string;
    divisao: string;
    valor: number | string;
    descricao: string;
}

interface PopupCompeticaoProps {
    onClose: () => void;
    onSuccess: (dados: any) => void;
}

const PopupCompeticao: React.FC<PopupCompeticaoProps> = ({ onClose, onSuccess }) => {
    const [fadeout, setFadeout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState<CompeticaoForm>({
        nome: '',
        imagem: '',
        divisao: '',
        valor: '',
        descricao: ''
    });

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        setError('');

        if (!formData.nome.trim()) {
            setError('O nome da competição é obrigatório.');
            return;
        }

        const valorInt = typeof formData.valor === 'string' ? parseInt(formData.valor) : formData.valor;
        if (valorInt && (valorInt < 0 || valorInt > 100)) {
            setError('O valor deve ser entre 0 e 100.');
            return;
        }

        setLoading(true);

        const payload = {
            ...formData,
            valor: valorInt ? valorInt : 0
        };

        try {
            const response = await API.post('/competicao/cadastrar', payload);
            setFadeout(true);
            setTimeout(() => {
                onSuccess(response.data);
                onClose();
            }, 300);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Erro ao cadastrar competição.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`pc-overlay ${fadeout ? 'pc-fade-out' : ''}`}>
            <div className="pc-content">
                <button className="pc-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="pc-header">
                    <div className="pc-icon-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                            <path d="M4 22h16" />
                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                        </svg>
                    </div>
                    <h2 className="pc-title">
                        Nova Competição
                    </h2>
                </div>

                <div className="pc-body pc-scrollbar">
                    <div className="pc-form">
                        <div className="pc-form-group">
                            <label>Nome da Competição</label>
                            <input
                                type="text"
                                name="nome"
                                className="pc-input"
                                value={formData.nome}
                                onChange={handleChange}
                                placeholder="Ex: Champions League"
                                autoFocus
                            />
                        </div>

                        <div className="pc-form-row">
                            <div className="pc-form-group">
                                <label>Divisão</label>
                                <input
                                    type="text"
                                    name="divisao"
                                    className="pc-input"
                                    value={formData.divisao}
                                    onChange={handleChange}
                                    placeholder="Ex: Série A"
                                />
                            </div>
                            <div className="pc-form-group">
                                <label>Valor (Peso 0-100)</label>
                                <input
                                    type="number"
                                    name="valor"
                                    className="pc-input"
                                    value={formData.valor}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>

                        <div className="pc-form-group">
                            <label>URL da Imagem</label>
                            <input
                                type="text"
                                name="imagem"
                                className="pc-input"
                                value={formData.imagem}
                                onChange={handleChange}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="pc-form-group">
                            <label>Descrição</label>
                            <textarea
                                name="descricao"
                                className="pc-textarea"
                                value={formData.descricao}
                                onChange={handleChange}
                                placeholder="Detalhes sobre a competição..."
                            />
                        </div>

                        {error && <div className="pc-error-msg">{error}</div>}
                    </div>
                </div>

                <div className="pc-footer">
                    <button 
                        type="button" 
                        className="pc-btn"
                        onClick={handleSubmit} 
                        disabled={loading}
                    >
                        {loading ? <div className="pc-spinner"></div> : 'Cadastrar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupCompeticao;