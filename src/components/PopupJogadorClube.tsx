import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { X, Link, Check, Search, User, Shield } from 'lucide-react';
import { API } from '../services/api';
import './PopupJogadorClube.css';

interface PopupJogadorClubeProps {
    onClose: () => void;
}

interface Jogador {
    id: string;
    nome: string;
    imagem: string | null;
}

interface Clube {
    id: string;
    nome: string;
    imagem: string;
    sigla: string;
}

export default function PopupJogadorClube({ onClose }: PopupJogadorClubeProps) {
    const { temporadaId } = useParams();
    const [fadeout, setFadeout] = useState(false);
    
    const [jogadores, setJogadores] = useState<Jogador[]>([]);
    const [clubes, setClubes] = useState<Clube[]>([]);
    
    const [selectedJogadorId, setSelectedJogadorId] = useState('');
    const [selectedClubeId, setSelectedClubeId] = useState('');
    
    const [searchJogador, setSearchJogador] = useState('');
    const [searchClube, setSearchClube] = useState('');

    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const [resJogadores, resClubes] = await Promise.all([
                    API.get('/jogador/all'),
                    API.get('/clube/all')
                ]);
                
                // Tratando retorno caso venha paginado ou lista direta
                const listaJogadores = Array.isArray(resJogadores.data) ? resJogadores.data : (resJogadores.data.content || []);
                const listaClubes = Array.isArray(resClubes.data) ? resClubes.data : (resClubes.data.content || []);

                setJogadores(listaJogadores);
                setClubes(listaClubes);
            } catch (err) {
                console.error("Erro ao carregar dados", err);
                setError("Não foi possível carregar as listas de jogadores e clubes.");
            } finally {
                setLoadingData(false);
            }
        }
        fetchData();
    }, []);

    const handleClose = () => {
        setFadeout(true);
        setTimeout(onClose, 300);
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleSubmit = async () => {
        if (!selectedJogadorId || !selectedClubeId) {
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
                jogadorId: selectedJogadorId,
                clubeId: selectedClubeId,
                temporadaId: temporadaId
            });

            setSuccess("Vinculação realizada com sucesso!");
            
            // Limpa seleção para permitir nova inserção rápida
            setSelectedJogadorId('');
            setSelectedClubeId('');
            
            // Opcional: fechar após um tempo ou deixar aberto para inserir mais
            // setTimeout(handleClose, 1500); 

        } catch (err: any) {
            const msg = err.response?.data?.message || "Erro ao realizar a vinculação.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredJogadores = jogadores.filter(j => 
        j.nome.toLowerCase().includes(searchJogador.toLowerCase())
    );

    const filteredClubes = clubes.filter(c => 
        c.nome.toLowerCase().includes(searchClube.toLowerCase()) || 
        (c.sigla && c.sigla.toLowerCase().includes(searchClube.toLowerCase()))
    );

    return (
        <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`} onClick={handleBackdropClick}>
            <div className="popup-content">
                <button className="popup-close-btn" onClick={handleClose}>
                    <X size={20} />
                </button>

                <div className="popup-header-clean">
                    <div className="popup-icon-wrapper">
                        <Link size={32} />
                    </div>
                    <h2 className="popup-title">Vincular Jogador</h2>
                    <p className="popup-subtitle">Associe um jogador a um clube nesta temporada</p>
                </div>

                {loadingData ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--pjc-text-secondary)' }}>
                        <div className="spinner" style={{ margin: '0 auto 10px', borderColor: 'var(--pjc-text-secondary)', borderTopColor: 'transparent' }}></div>
                        Carregando dados...
                    </div>
                ) : (
                    <>
                        <div className="split-container">
                            
                            {/* Coluna Jogadores */}
                            <div className="selection-column">
                                <div className="column-header">
                                    <span>Selecione o Jogador</span>
                                    <span style={{fontSize: '0.8rem', color: 'var(--pjc-text-secondary)'}}>{filteredJogadores.length}</span>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#999' }} />
                                    <input 
                                        type="text" 
                                        className="search-input" 
                                        placeholder="Buscar jogador..." 
                                        style={{ paddingLeft: 30 }}
                                        value={searchJogador}
                                        onChange={(e) => setSearchJogador(e.target.value)}
                                    />
                                </div>
                                <div className="list-scroll-area">
                                    {filteredJogadores.map(jogador => (
                                        <div 
                                            key={jogador.id} 
                                            className={`list-item ${selectedJogadorId === jogador.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedJogadorId(jogador.id)}
                                        >
                                            {jogador.imagem ? (
                                                <img src={jogador.imagem} alt={jogador.nome} className="item-avatar" />
                                            ) : (
                                                <div className="item-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee', color: '#666' }}>
                                                    <User size={16} />
                                                </div>
                                            )}
                                            <span className="item-name">{jogador.nome}</span>
                                            {selectedJogadorId === jogador.id && <Check size={16} color="#007bff" style={{ marginLeft: 'auto' }} />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Coluna Clubes */}
                            <div className="selection-column">
                                <div className="column-header">
                                    <span>Selecione o Clube</span>
                                    <span style={{fontSize: '0.8rem', color: 'var(--pjc-text-secondary)'}}>{filteredClubes.length}</span>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#999' }} />
                                    <input 
                                        type="text" 
                                        className="search-input" 
                                        placeholder="Buscar clube..." 
                                        style={{ paddingLeft: 30 }}
                                        value={searchClube}
                                        onChange={(e) => setSearchClube(e.target.value)}
                                    />
                                </div>
                                <div className="list-scroll-area">
                                    {filteredClubes.map(clube => (
                                        <div 
                                            key={clube.id} 
                                            className={`list-item ${selectedClubeId === clube.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedClubeId(clube.id)}
                                        >
                                            {clube.imagem ? (
                                                <img src={clube.imagem} alt={clube.nome} className="item-logo" />
                                            ) : (
                                                <div className="item-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee', color: '#666', borderRadius: '4px' }}>
                                                    <Shield size={16} />
                                                </div>
                                            )}
                                            <span className="item-name">{clube.nome}</span>
                                            {selectedClubeId === clube.id && <Check size={16} color="#007bff" style={{ marginLeft: 'auto' }} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {error && <div className="error-msg">{error}</div>}
                        {success && <div className="success-msg">{success}</div>}

                        <button 
                            className="submit-btn" 
                            onClick={handleSubmit} 
                            disabled={submitting || !selectedJogadorId || !selectedClubeId}
                        >
                            {submitting ? <div className="spinner"></div> : 'Confirmar Vinculação'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}