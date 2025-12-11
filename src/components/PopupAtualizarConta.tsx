import React, { useState, useEffect, useRef } from 'react';
import { API } from '../services/api';
import './PopupAtualizarConta.css';

interface UserData {
  nome: string;
  descricao: string | null;
  imagem: string | null;
}

interface AvatarData {
  id: string;
  url: string;
  nome?: string;
}

interface PopupAtualizarContaProps {
  currentUser: any;
  onClose: () => void;
  onUpdateSuccess: (updatedUser: any) => void;
}

const PopupAtualizarConta: React.FC<PopupAtualizarContaProps> = ({ currentUser, onClose, onUpdateSuccess }) => {
  const [fadeout, setFadeout] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'avatar'>('info');
  const [avatarMode, setAvatarMode] = useState<'gallery' | 'upload'>('gallery');
  
  const [formData, setFormData] = useState<UserData>({
    nome: '',
    descricao: '',
    imagem: ''
  });

  const [avatares, setAvatares] = useState<AvatarData[]>([]);
  const [loadingAvatares, setLoadingAvatares] = useState(false);
  
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        nome: currentUser.nome || '',
        descricao: currentUser.descricao || '',
        imagem: currentUser.imagem || ''
      });
      setSelectedAvatarUrl(currentUser.imagem);
    }

    return () => {
      if (previewFileUrl) URL.revokeObjectURL(previewFileUrl);
    };
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'avatar' && avatares.length === 0) {
      fetchAvatares();
    }
  }, [activeTab]);

  const fetchAvatares = async () => {
    setLoadingAvatares(true);
    try {
      const response = await API.get('/api/avatares');
      const dados = (response && response.data) ? response.data : response;
      if (Array.isArray(dados)) {
        setAvatares(dados);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAvatares(false);
    }
  };

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectAvatar = (url: string) => {
    setSelectedAvatarUrl(url);
    setSelectedFile(null);
    if (previewFileUrl) {
      URL.revokeObjectURL(previewFileUrl);
      setPreviewFileUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const objectUrl = URL.createObjectURL(file);
      setPreviewFileUrl(objectUrl);
      setSelectedAvatarUrl(objectUrl); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        await API.patch('/jogador/uploadfoto', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        imagem: (!selectedFile && selectedAvatarUrl !== currentUser.imagem) ? selectedAvatarUrl : undefined
      };

      const response = await API.patch('/jogador/perfil', payload);
      
      onUpdateSuccess(response.data || response);
      handleClose();

    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Erro ao atualizar perfil.";
      setError(msg);
      setSaving(false);
    }
  };

  const currentDisplayAvatar = previewFileUrl || selectedAvatarUrl || formData.imagem;

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content conta-popup-width">
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={`popup-body-animate ${fadeout ? 'fade-out-content' : ''}`}>
          
          <div className="popup-header-clean">
            <div className="header-top-row">
                <div className="icon-badge-wrapper conta-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </div>
                <div>
                    <h2 className="popup-title">Editar Perfil</h2>
                    <p className="popup-subtitle">Personalize como você aparece para os outros</p>
                </div>
            </div>

            <div className="main-tabs">
                <button 
                    className={`main-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                >
                    Informações
                </button>
                <button 
                    className={`main-tab-btn ${activeTab === 'avatar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('avatar')}
                >
                    Avatar e Foto
                </button>
            </div>
          </div>

          <div className="popup-scrollable-area custom-scrollbar form-layout">
            
            {activeTab === 'info' && (
                <div className="tab-content-animate">
                    <div className="preview-mini-header">
                        <div className="mini-avatar">
                            {currentDisplayAvatar ? (
                                <img src={currentDisplayAvatar} alt="Preview" />
                            ) : (
                                <span>{formData.nome.charAt(0)}</span>
                            )}
                        </div>
                        <div className="mini-info">
                            <strong>{formData.nome}</strong>
                            <span>Editando informações públicas</span>
                        </div>
                    </div>

                    <div className="form-section">
                        <label className="form-label">Nome de Exibição</label>
                        <input 
                            type="text" 
                            name="nome"
                            className="form-input"
                            value={formData.nome}
                            onChange={handleChange}
                            maxLength={30}
                            placeholder="Seu nome ou nick"
                        />
                        <div className="char-counter">{formData.nome.length}/30</div>
                    </div>

                    <div className="form-section">
                        <label className="form-label">Biografia / Descrição</label>
                        <textarea 
                            name="descricao"
                            className="form-textarea custom-scrollbar"
                            value={formData.descricao || ''}
                            onChange={handleChange}
                            maxLength={150}
                            placeholder="Conte um pouco sobre você..."
                        />
                        <div className="char-counter">{(formData.descricao || '').length}/150</div>
                    </div>
                </div>
            )}

            {activeTab === 'avatar' && (
                <div className="tab-content-animate">
                     <div className="sub-tabs-container">
                        <button 
                            className={`sub-tab-pill ${avatarMode === 'gallery' ? 'active' : ''}`}
                            onClick={() => setAvatarMode('gallery')}
                        >
                            Galeria
                        </button>
                        <button 
                            className={`sub-tab-pill ${avatarMode === 'upload' ? 'active' : ''}`}
                            onClick={() => setAvatarMode('upload')}
                        >
                            Upload
                        </button>
                    </div>

                    {avatarMode === 'gallery' ? (
                        loadingAvatares ? (
                            <div className="loading-area">
                                <div className="spinner-small"></div>
                                <span>Carregando galeria...</span>
                            </div>
                        ) : (
                            <div className="avatar-grid-wrapper">
                                {avatares.map((avatar) => (
                                    <div 
                                        key={avatar.id} 
                                        className={`avatar-option ${selectedAvatarUrl === avatar.url ? 'selected' : ''}`}
                                        onClick={() => handleSelectAvatar(avatar.url)}
                                    >
                                        <img src={avatar.url} alt="Avatar" loading="lazy" />
                                        {selectedAvatarUrl === avatar.url && (
                                            <div className="check-indicator">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="upload-wrapper">
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            <div 
                                className="upload-box"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewFileUrl ? (
                                    <div className="upload-preview-active">
                                        <img src={previewFileUrl} alt="Upload Preview" />
                                        <div className="upload-overlay-text">Trocar Imagem</div>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder-content">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="17 8 12 3 7 8"></polyline>
                                            <line x1="12" y1="3" x2="12" y2="15"></line>
                                        </svg>
                                        <p>Clique para selecionar</p>
                                        <span>JPG, PNG (Max 5MB)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && <div className="reivindicar-error-msg">{error}</div>}
          </div>

          <div className="actions-footer">
            <div className="footer-left">
                {activeTab === 'avatar' && selectedAvatarUrl !== currentUser?.imagem && (
                    <span className="unsaved-badge">Alteração pendente</span>
                )}
            </div>

            <div className="footer-right">
              <button 
                  type="button"
                  className="btn-base btn-secondary" 
                  onClick={handleClose}
              >
                  Cancelar
              </button>
              
              <button 
                  type="button"
                  className="btn-base btn-primary" 
                  onClick={handleSubmit}
                  disabled={saving}
              >
                  {saving ? <div className="btn-spinner"></div> : 'Salvar Alterações'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PopupAtualizarConta;