import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { API } from '../services/api';
import './PopupSorteioJogClube.css';

interface JogadorSugestao {
    id: string;
    nome: string;
    discord: string;
    imagem: string;
}

interface ClubeSugestao {
    id: string;
    nome: string;
    imagem: string;
    sigla: string;
}

interface SorteioResultadoDTO {
    jogadorId: string;
    jogadorNome: string;
    clubeId: string;
    clubeNome: string;
    clubeImagem: string;
}

interface PopupSorteioJogClubeProps {
    onClose: () => void;
    onSuccess: () => void;
}

const PopupSorteioJogClube: React.FC<PopupSorteioJogClubeProps> = ({ onClose, onSuccess }) => {
    const { temporadaId } = useParams();
    const [fadeout, setFadeout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<1 | 2>(1);
    
    const [termoJogador, setTermoJogador] = useState('');
    const [sugestoesJogadores, setSugestoesJogadores] = useState<JogadorSugestao[]>([]);
    const [jogadoresSelecionados, setJogadoresSelecionados] = useState<JogadorSugestao[]>([]);

    const [termoClube, setTermoClube] = useState('');
    const [sugestoesClubes, setSugestoesClubes] = useState<ClubeSugestao[]>([]);
    const [clubesSelecionados, setClubesSelecionados] = useState<ClubeSugestao[]>([]);

    const [resultadoSorteio, setResultadoSorteio] = useState<SorteioResultadoDTO[]>([]);

    const handleSearchJogador = async (termo: string) => {
        setTermoJogador(termo);
        if (termo.length < 3) {
            setSugestoesJogadores([]);
            return;
        }
        try {
            const response = await API.get(`/jogador/buscar-autocomplete?termo=${termo}`);
            setSugestoesJogadores(response.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearchClube = async (termo: string) => {
        setTermoClube(termo);
        if (termo.length < 2) {
            setSugestoesClubes([]);
            return;
        }
        try {
            const response = await API.get(`/clube/buscar-autocomplete?termo=${termo}`);
            setSugestoesClubes(response.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const selecionarJogador = (jogador: JogadorSugestao) => {
        if (!jogadoresSelecionados.some(j => j.id === jogador.id)) {
            setJogadoresSelecionados(prev => [...prev, jogador]);
        }
        setTermoJogador('');
        setSugestoesJogadores([]);
    };

    const removerJogador = (id: string) => {
        setJogadoresSelecionados(prev => prev.filter(j => j.id !== id));
    };

    const selecionarClube = (clube: ClubeSugestao) => {
        if (!clubesSelecionados.some(c => c.id === clube.id)) {
            setClubesSelecionados(prev => [...prev, clube]);
        }
        setTermoClube('');
        setSugestoesClubes([]);
    };

    const removerClube = (id: string) => {
        setClubesSelecionados(prev => prev.filter(c => c.id !== id));
    };

    const handleSimular = async () => {
        setError('');
        if (!temporadaId) {
            setError('ID da Temporada não encontrado na URL.');
            return;
        }
        if (jogadoresSelecionados.length === 0 || clubesSelecionados.length === 0) {
            setError('Selecione jogadores e clubes.');
            return;
        }
        
        setLoading(true);
        try {
            const payload = {
                temporadaId,
                jogadoresIds: jogadoresSelecionados.map(j => j.id),
                clubesIds: clubesSelecionados.map(c => c.id)
            };
            
            const response = await API.post('/inscricao/sorteio/simular', payload);
            setResultadoSorteio(response.data || []);
            setStep(2);
        } catch (err: any) {
            setError('Erro ao simular sorteio.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmar = async () => {
        setLoading(true);
        try {
            const inscricoes = resultadoSorteio.map(r => ({
                jogadorId: r.jogadorId,
                clubeId: r.clubeId
            }));

            const payload = {
                temporadaId,
                inscricoes
            };

            await API.post('/inscricao/sorteio/confirmar', payload);
            
            setFadeout(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 300);
        } catch (err: any) {
            setError('Erro ao confirmar sorteio.');
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    return (
        <div className={`psjc-overlay ${fadeout ? 'psjc-fade-out' : ''}`}>
            <div className="psjc-content">
                <button className="psjc-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="psjc-header">
                    <div className="psjc-icon-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                           <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                           <line x1="12" y1="4" x2="12" y2="20"></line>
                        </svg>
                    </div>
                    <h2 className="psjc-title">
                        {step === 1 ? 'Sorteio de Times' : 'Confirmar Sorteio'}
                    </h2>
                </div>

                <div className="psjc-body psjc-scrollbar">
                    {step === 1 && (
                        <div className="psjc-form">
                            <div className="psjc-columns">
                                <div className="psjc-column">
                                    <div className="psjc-column-header">
                                        <h3>Jogadores ({jogadoresSelecionados.length})</h3>
                                    </div>
                                    <div className="psjc-search-container">
                                        <input 
                                            type="text" 
                                            className="psjc-input"
                                            placeholder="Adicionar jogador..."
                                            value={termoJogador}
                                            onChange={(e) => handleSearchJogador(e.target.value)}
                                        />
                                        {sugestoesJogadores.length > 0 && (
                                            <ul className="psjc-suggestions-list psjc-scrollbar">
                                                {sugestoesJogadores.map(j => (
                                                    <li 
                                                        key={j.id} 
                                                        className="psjc-suggestion-item"
                                                        onClick={() => selecionarJogador(j)}
                                                    >
                                                        {j.imagem && <img src={j.imagem} alt="" className="psjc-suggestion-avatar"/>}
                                                        <span>{j.nome}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div className="psjc-list psjc-scrollbar">
                                        {jogadoresSelecionados.map(j => (
                                            <div key={j.id} className="psjc-list-item">
                                                <div className="psjc-item-info">
                                                    {j.imagem && <img src={j.imagem} alt="" className="psjc-item-avatar"/>}
                                                    <span>{j.nome}</span>
                                                </div>
                                                <button onClick={() => removerJogador(j.id)} className="psjc-remove-mini">
                                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="psjc-column">
                                    <div className="psjc-column-header">
                                        <h3>Clubes ({clubesSelecionados.length})</h3>
                                    </div>
                                    <div className="psjc-search-container">
                                        <input 
                                            type="text" 
                                            className="psjc-input"
                                            placeholder="Adicionar clube..."
                                            value={termoClube}
                                            onChange={(e) => handleSearchClube(e.target.value)}
                                        />
                                        {sugestoesClubes.length > 0 && (
                                            <ul className="psjc-suggestions-list psjc-scrollbar">
                                                {sugestoesClubes.map(c => (
                                                    <li 
                                                        key={c.id} 
                                                        className="psjc-suggestion-item"
                                                        onClick={() => selecionarClube(c)}
                                                    >
                                                        {c.imagem && <img src={c.imagem} alt="" className="psjc-suggestion-avatar"/>}
                                                        <span>{c.nome} ({c.sigla})</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div className="psjc-list psjc-scrollbar">
                                        {clubesSelecionados.map(c => (
                                            <div key={c.id} className="psjc-list-item">
                                                <div className="psjc-item-info">
                                                    {c.imagem && <img src={c.imagem} alt="" className="psjc-item-avatar"/>}
                                                    <span>{c.nome}</span>
                                                </div>
                                                <button onClick={() => removerClube(c.id)} className="psjc-remove-mini">
                                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="psjc-results-container">
                             <div className="psjc-match-grid psjc-scrollbar">
                                {resultadoSorteio.map((res, index) => (
                                    <div key={index} className="psjc-match-card">
                                        <div className="psjc-match-side">
                                            <span>{res.jogadorNome}</span>
                                        </div>
                                        <div className="psjc-match-vs">COM</div>
                                        <div className="psjc-match-side">
                                            {res.clubeImagem && <img src={res.clubeImagem} alt="" className="psjc-match-logo"/>}
                                            <span>{res.clubeNome}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <div className="psjc-error-msg">{error}</div>}
                </div>

                <div className="psjc-footer">
                    {step === 2 && (
                        <button 
                            type="button" 
                            className="psjc-btn psjc-btn-secondary"
                            onClick={() => setStep(1)}
                            disabled={loading}
                        >
                            Voltar
                        </button>
                    )}
                    <button 
                        type="button" 
                        className="psjc-btn"
                        onClick={step === 1 ? handleSimular : handleConfirmar} 
                        disabled={loading}
                    >
                        {loading ? <div className="psjc-spinner"></div> : (step === 1 ? 'Simular Sorteio' : 'Confirmar Inscrições')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupSorteioJogClube;