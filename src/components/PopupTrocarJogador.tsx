import React, { useState } from 'react';
import { API } from '../services/api';
import './PopupTrocarJogador.css';

interface JogadorClubeDTO {
    id: string;
    jogadorId: string;
    jogadorNome: string;
    jogadorImagem?: string;
    clubeId?: string;
    clubeNome?: string;
    clubeImagem?: string;
    clubeSigla?: string;
}

interface JogadorNovoDTO {
    id: string;
    nome: string;
    discord?: string;
    imagem?: string;
}

interface PopupTrocarJogadorProps {
    temporadaId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const PopupTrocarJogador: React.FC<PopupTrocarJogadorProps> = ({ temporadaId, onClose, onSuccess }) => {
    const [fadeout, setFadeout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [jogadorAtual, setJogadorAtual] = useState<JogadorClubeDTO | null>(null);
    const [termoAtual, setTermoAtual] = useState('');
    const [sugestoesAtual, setSugestoesAtual] = useState<JogadorClubeDTO[]>([]);
    const [buscandoAtual, setBuscandoAtual] = useState(false);

    const [jogadorNovo, setJogadorNovo] = useState<JogadorNovoDTO | null>(null);
    const [termoNovo, setTermoNovo] = useState('');
    const [sugestoesNovo, setSugestoesNovo] = useState<JogadorNovoDTO[]>([]);
    const [buscandoNovo, setBuscandoNovo] = useState(false);

    const handleBuscarAtual = async (termo: string) => {
        setTermoAtual(termo);
        if (termo.length < 3) {
            setSugestoesAtual([]);
            return;
        }
        setBuscandoAtual(true);
        try {
            const response = await API.get(`/inscricao/buscar-autocomplete/temporada?termo=${termo}&temporadaId=${temporadaId}`);
            setSugestoesAtual(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setBuscandoAtual(false);
        }
    };

    const handleBuscarNovo = async (termo: string) => {
        setTermoNovo(termo);
        if (termo.length < 3) {
            setSugestoesNovo([]);
            return;
        }
        setBuscandoNovo(true);
        try {
            const response = await API.get(`/jogador/buscar-autocomplete?termo=${termo}`);
            if (Array.isArray(response.data)) {
                setSugestoesNovo(response.data);
            } else {
                setSugestoesNovo([]);
            }
        } catch (err) {
            console.error(err);
            setSugestoesNovo([]);
        } finally {
            setBuscandoNovo(false);
        }
    };

    const selecionarAtual = (jog: JogadorClubeDTO) => {
        setJogadorAtual(jog);
        setSugestoesAtual([]);
        setTermoAtual('');
        setError('');
        
        if (jogadorNovo && jog.jogadorId === jogadorNovo.id) {
            setError('O novo jogador não pode ser igual ao jogador atual.');
        }
    };

    const selecionarNovo = (jog: JogadorNovoDTO) => {
        if (jogadorAtual && jog.id === jogadorAtual.jogadorId) {
            setError('O novo jogador deve ser diferente do jogador a ser substituído.');
            return;
        }
        
        setJogadorNovo(jog);
        setSugestoesNovo([]);
        setTermoNovo('');
        setError('');
    };

    const limparAtual = () => {
        setJogadorAtual(null);
        setError('');
    };

    const limparNovo = () => {
        setJogadorNovo(null);
        setError('');
    };

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleSubmit = async () => {
        if (!jogadorAtual || !jogadorNovo) {
            setError('Selecione ambos os jogadores para realizar a troca.');
            return;
        }
        
        if (jogadorAtual.jogadorId === jogadorNovo.id) {
            setError('O jogador substituto não pode ser o mesmo que sai.');
            return;
        }

        setLoading(true);
        setError('');

        const payload = {
            idInscricaoAntiga: jogadorAtual.id,
            idNovoAlvo: jogadorNovo.id
        };

        try {
            await API.put('/inscricao/substituir-jogador', payload);
            setFadeout(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 300);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Erro ao realizar substituição.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`ptj-overlay ${fadeout ? 'ptj-fade-out' : ''}`}>
            <div className="ptj-content">
                <button className="ptj-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="ptj-header">
                    <div className="ptj-icon-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                            <path d="M17 1l4 4-4 4" />
                            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                            <path d="M7 23l-4-4 4-4" />
                            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                        </svg>
                    </div>
                    <h2 className="ptj-title">
                        Substituir Jogador
                    </h2>
                </div>

                <div className="ptj-body ptj-scrollbar">
                    <div className="ptj-search-block">
                        <div className="ptj-section-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 12H3m0 0l6-6m-6 6l6 6" style={{ transform: 'rotate(180deg)', transformOrigin: 'center' }} />
                            </svg>
                            Quem Sai (Atual)
                        </div>
                        
                        {!jogadorAtual ? (
                            <div className="ptj-input-wrapper">
                                <input
                                    type="text"
                                    className="ptj-input"
                                    placeholder="Buscar jogador na temporada..."
                                    value={termoAtual}
                                    onChange={(e) => handleBuscarAtual(e.target.value)}
                                    autoFocus
                                />
                                {buscandoAtual && <div className="ptj-spinner-small"></div>}
                                
                                {sugestoesAtual.length > 0 && (
                                    <ul className="ptj-suggestions-list ptj-scrollbar">
                                        {sugestoesAtual.map((jog) => (
                                            <li key={jog.id} onClick={() => selecionarAtual(jog)}>
                                                {jog.jogadorImagem && <img src={jog.jogadorImagem} alt="" className="ptj-suggestion-avatar" />}
                                                <div className="ptj-suggestion-item">
                                                    <span className="ptj-suggestion-name">{jog.jogadorNome}</span>
                                                    {jog.clubeNome && <span className="ptj-suggestion-discord">{jog.clubeNome}</span>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <div className="ptj-selected-card">
                                <div className="ptj-player-info">
                                    {jogadorAtual.jogadorImagem && <img src={jogadorAtual.jogadorImagem} alt="" className="ptj-selected-avatar" />}
                                    <div className="ptj-player-details">
                                        <span className="ptj-player-name">{jogadorAtual.jogadorNome}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {jogadorAtual.clubeImagem && <img src={jogadorAtual.clubeImagem} alt="" style={{ width: '16px', height: '16px' }} />}
                                            <span className="ptj-discord-tag">{jogadorAtual.clubeNome}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="ptj-btn-change" onClick={limparAtual} disabled={loading}>
                                    Alterar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="ptj-transfer-arrow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <polyline points="19 12 12 19 5 12"></polyline>
                        </svg>
                    </div>

                    <div className="ptj-search-block">
                        <div className="ptj-section-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 12H3m0 0l6-6m-6 6l6 6" />
                            </svg>
                            Quem Entra (Novo)
                        </div>

                        {!jogadorNovo ? (
                            <div className="ptj-input-wrapper">
                                <input
                                    type="text"
                                    className="ptj-input"
                                    placeholder="Buscar novo jogador..."
                                    value={termoNovo}
                                    onChange={(e) => handleBuscarNovo(e.target.value)}
                                    disabled={!jogadorAtual}
                                />
                                {buscandoNovo && <div className="ptj-spinner-small"></div>}

                                {sugestoesNovo.length > 0 && (
                                    <ul className="ptj-suggestions-list ptj-scrollbar">
                                        {sugestoesNovo.map((jog) => (
                                            <li key={jog.id} onClick={() => selecionarNovo(jog)}>
                                                {jog.imagem && <img src={jog.imagem} alt="" className="ptj-suggestion-avatar" />}
                                                <div className="ptj-suggestion-item">
                                                    <span className="ptj-suggestion-name">{jog.nome}</span>
                                                    {jog.discord && <span className="ptj-suggestion-discord">@{jog.discord}</span>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <div className="ptj-selected-card">
                                <div className="ptj-player-info">
                                    {jogadorNovo.imagem && <img src={jogadorNovo.imagem} alt="" className="ptj-selected-avatar" />}
                                    <div className="ptj-player-details">
                                        <span className="ptj-player-name">{jogadorNovo.nome}</span>
                                        {jogadorNovo.discord && <span className="ptj-discord-tag">@{jogadorNovo.discord}</span>}
                                    </div>
                                </div>
                                <button className="ptj-btn-change" onClick={limparNovo} disabled={loading}>
                                    Alterar
                                </button>
                            </div>
                        )}
                    </div>

                    {error && <div className="ptj-error-msg">{error}</div>}
                </div>

                <div className="ptj-footer">
                    <button 
                        type="button" 
                        className="ptj-btn"
                        onClick={handleSubmit} 
                        disabled={loading || !jogadorAtual || !jogadorNovo}
                    >
                        {loading ? <div className="ptj-spinner"></div> : 'Confirmar Troca'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupTrocarJogador;