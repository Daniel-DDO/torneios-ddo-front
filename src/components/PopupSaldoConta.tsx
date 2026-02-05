import React, { useState, useEffect } from 'react';
import { API } from '../services/api';
import './PopupSaldoConta.css';

interface JogadorDTO {
    id: string;
    nome: string;
    discord?: string;
    saldoVirtual?: number;
    imagem?: string;
}

interface PopupSaldoContaProps {
    jogadorId?: string;
    onClose: () => void;
    onSuccess: (novoSaldo: number) => void;
}

type TipoOperacao = 'ADICIONAR' | 'REMOVER';

const PopupSaldoConta: React.FC<PopupSaldoContaProps> = ({ jogadorId, onClose, onSuccess }) => {
    const [fadeout, setFadeout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [jogadorSelecionado, setJogadorSelecionado] = useState<JogadorDTO | null>(null);
    const [termoBusca, setTermoBusca] = useState('');
    const [sugestoes, setSugestoes] = useState<JogadorDTO[]>([]);
    const [buscando, setBuscando] = useState(false);

    const [valor, setValor] = useState<string>('');
    const [motivo, setMotivo] = useState('');
    const [operacao, setOperacao] = useState<TipoOperacao>('ADICIONAR');
    
    const [needsConfirmation, setNeedsConfirmation] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState('');

    useEffect(() => {
        if (jogadorId) {
            carregarJogadorInicial(jogadorId);
        }
    }, [jogadorId]);

    const carregarJogadorInicial = async (id: string) => {
        try {
            const response = await API.get(`/jogadores/${id}`);
            setJogadorSelecionado(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBuscarJogador = async (termo: string) => {
        setTermoBusca(termo);
        if (termo.length < 3) {
            setSugestoes([]);
            return;
        }

        setBuscando(true);
        try {
            const response = await API.get(`/jogador/busca-rapida?termo=${termo}`);
            setSugestoes(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setBuscando(false);
        }
    };

    const selecionarJogador = (jogador: JogadorDTO) => {
        setJogadorSelecionado(jogador);
        setSugestoes([]);
        setTermoBusca('');
        setError('');
    };

    const limparSelecao = () => {
        setJogadorSelecionado(null);
        setValor('');
        setMotivo('');
        setNeedsConfirmation(false);
        setError('');
    };

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleSubmit = async (confirmarSaldoNegativo: boolean = false) => {
        setError('');
        
        if (!jogadorSelecionado) {
            setError('Selecione um jogador.');
            return;
        }
        if (!valor || parseFloat(valor) <= 0) {
            setError('Digite um valor válido maior que zero.');
            return;
        }
        if (!motivo.trim()) {
            setError('O motivo é obrigatório.');
            return;
        }

        setLoading(true);

        const payload = {
            valor: parseFloat(valor),
            motivo: motivo,
            operacao: operacao,
            confirmarSaldoNegativo: confirmarSaldoNegativo
        };

        try {
            const response = await API.patch(`/api/jogadores/${jogadorSelecionado.id}/saldo`, payload);
            setFadeout(true);
            setTimeout(() => {
                onSuccess(response.data);
                onClose();
            }, 300);
        } catch (err: any) {
            const status = err.response?.status;
            const msg = err.response?.data?.message || "Erro ao atualizar saldo.";

            if ((status === 409 || status === 422) && !confirmarSaldoNegativo) {
                setNeedsConfirmation(true);
                setConfirmationMessage(msg);
            } else {
                setError(msg);
                setNeedsConfirmation(false);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`psc-overlay ${fadeout ? 'psc-fade-out' : ''}`}>
            <div className="psc-content">
                <button className="psc-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="psc-header">
                    <div className="psc-icon-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <h2 className="psc-title">
                        Movimentar Saldo
                    </h2>
                </div>

                <div className="psc-body psc-scrollbar">
                    {!jogadorSelecionado ? (
                        <div className="psc-search-section">
                            <label>Buscar Jogador</label>
                            <div className="psc-input-wrapper">
                                <input
                                    type="text"
                                    className="psc-input"
                                    placeholder="Digite nome ou discord (min. 3 letras)..."
                                    value={termoBusca}
                                    onChange={(e) => handleBuscarJogador(e.target.value)}
                                    autoFocus
                                />
                                {buscando && <div className="psc-spinner-small"></div>}
                            </div>
                            
                            {sugestoes.length > 0 && (
                                <ul className="psc-suggestions-list psc-scrollbar">
                                    {sugestoes.map((jog) => (
                                        <li key={jog.id} onClick={() => selecionarJogador(jog)}>
                                            <div className="psc-suggestion-item">
                                                <span className="psc-suggestion-name">{jog.nome}</span>
                                                {jog.discord && <span className="psc-suggestion-discord">@{jog.discord}</span>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <div className="psc-selected-player">
                            <div className="psc-player-info">
                                <span className="psc-label">Jogador Selecionado</span>
                                <div className="psc-player-details">
                                    <strong className="psc-player-name">{jogadorSelecionado.nome}</strong>
                                    {jogadorSelecionado.discord && <span className="psc-discord-tag">@{jogadorSelecionado.discord}</span>}
                                </div>
                                
                                <div className="psc-current-balance">
                                    Saldo Atual: 
                                    <span className={jogadorSelecionado.saldoVirtual && jogadorSelecionado.saldoVirtual < 0 ? 'text-danger' : 'text-success'}>
                                        $ {jogadorSelecionado.saldoVirtual?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                            </div>
                            <button className="psc-btn-link" onClick={limparSelecao} disabled={loading}>
                                Trocar Jogador
                            </button>
                        </div>
                    )}

                    {jogadorSelecionado && (
                        <>
                            {needsConfirmation ? (
                                <div className="psc-confirmation-wrapper">
                                    <div className="psc-warning-box">
                                        <strong>Atenção:</strong> {confirmationMessage}
                                    </div>
                                    <p className="psc-confirm-text">
                                        Deseja confirmar a operação mesmo assim?
                                    </p>
                                </div>
                            ) : (
                                <div className="psc-form">
                                    <div className="psc-form-group">
                                        <label>Operação</label>
                                        <select 
                                            className="psc-select"
                                            value={operacao}
                                            onChange={(e) => setOperacao(e.target.value as TipoOperacao)}
                                        >
                                            <option value="ADICIONAR">Adicionar Saldo (Crédito)</option>
                                            <option value="REMOVER">Remover Saldo (Débito)</option>
                                        </select>
                                    </div>

                                    <div className="psc-form-group">
                                        <label>Valor ($)</label>
                                        <input 
                                            type="number" 
                                            className="psc-input" 
                                            value={valor}
                                            onChange={(e) => setValor(e.target.value)}
                                            placeholder="0.00"
                                            min="0.01"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="psc-form-group">
                                        <label>Motivo</label>
                                        <input 
                                            type="text" 
                                            className="psc-input" 
                                            value={motivo}
                                            onChange={(e) => setMotivo(e.target.value)}
                                            placeholder="Ex: Premiação Torneio, Punição..."
                                        />
                                    </div>

                                    {error && <div className="psc-error-msg">{error}</div>}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="psc-footer">
                    {needsConfirmation ? (
                        <>
                            <button 
                                type="button" 
                                className="psc-btn secondary" 
                                onClick={() => setNeedsConfirmation(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button" 
                                className="psc-btn danger" 
                                onClick={() => handleSubmit(true)}
                                disabled={loading}
                            >
                                {loading ? <div className="psc-spinner"></div> : 'Confirmar Negativo'}
                            </button>
                        </>
                    ) : (
                        <button 
                            type="button" 
                            className={`psc-btn ${operacao === 'REMOVER' ? 'danger' : ''}`}
                            onClick={() => handleSubmit(false)} 
                            disabled={loading || !jogadorSelecionado}
                        >
                            {loading ? <div className="psc-spinner"></div> : (operacao === 'ADICIONAR' ? 'Creditar Valor' : 'Debitar Valor')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PopupSaldoConta;