import React, { useState, useEffect } from 'react';
import { X, Check, Bell, AlertTriangle, Info, Zap, Star, Gavel, Flag, CheckCheck } from 'lucide-react';
import { API } from '../services/api';
import './PopupNotificacao.css';

type TipoNotificacao = 
    'INFORMACAO' | 'ALERTA' | 'NOVIDADE' | 'URGENTE' | 
    'ESPECIAL' | 'LEILAO' | 'FINAL' | 'PARTIDA';

interface NotificacaoDTO {
    id: string;
    titulo: string;
    mensagem: string;
    link?: string;
    tipo: TipoNotificacao;
    lida: boolean;
    dataCriacao: string;
}

interface PopupNotificacaoProps {
    onClose: () => void;
}

const PopupNotificacao: React.FC<PopupNotificacaoProps> = ({ onClose }) => {
    const [fadeout, setFadeout] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notificacoes, setNotificacoes] = useState<NotificacaoDTO[]>([]);

    useEffect(() => {
        fetchNotificacoes();
    }, []);

    const fetchNotificacoes = async () => {
        try {
            setLoading(true);
            const response = await API.get('/api/notificacoes/minhas');
            setNotificacoes(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => onClose(), 250);
    };

    const marcarComoLida = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
        try {
            await API.patch(`/api/notificacoes/${id}/lida`);
        } catch (err) { console.error(err); }
    };

    const marcarTodasComoLidas = async () => {
        setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
        try {
            await API.patch('/api/notificacoes/todas-lidas');
        } catch (err) { console.error(err); }
    };

    const handleItemClick = (notif: NotificacaoDTO) => {
        if (!notif.lida) marcarComoLida({ stopPropagation: () => {} } as React.MouseEvent, notif.id);
        if (notif.link) window.open(notif.link, '_blank');
    };

    const formatarData = (dataIso: string) => {
        const data = new Date(dataIso);
        const agora = new Date();
        const diffDias = Math.floor((agora.getTime() - data.getTime()) / (1000 * 3600 * 24));
        
        if (diffDias === 0) return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        if (diffDias === 1) return 'Ontem';
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const getIcone = (tipo: TipoNotificacao) => {
        switch (tipo) {
            case 'ALERTA': case 'URGENTE': return <AlertTriangle size={24} />;
            case 'NOVIDADE': return <Zap size={24} />;
            case 'ESPECIAL': return <Star size={24} />;
            case 'LEILAO': return <Gavel size={24} />;
            case 'FINAL': case 'PARTIDA': return <Flag size={24} />;
            default: return <Info size={24} />;
        }
    };

    const naoLidasCount = notificacoes.filter(n => !n.lida).length;

    return (
        <div className={`pop-not-overlay ${fadeout ? 'pop-not-fade-out' : ''}`}>
            <div className="pop-not-content">
                <button className="pop-not-close-btn" onClick={handleClose}>
                    <X size={20} />
                </button>

                <div className="pop-not-header">
                    <div className="pop-not-header-info">
                        <div className="pop-not-title-row">
                            <h2 className="pop-not-title">Notificações</h2>
                            {naoLidasCount > 0 && <span className="pop-not-count">{naoLidasCount}</span>}
                        </div>
                        <span className="pop-not-subtitle">Suas últimas atualizações</span>
                    </div>

                    {naoLidasCount > 0 && (
                        <button className="pop-not-mark-all" onClick={marcarTodasComoLidas}>
                            <CheckCheck size={16} /> Ler todas
                        </button>
                    )}
                </div>

                <div className="pop-not-body pop-not-scrollbar">
                    {loading ? (
                        <div className="pop-not-loading">
                            <div className="pop-not-spinner"></div>
                            <span>Carregando...</span>
                        </div>
                    ) : notificacoes.length === 0 ? (
                        <div className="pop-not-empty">
                            <Bell size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                            <h3>Tudo limpo!</h3>
                            <p>Você não tem notificações no momento.</p>
                        </div>
                    ) : (
                        <div className="pop-not-list">
                            {notificacoes.map((notif) => (
                                <div 
                                    key={notif.id} 
                                    className={`pop-not-item ${notif.lida ? 'lida' : 'nao-lida'} tipo-${notif.tipo.toLowerCase()}`}
                                    onClick={() => handleItemClick(notif)}
                                >
                                    <div className="pop-not-icon-box">
                                        {getIcone(notif.tipo)}
                                    </div>
                                    
                                    <div className="pop-not-content-box">
                                        <div className="pop-not-top-meta">
                                            <span className="pop-not-tag">{notif.tipo}</span>
                                            <span className="pop-not-time">{formatarData(notif.dataCriacao)}</span>
                                        </div>
                                        <h3 className="pop-not-item-title">{notif.titulo}</h3>
                                        <p className="pop-not-item-msg">{notif.mensagem}</p>
                                    </div>

                                    {!notif.lida && (
                                        <button 
                                            className="pop-not-check-btn"
                                            onClick={(e) => marcarComoLida(e, notif.id)}
                                            title="Marcar como lida"
                                        >
                                            <Check size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PopupNotificacao;