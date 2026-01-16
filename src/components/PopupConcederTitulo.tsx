import React, { useState, useEffect, useMemo } from 'react';
import { API } from '../services/api';
import './PopupConcederTitulo.css';

interface Titulo {
    id: string;
    nome: string;
    imagem: string;
    descricao?: string;
}

interface Inscricao {
    id: string;
    jogadorId: string;
    jogadorNome: string;
    jogadorImagem: string | null;
    clubeId: string;
    clubeNome: string;
    clubeImagem: string;
    clubeSigla: string;
    temporadaId: string;
    temporadaNome: string;
}

interface ConcederResponse {
    mensagem: string;
    idConquista: string;
    imagemGerada: string;
    nomeTitulo: string;
}

interface PopupConcederTituloProps {
    onClose: () => void;
    temporadaId: string;
    nomeTemporada: string;
    onSuccess?: () => void; 
}

const PopupConcederTitulo: React.FC<PopupConcederTituloProps> = ({ 
    onClose, 
    temporadaId, 
    nomeTemporada,
    onSuccess 
}) => {
    
    const [fadeout, setFadeout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [titulos, setTitulos] = useState<Titulo[]>([]);
    const [inscritos, setInscritos] = useState<Inscricao[]>([]);
    
    const [selectedTituloId, setSelectedTituloId] = useState('');
    const [selectedInscricaoId, setSelectedInscricaoId] = useState('');
    const [playerSearch, setPlayerSearch] = useState('');
    
    const [successData, setSuccessData] = useState<ConcederResponse | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [titulosRes, inscritosRes] = await Promise.all([
                    API.get('/titulos'),
                    API.get(`/inscricao/temporada/${temporadaId}`)
                ]);

                setTitulos(titulosRes.data || []);
                
                const listaInscritos = Array.isArray(inscritosRes.data) ? inscritosRes.data : [];
                setInscritos(listaInscritos);

            } catch (err) {
                console.error("Erro ao carregar dados:", err);
                setError("Falha ao carregar lista de títulos ou jogadores.");
            } finally {
                setInitialLoading(false);
            }
        };

        fetchData();
    }, [temporadaId]);

    const filteredPlayers = useMemo(() => {
        if (!playerSearch) return inscritos.slice(0, 10);
        
        const lowerSearch = playerSearch.toLowerCase();
        
        return inscritos.filter(i => {
            const nomeP = i.jogadorNome ? i.jogadorNome.toLowerCase() : '';
            const nomeC = i.clubeNome ? i.clubeNome.toLowerCase() : '';
            const siglaC = i.clubeSigla ? i.clubeSigla.toLowerCase() : '';

            return nomeP.includes(lowerSearch) || nomeC.includes(lowerSearch) || siglaC.includes(lowerSearch);
        }).slice(0, 20);
    }, [inscritos, playerSearch]);

    const getAvatarUrl = (img: string | null) => {
        if (!img) return 'https://via.placeholder.com/32';
        if (img.includes('http')) return img;
        return `/api/avatares/${img}`;
    };

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleConceder = async () => {
        setError('');
        if (!selectedTituloId || !selectedInscricaoId) {
            setError("Selecione um título e um jogador.");
            return;
        }

        setLoading(true);

        const payload = {
            jogadorClubeId: selectedInscricaoId,
            idTitulo: selectedTituloId,
            edicao: nomeTemporada
        };

        try {
            const response = await API.post('/titulos/conceder', payload);
            setSuccessData(response.data);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            const msg = err.response?.data?.erro || err.response?.data?.message || "Erro ao conceder título.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
            <div className="popup-content conceder-popup-width">
                
                <button className="popup-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="popup-header-fixed">
                    <div className="icon-badge-gold">
                        {successData ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="32" height="32">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                                <path d="M4 22h16"></path>
                                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                            </svg>
                        )}
                    </div>
                    <h2 className="popup-title">
                        {successData ? 'Título Concedido!' : 'Conceder Título'}
                    </h2>
                    <p className="popup-subtitle">
                        {successData 
                            ? `O troféu foi entregue para a temporada ${nomeTemporada}` 
                            : 'Entregue um troféu para um jogador da temporada atual'}
                    </p>
                </div>

                <div className="popup-body-scroll custom-scrollbar">
                    {initialLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="popup-spinner-small" style={{ borderColor: '#2563eb', borderTopColor: 'transparent', margin: '0 auto' }}></div>
                            <p style={{ marginTop: '10px', color: '#666' }}>Carregando dados...</p>
                        </div>
                    ) : successData ? (
                        <div className="success-view">
                            <div className="success-image-container">
                                {successData.imagemGerada ? (
                                    <img src={successData.imagemGerada} alt="Card da Conquista" className="generated-image" />
                                ) : (
                                    <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '10px' }}>Sem imagem gerada</div>
                                )}
                            </div>
                            <h3 className="success-title">{successData.nomeTitulo}</h3>
                            <p className="success-desc">Adicionado ao perfil com sucesso.</p>
                        </div>
                    ) : (
                        <div className="conceder-form">
                            
                            <div className="form-group">
                                <label>Edição / Temporada</label>
                                <input 
                                    className="conceder-input" 
                                    value={nomeTemporada} 
                                    disabled 
                                    style={{ fontWeight: 'bold', color: '#555' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Selecione o Título</label>
                                <div className="titles-grid custom-scrollbar">
                                    {titulos.map(t => (
                                        <div 
                                            key={t.id} 
                                            className={`title-card ${selectedTituloId === t.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedTituloId(t.id)}
                                        >
                                            {t.imagem ? (
                                                <img src={t.imagem} alt={t.nome} />
                                            ) : (
                                                <div style={{width: 40, height: 40, background: '#eee', borderRadius: '50%', marginBottom: 8}}></div>
                                            )}
                                            <span>{t.nome}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Selecione o Jogador</label>
                                <input 
                                    type="text" 
                                    className="conceder-input" 
                                    placeholder="Buscar por nome ou clube..." 
                                    value={playerSearch}
                                    onChange={(e) => {
                                        setPlayerSearch(e.target.value);
                                        if (selectedInscricaoId && e.target.value === '') {
                                            setSelectedInscricaoId('');
                                        }
                                    }}
                                />
                                
                                <div className="player-search-results custom-scrollbar">
                                    {filteredPlayers.length === 0 ? (
                                        <div style={{ padding: '10px', color: '#999', textAlign: 'center', fontSize: '0.85rem' }}>
                                            Nenhum jogador encontrado.
                                        </div>
                                    ) : (
                                        filteredPlayers.map(insc => (
                                            <div 
                                                key={insc.id} 
                                                className={`player-item ${selectedInscricaoId === insc.id ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setSelectedInscricaoId(insc.id);
                                                    setPlayerSearch(`${insc.jogadorNome} (${insc.clubeNome})`);
                                                }}
                                            >
                                                <img 
                                                    src={getAvatarUrl(insc.jogadorImagem)} 
                                                    alt="Avatar" 
                                                    className="p-avatar"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://via.placeholder.com/32';
                                                    }}
                                                />
                                                
                                                <div className="p-info">
                                                    <span className="p-name">{insc.jogadorNome}</span>
                                                    <span className="p-club">
                                                        {insc.clubeImagem && (
                                                            <img 
                                                                src={insc.clubeImagem} 
                                                                alt={insc.clubeSigla} 
                                                                style={{width: 12, height: 12, marginRight: 4, verticalAlign: 'middle'}} 
                                                            />
                                                        )}
                                                        {insc.clubeNome}
                                                    </span>
                                                </div>
                                                
                                                {selectedInscricaoId === insc.id && (
                                                    <div style={{ marginLeft: 'auto', color: '#2563eb' }}>✓</div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {error && <div className="conceder-error-msg">{error}</div>}
                        </div>
                    )}
                </div>

                <div className="popup-footer-fixed">
                    {successData ? (
                         <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                             {successData.imagemGerada && (
                                <a 
                                    href={successData.imagemGerada} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="conceder-btn"
                                    style={{ 
                                        backgroundColor: '#2563eb', 
                                        textDecoration: 'none', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    Baixar Imagem
                                </a>
                             )}
                             <button type="button" className="conceder-btn close-success" onClick={handleClose}>
                                Fechar
                             </button>
                         </div>
                    ) : (
                        <button 
                            type="button" 
                            className="conceder-btn" 
                            onClick={handleConceder} 
                            disabled={loading || initialLoading}
                        >
                            {loading ? <div className="popup-spinner-small"></div> : 'Confirmar e Conceder'}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PopupConcederTitulo;