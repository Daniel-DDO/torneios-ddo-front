import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API } from '../services/api';
import './PopupCopaLiga.css';

interface PopupCopaLigaProps {
    onClose: () => void;
    onSubmit: () => void;
}

interface TorneioDTO {
    id: string;
    nome: string;
}

interface FaseDTO {
    id: string;
    nome: string;
    tipoTorneio: string;
}

interface ParticipacaoDTO {
    id: string;
    jogadorNome: string;
    clubeNome: string;
    clubeImagem?: string;
    pontos: number;
    vitorias: number;
    saldoGols: number;
}

const PopupCopaLiga: React.FC<PopupCopaLigaProps> = ({ onClose, onSubmit }) => {
    const { temporadaId, faseId } = useParams();
    const [fadeout, setFadeout] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');

    const [torneios, setTorneios] = useState<TorneioDTO[]>([]);
    const [selectedTorneioId, setSelectedTorneioId] = useState<string>('');

    const [fases, setFases] = useState<FaseDTO[]>([]);
    const [selectedFaseId, setSelectedFaseId] = useState<string>('');
    
    const [participantes, setParticipantes] = useState<ParticipacaoDTO[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        const fetchTorneios = async () => {
            if (!temporadaId) return;
            setFetching(true);
            try {
                const response = await API.get(`/temporada/${temporadaId}/torneios`);
                const lista = Array.isArray(response.data) ? response.data : [];
                setTorneios(lista);
                if (lista.length > 0) {
                    setSelectedTorneioId(lista[0].id);
                }
            } catch (err) {
                console.error(err);
                setError("Erro ao carregar torneios da temporada.");
            } finally {
                setFetching(false);
            }
        };

        if (step === 1) {
            fetchTorneios();
        }
    }, [temporadaId, step]);

    const handleAvancarParaFases = async () => {
        if (!selectedTorneioId) {
            setError("Selecione um torneio.");
            return;
        }
        
        setFetching(true);
        setError('');
        try {
            const response = await API.get(`/fase-torneio/torneio/${selectedTorneioId}`);
            const lista = Array.isArray(response.data) ? response.data : [];
            setFases(lista);
            
            if (lista.length > 0) {
                setSelectedFaseId(lista[0].id);
                setStep(2);
            } else {
                setError("Este torneio não possui fases cadastradas.");
            }
        } catch (err) {
            console.error(err);
            setError("Erro ao buscar fases do torneio.");
        } finally {
            setFetching(false);
        }
    };

    const handleAvancarParaTimes = async () => {
        if (!selectedFaseId) {
            setError("Selecione uma fase de origem.");
            return;
        }

        setFetching(true);
        setError('');
        try {
            const response = await API.get(`/participacao-fase/previa-classificados/${selectedFaseId}`, {
                params: { quantidade: 64 }
            });
            setParticipantes(response.data);
            setStep(3);
        } catch (err) {
            console.error("Erro ao buscar participantes:", err);
            setError("Erro ao carregar lista de times da fase selecionada.");
        } finally {
            setFetching(false);
        }
    };

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                if (prev.length >= 4) return prev;
                return [...prev, id];
            }
        });
    };

    const handleImport = async () => {
        setError('');
        if (!faseId) {
            setError("ID da fase destino não encontrado.");
            return;
        }

        if (selectedIds.length !== 4) {
            setError("Selecione exatamente 4 times para importar.");
            return;
        }

        setLoading(true);

        try {
            await API.post(`/fase-torneio/${faseId}/copa-liga/importar-eliminados`, selectedIds);
            handleClose();
            onSubmit();
        } catch (err: any) {
            const msg = err.response?.data?.erro || err.response?.data || "Erro ao importar eliminados.";
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        if (step === 1) return "1. Selecione o Torneio";
        if (step === 2) return "2. Selecione a Fase";
        return "3. Selecione os Eliminados";
    };

    const getSubtitle = () => {
        if (step === 1) return "Escolha o torneio de origem na temporada atual";
        if (step === 2) return "Escolha a fase de onde virão os times";
        return "Selecione os 4 times para entrar na Copa Liga";
    };

    return (
        <div className={`pocoli-overlay ${fadeout ? 'fade-out' : ''}`}>
            <div className="pocoli-content pocoli-width">
                <button className="pocoli-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="pocoli-header-fixed">
                    <div className="pocoli-icon-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="30" height="30">
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                            <path d="M4 22h16" />
                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                        </svg>
                    </div>
                    <h2 className="pocoli-title">{getTitle()}</h2>
                    <p className="pocoli-subtitle">{getSubtitle()}</p>
                </div>

                <div className="pocoli-body-scroll custom-scrollbar">
                    {fetching && (
                        <div style={{ textAlign: 'center', padding: '30px' }}>
                            <div className="pocoli-spinner" style={{ margin: '0 auto', borderColor: '#8b5cf6', borderTopColor: 'transparent' }}></div>
                            <p style={{ marginTop: '10px', color: '#666' }}>Carregando...</p>
                        </div>
                    )}

                    {!fetching && step === 1 && (
                        <div className="pocoli-list-container">
                             <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--pocoli-text-secondary)', marginBottom: '5px' }}>
                                Torneio:
                            </label>
                            <select 
                                className="pocoli-select"
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '10px',
                                    border: '1px solid var(--pocoli-border)',
                                    backgroundColor: 'var(--pocoli-input-bg)',
                                    color: 'var(--pocoli-input-text)',
                                    fontSize: '1rem', marginBottom: '10px'
                                }}
                                value={selectedTorneioId} 
                                onChange={(e) => setSelectedTorneioId(e.target.value)}
                            >
                                {torneios.map(t => (
                                    <option key={t.id} value={t.id}>{t.nome}</option>
                                ))}
                            </select>
                            {torneios.length === 0 && <p className="pocoli-error-msg">Nenhum torneio encontrado nesta temporada.</p>}
                        </div>
                    )}

                    {!fetching && step === 2 && (
                        <div className="pocoli-list-container">
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--pocoli-text-secondary)', marginBottom: '5px' }}>
                                Fase de Origem:
                            </label>
                            <select 
                                className="pocoli-select"
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '10px',
                                    border: '1px solid var(--pocoli-border)',
                                    backgroundColor: 'var(--pocoli-input-bg)',
                                    color: 'var(--pocoli-input-text)',
                                    fontSize: '1rem', marginBottom: '10px'
                                }}
                                value={selectedFaseId} 
                                onChange={(e) => setSelectedFaseId(e.target.value)}
                            >
                                {fases.map(f => (
                                    <option key={f.id} value={f.id}>{f.nome} ({f.tipoTorneio?.replace('_', ' ')})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!fetching && step === 3 && (
                        <div className="pocoli-list-container">
                            {participantes.map((p) => {
                                const isSelected = selectedIds.includes(p.id);
                                return (
                                    <div 
                                        key={p.id} 
                                        className={`pocoli-item-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleSelection(p.id)}
                                    >
                                        <div className="pocoli-item-info">
                                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                {p.clubeImagem && (
                                                    <img 
                                                        src={p.clubeImagem} 
                                                        alt={p.clubeNome} 
                                                        style={{width: '24px', height: '24px', objectFit: 'contain'}} 
                                                    />
                                                )}
                                                <span className="pocoli-item-name">{p.jogadorNome}</span>
                                            </div>
                                            <span className="pocoli-item-stats">
                                                {p.clubeNome} • {p.pontos} pts • {p.vitorias} vit
                                            </span>
                                        </div>
                                        <div className="pocoli-checkbox">
                                            {isSelected && (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {error && <div className="pocoli-error-msg">{error}</div>}
                </div>

                <div className="pocoli-footer-fixed">
                    {step === 1 && (
                        <button 
                            type="button" 
                            className="pocoli-btn" 
                            onClick={handleAvancarParaFases} 
                            disabled={fetching || !selectedTorneioId}
                        >
                            Próximo
                        </button>
                    )}

                    {step === 2 && (
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <button
                                type="button"
                                className="pocoli-btn"
                                style={{ background: 'var(--pocoli-btn-close-bg)', color: 'var(--pocoli-text-primary)', width: '30%' }}
                                onClick={() => setStep(1)}
                            >
                                Voltar
                            </button>
                            <button 
                                type="button" 
                                className="pocoli-btn" 
                                onClick={handleAvancarParaTimes} 
                                disabled={fetching || !selectedFaseId}
                            >
                                Buscar Times
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                            <div className={`pocoli-counter ${selectedIds.length === 4 ? 'valid' : ''}`}>
                                {selectedIds.length} de 4 selecionados
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    className="pocoli-btn"
                                    style={{ background: 'var(--pocoli-btn-close-bg)', color: 'var(--pocoli-text-primary)', width: '30%' }}
                                    onClick={() => setStep(2)}
                                    disabled={loading}
                                >
                                    Voltar
                                </button>
                                <button 
                                    type="button" 
                                    className="pocoli-btn" 
                                    onClick={handleImport} 
                                    disabled={loading || fetching || selectedIds.length !== 4}
                                >
                                    {loading ? <div className="pocoli-spinner"></div> : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PopupCopaLiga;