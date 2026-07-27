import React, { useState } from 'react';
import { API } from '../services/api';
import './PopupTrocarJogadorTorneio.css';

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

interface PopupTrocarJogadorTorneioProps {
    temporadaId: string;
    torneioId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const PopupTrocarJogadorTorneio: React.FC<PopupTrocarJogadorTorneioProps> = ({ temporadaId, torneioId, onClose, onSuccess }) => {
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
            idNovoJogador: jogadorNovo.id,
            torneioId: torneioId
        };

        try {
            await API.put('/inscricao/substituir-jogador-torneio', payload);
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
        <div className={`ptjt-overlay ${fadeout ? 'ptjt-fade-out' : ''}`}>
            <div className="ptjt-content">
                <button className="ptjt-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="ptjt-header">
                    <div className="ptjt-icon-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                            <path d="M17 1l4 4-4 4" />
                            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                            <path d="M7 23l-4-4 4-4" />
                            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                        </svg>
                    </div>
                    <h2 className="ptjt-title">
                        Substituir Jogador
                    </h2>
                    <span className="ptjt-subtitle">Apenas neste torneio</span>
                </div>

                <div className="ptjt-body ptjt-scrollbar">
                    <div className="ptjt-search-block">
                        <div className="ptjt-section-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 12H3m0 0l6-6m-6 6l6 6" style={{ transform: 'rotate(180deg)', transformOrigin: 'center' }} />
                            </svg>
                            Quem Sai (Atual)
                        </div>

                        {!jogadorAtual ? (
                            <div className="ptjt-input-wrapper">
                                <input
                                    type="text"
                                    className="ptjt-input"
                                    placeholder="Buscar jogador na temporada..."
                                    value={termoAtual}
                                    onChange={(e) => handleBuscarAtual(e.target.value)}
                                    autoFocus
                                />
                                {buscandoAtual && <div className="ptjt-spinner-small"></div>}

                                {sugestoesAtual.length > 0 && (
                                    <ul className="ptjt-suggestions-list ptjt-scrollbar">
                                        {sugestoesAtual.map((jog) => (
                                            <li key={jog.id} onClick={() => selecionarAtual(jog)}>
                                                {jog.jogadorImagem && <img src={jog.jogadorImagem} alt="" className="ptjt-suggestion-avatar" />}
                                                <div className="ptjt-suggestion-item">
                                                    <span className="ptjt-suggestion-name">{jog.jogadorNome}</span>
                                                    {jog.clubeNome && <span className="ptjt-suggestion-discord">{jog.clubeNome}</span>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <div className="ptjt-selected-card">
                                <div className="ptjt-player-info">
                                    {jogadorAtual.jogadorImagem && <img src={jogadorAtual.jogadorImagem} alt="" className="ptjt-selected-avatar" />}
                                    <div className="ptjt-player-details">
                                        <span className="ptjt-player-name">{jogadorAtual.jogadorNome}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {jogadorAtual.clubeImagem && <img src={jogadorAtual.clubeImagem} alt="" style={{ width: '16px', height: '16px' }} />}
                                            <span className="ptjt-discord-tag">{jogadorAtual.clubeNome}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="ptjt-btn-change" onClick={limparAtual} disabled={loading}>
                                    Alterar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="ptjt-transfer-arrow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <polyline points="19 12 12 19 5 12"></polyline>
                        </svg>
                    </div>

                    <div className="ptjt-search-block">
                        <div className="ptjt-section-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 12H3m0 0l6-6m-6 6l6 6" />
                            </svg>
                            Quem Entra (Novo)
                        </div>

                        {!jogadorNovo ? (
                            <div className="ptjt-input-wrapper">
                                <input
                                    type="text"
                                    className="ptjt-input"
                                    placeholder="Buscar novo jogador..."
                                    value={termoNovo}
                                    onChange={(e) => handleBuscarNovo(e.target.value)}
                                    disabled={!jogadorAtual}
                                />
                                {buscandoNovo && <div className="ptjt-spinner-small"></div>}

                                {sugestoesNovo.length > 0 && (
                                    <ul className="ptjt-suggestions-list ptjt-scrollbar">
                                        {sugestoesNovo.map((jog) => (
                                            <li key={jog.id} onClick={() => selecionarNovo(jog)}>
                                                {jog.imagem && <img src={jog.imagem} alt="" className="ptjt-suggestion-avatar" />}
                                                <div className="ptjt-suggestion-item">
                                                    <span className="ptjt-suggestion-name">{jog.nome}</span>
                                                    {jog.discord && <span className="ptjt-suggestion-discord">@{jog.discord}</span>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <div className="ptjt-selected-card">
                                <div className="ptjt-player-info">
                                    {jogadorNovo.imagem && <img src={jogadorNovo.imagem} alt="" className="ptjt-selected-avatar" />}
                                    <div className="ptjt-player-details">
                                        <span className="ptjt-player-name">{jogadorNovo.nome}</span>
                                        {jogadorNovo.discord && <span className="ptjt-discord-tag">@{jogadorNovo.discord}</span>}
                                    </div>
                                </div>
                                <button className="ptjt-btn-change" onClick={limparNovo} disabled={loading}>
                                    Alterar
                                </button>
                            </div>
                        )}
                    </div>

                    {error && <div className="ptjt-error-msg">{error}</div>}
                </div>

                <div className="ptjt-footer">
                    <button
                        type="button"
                        className="ptjt-btn"
                        onClick={handleSubmit}
                        disabled={loading || !jogadorAtual || !jogadorNovo}
                    >
                        {loading ? <div className="ptjt-spinner"></div> : 'Confirmar Troca'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupTrocarJogadorTorneio;