import React, { useEffect, useState } from 'react';

interface PopupInformacaoProps {
  titulo: string;
  mensagem: string;
  onClose: () => void;
  textoBotao?: string;
  tipo?: 'info' | 'sucesso' | 'erro';
}

export default function PopupInformacao({ 
  titulo, 
  mensagem, 
  onClose,
  textoBotao = 'Entendi',
  tipo = 'info'
}: PopupInformacaoProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className={`popup-overlay ${visible ? 'show' : ''}`}>
      <style>{`
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .popup-overlay.show {
          opacity: 1;
        }

        .popup-card {
          background: var(--bg-card, #fff);
          width: 90%;
          max-width: 400px;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          transform: scale(0.95) translateY(10px);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid var(--border-color, #e2e8f0);
          text-align: center;
        }

        .popup-overlay.show .popup-card {
          transform: scale(1) translateY(0);
        }

        .popup-icon-info {
          width: 60px;
          height: 60px;
          background: #eff6ff;
          color: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px auto;
        }

        body.dark-mode .popup-icon-info {
          background: rgba(59, 130, 246, 0.15);
        }

        .popup-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-dark, #1a1a1a);
          margin-bottom: 10px;
        }

        .popup-message {
          font-size: 0.95rem;
          color: var(--text-gray, #6b7280);
          margin-bottom: 25px;
          line-height: 1.5;
        }

        .btn-info {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          background: #3b82f6;
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          transition: 0.2s;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
        }

        .btn-info:hover {
          background: #2563eb;
          transform: translateY(-2px);
        }
      `}</style>

      <div className="popup-card">
        <div className="popup-icon-info">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>

        <h3 className="popup-title">{titulo}</h3>
        <p className="popup-message">{mensagem}</p>

        <button className="btn-info" onClick={handleClose}>
          {textoBotao}
        </button>
      </div>
    </div>
  );
}