import React, { useState, useEffect, useRef } from 'react';
import { API } from '../services/api';
import './PopupAtualizarFoto.css';

interface AvatarData {
  id: string;
  url: string;
  nome?: string;
}

interface PopupAtualizarFotoProps {
  onClose: () => void;
  onUpdateSuccess: (novaUrl: string) => void;
}

const PopupAtualizarFoto: React.FC<PopupAtualizarFotoProps> = ({ onClose, onUpdateSuccess }) => {
  const [fadeout, setFadeout] = useState(false);
  const [loadingAvatares, setLoadingAvatares] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  
  const [viewMode, setViewMode] = useState<'gallery' | 'upload'>('gallery');
  
  const [avatares, setAvatares] = useState<AvatarData[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAvatares = async () => {
      try {
        const response = await API.get('/api/avatares');
        const dados = (response && response.data) ? response.data : response;

        if (Array.isArray(dados)) {
          setAvatares(dados);
        } else {
          setAvatares([]);
        }
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar a galeria.');
      } finally {
        setLoadingAvatares(false);
      }
    };

    fetchAvatares();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSelectAvatar = (id: string) => {
    setSelectedAvatarId(id);
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');

    try {
      if (viewMode === 'gallery') {
        if (!selectedAvatarId) {
            setError('Por favor, selecione uma imagem.');
            setSaving(false);
            return;
        }

        await API.put('/jogador/avatarId', { 
          avatarId: selectedAvatarId 
        });
        
        const avatarSelecionado = avatares.find(a => a.id === selectedAvatarId);
        if (avatarSelecionado) {
          onUpdateSuccess(avatarSelecionado.url);
        }

      } else {
        if (!selectedFile) {
            setError('Por favor, escolha uma foto.');
            setSaving(false);
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        await API.patch('/jogador/uploadfoto', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        onUpdateSuccess(previewUrl || ''); 
      }
      
      handleClose();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Erro ao atualizar a foto.";
      setError(msg);
      setSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm("Tem certeza que deseja remover sua foto de perfil?")) {
        return;
    }

    setDeleting(true);
    try {
        await API.delete('/jogador/avatar');
        onUpdateSuccess(''); 
        handleClose();
    } catch (err: any) {
        console.error(err);
        setError("Erro ao remover a foto.");
        setDeleting(false);
    }
  };

  const isSaveDisabled = 
    saving || 
    deleting || 
    loadingAvatares || 
    (viewMode === 'gallery' && !selectedAvatarId) ||
    (viewMode === 'upload' && !selectedFile);

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content foto-popup-width">
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={`popup-body-animate ${fadeout ? 'fade-out-content' : ''}`}>
          
          <div className="popup-header-clean">
            <div className="icon-badge-wrapper">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="30" height="30">
                 <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                 <circle cx="12" cy="13" r="4"></circle>
               </svg>
            </div>
            <h2 className="popup-title">Alterar Foto</h2>
          </div>

          <div className="tab-switch-container">
            <button 
                className={`tab-btn ${viewMode === 'gallery' ? 'active' : ''}`}
                onClick={() => setViewMode('gallery')}
            >
                Galeria
            </button>
            <button 
                className={`tab-btn ${viewMode === 'upload' ? 'active' : ''}`}
                onClick={() => setViewMode('upload')}
            >
                Enviar Foto
            </button>
          </div>

          <div className="popup-scrollable-area custom-scrollbar">
            
            {viewMode === 'gallery' && (
                loadingAvatares ? (
                <div className="loading-container">
                    <div className="popup-spinner-large"></div>
                    <p>Carregando galeria...</p>
                </div>
                ) : (
                <>
                    <div className="avatar-grid-container">
                        {avatares.length > 0 ? (
                            avatares.map((avatar) => (
                            <div 
                                key={avatar.id} 
                                className={`avatar-item ${selectedAvatarId === avatar.id ? 'selected' : ''}`}
                                onClick={() => handleSelectAvatar(avatar.id)}
                                title={avatar.nome}
                            >
                                <img src={avatar.url} alt={avatar.nome || "Avatar"} loading="lazy" />
                                {selectedAvatarId === avatar.id && (
                                    <div className="check-overlay">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="20" height="20">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                )}
                            </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#888', gridColumn: '1/-1' }}>
                            <p>Nenhum avatar encontrado.</p>
                            </div>
                        )}
                    </div>
                    <div className="avatar-count-info">
                        {avatares.length} avatares disponíveis
                    </div>
                </>
                )
            )}

            {viewMode === 'upload' && (
                <div className="upload-section">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/jpg"
                        style={{ display: 'none' }}
                    />
                    
                    <div 
                        className="upload-dropzone"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                            <div className="preview-container">
                                <img src={previewUrl} alt="Preview" className="upload-preview-img" />
                                <div className="preview-overlay">
                                    <span>Trocar imagem</span>
                                </div>
                            </div>
                        ) : (
                            <div className="upload-placeholder">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                                <p>Clique para enviar sua foto</p>
                                <span className="upload-hint">JPG ou PNG (Máx 2MB)</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && <div className="reivindicar-error-msg">{error}</div>}
          </div>

          <div className="actions-footer">
            <div className="footer-left">
              <button 
                type="button"
                className="btn-base btn-danger-ghost" 
                onClick={handleRemoveAvatar}
                disabled={saving || deleting || loadingAvatares}
                title="Remover foto atual"
              >
                 {deleting ? (
                    <span className="btn-spinner" style={{borderColor: '#ff4d4f', borderTopColor: 'transparent'}}></span>
                 ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                 )}
              </button>
            </div>

            <div className="footer-right">
              <button 
                  className="btn-base btn-secondary" 
                  onClick={handleClose}
              >
                  Cancelar
              </button>
              
              <button 
                  className="btn-base btn-primary" 
                  onClick={handleSubmit}
                  disabled={isSaveDisabled}
              >
                  {saving ? <div className="btn-spinner"></div> : 'Salvar'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PopupAtualizarFoto;