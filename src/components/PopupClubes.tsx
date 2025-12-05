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

interface PopupClubesProps {
  clubId: string;
  onClose: () => void;
}

const PopupClubes: React.FC<PopupClubesProps> = ({ clubId, onClose }) => {
  const [clube, setClube] = useState<Clube | null>(null);
  const [fadeout, setFadeout] = useState(false);

  useEffect(() => {
    const fetchClube = async () => {
      try {
        const response = await API.get(`/clube/${clubId}`);
        setClube(response.data);
      } catch (error) {
        console.error('Erro ao buscar os detalhes do clube:', error);
      }
    };

    fetchClube();
  }, [clubId]);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(onClose, 300);
  };

  if (!clube) {
    return null;
  }

  const popupStyle = {
    borderTop: `10px solid ${clube.corPrimaria}`,
    boxShadow: `0 8px 30px ${clube.corPrimaria}50`,
  };

  const headerStyle = {
    backgroundColor: clube.corPrimaria,
    color: clube.corSecundaria,
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content" style={popupStyle}>
        <button className="popup-close-btn" onClick={handleClose}>×</button>
        <div className="popup-header" style={headerStyle}>
            <div className="popup-club-image" style={{ backgroundImage: `url(${clube.imagem})` }}></div>
            <h2 className="popup-club-name">{clube.nome}</h2>
            <p className="popup-club-league">{clube.ligaClube}</p>
        </div>
        <div className="popup-club-info">
          <div className="info-item">
            <span className="info-label">Estádio:</span>
            <span className="info-value">{clube.estadio}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Sigla:</span>
            <span className="info-value">{clube.sigla}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Estrelas:</span>
            <span className="info-value">{clube.estrelas}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Títulos:</span>
            <span className="info-value">{clube.titulos}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupClubes;