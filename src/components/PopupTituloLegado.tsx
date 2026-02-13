import React, { useState, useEffect } from 'react';
import { API } from '../services/api';
import './PopupTituloLegado.css';

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

interface Titulo {
    id: string;
    nome: string;
}

interface PopupTituloLegadoProps {
    onClose: () => void;
    onSuccess: (dados: any) => void;
}

const PopupTituloLegado: React.FC<PopupTituloLegadoProps> = ({ onClose, onSuccess }) => {
    const [fadeout, setFadeout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingTitulos, setLoadingTitulos] = useState(true);
    const [error, setError] = useState('');

    const [titulos, setTitulos] = useState<Titulo[]>([]);
    
    const [termoJogador, setTermoJogador] = useState('');
    const [sugestoesJogadores, setSugestoesJogadores] = useState<JogadorSugestao[]>([]);
    const [jogadorSelecionado, setJogadorSelecionado] = useState<JogadorSugestao | null>(null);

    const [termoClube, setTermoClube] = useState('');
    const [sugestoesClubes, setSugestoesClubes] = useState<ClubeSugestao[]>([]);
    const [clubeSelecionado, setClubeSelecionado] = useState<ClubeSugestao | null>(null);

    const [formData, setFormData] = useState({
        jogadorId: '',
        clubeId: '',
        idTitulo: '',
        edicao: '',
        data: ''
    });

    useEffect(() => {
        const fetchTitulos = async () => {
            try {
                const response = await API.get('/titulos');
                const listaTitulos = response.data?.conteudo || response.data || [];
                setTitulos(Array.isArray(listaTitulos) ? listaTitulos : []);
            } catch (err) {
                console.error(err);
                setError('Erro ao carregar lista de títulos.');
            } finally {
                setLoadingTitulos(false);
            }
        };

        fetchTitulos();
    }, []);

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
            console.error("Erro ao buscar jogadores", err);
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
            console.error("Erro ao buscar clubes", err);
        }
    };

    const selecionarJogador = (jogador: JogadorSugestao) => {
        setFormData(prev => ({ ...prev, jogadorId: jogador.id }));
        setJogadorSelecionado(jogador);
        setTermoJogador(''); 
        setSugestoesJogadores([]);
    };

    const removerJogador = () => {
        setFormData(prev => ({ ...prev, jogadorId: '' }));
        setJogadorSelecionado(null);
        setTermoJogador('');
    };

    const selecionarClube = (clube: ClubeSugestao) => {
        setFormData(prev => ({ ...prev, clubeId: clube.id }));
        setClubeSelecionado(clube);
        setTermoClube('');
        setSugestoesClubes([]);
    };

    const removerClube = () => {
        setFormData(prev => ({ ...prev, clubeId: '' }));
        setClubeSelecionado(null);
        setTermoClube('');
    };

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setError('');

        if (!formData.jogadorId || !formData.clubeId || !formData.idTitulo || !formData.edicao || !formData.data) {
            setError('Todos os campos são obrigatórios.');
            return;
        }

        setLoading(true);

        try {
            const response = await API.post('/titulos/conceder-legado', formData);
            setFadeout(true);
            setTimeout(() => {
                onSuccess(response.data);
                onClose();
            }, 300);
        } catch (err: any) {
            const msg = err.response?.data?.erro || err.response?.data?.message || "Erro ao conceder título legado.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`ptl-overlay ${fadeout ? 'ptl-fade-out' : ''}`}>
            <div className="ptl-content">
                <button className="ptl-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="ptl-header">
                    <div className="ptl-icon-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                           <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                        </svg>
                    </div>
                    <h2 className="ptl-title">
                        Título Legado
                    </h2>
                </div>

                <div className="ptl-body ptl-scrollbar">
                    {loadingTitulos ? (
                        <div style={{textAlign: 'center', padding: '20px'}}>
                            <div className="ptl-spinner" style={{borderColor: '#2563eb', borderTopColor: 'transparent', margin: '0 auto'}}></div>
                        </div>
                    ) : (
                        <div className="ptl-form">
                            <div className="ptl-form-group">
                                <label>Jogador</label>
                                {!jogadorSelecionado ? (
                                    <>
                                        <input 
                                            type="text" 
                                            className="ptl-input"
                                            placeholder="Buscar por discord (min 3 chars)..."
                                            value={termoJogador}
                                            onChange={(e) => handleSearchJogador(e.target.value)}
                                            autoFocus
                                        />
                                        {sugestoesJogadores.length > 0 && (
                                            <ul className="ptl-suggestions-list ptl-scrollbar">
                                                {sugestoesJogadores.map(j => (
                                                    <li 
                                                        key={j.id} 
                                                        className="ptl-suggestion-item"
                                                        onClick={() => selecionarJogador(j)}
                                                    >
                                                        {j.imagem && <img src={j.imagem} alt="" className="ptl-suggestion-avatar"/>}
                                                        <span>{j.nome} ({j.discord})</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    <div className="ptl-selected-item-card">
                                        <div className="ptl-selected-info">
                                            {jogadorSelecionado.imagem && <img src={jogadorSelecionado.imagem} alt="" className="ptl-suggestion-avatar"/>}
                                            <span>{jogadorSelecionado.nome}</span>
                                        </div>
                                        <button className="ptl-remove-btn" onClick={removerJogador}>
                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="ptl-form-group">
                                <label>Clube</label>
                                {!clubeSelecionado ? (
                                    <>
                                        <input 
                                            type="text" 
                                            className="ptl-input"
                                            placeholder="Buscar clube..."
                                            value={termoClube}
                                            onChange={(e) => handleSearchClube(e.target.value)}
                                        />
                                        {sugestoesClubes.length > 0 && (
                                            <ul className="ptl-suggestions-list ptl-scrollbar">
                                                {sugestoesClubes.map(c => (
                                                    <li 
                                                        key={c.id} 
                                                        className="ptl-suggestion-item"
                                                        onClick={() => selecionarClube(c)}
                                                    >
                                                        {c.imagem && <img src={c.imagem} alt="" className="ptl-suggestion-avatar"/>}
                                                        <span>{c.nome}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    <div className="ptl-selected-item-card">
                                        <div className="ptl-selected-info">
                                            {clubeSelecionado.imagem && <img src={clubeSelecionado.imagem} alt="" className="ptl-suggestion-avatar"/>}
                                            <span>{clubeSelecionado.nome}</span>
                                        </div>
                                        <button className="ptl-remove-btn" onClick={removerClube}>
                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="ptl-form-group">
                                <label>Título</label>
                                <select 
                                    name="idTitulo" 
                                    className="ptl-select"
                                    value={formData.idTitulo}
                                    onChange={handleChange}
                                >
                                    <option value="">Selecione um título...</option>
                                    {titulos.map(t => (
                                        <option key={t.id} value={t.id}>{t.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="ptl-form-group">
                                <label>Edição (Texto)</label>
                                <input
                                    type="text"
                                    name="edicao"
                                    className="ptl-input"
                                    value={formData.edicao}
                                    onChange={handleChange}
                                    placeholder="Ex: 2024 ou Temporada 1"
                                />
                            </div>

                            <div className="ptl-form-group">
                                <label>Data da Conquista</label>
                                <input
                                    type="datetime-local"
                                    name="data"
                                    className="ptl-input"
                                    value={formData.data}
                                    onChange={handleChange}
                                />
                            </div>

                            {error && <div className="ptl-error-msg">{error}</div>}
                        </div>
                    )}
                </div>

                <div className="ptl-footer">
                    <button 
                        type="button" 
                        className="ptl-btn"
                        onClick={handleSubmit} 
                        disabled={loading || loadingTitulos}
                    >
                        {loading ? <div className="ptl-spinner"></div> : 'Conceder Título'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupTituloLegado;