import React, { useState, useEffect } from 'react';
import { API } from '../services/api';
import './PopupAtualizarJogador.css';

const StatusOpcoes = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  BLOQUEADO: 'BLOQUEADO',
  SUSPENSO: 'SUSPENSO',
  APOSENTADO: 'APOSENTADO'
} as const;

type StatusJogadorType = keyof typeof StatusOpcoes;

const LISTA_STATUS: StatusJogadorType[] = [
  'ATIVO', 
  'INATIVO', 
  'BLOQUEADO', 
  'SUSPENSO', 
  'APOSENTADO'
];

interface JogadorBusca {
  id: string;
  discord: string;
  nome: string;
  imagem?: string;
}

interface PopupAtualizarJogadorProps {
  onClose: () => void;
}

const SmartAvatar: React.FC<{ src?: string | null; alt: string }> = ({ src, alt }) => {
  const [finalUrl, setFinalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setFinalUrl(null);
      return;
    }

    if (src.startsWith('http') || src.startsWith('data:')) {
      setFinalUrl(src);
    } else {
      API.get(`/api/avatares/${src}`)
        .then(response => {
          const data = response.data;
          if (data && data.url) {
            setFinalUrl(data.url);
          }
        })
        .catch(() => setFinalUrl(null));
    }
  }, [src]);

  if (finalUrl) {
    return <img src={finalUrl} alt={alt} />;
  }

  return <span>{alt.charAt(0).toUpperCase()}</span>;
};

const PopupAtualizarJogador: React.FC<PopupAtualizarJogadorProps> = ({ onClose }) => {
  const [fadeout, setFadeout] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<JogadorBusca[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<JogadorBusca | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<StatusJogadorType | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => onClose(), 300);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 3 && !selectedPlayer) {
        buscarJogadores(searchTerm);
      } else if (searchTerm.length < 3) {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedPlayer]);

  const buscarJogadores = async (termo: string) => {
    setIsSearching(true);
    try {
      const response = await API.get(`/jogador/buscar-autocomplete?termo=${termo}`);
      const dados = (response && response.data) ? response.data : response;

      if (Array.isArray(dados)) {
        setSuggestions(dados);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlayer = (player: JogadorBusca) => {
    setSelectedPlayer(player);
    setSearchTerm(player.discord); 
    setSuggestions([]);
    setErrorMsg(null);
    setSelectedStatus(null); 
  };

  const clearSelection = () => {
    setSelectedPlayer(null);
    setSearchTerm('');
    setSuggestions([]);
    setSuccess(false);
    setErrorMsg(null);
    setSelectedStatus(null);
  };

  const handleSalvarStatus = async () => {
    if (!selectedPlayer || !selectedStatus) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await API.patch(`/jogador/${selectedPlayer.id}/status`, {
        status: selectedStatus
      });
      
      setSuccess(true);

    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao atualizar status. Tente novamente.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: StatusJogadorType) => {
      switch(status) {
          case StatusOpcoes.ATIVO: return 'Ativo';
          case StatusOpcoes.INATIVO: return 'Inativo';
          case StatusOpcoes.BLOQUEADO: return 'Bloqueado';
          case StatusOpcoes.SUSPENSO: return 'Suspenso';
          case StatusOpcoes.APOSENTADO: return 'Aposentado';
          default: return status;
      }
  };

  const getStatusClass = (status: StatusJogadorType) => {
    switch(status) {
        case StatusOpcoes.ATIVO: return 'poatu-st-ativo';
        case StatusOpcoes.INATIVO: return 'poatu-st-inativo';
        case StatusOpcoes.BLOQUEADO: return 'poatu-st-bloqueado';
        case StatusOpcoes.SUSPENSO: return 'poatu-st-suspenso';
        case StatusOpcoes.APOSENTADO: return 'poatu-st-aposentado';
        default: return '';
    }
  };

  return (
    <div className={`poatu-overlay ${fadeout ? 'poatu-fade-out' : ''}`}>
      <div className="poatu-content">
        
        <button className="poatu-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="poatu-header">
            <div className="poatu-icon-badge">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                 <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
               </svg>
            </div>
            <h2 className="poatu-title">Atualizar Status</h2>
            <p className="poatu-subtitle">Gerencie a situação cadastral do jogador</p>
        </div>

        <div className="poatu-body poatu-scrollbar">
            {!success ? (
                <div className="poatu-search-container">
                    <div className="poatu-form-group">
                        <label>Buscar Jogador</label>
                        <div className="poatu-input-wrap">
                            <input 
                                type="text" 
                                className="poatu-input"
                                placeholder="Nome ou Discord..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (selectedPlayer && e.target.value !== selectedPlayer.discord) {
                                        setSelectedPlayer(null);
                                        setSelectedStatus(null);
                                    }
                                }}
                                disabled={isLoading}
                            />
                             <div className="poatu-search-icon">
                                {isSearching ? <div className="poatu-spinner-blue"></div> : (
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                )}
                            </div>
                        </div>

                        {suggestions.length > 0 && !selectedPlayer && (
                            <div className="poatu-suggestions-list poatu-scrollbar">
                                {suggestions.map((player) => (
                                    <div 
                                        key={player.id} 
                                        className="poatu-suggestion-item"
                                        onClick={() => handleSelectPlayer(player)}
                                    >
                                        <div className="poatu-sug-avatar">
                                            <SmartAvatar src={player.imagem} alt={player.nome} />
                                        </div>
                                        <div className="poatu-sug-info">
                                            <span className="poatu-sug-discord">{player.discord}</span>
                                            <span className="poatu-sug-name">{player.nome}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedPlayer && (
                        <>
                            <div className="poatu-selected-card">
                                <div className="poatu-sp-content">
                                    <span className="poatu-sp-label">Editando:</span>
                                    <span className="poatu-sp-value">{selectedPlayer.nome}</span>
                                </div>
                                <button className="poatu-sp-remove" onClick={clearSelection}>Trocar</button>
                            </div>

                            <div className="poatu-status-section">
                                <div className="poatu-form-group">
                                    <label>Novo Status</label>
                                    <div className="poatu-status-grid">
                                        {LISTA_STATUS.map((status) => (
                                            <div 
                                                key={status}
                                                className={`poatu-status-opt ${getStatusClass(status)} ${selectedStatus === status ? 'selected' : ''}`}
                                                onClick={() => setSelectedStatus(status)}
                                            >
                                                {getStatusLabel(status)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {errorMsg && <div className="poatu-error-msg">{errorMsg}</div>}
                </div>
            ) : (
                <div className="poatu-result-success">
                    <div className="poatu-success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <h3>Status Atualizado!</h3>
                    <p>O status de <strong>{selectedPlayer?.nome}</strong> foi alterado para <strong>{selectedStatus ? getStatusLabel(selectedStatus) : ''}</strong> com sucesso.</p>
                </div>
            )}
        </div>

        <div className="poatu-footer">
            {!success ? (
                <button 
                    className="poatu-btn"
                    disabled={!selectedPlayer || !selectedStatus || isLoading}
                    onClick={handleSalvarStatus}
                >
                    {isLoading ? <div className="poatu-spinner"></div> : 'Salvar Alterações'}
                </button>
            ) : (
                <button className="poatu-btn secondary" onClick={clearSelection}>
                    Atualizar Outro Jogador
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default PopupAtualizarJogador;