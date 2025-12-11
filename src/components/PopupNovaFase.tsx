import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { X, Layers, AlertCircle } from 'lucide-react';
import { API } from '../services/api';
import './PopupNovaFase.css';

interface PopupNovaFaseProps {
  onClose: () => void;
  onSubmit: () => void;
}

const TIPO_TORNEIO_OPTIONS = [
  { value: 'GRUPOS', label: 'Fase de Grupos' },
  { value: 'PONTOS_CORRIDOS', label: 'Pontos Corridos' },
  { value: 'MATA_MATA', label: 'Mata-Mata' },
  { value: 'JOGO_UNICO', label: 'Jogo Único' }
];

const FASE_MATA_MATA_OPTIONS = [
  { value: 'FINAL', label: 'Final' },
  { value: 'SEMI_FINAL', label: 'Semi-Final' },
  { value: 'QUARTAS_FINAL', label: 'Quartas de Final' },
  { value: 'OITAVAS_FINAL', label: 'Oitavas de Final' },
  { value: 'DEZESSEIS_AVOS', label: '16-avos de Final' },
  { value: 'TRINTA_E_DOIS_AVOS', label: '32-avos de Final' }
];

const ALGORITMO_LIGA_OPTIONS = [
  { value: 'PADRAO', label: 'Padrão' },
  { value: 'ALEATORIO', label: 'Aleatório' }
];

const ALGORITMO_MATA_MATA_OPTIONS = [
  { value: 'PADRAO', label: 'Padrão (Melhor x Pior)' },
  { value: 'ALEATORIO', label: 'Sorteio Puro' },
  { value: 'POTES', label: 'Sorteio por Potes' }
];

export default function PopupNovaFase({ onClose, onSubmit }: PopupNovaFaseProps) {
  const { torneioId } = useParams();
  const [fadeout, setFadeout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    ordem: 1,
    tipoTorneio: 'GRUPOS',
    numeroRodadas: 1,
    faseInicialMataMata: 'FINAL',
    temJogoVolta: false,
    algoritmoLiga: 'PADRAO',
    algoritmoMataMata: 'PADRAO',
    maxJogosEmCasa: 3
  });

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nome || !formData.ordem || !formData.tipoTorneio) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    if (!torneioId) {
      setError("ID do torneio não encontrado.");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        torneioId: torneioId,
        nome: formData.nome,
        ordem: Number(formData.ordem),
        tipoTorneio: formData.tipoTorneio,
        maxJogosEmCasa: Number(formData.maxJogosEmCasa)
      };

      if (formData.tipoTorneio === 'PONTOS_CORRIDOS' || formData.tipoTorneio === 'GRUPOS') {
        payload.numeroRodadas = Number(formData.numeroRodadas);
        payload.algoritmoLiga = formData.algoritmoLiga;
      }

      if (formData.tipoTorneio === 'MATA_MATA') {
        payload.faseInicialMataMata = formData.faseInicialMataMata;
        payload.temJogoVolta = formData.temJogoVolta;
        payload.algoritmoMataMata = formData.algoritmoMataMata;
      }

      await API.post('/fase-torneio/criar', payload);
      onSubmit();
      handleClose();

    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Erro ao criar fase.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content nova-fase-popup-width">
        
        <button className="popup-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="popup-header-fixed">
            <div className="icon-badge-wrapper fase-badge">
               <Layers size={28} />
            </div>
            <h2 className="popup-title">Nova Fase</h2>
            <p className="popup-subtitle">Configure uma nova etapa para o torneio</p>
        </div>

        <div className="popup-body-scroll custom-scrollbar">
            
            <form onSubmit={handleSubmit} className="nova-fase-form" id="form-fase">
                
                <div className="form-row-split">
                    <div className="form-group" style={{ flex: 2 }}>
                        <label>Nome da Fase <span className="required-star">*</span></label>
                        <input 
                            className="nf-input" 
                            type="text" 
                            name="nome" 
                            placeholder="Ex: Fase de Grupos"
                            value={formData.nome}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Ordem <span className="required-star">*</span></label>
                        <input 
                            className="nf-input" 
                            type="number" 
                            name="ordem" 
                            min="1"
                            value={formData.ordem}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Tipo de Torneio <span className="required-star">*</span></label>
                    <select 
                        className="nf-select"
                        name="tipoTorneio"
                        value={formData.tipoTorneio}
                        onChange={handleChange}
                    >
                        {TIPO_TORNEIO_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {(formData.tipoTorneio === 'PONTOS_CORRIDOS' || formData.tipoTorneio === 'GRUPOS') && (
                    <div className="conditional-section">
                        <div className="form-row-split">
                            <div className="form-group">
                                <label>Número de Rodadas</label>
                                <input 
                                    className="nf-input" 
                                    type="number" 
                                    name="numeroRodadas" 
                                    min="1"
                                    value={formData.numeroRodadas}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Algoritmo de Geração</label>
                                <select 
                                    className="nf-select"
                                    name="algoritmoLiga"
                                    value={formData.algoritmoLiga}
                                    onChange={handleChange}
                                >
                                    {ALGORITMO_LIGA_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {formData.tipoTorneio === 'MATA_MATA' && (
                    <div className="conditional-section">
                        <div className="form-group">
                            <label>Fase Inicial</label>
                            <select 
                                className="nf-select"
                                name="faseInicialMataMata"
                                value={formData.faseInicialMataMata}
                                onChange={handleChange}
                            >
                                {FASE_MATA_MATA_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row-split">
                            <div className="form-group">
                                <label>Algoritmo de Chaveamento</label>
                                <select 
                                    className="nf-select"
                                    name="algoritmoMataMata"
                                    value={formData.algoritmoMataMata}
                                    onChange={handleChange}
                                >
                                    {ALGORITMO_MATA_MATA_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group checkbox-group">
                                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', height: '100%', paddingTop: '20px' }}>
                                    <input 
                                        type="checkbox" 
                                        name="temJogoVolta"
                                        checked={formData.temJogoVolta}
                                        onChange={handleChange}
                                        style={{ marginRight: '10px', width: '18px', height: '18px', accentColor: 'var(--pnf-accent)' }}
                                    />
                                    Tem Jogo de Volta?
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="nf-error-msg">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </form>
        </div>

        <div className="popup-footer-fixed">
            <button 
                type="submit" 
                form="form-fase" 
                className="submit-fase-btn" 
                disabled={loading}
            >
                {loading ? <div className="popup-spinner-small"></div> : 'Criar Fase'}
            </button>
        </div>

      </div>
    </div>
  );
}