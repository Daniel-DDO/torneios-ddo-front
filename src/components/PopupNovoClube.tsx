import React, { useState } from 'react';
import { Shield, Image as ImageIcon, } from 'lucide-react';
import { API } from '../services/api';
import './PopupNovoClube.css';

interface PopupNovoClubeProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const LIGA_OPTIONS = [
  { value: "LALIGA", label: "La Liga - ESP" },
  { value: "PREMIER_LEAGUE", label: "Premier League - ING" },
  { value: "SERIEA", label: "Serie A - ITA" },
  { value: "BUNDESLIGA", label: "Bundesliga - ALE" },
  { value: "LIGUEONE", label: "Ligue One - FRA" },
  { value: "BRASILEIRAO", label: "Brasileirão - BRA" },
  { value: "ARGENTINA", label: "Liga Argentina - ARG" },
  { value: "MLS", label: "Major League Soccer - EUA" },
  { value: "SAUDI_PRO_LEAGUE", label: "Saudi Pro League - ARA" },
  { value: "SELECAO", label: "Seleção" },
  { value: "OUTROS", label: "Outros" }
];

const PopupNovoClube: React.FC<PopupNovoClubeProps> = ({ onClose, onSuccess }) => {
  const [fadeout, setFadeout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    estadio: '',
    imagem: '',
    ligaClube: '',
    estrelas: 3.0,
    corPrimaria: '#000000',
    corSecundaria: '#ffffff'
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageBlur = () => {
    if (formData.imagem) {
      setImagePreview(formData.imagem);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nome || !formData.sigla || !formData.estadio || !formData.ligaClube) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    if (formData.sigla.length !== 3) {
      setError("A sigla deve ter exatamente 3 letras.");
      return;
    }

    setLoading(true);

    try {
      await API.post('/clube/cadastrar', formData);
      setSuccess("Clube cadastrado com sucesso!");
      
      if (onSuccess) onSuccess();

      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao cadastrar clube.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content popup-novo-clube">
        
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="popup-header-fixed">
            <div 
              className="icon-badge-wrapper"
              style={{
                background: `linear-gradient(135deg, ${formData.corPrimaria} 0%, ${formData.corSecundaria} 100%)`,
                boxShadow: `0 8px 20px ${formData.corPrimaria}40`
              }}
            >
               <Shield size={28} color="#fff" />
            </div>
            <h2 className="popup-title">Novo Clube</h2>
            <p className="popup-subtitle">Cadastre um novo time no sistema</p>
        </div>

        <div className="popup-body-scroll custom-scrollbar">
            
            <div className="form-row-split">
                {/* Coluna Esquerda: Dados Básicos */}
                <div className="form-column">
                    <div className="form-group">
                        <label>Nome do Clube <span className="required-star">*</span></label>
                        <input 
                            className="pnc-input" 
                            type="text" 
                            name="nome" 
                            placeholder="Ex: Real Madrid"
                            value={formData.nome}
                            onChange={handleChange}
                            maxLength={50}
                        />
                    </div>

                    <div className="form-row-mini">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Sigla <span className="required-star">*</span></label>
                            <input 
                                className="pnc-input" 
                                type="text" 
                                name="sigla" 
                                placeholder="RMA"
                                value={formData.sigla}
                                onChange={(e) => setFormData({...formData, sigla: e.target.value.toUpperCase()})}
                                maxLength={3}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Estrelas (0.5 - 5.0)</label>
                            <input 
                                className="pnc-input" 
                                type="number" 
                                name="estrelas" 
                                step="0.5"
                                min="0.5"
                                max="5.0"
                                value={formData.estrelas}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Estádio <span className="required-star">*</span></label>
                        <input 
                            className="pnc-input" 
                            type="text" 
                            name="estadio" 
                            placeholder="Ex: Santiago Bernabéu"
                            value={formData.estadio}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Liga <span className="required-star">*</span></label>
                        <div className="select-wrapper">
                            <select 
                                className="pnc-select"
                                name="ligaClube"
                                value={formData.ligaClube}
                                onChange={handleChange}
                            >
                                <option value="">Selecione uma liga...</option>
                                {LIGA_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Coluna Direita: Visual */}
                <div className="form-column">
                    <div className="form-group">
                        <label>Link da Imagem (Logo)</label>
                        <div className="image-input-group">
                            <input 
                                className="pnc-input" 
                                type="text" 
                                name="imagem" 
                                placeholder="https://..."
                                value={formData.imagem}
                                onChange={handleChange}
                                onBlur={handleImageBlur}
                            />
                            <div className="image-preview-box" style={{ borderColor: formData.corPrimaria }}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" onError={() => setImagePreview(null)} />
                                ) : (
                                    <ImageIcon size={24} color="var(--pnc-text-secondary)" />
                                )}
                            </div>
                        </div>
                        <span className="helper-text">Cole o link direto da imagem (PNG/JPG/SVG)</span>
                    </div>

                    <div className="form-group">
                        <label>Cores do Clube</label>
                        <div className="color-picker-row">
                            <div className="color-input-wrapper">
                                <span className="color-label">Primária</span>
                                <div className="color-field">
                                    <input 
                                        type="color" 
                                        name="corPrimaria"
                                        value={formData.corPrimaria}
                                        onChange={handleColorChange}
                                    />
                                    <input 
                                        type="text" 
                                        className="hex-input"
                                        name="corPrimaria"
                                        value={formData.corPrimaria}
                                        onChange={handleChange}
                                        maxLength={7}
                                    />
                                </div>
                            </div>

                            <div className="color-input-wrapper">
                                <span className="color-label">Secundária</span>
                                <div className="color-field">
                                    <input 
                                        type="color" 
                                        name="corSecundaria"
                                        value={formData.corSecundaria}
                                        onChange={handleColorChange}
                                    />
                                    <input 
                                        type="text" 
                                        className="hex-input"
                                        name="corSecundaria"
                                        value={formData.corSecundaria}
                                        onChange={handleChange}
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="pnc-error-msg">{error}</div>}
            {success && <div className="pnc-success-msg">{success}</div>}

        </div>

        <div className="popup-footer-fixed">
            <button 
                className="btn-base btn-primary" 
                onClick={handleSubmit} 
                disabled={loading || !!success}
                style={{ background: `linear-gradient(90deg, ${formData.corPrimaria}, ${formData.corSecundaria})` }}
            >
                {loading ? <div className="btn-spinner"></div> : 'Cadastrar Clube'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default PopupNovoClube;