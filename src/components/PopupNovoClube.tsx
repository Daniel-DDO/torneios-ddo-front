import React, { useState } from 'react';
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

  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    estadio: '',
    imagem: '',
    ligaClube: 'OUTROS',
    valorAvaliado: '',
    estrelas: '3.0',
    corPrimaria: '#000000',
    corSecundaria: '#ffffff'
  });

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => onClose(), 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!formData.nome || !formData.sigla || !formData.estadio || !formData.valorAvaliado) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    
    if (formData.sigla.length !== 3) {
      setError('A sigla deve ter exatamente 3 letras.');
      return;
    }

    const valorNumerico = parseFloat(formData.valorAvaliado);
    if (isNaN(valorNumerico) || valorNumerico < 0) {
      setError('O valor avaliado deve ser um número positivo.');
      return;
    }

    setLoading(true);

    const payload = {
        ...formData,
        sigla: formData.sigla.toUpperCase(),
        valorAvaliado: valorNumerico,
        estrelas: parseFloat(formData.estrelas)
    };

    try {
      await API.post('/clube/cadastrar', payload);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao cadastrar clube.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`ponovclube-overlay ${fadeout ? 'ponovclube-fade-out' : ''}`}>
      <div className="ponovclube-content">
        
        <button className="ponovclube-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="ponovclube-header">
            <div className="ponovclube-icon-badge" style={{ 
                background: `linear-gradient(135deg, ${formData.corPrimaria} 0%, ${formData.corSecundaria} 100%)` 
            }}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32" style={{ color: '#fff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                 <path d="M12 22V5"></path>
               </svg>
            </div>
            <h2 className="ponovclube-title">Novo Clube</h2>
            <p className="ponovclube-subtitle">Cadastre um novo time no sistema</p>
        </div>

        <div className="ponovclube-body ponovclube-scrollbar">
            <div className="ponovclube-form-grid">
                
                <div className="ponovclube-form-group full-width">
                    <label>Nome do Clube</label>
                    <input 
                        type="text" 
                        className="ponovclube-input"
                        name="nome"
                        placeholder="Ex: Real Madrid"
                        value={formData.nome}
                        onChange={handleChange}
                    />
                </div>

                <div className="ponovclube-form-group">
                    <label>Sigla (3 letras)</label>
                    <input 
                        type="text" 
                        className="ponovclube-input"
                        name="sigla"
                        placeholder="RMA"
                        maxLength={3}
                        value={formData.sigla}
                        onChange={(e) => setFormData({...formData, sigla: e.target.value.toUpperCase()})}
                    />
                </div>

                <div className="ponovclube-form-group">
                    <label>Estrelas</label>
                    <select 
                        className="ponovclube-select"
                        name="estrelas"
                        value={formData.estrelas}
                        onChange={handleChange}
                    >
                        <option value="0.5">0.5 ⭐</option>
                        <option value="1.0">1.0 ⭐</option>
                        <option value="1.5">1.5 ⭐</option>
                        <option value="2.0">2.0 ⭐</option>
                        <option value="2.5">2.5 ⭐</option>
                        <option value="3.0">3.0 ⭐</option>
                        <option value="3.5">3.5 ⭐</option>
                        <option value="4.0">4.0 ⭐</option>
                        <option value="4.5">4.5 ⭐</option>
                        <option value="5.0">5.0 ⭐</option>
                    </select>
                </div>

                <div className="ponovclube-form-group full-width">
                    <label>Liga</label>
                    <select 
                        className="ponovclube-select"
                        name="ligaClube"
                        value={formData.ligaClube}
                        onChange={handleChange}
                    >
                        {LIGA_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="ponovclube-form-group">
                    <label>Estádio</label>
                    <input 
                        type="text" 
                        className="ponovclube-input"
                        name="estadio"
                        placeholder="Santiago Bernabéu"
                        value={formData.estadio}
                        onChange={handleChange}
                    />
                </div>

                <div className="ponovclube-form-group">
                    <label>Valor Avaliado ($)</label>
                    <input 
                        type="number" 
                        className="ponovclube-input"
                        name="valorAvaliado"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={formData.valorAvaliado}
                        onChange={handleChange}
                    />
                </div>

                <div className="ponovclube-form-group">
                    <label>Cor Primária</label>
                    <div className="ponovclube-color-row">
                        <input 
                            type="color" 
                            className="ponovclube-color-picker"
                            name="corPrimaria"
                            value={formData.corPrimaria}
                            onChange={handleColorChange}
                        />
                        <input 
                            type="text" 
                            className="ponovclube-input"
                            name="corPrimaria"
                            value={formData.corPrimaria}
                            onChange={handleChange}
                            maxLength={7}
                        />
                    </div>
                </div>

                <div className="ponovclube-form-group">
                    <label>Cor Secundária</label>
                    <div className="ponovclube-color-row">
                        <input 
                            type="color" 
                            className="ponovclube-color-picker"
                            name="corSecundaria"
                            value={formData.corSecundaria}
                            onChange={handleColorChange}
                        />
                        <input 
                            type="text" 
                            className="ponovclube-input"
                            name="corSecundaria"
                            value={formData.corSecundaria}
                            onChange={handleChange}
                            maxLength={7}
                        />
                    </div>
                </div>

                <div className="ponovclube-form-group full-width">
                    <label>URL do Escudo</label>
                    <input 
                        type="text" 
                        className="ponovclube-input"
                        name="imagem"
                        placeholder="https://..."
                        value={formData.imagem}
                        onChange={handleChange}
                    />
                    {formData.imagem && (
                        <div className="ponovclube-image-preview">
                            <img src={formData.imagem} alt="Preview" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        </div>
                    )}
                </div>

            </div>
            
            {error && <div className="ponovclube-error-msg">{error}</div>}
        </div>

        <div className="ponovclube-footer">
            <button className="ponovclube-btn secondary" onClick={handleClose} disabled={loading}>
                Cancelar
            </button>
            <button 
                className="ponovclube-btn" 
                onClick={handleSubmit} 
                disabled={loading}
            >
                {loading ? <div className="ponovclube-spinner"></div> : 'Cadastrar Clube'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default PopupNovoClube;