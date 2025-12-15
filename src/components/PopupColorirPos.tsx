import React, { useState, useEffect } from 'react';
import { API } from '../services/api';
import { Trash2, Plus, Palette, Info, X } from 'lucide-react';
import './PopupColorirPos.css';

interface ZonaFase {
    nome: string;
    posicaoDe: number;
    posicaoAte: number;
    corHex: string;
}

interface PopupColorirPosProps {
    faseId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const PopupColorirPos: React.FC<PopupColorirPosProps> = ({ faseId, onClose, onSuccess }) => {
    const [fadeout, setFadeout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [zonas, setZonas] = useState<ZonaFase[]>([]);

    useEffect(() => {
        const carregarZonasAtuais = async () => {
            try {
                const response = await API.get(`/fases/${faseId}`);
                if (response.data && response.data.zonas) {
                    setZonas(response.data.zonas);
                }
            } catch (err) {
                console.error("Erro ao carregar zonas", err);
            }
        };
        carregarZonasAtuais();
    }, [faseId]);

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const adicionarZona = () => {
        setZonas([...zonas, { nome: '', posicaoDe: 1, posicaoAte: 4, corHex: '#3b82f6' }]);
    };

    const removerZona = (index: number) => {
        setZonas(zonas.filter((_, i) => i !== index));
    };

    const atualizarZona = (index: number, campo: keyof ZonaFase, valor: string | number) => {
        const novasZonas = [...zonas];
        novasZonas[index] = { ...novasZonas[index], [campo]: valor };
        setZonas(novasZonas);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await API.post(`/fase-torneio/${faseId}/zonas`, zonas);
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError("Erro ao salvar zonas de classificação.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
            <div className="popup-content colorir-popup-width">
                
                <button className="popup-close-btn" onClick={handleClose}>
                    <X size={20} />
                </button>

                <div className="popup-header-fixed">
                    <div className="icon-badge-wrapper season-badge">
                        <Palette size={32} />
                    </div>
                    <h2 className="popup-title">Colorir Posições</h2>
                    <p className="popup-subtitle">Defina as zonas de classificação e cores</p>
                </div>

                <div className="popup-body-scroll custom-scrollbar">
                    <div className="info-box">
                        <div className="info-icon">
                            <Info size={20} />
                        </div>
                        <p>As cores definidas aqui serão aplicadas na tabela da fase em tempo real para todos os usuários.</p>
                    </div>

                    <form onSubmit={handleSubmit} id="form-colorir-pos">
                        <div className="zonas-list">
                            {zonas.map((zona, index) => (
                                <div key={index} className="zona-item-row">
                                    <div className="form-group flex-2">
                                        <label>Nome da Zona</label>
                                        <input 
                                            className="nova-temporada-input"
                                            type="text" 
                                            placeholder="Ex: G4, Rebaixamento..."
                                            value={zona.nome}
                                            onChange={(e) => atualizarZona(index, 'nome', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>De</label>
                                        <input 
                                            className="nova-temporada-input"
                                            type="number" 
                                            value={zona.posicaoDe}
                                            onChange={(e) => atualizarZona(index, 'posicaoDe', parseInt(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>Até</label>
                                        <input 
                                            className="nova-temporada-input"
                                            type="number" 
                                            value={zona.posicaoAte}
                                            onChange={(e) => atualizarZona(index, 'posicaoAte', parseInt(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="form-group flex-0">
                                        <label>Cor</label>
                                        <input 
                                            className="color-picker-input"
                                            type="color" 
                                            value={zona.corHex}
                                            onChange={(e) => atualizarZona(index, 'corHex', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button type="button" className="btn-remove-zona" onClick={() => removerZona(index)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button type="button" className="btn-add-zona" onClick={adicionarZona}>
                            <Plus size={18} /> Adicionar Nova Zona
                        </button>

                        {error && <div className="temporada-error-msg">{error}</div>}
                    </form>
                </div>

                <div className="popup-footer-fixed">
                    <button type="submit" form="form-colorir-pos" className="submit-season-btn" disabled={loading}>
                        {loading ? <div className="popup-spinner-small"></div> : 'Salvar Configurações'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PopupColorirPos;