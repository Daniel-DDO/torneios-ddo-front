import React, { useState, useEffect } from 'react';
import { API } from '../services/api';
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
  const [userData, setUserData] = useState<JogadorData>(user);

  useEffect(() => {
    const fetchLatestUserData = async () => {
      try {
        const response = await API.get(`/jogadores/${user.id}`);
        if (response.data) {
          setUserData(response.data);
          localStorage.setItem('user_data', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error("Erro ao atualizar dados do usuário", error);
      }
    };

    fetchLatestUserData();
  }, [user.id]);

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
    return `D$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getRoleColor = (role: string) => {
    if (role === 'PROPRIETARIO') return '#e1b12c';
    if (role === 'DIRETOR') return '#2116c2';
    if (role === 'ADMINISTRADOR') return '#e62300';
    return '#00d09c'; 
  };

  const roleColor = getRoleColor(userData.cargo || '');

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div 
        className="popup-content user-popup-card" 
        style={{ '--role-color': roleColor } as React.CSSProperties}
      >
        
        <button className="popup-close-btn" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="popup-header-fixed">
            <div className="popup-user-image-wrapper">
                {userData.imagem ? (
                    <img src={userData.imagem} alt={userData.nome} className="popup-user-img" />
                ) : (
                    <div className="popup-user-placeholder">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
                            <path d="M7.5 6.5C7.5 8.981 9.519 11 12 11s4.5-2.019 4.5-4.5S14.481 2 12 2 7.5 4.019 7.5 6.5zM20 21h1v-1c0-3.859-3.141-7-7-7h-4c-3.86 0-7 3.141-7 7v1h17z"/>
                        </svg>
                    </div>
                )}
            </div>
            <h2 className="popup-user-name">{userData.nome}</h2>
            <span className="popup-role-badge">
                {userData.cargo}
            </span>
        </div>

        <div className="popup-body-scroll custom-scrollbar">
            <div className="user-stats-grid">
                <div className="stat-item">
                    <span className="stat-value">{userData.partidasJogadas}</span>
                    <span className="stat-label">Partidas</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{userData.golsMarcados}</span>
                    <span className="stat-label">Gols</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{userData.titulos}</span>
                    <span className="stat-label">Títulos</span>
                </div>
            </div>

            <div className="user-details-list">
                <div className="detail-row">
                    <div className="detail-icon money-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <div className="detail-info">
                        <label>Saldo Virtual</label>
                        <span className="money-value">{formatCurrency(userData.saldoVirtual)}</span>
                    </div>
                </div>

                <div className="detail-row">
                    <div className="detail-icon discord-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3z"/><path d="M15.5 17c0 1 1.5 3 2 3 2.5 0 3.5-2.5 4-5"/><path d="M8.5 17c0 1-1.5 3-2 3-2.5 0-3.5-2.5-4-5"/></svg>
                    </div>
                    <div className="detail-info">
                        <label>Discord</label>
                        <span>{userData.discord || 'Não vinculado'}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="popup-footer-fixed">
            <button onClick={handleLogoutClick} className="logout-btn">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Sair da Conta
            </button>
        </div>

      </div>
    </div>
  );
};

export default PopupUser;