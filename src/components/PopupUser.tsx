import React, { useState } from 'react';
import './PopupUser.css';

interface JogadorData {
  id: string;
  nome: string;
  discord: string;
  finais: number;
  titulos: number;
  golsMarcados: number;
  partidasJogadas: number;
  cargo: string;
  imagem: string | null;
  saldoVirtual: number;
}

interface PopupUserProps {
  user: JogadorData;
  onClose: () => void;
  onLogout: () => void;
}

const PopupUser: React.FC<PopupUserProps> = ({ user, onClose, onLogout }) => {
  const [fadeout, setFadeout] = useState(false);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleLogoutClick = () => {
    setFadeout(true);
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    
    setTimeout(() => {
      onLogout();
      onClose();
    }, 300);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getRoleColor = (role: string) => {
    if (role === 'PROPRIETARIO') return '#e1b12c';
    if (role === 'DIRETOR') return '#2116c2ff';
    if (role === 'ADMINISTRADOR') return '#e62300ff';
    return 'var(--primary, #15ff00ff)'; 
  };

  const themeColor = getRoleColor(user.cargo || '');

  const popupContentStyle = {
    borderColor: themeColor,
    boxShadow: `0 0 20px ${themeColor}40`
  };

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content user-popup-width" style={popupContentStyle}>
        
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={`popup-body-animate ${fadeout ? 'fade-out-content' : ''}`}>
          
          <div className="popup-header-clean">
            <div className="popup-user-image-wrapper" style={{ borderColor: themeColor }}>
                {user.imagem ? (
                    <img src={user.imagem} alt={user.nome} className="popup-user-img" />
                ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40" color={themeColor}>
                        <path d="M7.5 6.5C7.5 8.981 9.519 11 12 11s4.5-2.019 4.5-4.5S14.481 2 12 2 7.5 4.019 7.5 6.5zM20 21h1v-1c0-3.859-3.141-7-7-7h-4c-3.86 0-7 3.141-7 7v1h17z"/>
                    </svg>
                )}
            </div>
            <h2 className="popup-club-name">{user.nome}</h2>
            <span className="popup-club-league-badge" style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                {user.cargo}
            </span>
          </div>

          <div className="user-stats-grid">
            <div className="stat-item">
                <span className="stat-value">{user.partidasJogadas}</span>
                <span className="stat-label">Partidas</span>
            </div>
            <div className="stat-item">
                <span className="stat-value">{user.golsMarcados}</span>
                <span className="stat-label">Gols</span>
            </div>
            <div className="stat-item">
                <span className="stat-value">{user.titulos}</span>
                <span className="stat-label">Títulos</span>
            </div>
          </div>

          <div className="user-details-list">
            <div className="detail-row">
                <div className="detail-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3z"/><path d="M3 12v1c0 1.66 4 3 9 3s9-1.34 9-3v-1"/></svg>
                </div>
                <div className="detail-info">
                    <label>Saldo Virtual</label>
                    <span className="money-value">{formatCurrency(user.saldoVirtual)}</span>
                </div>
            </div>

            <div className="detail-row">
                <div className="detail-icon">
                   <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/></svg>
                </div>
                <div className="detail-info">
                    <label>Discord</label>
                    <span>{user.discord}</span>
                </div>
            </div>
          </div>

          <button onClick={handleLogoutClick} className="logout-btn">
             SAIR DA CONTA
          </button>

        </div>
      </div>
    </div>
  );
};

export default PopupUser;