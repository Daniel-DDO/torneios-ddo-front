import React, { useState, useEffect } from 'react';
import './PopupClubes.css';
import { API } from '../services/api';

interface Clube {
  id: string;
  nome: string;
  estadio: string;
  imagem: string;
  ligaClube: string;
  sigla: string;
  corPrimaria: string;
  corSecundaria: string;
  ativo: boolean;
  estrelas: number;
  titulos: number;
}

const LIGA_NAMES: { [key: string]: string } = {
  LALIGA: "LaLiga",
  PREMIER_LEAGUE: "Premier League",
  SERIEA: "Serie A",
  BUNDESLIGA: "Bundesliga",
  LIGUEONE: "Ligue One",
  BRASILEIRAO: "Brasileirão",
  ARGENTINA: "Liga Argentina",
  MLS: "Major League Soccer",
  SAUDI_PRO_LEAGUE: "Saudi Pro League",
  SELECAO: "Seleção",
  OUTROS: "Outros"
};

interface PopupClubesProps {
  clubId: string;
  onClose: () => void;
}

const PopupClubes: React.FC<PopupClubesProps> = ({ clubId, onClose }) => {
  const [clube, setClube] = useState<Clube | null>(null);
  const [loading, setLoading] = useState(true);
  const [fadeout, setFadeout] = useState(false);

  useEffect(() => {
    const fetchClube = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/clube/${clubId}`);
        setClube(response.data || response); 
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (clubId) {
      fetchClube();
    }
  }, [clubId]);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const primaryColor = clube?.corPrimaria || 'var(--primary)';
  
  const popupStyle = {
    borderColor: primaryColor,
    boxShadow: `0 0 25px ${primaryColor}40`
  };

  const imageBorder = {
    borderColor: primaryColor
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content" style={popupStyle}>
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {loading ? (
          <div className="popup-loading-container">
            <div className="popup-spinner"></div>
            <p>Carregando informações...</p>
          </div>
        ) : clube ? (
          <div className="popup-layout-wrapper">
            
            <div className="popup-header-fixed">
              <div className="popup-club-image-wrapper" style={imageBorder}>
                <div 
                    className="popup-club-image" 
                    style={{ backgroundImage: `url(${clube.imagem})` }}
                ></div>
              </div>
              <h2 className="popup-club-name">{clube.nome}</h2>
              <span className="popup-club-league-badge">
                {LIGA_NAMES[clube.ligaClube] || clube.ligaClube}
              </span>
            </div>

            <div className="popup-body-scroll custom-scrollbar">
                <div className="popup-stats-grid">
                    <div className="stat-card">
                        <span className="stat-icon">🏟️</span>
                        <div className="stat-info">
                            <span className="stat-label">Estádio</span>
                            <span className="stat-value">{clube.estadio}</span>
                        </div>
                    </div>
                    
                    <div className="stat-card">
                        <span className="stat-icon">🏷️</span>
                        <div className="stat-info">
                            <span className="stat-label">Sigla</span>
                            <span className="stat-value">{clube.sigla}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <span className="stat-icon">⭐</span>
                        <div className="stat-info">
                            <span className="stat-label">Estrelas</span>
                            <span className="stat-value">{clube.estrelas}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <span className="stat-icon">🏆</span>
                        <div className="stat-info">
                            <span className="stat-label">Títulos</span>
                            <span className="stat-value">{clube.titulos}</span>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        ) : (
          <div className="popup-error">
            <p>Não foi possível carregar os dados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupClubes;