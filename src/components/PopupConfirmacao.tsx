import React, { useEffect, useState } from 'react';

interface PopupConfirmacaoProps {
  titulo: string;
  mensagem: string;
  onConfirm: () => void;
  onCancel: () => void;
  textoConfirmar?: string;
  textoCancelar?: string;
}

export default function PopupConfirmacao({ 
  titulo, 
  mensagem, 
  onConfirm, 
  onCancel,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar'
}: PopupConfirmacaoProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = (action: 'confirm' | 'cancel') => {
    setVisible(false);
    setTimeout(() => {
      if (action === 'confirm') onConfirm();
      else onCancel();
    }, 300); // Espera a animação de saída
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

        .popup-icon-warning {
          width: 60px;
          height: 60px;
          background: #fef2f2;
          color: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px auto;
        }
        
        body.dark-mode .popup-icon-warning {
          background: rgba(239, 68, 68, 0.15);
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

        .popup-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn-action {
          flex: 1;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          border: none;
        }

        .btn-action:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }

        .btn-cancel {
          background: #ef4444;
          color: white;
          box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
        }

        .btn-confirm {
          background: #22c55e;
          color: white;
          box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.3);
        }
      `}</style>

      <div className="popup-card">
        <div className="popup-icon-warning">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>

        <h3 className="popup-title">{titulo}</h3>
        <p className="popup-message">{mensagem}</p>

        <div className="popup-actions">
          <button className="btn-action btn-cancel" onClick={() => handleClose('cancel')}>
            {textoCancelar}
          </button>
          <button className="btn-action btn-confirm" onClick={() => handleClose('confirm')}>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}