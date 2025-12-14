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
  { value: 'PONTOS_CORRIDOS', label: 'Pontos Corridos / Liga' },
  { value: 'MATA_MATA', label: 'Mata-Mata (Bracket)' }
];

const FASE_MATA_MATA_OPTIONS = [
  { value: 'FINAL', label: 'Final (2 times)' },
  { value: 'SEMI', label: 'Semi-Final (4 times)' },
  { value: 'QUARTAS', label: 'Quartas de Final (8 times)' },
  { value: 'OITAVAS', label: 'Oitavas de Final (16 times)' },
  { value: 'DEZESSEIS_AVOS', label: '16-avos de Final (32 times)' },
  { value: 'TRINTA_E_DOIS_AVOS', label: '32-avos de Final (64 times)' }
];

const ALGORITMO_LIGA_OPTIONS = [
  { value: 'TODOS_CONTRA_TODOS_IDA_VOLTA', label: 'Todos contra Todos (Ida e Volta)' },
  { value: 'TODOS_CONTRA_TODOS_UNICO', label: 'Todos contra Todos (Turno Único)' },
  { value: 'FASE_GRUPOS', label: 'Fase de Grupos' },
  { value: 'SISTEMA_SUICO', label: 'Sistema Suíço' },
  { value: 'ALEATORIO_BALANCEADO', label: 'Aleatório Balanceado (Novo Formato UCL)' }
];

const ALGORITMO_MATA_MATA_OPTIONS = [
  { value: 'RANKING_PADRAO', label: 'Ranking (1º vs 16º...)' },
  { value: 'SORTEIO_TOTAL', label: 'Sorteio Total (Aleatório)' },
  { value: 'SORTEIO_DIRIGIDO', label: 'Sorteio Dirigido (Potes A e B)' },
  { value: 'POTES_MANUAIS', label: 'Potes Manuais (Definido por Grupo)' }
];

export default function PopupNovaFase({ onClose, onSubmit }: PopupNovaFaseProps) {
  const { torneioId } = useParams();
  const [fadeout, setFadeout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    ordem: 1,
    tipoTorneio: 'PONTOS_CORRIDOS',
    numeroRodadas: 1,
    faseInicialMataMata: 'OITAVAS',
    temJogoVolta: false,
    finalJogoUnico: true,
    algoritmoLiga: 'TODOS_CONTRA_TODOS_IDA_VOLTA',
    algoritmoMataMata: 'RANKING_PADRAO',
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

    if (!torneioId) {
      setError("Torneio não identificado.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        torneioId: torneioId,
        nome: formData.nome,
        ordem: Number(formData.ordem),
        tipoTorneio: formData.tipoTorneio,
        maxJogosEmCasa: Number(formData.maxJogosEmCasa),
        ...(formData.tipoTorneio === 'PONTOS_CORRIDOS' ? {
          numeroRodadas: Number(formData.numeroRodadas),
          algoritmoLiga: formData.algoritmoLiga
        } : {
          faseInicialMataMata: formData.faseInicialMataMata,
          temJogoVolta: formData.temJogoVolta,
          finalJogoUnico: formData.finalJogoUnico,
          algoritmoMataMata: formData.algoritmoMataMata
        })
      };

      await API.post('/fase-torneio/criar', payload);
      onSubmit();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao criar fase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content nova-fase-popup-width-extended">
        <button className="popup-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="popup-header-fixed">
          <div className="icon-badge-wrapper fase-badge">
            <Layers size={28} />
          </div>
          <h2 className="popup-title">Nova Fase</h2>
          <p className="popup-subtitle">Configure as regras e o algoritmo de geração</p>
        </div>

        <div className="popup-body-scroll custom-scrollbar">
          <form onSubmit={handleSubmit} className="nova-fase-form" id="form-fase">
            <div className="form-row-split">
              <div className="form-group" style={{ flex: 3 }}>
                <label>Nome da Etapa <span className="required-star">*</span></label>
                <input
                  className="nf-input"
                  type="text"
                  name="nome"
                  placeholder="Ex: Oitavas de Final"
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
              <label>Tipo de Competição <span className="required-star">*</span></label>
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

            {formData.tipoTorneio === 'PONTOS_CORRIDOS' && (
              <div className="conditional-section">
                <div className="form-group">
                  <label>Algoritmo de Liga</label>
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
                <div className="form-row-split">
                  <div className="form-group">
                    <label>Rodadas</label>
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
                    <label>Limite Casa</label>
                    <input
                      className="nf-input"
                      type="number"
                      name="maxJogosEmCasa"
                      value={formData.maxJogosEmCasa}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.tipoTorneio === 'MATA_MATA' && (
              <div className="conditional-section">
                <div className="form-row-split">
                  <div className="form-group">
                    <label>Inicia em</label>
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
                  <div className="form-group">
                    <label>Algoritmo</label>
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
                </div>

                <div className="form-row-split-checkboxes">
                  <div className="form-group checkbox-group">
                    <label className="nf-checkbox-label">
                      <input
                        type="checkbox"
                        name="temJogoVolta"
                        checked={formData.temJogoVolta}
                        onChange={handleChange}
                      />
                      Ida e Volta
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="nf-checkbox-label">
                      <input
                        type="checkbox"
                        name="finalJogoUnico"
                        checked={formData.finalJogoUnico}
                        onChange={handleChange}
                      />
                      Final Única
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