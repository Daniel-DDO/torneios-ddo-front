import React, { useState, useRef, useEffect } from 'react';
import { API } from '../services/api';
import './PopupVincularCompTitulo.css';

interface CompeticaoOption {
    id: string;
    nome: string;
    imagem: string;
}

interface TituloOption {
    id: string;
    nome: string;
    imagem: string;
}

interface PopupVincularCompTituloProps {
    onClose: () => void;
    onSuccess: () => void;
}

const buscarCompeticoes = async (termo: string): Promise<CompeticaoOption[]> => {
    try {
        const response = await API.get('/competicao/buscar-autocomplete', { params: { termo } });
        const data = (response && (response as any).data) ? (response as any).data : response;
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('Erro ao buscar competições', err);
        return [];
    }
};

const buscarTitulos = async (termo: string): Promise<TituloOption[]> => {
    try {
        const response = await API.get('/titulos/buscar-autocomplete', { params: { termo } });
        const data = (response && (response as any).data) ? (response as any).data : response;
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('Erro ao buscar títulos', err);
        return [];
    }
};

const PopupVincularCompTitulo: React.FC<PopupVincularCompTituloProps> = ({ onClose, onSuccess }) => {
    const [fadeout, setFadeout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [termoCompeticao, setTermoCompeticao] = useState('');
    const [resultadosCompeticao, setResultadosCompeticao] = useState<CompeticaoOption[]>([]);
    const [competicaoSelecionada, setCompeticaoSelecionada] = useState<CompeticaoOption | null>(null);
    const [showDropdownCompeticao, setShowDropdownCompeticao] = useState(false);

    const [termoTitulo, setTermoTitulo] = useState('');
    const [resultadosTitulo, setResultadosTitulo] = useState<TituloOption[]>([]);
    const [tituloSelecionado, setTituloSelecionado] = useState<TituloOption | null>(null);
    const [showDropdownTitulo, setShowDropdownTitulo] = useState(false);
    const [desvincular, setDesvincular] = useState(false);

    const debounceCompeticao = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debounceTitulo = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceCompeticao.current) clearTimeout(debounceCompeticao.current);

        if (termoCompeticao.trim().length < 3) {
            setResultadosCompeticao([]);
            return;
        }

        debounceCompeticao.current = setTimeout(async () => {
            const resultados = await buscarCompeticoes(termoCompeticao.trim());
            setResultadosCompeticao(resultados);
        }, 350);

        return () => {
            if (debounceCompeticao.current) clearTimeout(debounceCompeticao.current);
        };
    }, [termoCompeticao]);

    useEffect(() => {
        if (debounceTitulo.current) clearTimeout(debounceTitulo.current);

        if (termoTitulo.trim().length < 3) {
            setResultadosTitulo([]);
            return;
        }

        debounceTitulo.current = setTimeout(async () => {
            const resultados = await buscarTitulos(termoTitulo.trim());
            setResultadosTitulo(resultados);
        }, 350);

        return () => {
            if (debounceTitulo.current) clearTimeout(debounceTitulo.current);
        };
    }, [termoTitulo]);

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleSelecionarCompeticao = (competicao: CompeticaoOption) => {
        setCompeticaoSelecionada(competicao);
        setTermoCompeticao('');
        setResultadosCompeticao([]);
        setShowDropdownCompeticao(false);
        setError('');
    };

    const handleSelecionarTitulo = (titulo: TituloOption) => {
        setTituloSelecionado(titulo);
        setDesvincular(false);
        setTermoTitulo('');
        setResultadosTitulo([]);
        setShowDropdownTitulo(false);
        setError('');
    };

    const handleMarcarDesvincular = () => {
        setTituloSelecionado(null);
        setDesvincular(true);
        setError('');
    };

    const handleSubmit = async () => {
        setError('');

        if (!competicaoSelecionada) {
            setError('Selecione uma competição.');
            return;
        }

        if (!tituloSelecionado && !desvincular) {
            setError('Selecione um título ou marque para remover o vínculo atual.');
            return;
        }

        setLoading(true);

        try {
            await API.patch(`/competicao/${competicaoSelecionada.id}/vincular-titulo`, {
                tituloId: desvincular ? null : tituloSelecionado?.id
            });

            setFadeout(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 300);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Erro ao vincular título à competição.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`pc-overlay ${fadeout ? 'pc-fade-out' : ''}`}>
            <div className="pc-content">
                <button className="pc-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="pc-header">
                    <div className="pc-icon-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                            <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
                            <circle cx="12" cy="8" r="7" />
                        </svg>
                    </div>
                    <h2 className="pc-title">Vincular Título</h2>
                    <span className="pc-subtitle">Associe um título a uma competição existente</span>
                </div>

                <div className="pc-body pc-scrollbar">
                    <div className="pc-form">

                        <div className="pc-form-group">
                            <label>Competição</label>

                            {competicaoSelecionada ? (
                                <div className="pvt-selecionado-chip">
                                    <div
                                        className="pvt-chip-avatar"
                                        style={competicaoSelecionada.imagem ? { backgroundImage: `url(${competicaoSelecionada.imagem})` } : undefined}
                                    />
                                    <span className="pvt-chip-nome">{competicaoSelecionada.nome}</span>
                                    <button
                                        type="button"
                                        className="pvt-chip-remover"
                                        onClick={() => setCompeticaoSelecionada(null)}
                                    >
                                        Trocar
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        className="pc-input"
                                        placeholder="Digite ao menos 3 letras..."
                                        value={termoCompeticao}
                                        onChange={(e) => {
                                            setTermoCompeticao(e.target.value);
                                            setShowDropdownCompeticao(true);
                                        }}
                                        onFocus={() => setShowDropdownCompeticao(true)}
                                        onBlur={() => setTimeout(() => setShowDropdownCompeticao(false), 150)}
                                        autoFocus
                                    />
                                    {showDropdownCompeticao && termoCompeticao.trim().length >= 3 && (
                                        <div className="pvt-dropdown">
                                            {resultadosCompeticao.length === 0 ? (
                                                <div className="pvt-dropdown-empty">Nenhuma competição encontrada</div>
                                            ) : (
                                                resultadosCompeticao.map((comp) => (
                                                    <div
                                                        key={comp.id}
                                                        className="pvt-dropdown-item"
                                                        onMouseDown={() => handleSelecionarCompeticao(comp)}
                                                    >
                                                        <div
                                                            className="pvt-dropdown-avatar"
                                                            style={comp.imagem ? { backgroundImage: `url(${comp.imagem})` } : undefined}
                                                        />
                                                        <span className="pvt-dropdown-nome">{comp.nome}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="pc-form-group">
                            <label>Título</label>

                            {tituloSelecionado ? (
                                <div className="pvt-selecionado-chip">
                                    <div
                                        className="pvt-chip-avatar"
                                        style={tituloSelecionado.imagem ? { backgroundImage: `url(${tituloSelecionado.imagem})` } : undefined}
                                    />
                                    <span className="pvt-chip-nome">{tituloSelecionado.nome}</span>
                                    <button
                                        type="button"
                                        className="pvt-chip-remover"
                                        onClick={() => setTituloSelecionado(null)}
                                    >
                                        Trocar
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        className="pc-input"
                                        placeholder="Digite ao menos 3 letras..."
                                        value={termoTitulo}
                                        onChange={(e) => {
                                            setTermoTitulo(e.target.value);
                                            setShowDropdownTitulo(true);
                                            setDesvincular(false);
                                        }}
                                        onFocus={() => setShowDropdownTitulo(true)}
                                        onBlur={() => setTimeout(() => setShowDropdownTitulo(false), 150)}
                                        disabled={desvincular}
                                    />
                                    {showDropdownTitulo && termoTitulo.trim().length >= 3 && (
                                        <div className="pvt-dropdown">
                                            {resultadosTitulo.length === 0 ? (
                                                <div className="pvt-dropdown-empty">Nenhum título encontrado</div>
                                            ) : (
                                                resultadosTitulo.map((titulo) => (
                                                    <div
                                                        key={titulo.id}
                                                        className="pvt-dropdown-item"
                                                        onMouseDown={() => handleSelecionarTitulo(titulo)}
                                                    >
                                                        <div
                                                            className="pvt-dropdown-avatar"
                                                            style={titulo.imagem ? { backgroundImage: `url(${titulo.imagem})` } : undefined}
                                                        />
                                                        <span className="pvt-dropdown-nome">{titulo.nome}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {!tituloSelecionado && (
                            <button
                                type="button"
                                className="pvt-remover-vinculo"
                                onClick={handleMarcarDesvincular}
                                style={desvincular ? { borderColor: '#d63031', color: '#d63031' } : undefined}
                            >
                                {desvincular ? '✓ Vínculo será removido' : 'Remover vínculo atual desta competição'}
                            </button>
                        )}

                        {error && <div className="pc-error-msg">{error}</div>}
                    </div>
                </div>

                <div className="pc-footer">
                    <button
                        type="button"
                        className="pc-btn"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <div className="pc-spinner"></div> : 'Salvar Vínculo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupVincularCompTitulo;