import React, { useState } from 'react';
import { API } from '../services/api';
import './PopupAnularPartida.css';

interface PopupAnularPartidaProps {
    partidaId: string;
    modo: 'anular' | 'desanular';
    onClose: () => void;
    onSuccess: () => void;
}

const IconBan = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
);

const IconCheck = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const IconAlertTriangle = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const IconInfo = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const PopupAnularPartida: React.FC<PopupAnularPartidaProps> = ({ partidaId, modo, onClose, onSuccess }) => {
    const [fadeout, setFadeout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [motivo, setMotivo] = useState('');

    const isAnular = modo === 'anular';

    const handleClose = () => {
        if (loading) return;
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleSubmit = async () => {
        if (isAnular && motivo.trim().length === 0) {
            setError('Informe o motivo da anulação.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (isAnular) {
                await API.post(`/partida/${partidaId}/anular`, { motivo: motivo.trim() });
            } else {
                await API.post(`/partida/${partidaId}/desanular`);
            }
            setFadeout(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 300);
        } catch (err: any) {
            const msg = err.response?.data?.message || `Erro ao ${isAnular ? 'anular' : 'desanular'} a partida.`;
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`pap-overlay ${fadeout ? 'pap-fade-out' : ''}`}>
            <div className="pap-content">
                <button className="pap-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="pap-header">
                    <div className={`pap-icon-badge ${isAnular ? 'pap-anular' : 'pap-desanular'}`}>
                        {isAnular ? <IconBan /> : <IconCheck />}
                    </div>
                    <h2 className="pap-title">
                        {isAnular ? 'Anular Partida' : 'Desanular Partida'}
                    </h2>
                    <p className="pap-subtitle">
                        {isAnular
                            ? 'Essa ação marca a partida como anulada e impede o registro de resultado.'
                            : 'Essa ação reverte a anulação e libera a partida para registro de resultado.'}
                    </p>
                </div>

                <div className="pap-body pap-scrollbar">
                    {isAnular ? (
                        <>
                            <div>
                                <div className="pap-section-title">Motivo da Anulação</div>
                                <textarea
                                    className="pap-textarea"
                                    placeholder="Descreva o motivo da anulação desta partida..."
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    maxLength={300}
                                    disabled={loading}
                                    autoFocus
                                />
                                <div className="pap-char-count">{motivo.length}/300</div>
                            </div>

                            <div className="pap-warning-box">
                                <IconAlertTriangle />
                                <span>Enquanto a partida estiver anulada, não será possível registrar resultado para ela.</span>
                            </div>
                        </>
                    ) : (
                        <div className="pap-info-box">
                            <IconInfo />
                            <span>A partida voltará a ficar disponível para registro de resultado normalmente.</span>
                        </div>
                    )}

                    {error && <div className="pap-error-msg">{error}</div>}
                </div>

                <div className="pap-footer">
                    <button
                        type="button"
                        className="pap-btn-secondary"
                        onClick={handleClose}
                        disabled={loading}
                        style={{ flex: 1 }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={`pap-btn ${isAnular ? 'pap-btn-anular' : 'pap-btn-desanular'}`}
                        onClick={handleSubmit}
                        disabled={loading || (isAnular && motivo.trim().length === 0)}
                        style={{ flex: 1 }}
                    >
                        {loading ? <div className="pap-spinner"></div> : (isAnular ? 'Confirmar Anulação' : 'Confirmar Desanulação')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupAnularPartida;