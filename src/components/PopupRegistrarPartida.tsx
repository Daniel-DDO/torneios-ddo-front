import React, { useState, useEffect, useRef } from 'react';
import { API } from '../services/api';
import './PopupDesign.css';

interface JogadorClubeDTO {
  nome: string;
  psnId: string;
  imgUrl?: string; 
}

interface PartidaDTO {
  id: string;
  faseId: string;
  rodadaId?: string;
  numeroRodada?: number;
  etapaMataMata?: string;
  chaveIndex?: number;
  dataHora: string;
  estadio?: string;
  linkPartida?: string;
  mandante: JogadorClubeDTO;
  visitante: JogadorClubeDTO;
  golsMandante: number;
  golsVisitante: number;
  realizada: boolean;
  wo: boolean;
  houveProrrogacao: boolean;
  houvePenaltis: boolean;
  penaltisMandante?: number;
  penaltisVisitante?: number;
  logEventos?: string;
  cartoesAmarelosMandante: number;
  cartoesVermelhosMandante: number;
  cartoesAmarelosVisitante: number;
  cartoesVermelhosVisitante: number;
  coeficienteMandante?: number;
  coeficienteVisitante?: number;
  tipoPartida?: string;
}

interface PopupRegistrarPartidaProps {
  partida: PartidaDTO;
  onClose: () => void;
  onSuccess: () => void;
}

const PopupRegistrarPartida: React.FC<PopupRegistrarPartidaProps> = ({ partida, onClose, onSuccess }) => {
  const [fadeout, setFadeout] = useState(false);
  const [error, setError] = useState('');
  const [isCountdown, setIsCountdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [seconds, setSeconds] = useState(5);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [golsMandante, setGolsMandante] = useState<number>(partida.golsMandante || 0);
  const [golsVisitante, setGolsVisitante] = useState<number>(partida.golsVisitante || 0);
  const [wo, setWo] = useState(partida.wo || false);
  const [houveProrrogacao, setHouveProrrogacao] = useState(partida.houveProrrogacao || false);
  const [houvePenaltis, setHouvePenaltis] = useState(partida.houvePenaltis || false);
  const [penaltisMandante, setPenaltisMandante] = useState<number>(partida.penaltisMandante || 0);
  const [penaltisVisitante, setPenaltisVisitante] = useState<number>(partida.penaltisVisitante || 0);
  const [cam, setCam] = useState<number>(partida.cartoesAmarelosMandante || 0);
  const [cvm, setCvm] = useState<number>(partida.cartoesVermelhosMandante || 0);
  const [cav, setCav] = useState<number>(partida.cartoesAmarelosVisitante || 0);
  const [cvv, setCvv] = useState<number>(partida.cartoesVermelhosVisitante || 0);
  const [linkPartida, setLinkPartida] = useState(partida.linkPartida || '');

  useEffect(() => {
    if (isCountdown && seconds > 0) {
      timerRef.current = setTimeout(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isCountdown && seconds === 0) {
      executeSubmit();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isCountdown, seconds]);

  const handleClose = () => {
    if (isLoading) return;
    setFadeout(true);
    setTimeout(() => onClose(), 300);
  };

  const startCountdown = () => {
    setError('');
    setIsCountdown(true);
    setSeconds(5);
  };

  const cancelCountdown = () => {
    setIsCountdown(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const executeSubmit = async () => {
    const payload: PartidaDTO = {
      ...partida,
      golsMandante,
      golsVisitante,
      wo,
      houveProrrogacao,
      houvePenaltis,
      penaltisMandante: houvePenaltis ? penaltisMandante : undefined,
      penaltisVisitante: houvePenaltis ? penaltisVisitante : undefined,
      cartoesAmarelosMandante: cam,
      cartoesVermelhosMandante: cvm,
      cartoesAmarelosVisitante: cav,
      cartoesVermelhosVisitante: cvv,
      linkPartida,
      realizada: true 
    };

    try {
      await API.post('/partida/registrar-resultado', payload);
      setFadeout(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 300);
    } catch (err: any) {
      setIsCountdown(false);
      setError(err.response?.data?.message || 'Erro ao registrar resultado.');
    }
  };

  const executeUndo = async () => {
    if (!window.confirm("ATENÇÃO: Desfazer um resultado não é recomendado, pois pode gerar instabilidades no sistema de classificação. Deseja realmente continuar?")) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await API.post(`/partida/${partida.id}/desfazer-resultado`);
      setFadeout(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 300);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.response?.data?.message || 'Erro ao desfazer resultado.');
    }
  };

  const adjustValue = (setter: React.Dispatch<React.SetStateAction<number>>, currentVal: number, delta: number) => {
    setter(Math.max(0, currentVal + delta));
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div className="popup-content reivindicar-popup-width">
        <button className="popup-close-btn" onClick={handleClose} disabled={isLoading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="popup-header-fixed">
          <div className="icon-badge-wrapper">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
               <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
             </svg>
          </div>
          <h2 className="popup-title">Registrar Resultado</h2>
        </div>

        <div className="popup-body-scroll custom-scrollbar">
          {isCountdown ? (
            <div className="countdown-wrapper">
              <div className="countdown-circle">
                <span className="countdown-number">{seconds}</span>
              </div>
              <p className="countdown-label">Registrando resultado...</p>
              <button className="cancel-countdown-btn" onClick={cancelCountdown}>
                CANCELAR
              </button>
            </div>
          ) : (
            <>
              <div className="irreversible-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>Atenção: Este processo é <strong>irreversível</strong>. Confira os dados antes de confirmar.</span>
              </div>

              <div className="score-grid-container">
                <div className="team-side">
                  <div className="team-logo-display">
                      {partida.mandante.imgUrl ? (
                        <img src={partida.mandante.imgUrl} alt="Mandante" />
                      ) : (
                        <div className="team-abbr">{partida.mandante.nome.substring(0,2)}</div>
                      )}
                  </div>
                  <span className="team-name">{partida.mandante.nome}</span>
                </div>

                <div className="score-center-controls">
                    <div className="score-control-unit">
                        <button className="score-arrow up" onClick={() => adjustValue(setGolsMandante, golsMandante, 1)} disabled={isLoading}>▲</button>
                        <div className="score-display">{golsMandante}</div>
                        <button className="score-arrow down" onClick={() => adjustValue(setGolsMandante, golsMandante, -1)} disabled={isLoading}>▼</button>
                    </div>
                    
                    <span className="score-x">X</span>

                    <div className="score-control-unit">
                        <button className="score-arrow up" onClick={() => adjustValue(setGolsVisitante, golsVisitante, 1)} disabled={isLoading}>▲</button>
                        <div className="score-display">{golsVisitante}</div>
                        <button className="score-arrow down" onClick={() => adjustValue(setGolsVisitante, golsVisitante, -1)} disabled={isLoading}>▼</button>
                    </div>
                </div>

                <div className="team-side">
                  <div className="team-logo-display">
                      {partida.visitante.imgUrl ? (
                        <img src={partida.visitante.imgUrl} alt="Visitante" />
                      ) : (
                        <div className="team-abbr">{partida.visitante.nome.substring(0,2)}</div>
                      )}
                  </div>
                  <span className="team-name">{partida.visitante.nome}</span>
                </div>
              </div>

              <div className="options-card">
                <div className="toggles-grid">
                  <label className={`toggle-item ${wo ? 'active' : ''}`}>
                    <input type="checkbox" checked={wo} onChange={(e) => setWo(e.target.checked)} disabled={isLoading} />
                    <span className="toggle-label">W.O.</span>
                  </label>
                  <label className={`toggle-item ${houveProrrogacao ? 'active' : ''}`}>
                    <input type="checkbox" checked={houveProrrogacao} onChange={(e) => setHouveProrrogacao(e.target.checked)} disabled={isLoading} />
                    <span className="toggle-label">Prorrogação</span>
                  </label>
                  <label className={`toggle-item ${houvePenaltis ? 'active' : ''}`}>
                    <input type="checkbox" checked={houvePenaltis} onChange={(e) => setHouvePenaltis(e.target.checked)} disabled={isLoading} />
                    <span className="toggle-label">Pênaltis</span>
                  </label>
                </div>
              </div>

              {houvePenaltis && (
                <div className="options-card">
                  <label className="section-title">DISPUTA DE PÊNALTIS</label>
                  <div className="penalty-row">
                    <div className="penalty-control">
                      <button className="mini-btn" onClick={() => adjustValue(setPenaltisMandante, penaltisMandante, -1)} disabled={isLoading}>-</button>
                      <span className="penalty-value">{penaltisMandante}</span>
                      <button className="mini-btn" onClick={() => adjustValue(setPenaltisMandante, penaltisMandante, 1)} disabled={isLoading}>+</button>
                    </div>
                    <span className="penalty-x">x</span>
                    <div className="penalty-control">
                      <button className="mini-btn" onClick={() => adjustValue(setPenaltisVisitante, penaltisVisitante, -1)} disabled={isLoading}>-</button>
                      <span className="penalty-value">{penaltisVisitante}</span>
                      <button className="mini-btn" onClick={() => adjustValue(setPenaltisVisitante, penaltisVisitante, 1)} disabled={isLoading}>+</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="options-card">
                  <label className="section-title">CARTÕES</label>
                  <div className="cards-main-grid">
                    
                    <div className="card-team-block">
                        <span className="card-team-label">MANDANTE</span>
                        <div className="card-inputs-row">
                            <div className="card-unit">
                                <div className="card-icon yellow"></div>
                                <input type="number" min="0" className="card-input" value={cam} onChange={(e) => setCam(Number(e.target.value))} disabled={isLoading} />
                            </div>
                            <div className="card-unit">
                                <div className="card-icon red"></div>
                                <input type="number" min="0" className="card-input" value={cvm} onChange={(e) => setCvm(Number(e.target.value))} disabled={isLoading} />
                            </div>
                        </div>
                    </div>

                    <div className="card-team-block">
                        <span className="card-team-label">VISITANTE</span>
                        <div className="card-inputs-row">
                            <div className="card-unit">
                                <div className="card-icon yellow"></div>
                                <input type="number" min="0" className="card-input" value={cav} onChange={(e) => setCav(Number(e.target.value))} disabled={isLoading} />
                            </div>
                            <div className="card-unit">
                                <div className="card-icon red"></div>
                                <input type="number" min="0" className="card-input" value={cvv} onChange={(e) => setCvv(Number(e.target.value))} disabled={isLoading} />
                            </div>
                        </div>
                    </div>

                  </div>
              </div>

              <div className="input-group">
                <label>Link do Vídeo</label>
                <input 
                  className="reivindicar-input" 
                  type="text" 
                  placeholder="https://youtube.com/..." 
                  value={linkPartida} 
                  onChange={(e) => setLinkPartida(e.target.value)} 
                  disabled={isLoading}
                />
              </div>

              {error && <div className="error-message">{error}</div>}
            </>
          )}
        </div>

        <div className="popup-footer-fixed">
           {!isCountdown && (
             partida.realizada ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '8px' }}>
                    <span style={{ color: '#e74c3c', fontSize: '0.8rem', fontWeight: 500 }}>
                        Não recomendado fazer isso, pois pode gerar instabilidades no sistema.
                    </span>
                    <button 
                        type="button" 
                        className="submit-btn" 
                        style={{ 
                          backgroundColor: '#e74c3c', 
                          opacity: isLoading ? 0.7 : 1, 
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px'
                        }}
                        onClick={executeUndo}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                          <>
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }}>
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                             </svg>
                             <span>PROCESSANDO...</span>
                          </>
                        ) : (
                          "DESFAZER RESULTADO"
                        )}
                    </button>
                </div>
             ) : (
                <button 
                    type="button" 
                    className="submit-btn" 
                    onClick={startCountdown}
                >
                    CONFIRMAR RESULTADO
                </button>
             )
           )}
        </div>
      </div>
    </div>
  );
};

export default PopupRegistrarPartida;