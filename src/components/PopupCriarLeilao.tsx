import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API } from '../services/api';
import './PopupCriarLeilao.css';

interface PopupCriarLeilaoProps {
    onClose: () => void;
    onSubmit: () => void;
}

const PopupCriarLeilao: React.FC<PopupCriarLeilaoProps> = ({ onClose, onSubmit }) => {
    const { temporadaId } = useParams();
    const [fadeout, setFadeout] = useState(false);
    const [horasDuracao, setHorasDuracao] = useState<number>(24);
    const [isSelecao, setIsSelecao] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState('');
    const [canCreate, setCanCreate] = useState(true);

    useEffect(() => {
        const checkExistingLeilao = async () => {
            if (!temporadaId) return;
            try {
                const response = await API.get(`/api/leiloes/temporada/${temporadaId}/existe`);
                
                if (response.data === true) {
                    setCanCreate(false);
                    setError("Já existe um leilão ativo nesta temporada.");
                }
            } catch (err) {
                console.error("Erro ao verificar leilões:", err);
            } finally {
                setChecking(false);
            }
        };

        const checkUserPermissions = () => {
             const storedUser = localStorage.getItem('user_data');
             if (storedUser) {
                 const user = JSON.parse(storedUser);
                 if (!['PROPRIETARIO', 'DIRETOR'].includes(user.cargo)) {
                     setCanCreate(false);
                     setError("Você não tem permissão para criar leilões.");
                     setChecking(false); 
                     return;
                 }
             } else {
                 setCanCreate(false);
                 setError("Usuário não autenticado.");
                 setChecking(false);
                 return;
             }
             checkExistingLeilao();
        };

        checkUserPermissions();
    }, [temporadaId]);

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleCreate = async () => {
        setError('');
        if (!temporadaId) {
            setError("ID da temporada não encontrado.");
            return;
        }

        if (horasDuracao <= 0) {
            setError("A duração deve ser maior que 0 horas.");
            return;
        }

        setLoading(true);

        const payload = {
            temporadaId: temporadaId,
            horasDuracao: horasDuracao,
            isSelecao: isSelecao
        };

        try {
            await API.post('/api/leiloes/admin/iniciar', payload);
            handleClose();
            onSubmit();
        } catch (err: any) {
            const msg = err.response?.data?.erro || err.response?.data?.message || "Erro ao iniciar leilão.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
            <div className="popup-content criar-leilao-popup-width">
                <button className="popup-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="popup-header-fixed">
                    <div className="icon-badge-blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                             <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/>
                        </svg>
                    </div>
                    <h2 className="popup-title">Iniciar Leilão</h2>
                    <p className="popup-subtitle">Configure a janela de transferências</p>
                </div>

                <div className="popup-body-scroll custom-scrollbar">
                    {checking ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="popup-spinner-small" style={{ borderColor: '#2563eb', borderTopColor: 'transparent', margin: '0 auto' }}></div>
                            <p style={{ marginTop: '10px', color: '#666' }}>Verificando permissões...</p>
                        </div>
                    ) : !canCreate ? (
                        <div className="conceder-error-msg" style={{textAlign: 'center', marginTop: '20px'}}>
                            {error}
                        </div>
                    ) : (
                        <div className="conceder-form">
                            <div className="form-group">
                                <label>Duração (horas)</label>
                                <input 
                                    type="number"
                                    className="conceder-input" 
                                    value={horasDuracao} 
                                    onChange={(e) => setHorasDuracao(parseInt(e.target.value))}
                                    min="1"
                                />
                                <p style={{fontSize: '0.8rem', color: '#666', marginTop: '4px'}}>
                                    O leilão será encerrado automaticamente após este período.
                                </p>
                            </div>

                            <div className="form-group" style={{marginTop: '15px'}}>
                                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500}}>
                                    <input 
                                        type="checkbox"
                                        checked={isSelecao}
                                        onChange={(e) => setIsSelecao(e.target.checked)}
                                        style={{width: '18px', height: '18px', accentColor: '#2563eb'}}
                                    />
                                    Leilão de Seleções (Copa das Nações)
                                </label>
                            </div>

                            {error && <div className="conceder-error-msg">{error}</div>}
                        </div>
                    )}
                </div>

                <div className="popup-footer-fixed">
                    <button 
                        type="button" 
                        className="conceder-btn" 
                        onClick={handleCreate} 
                        disabled={loading || checking || !canCreate}
                    >
                        {loading ? <div className="popup-spinner-small"></div> : 'Iniciar Leilão'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupCriarLeilao;