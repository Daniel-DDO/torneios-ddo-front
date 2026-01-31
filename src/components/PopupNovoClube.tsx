import React, { useState } from 'react';
import { Shield, Image as ImageIcon, X } from 'lucide-react';
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
    <div className={`crcl-popup-overlay ${fadeout ? 'crcl-fade-out' : ''}`}>
      <div className="crcl-popup-content crcl-popup-novo-clube">
        
        <button className="crcl-popup-close-btn" onClick={handleClose} type="button">
          <X size={20} />
        </button>

        <div className="crcl-popup-header-fixed">
            <div 
              className="crcl-icon-badge-wrapper"
              style={{
                background: `linear-gradient(135deg, ${formData.corPrimaria} 0%, ${formData.corSecundaria} 100%)`,
                boxShadow: `0 8px 20px ${formData.corPrimaria}40`
              }}
            >
               <Shield size={28} color="#fff" />
            </div>
            <h2 className="crcl-popup-title">Novo Clube</h2>
            <p className="crcl-popup-subtitle">Cadastre um novo time no sistema</p>
        </div>

        <div className="crcl-popup-body-scroll crcl-custom-scrollbar">
            
            <div className="crcl-form-row-split">
                <div className="crcl-form-column">
                    <div className="crcl-form-group">
                        <label>Nome do Clube <span className="crcl-required-star">*</span></label>
                        <input 
                            className="crcl-input" 
                            type="text" 
                            name="nome" 
                            placeholder="Ex: Real Madrid"
                            value={formData.nome}
                            onChange={handleChange}
                            maxLength={50}
                        />
                    </div>

                    <div className="crcl-form-row-mini">
                        <div className="crcl-form-group" style={{ flex: 1 }}>
                            <label>Sigla <span className="crcl-required-star">*</span></label>
                            <input 
                                className="crcl-input" 
                                type="text" 
                                name="sigla" 
                                placeholder="RMA"
                                value={formData.sigla}
                                onChange={(e) => setFormData({...formData, sigla: e.target.value.toUpperCase()})}
                                maxLength={3}
                            />
                        </div>
                        <div className="crcl-form-group" style={{ flex: 1 }}>
                            <label>Estrelas (0.5 - 5.0)</label>
                            <input 
                                className="crcl-input" 
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

                    <div className="crcl-form-group">
                        <label>Estádio <span className="crcl-required-star">*</span></label>
                        <input 
                            className="crcl-input" 
                            type="text" 
                            name="estadio" 
                            placeholder="Ex: Santiago Bernabéu"
                            value={formData.estadio}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="crcl-form-group">
                        <label>Liga <span className="crcl-required-star">*</span></label>
                        <div className="crcl-select-wrapper">
                            <select 
                                className="crcl-select"
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

                <div className="crcl-form-column">
                    <div className="crcl-form-group">
                        <label>Link da Imagem (Logo)</label>
                        <div className="crcl-image-input-group">
                            <input 
                                className="crcl-input" 
                                type="text" 
                                name="imagem" 
                                placeholder="https://..."
                                value={formData.imagem}
                                onChange={handleChange}
                                onBlur={handleImageBlur}
                            />
                            <div className="crcl-image-preview-box" style={{ borderColor: formData.corPrimaria }}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" onError={() => setImagePreview(null)} />
                                ) : (
                                    <ImageIcon size={24} color="var(--crcl-text-secondary)" />
                                )}
                            </div>
                        </div>
                        <span className="crcl-helper-text">Cole o link direto da imagem (PNG/JPG/SVG)</span>
                    </div>

                    <div className="crcl-form-group">
                        <label>Cores do Clube</label>
                        <div className="crcl-color-picker-row">
                            <div className="crcl-color-input-wrapper">
                                <span className="crcl-color-label">Primária</span>
                                <div className="crcl-color-field">
                                    <input 
                                        type="color" 
                                        name="corPrimaria"
                                        value={formData.corPrimaria}
                                        onChange={handleColorChange}
                                    />
                                    <input 
                                        type="text" 
                                        className="crcl-hex-input"
                                        name="corPrimaria"
                                        value={formData.corPrimaria}
                                        onChange={handleChange}
                                        maxLength={7}
                                    />
                                </div>
                            </div>

                            <div className="crcl-color-input-wrapper">
                                <span className="crcl-color-label">Secundária</span>
                                <div className="crcl-color-field">
                                    <input 
                                        type="color" 
                                        name="corSecundaria"
                                        value={formData.corSecundaria}
                                        onChange={handleColorChange}
                                    />
                                    <input 
                                        type="text" 
                                        className="crcl-hex-input"
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

            {error && <div className="crcl-error-msg">{error}</div>}
            {success && <div className="crcl-success-msg">{success}</div>}

        </div>

        <div className="crcl-popup-footer-fixed">
            <button 
                className="crcl-btn-base crcl-btn-primary" 
                onClick={handleSubmit} 
                disabled={loading || !!success}
                style={{ background: `linear-gradient(90deg, ${formData.corPrimaria}, ${formData.corSecundaria})` }}
            >
                {loading ? <div className="crcl-btn-spinner"></div> : 'Cadastrar Clube'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default PopupNovoClube;