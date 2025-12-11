import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { X, Link, Search, User, Shield, Check } from 'lucide-react';
import { API } from '../services/api';
import './PopupJogadorClube.css';

interface PopupJogadorClubeProps {
    onClose: () => void;
}

interface Jogador {
    id: string;
    nome: string;
    discord?: string;
    imagem?: string | null;
}

interface Clube {
    id: string;
    nome: string;
    imagem?: string;
    sigla?: string;
}

const SmartAvatar: React.FC<{ src?: string | null; alt: string; type: 'player' | 'club' }> = ({ src, alt, type }) => {
    const [finalUrl, setFinalUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!src) {
            setFinalUrl(null);
            return;
        }

        if (src.startsWith('http') || src.startsWith('data:')) {
            setFinalUrl(src);
        } else {
            API.get(`/api/avatares/${src}`)
                .then(response => {
                    const data = response.data;
                    if (data && data.url) {
                        setFinalUrl(data.url);
                    }
                })
                .catch(() => setFinalUrl(null));
        }
    }, [src]);

    if (finalUrl) {
        return <img src={finalUrl} alt={alt} />;
    }

    return type === 'player' ? <User size={20} /> : <Shield size={20} />;
};

export default function PopupJogadorClube({ onClose }: PopupJogadorClubeProps) {
    const { temporadaId } = useParams();
    const [fadeout, setFadeout] = useState(false);
    
    const [jogadoresSuggestions, setJogadoresSuggestions] = useState<Jogador[]>([]);
    const [clubesSuggestions, setClubesSuggestions] = useState<Clube[]>([]);
    
    const [selectedJogador, setSelectedJogador] = useState<Jogador | null>(null);
    const [selectedClube, setSelectedClube] = useState<Clube | null>(null);
    
    const [searchJogador, setSearchJogador] = useState('');
    const [searchClube, setSearchClube] = useState('');

    const [loadingJogadores, setLoadingJogadores] = useState(false);
    const [loadingClubes, setLoadingClubes] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchJogador.length >= 3 && !selectedJogador) {
                setLoadingJogadores(true);
                try {
                    const response = await API.get(`/jogador/buscar-autocomplete?termo=${searchJogador}`);
                    const dados = (response && response.data) ? response.data : response;
                    
                    if (Array.isArray(dados)) {
                        setJogadoresSuggestions(dados);
                    } else {
                        setJogadoresSuggestions([]);
                    }
                } catch (err) {
                    setJogadoresSuggestions([]);
                } finally {
                    setLoadingJogadores(false);
                }
            } else if (searchJogador.length < 3) {
                setJogadoresSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchJogador, selectedJogador]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchClube.length >= 3 && !selectedClube) {
                setLoadingClubes(true);
                try {
                    const response = await API.get(`/clube/buscar-autocomplete?termo=${searchClube}`);
                    const dados = (response && response.data) ? response.data : response;

                    if (Array.isArray(dados)) {
                        setClubesSuggestions(dados);
                    } else {
                        setClubesSuggestions([]);
                    }
                } catch (err) {
                    setClubesSuggestions([]);
                } finally {
                    setLoadingClubes(false);
                }
            } else if (searchClube.length < 3) {
                setClubesSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchClube, selectedClube]);

    const handleClose = () => {
        setFadeout(true);
        setTimeout(onClose, 300);
    };

    const handleSelectJogador = (jogador: Jogador) => {
        setSelectedJogador(jogador);
        setSearchJogador(jogador.nome); 
        setJogadoresSuggestions([]); 
    };

    const handleSelectClube = (clube: Clube) => {
        setSelectedClube(clube);
        setSearchClube(clube.nome);
        setClubesSuggestions([]);
    };

    const clearSelectionJogador = () => {
        setSelectedJogador(null);
        setSearchJogador('');
        setJogadoresSuggestions([]);
    };

    const clearSelectionClube = () => {
        setSelectedClube(null);
        setSearchClube('');
        setClubesSuggestions([]);
    };

    const handleSubmit = async () => {
        if (!selectedJogador || !selectedClube) {
            setError("Selecione um jogador e um clube.");
            return;
        }

        if (!temporadaId) {
            setError("ID da temporada não identificado.");
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            await API.post('/inscricao/inscrever', {
                jogadorId: selectedJogador.id,
                clubeId: selectedClube.id,
                temporadaId: temporadaId
            });

            setSuccess("Vinculação realizada com sucesso!");
            
            clearSelectionJogador();
            clearSelectionClube();

        } catch (err: any) {
            const msg = err.response?.data?.message || "Erro ao realizar a vinculação.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
            <div className="popup-content" style={{ maxWidth: '800px', width: '90%' }}>
                <button className="popup-close-btn" onClick={handleClose}>
                    <X size={20} />
                </button>

                <div className="popup-header-clean">
                    <div className="icon-badge-wrapper">
                        <Link size={28} />
                    </div>
                    <h2 className="popup-title">Vincular Jogador</h2>
                    <p className="popup-subtitle">Associe um jogador a um clube nesta temporada</p>
                </div>

                <div className="split-container">
                    
                    <div className="selection-column">
                        <div className="column-header">
                            <span>Buscar Jogador</span>
                        </div>
                        
                        <div className="input-search-wrapper">
                            <Search size={16} className="search-icon-left" />
                            <input 
                                type="text" 
                                className="search-input-modern" 
                                placeholder="Nome ou Discord (3+ letras)" 
                                value={searchJogador}
                                onChange={(e) => {
                                    setSearchJogador(e.target.value);
                                    if (selectedJogador && e.target.value !== selectedJogador.nome) {
                                        setSelectedJogador(null);
                                    }
                                }}
                                disabled={submitting}
                            />
                            {loadingJogadores && <div className="spinner-mini-right"></div>}
                            {selectedJogador && (
                                <button className="clear-selection-btn" onClick={clearSelectionJogador}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {!selectedJogador && jogadoresSuggestions.length > 0 && (
                            <div className="suggestions-dropdown custom-scrollbar">
                                {jogadoresSuggestions.map(jogador => (
                                    <div 
                                        key={jogador.id} 
                                        className="suggestion-item"
                                        onClick={() => handleSelectJogador(jogador)}
                                    >
                                        <div className="sug-avatar">
                                            <SmartAvatar src={jogador.imagem} alt={jogador.nome} type="player" />
                                        </div>
                                        <div className="sug-info">
                                            <span className="sug-name">{jogador.nome}</span>
                                            {jogador.discord && <span className="sug-sub">{jogador.discord}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedJogador && (
                            <div className="selected-card-preview">
                                <div className="scp-avatar">
                                    <SmartAvatar src={selectedJogador.imagem} alt={selectedJogador.nome} type="player" />
                                </div>
                                <div className="scp-info">
                                    <span className="scp-name">{selectedJogador.nome}</span>
                                    <span className="scp-sub">Selecionado</span>
                                </div>
                                <Check size={18} className="scp-check" />
                            </div>
                        )}
                    </div>

                    <div className="selection-column">
                        <div className="column-header">
                            <span>Buscar Clube</span>
                        </div>
                        
                        <div className="input-search-wrapper">
                            <Search size={16} className="search-icon-left" />
                            <input 
                                type="text" 
                                className="search-input-modern" 
                                placeholder="Nome do clube (3+ letras)" 
                                value={searchClube}
                                onChange={(e) => {
                                    setSearchClube(e.target.value);
                                    if (selectedClube && e.target.value !== selectedClube.nome) {
                                        setSelectedClube(null);
                                    }
                                }}
                                disabled={submitting}
                            />
                            {loadingClubes && <div className="spinner-mini-right"></div>}
                            {selectedClube && (
                                <button className="clear-selection-btn" onClick={clearSelectionClube}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {!selectedClube && clubesSuggestions.length > 0 && (
                            <div className="suggestions-dropdown custom-scrollbar">
                                {clubesSuggestions.map(clube => (
                                    <div 
                                        key={clube.id} 
                                        className="suggestion-item"
                                        onClick={() => handleSelectClube(clube)}
                                    >
                                        <div className="sug-avatar">
                                            <SmartAvatar src={clube.imagem} alt={clube.nome} type="club" />
                                        </div>
                                        <div className="sug-info">
                                            <span className="sug-name">{clube.nome}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedClube && (
                            <div className="selected-card-preview">
                                <div className="scp-avatar">
                                    <SmartAvatar src={selectedClube.imagem} alt={selectedClube.nome} type="club" />
                                </div>
                                <div className="scp-info">
                                    <span className="scp-name">{selectedClube.nome}</span>
                                    <span className="scp-sub">Selecionado</span>
                                </div>
                                <Check size={18} className="scp-check" />
                            </div>
                        )}
                    </div>
                </div>

                {error && <div className="reivindicar-error-msg">{error}</div>}
                {success && <div className="success-msg-box">{success}</div>}

                <div className="actions-footer">
                    <div className="footer-left"></div>
                    <div className="footer-right">
                        <button 
                            className="btn-base btn-secondary" 
                            onClick={handleClose}
                        >
                            Fechar
                        </button>
                        
                        <button 
                            className="btn-base btn-primary" 
                            onClick={handleSubmit}
                            disabled={submitting || !selectedJogador || !selectedClube}
                        >
                            {submitting ? <div className="btn-spinner"></div> : 'Confirmar Vinculação'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}