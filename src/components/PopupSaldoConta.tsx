import React, { useState } from 'react';
import { API } from '../services/api';
import './PopupSaldoConta.css';

interface PopupSaldoContaProps {
    jogadorId: string;
    onClose: () => void;
    onSuccess: (novoSaldo: number) => void;
}

type TipoOperacao = 'ADICIONAR' | 'REMOVER';

const PopupSaldoConta: React.FC<PopupSaldoContaProps> = ({ jogadorId, onClose, onSuccess }) => {
    const [fadeout, setFadeout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [valor, setValor] = useState<string>('');
    const [motivo, setMotivo] = useState('');
    const [operacao, setOperacao] = useState<TipoOperacao>('ADICIONAR');
    
    const [needsConfirmation, setNeedsConfirmation] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState('');

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleSubmit = async (confirmarSaldoNegativo: boolean = false) => {
        setError('');
        
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
            const response = await API.patch(`/api/jogadores/${jogadorId}/saldo`, payload);
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
                    <p className="psc-subtitle">
                        Adicione ou remova fundos da conta
                    </p>
                </div>

                <div className="psc-body psc-scrollbar">
                    {needsConfirmation ? (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div className="psc-warning-box">
                                <strong>Atenção:</strong> {confirmationMessage}
                            </div>
                            <p style={{ color: 'var(--psc-text-secondary)', fontSize: '0.9rem' }}>
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
                                    placeholder="Ex: Premiação Torneio, Punição, Ajuste..."
                                />
                            </div>

                            {error && <div className="psc-error-msg">{error}</div>}
                        </div>
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
                            disabled={loading}
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