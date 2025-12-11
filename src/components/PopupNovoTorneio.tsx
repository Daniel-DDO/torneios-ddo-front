import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { X, Trophy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { API } from '../services/api';
import './PopupNovoTorneio.css'; 

interface PopupNovoTorneioProps {
    onClose: () => void;
    onSubmit: () => void;
}

interface Competicao {
    id: string;
    nome: string;
    imagem: string;
    divisao: string;
    valor: number;
    descricao: string;
}

export default function PopupNovoTorneio({ onClose, onSubmit }: PopupNovoTorneioProps) {
    const { temporadaId } = useParams();
    const [isClosing, setIsClosing] = useState(false);
    
    const [nome, setNome] = useState('');
    const [selectedCompeticaoId, setSelectedCompeticaoId] = useState('');
    
    const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
    const [loadingCompeticoes, setLoadingCompeticoes] = useState(true);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCompeticoes() {
            try {
                const response = await API.get('/competicao/lista-simples');
                if (response.data && response.data.content) {
                    setCompeticoes(response.data.content);
                } else if (Array.isArray(response.data)) {
                    setCompeticoes(response.data);
                }
            } catch (err) {
                console.error(err);
                setError("Não foi possível carregar a lista de competições.");
            } finally {
                setLoadingCompeticoes(false);
            }
        }
        fetchCompeticoes();
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!nome.trim()) {
            setError("O nome do torneio é obrigatório.");
            return;
        }
        if (!selectedCompeticaoId) {
            setError("Selecione uma competição base.");
            return;
        }
        if (!temporadaId) {
            setError("ID da temporada não encontrado.");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const payload = {
                nome: nome,
                temporadaId: temporadaId,
                competicaoId: selectedCompeticaoId
            };

            await API.post('/torneio/criar', payload);
            onSubmit();
            handleClose();
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError("Ocorreu um erro ao criar o torneio. Tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`popup-overlay ${isClosing ? 'fade-out' : ''}`} onClick={handleBackdropClick}>
            <div className="popup-content reivindicar-popup-width">
                <button className="popup-close-btn" onClick={handleClose}>
                    <X size={20} />
                </button>

                <div className="popup-header-fixed">
                    <div className="icon-badge-wrapper">
                        <Trophy size={28} />
                    </div>
                    <h2 className="popup-title">Novo Torneio</h2>
                    <p className="popup-subtitle">Crie um novo torneio para esta temporada</p>
                </div>

                <div className="popup-body-scroll custom-scrollbar">
                    {error && (
                        <div className="reivindicar-error-msg">
                            <AlertCircle size={16} style={{ display: 'inline', marginRight: 5, verticalAlign: 'text-bottom' }} />
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Nome do Torneio <span className="required-star">*</span></label>
                        <input 
                            type="text" 
                            className="reivindicar-input" 
                            placeholder="Ex: Liga Real DDO - 1"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Competição Base <span className="required-star">*</span></label>
                        
                        <div className="competicao-list-wrapper">
                            {loadingCompeticoes ? (
                                <div className="loading-state">
                                    <div className="popup-spinner-small"></div>
                                    <span>Carregando competições...</span>
                                </div>
                            ) : competicoes.length === 0 ? (
                                <div className="empty-state">Nenhuma competição encontrada.</div>
                            ) : (
                                competicoes.map((comp) => (
                                    <div 
                                        key={comp.id} 
                                        className={`competicao-item ${selectedCompeticaoId === comp.id ? 'selected' : ''}`}
                                        onClick={() => !loading && setSelectedCompeticaoId(comp.id)}
                                    >
                                        {selectedCompeticaoId === comp.id && (
                                            <CheckCircle2 size={18} color="#2563eb" className="check-icon" />
                                        )}
                                        
                                        <div className="comp-img-container">
                                            {comp.imagem ? (
                                                <img src={comp.imagem} alt={comp.nome} />
                                            ) : (
                                                <Trophy size={16} color="#999" />
                                            )}
                                        </div>
                                        
                                        <div className="competicao-info">
                                            <span className="competicao-name">{comp.nome}</span>
                                            <span className="competicao-division">
                                                {comp.divisao ? comp.divisao : `Peso: ${comp.valor}`}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="info-box">
                        <div className="info-icon">
                            <AlertCircle size={18} />
                        </div>
                        <p>
                            O torneio será criado vinculado à temporada atual. Certifique-se de escolher a competição correta para definir o peso e as regras.
                        </p>
                    </div>
                </div>

                <div className="popup-footer-fixed">
                    <button 
                        type="button" 
                        className="submit-claim-btn" 
                        onClick={handleSubmit}
                        disabled={loading || loadingCompeticoes}
                    >
                        {loading ? <div className="popup-spinner-small-white"></div> : 'Criar Torneio'}
                    </button>
                </div>
            </div>
        </div>
    );
}