import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface AdvertenciaModalProps {
  titulo: string;
  onClose: () => void;
  children: ReactNode;
  largura?: number;
}

export function AdvertenciaModal({ titulo, onClose, children, largura = 540 }: AdvertenciaModalProps) {
  return (
    <div className="adv-overlay">
      <style>{`
        .adv-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
        }

        .adv-modal {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          width: 100%;
          max-height: 92vh;
          overflow-y: auto;
          padding: 24px;
          box-shadow: var(--shadow-md);
        }

        .adv-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .adv-modal-titulo {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .adv-modal-fechar {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-gray);
          display: flex;
          padding: 4px;
        }

        .adv-campo {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }

        .adv-campo label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .adv-campo small {
          font-size: 0.78rem;
          color: var(--text-gray);
        }

        .adv-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: transparent;
          color: var(--text-dark);
          font-size: 0.95rem;
          font-family: inherit;
          box-sizing: border-box;
        }

        .adv-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        textarea.adv-input {
          resize: vertical;
          min-height: 80px;
        }

        .adv-linha {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .adv-aviso {
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.85rem;
          line-height: 1.45;
          margin-bottom: 14px;
          border: 1px solid #f59e0b;
          background: rgba(245, 158, 11, 0.12);
          color: var(--text-dark);
        }

        .adv-erro {
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.85rem;
          margin-bottom: 14px;
          border: 1px solid #dc2626;
          background: rgba(220, 38, 38, 0.1);
          color: #dc2626;
        }

        .adv-rodape {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 6px;
        }

        .adv-btn {
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-dark);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .adv-btn-primario {
          background: var(--primary);
          border-color: var(--primary);
          color: #fff;
        }

        .adv-btn-perigo {
          background: #dc2626;
          border-color: #dc2626;
          color: #fff;
        }

        .adv-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .adv-linha { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className="adv-modal" style={{ maxWidth: largura }}>
        <div className="adv-modal-header">
          <span className="adv-modal-titulo">{titulo}</span>
          <button type="button" className="adv-modal-fechar" onClick={onClose} aria-label="Fechar">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
