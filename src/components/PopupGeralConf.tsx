import React, { useState } from 'react';
import './PopupGeralConf.css';

interface PopupGeralConfProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const PopupGeralConf: React.FC<PopupGeralConfProps> = ({ 
    title, 
    message, 
    confirmText = 'Confirmar', 
    cancelText = 'Cancelar', 
    onConfirm,
    onCancel
}) => {
    const [fadeout, setFadeout] = useState(false);

    const handleAction = (callback: () => void) => {
        setFadeout(true);
        setTimeout(() => {
            callback();
        }, 300);
    };

    return (
        <div className={`pger-overlay ${fadeout ? 'pger-fade-out' : ''}`}>
            <div className="pger-content pger-width">
                <button className="pger-close-btn" onClick={() => handleAction(onCancel)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="pger-header-fixed">
                    <div className="pger-icon-badge pger-is-info">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <h2 className="pger-title">{title}</h2>
                </div>

                <div className="pger-body-scroll pger-scrollbar">
                    <div className="pger-message-container">
                        <p className="pger-message-text">{message}</p>
                    </div>
                </div>

                <div className="pger-footer-fixed">
                    <button 
                        type="button" 
                        className="pger-btn-base pger-btn-cancel" 
                        onClick={() => handleAction(onCancel)}
                    >
                        {cancelText}
                    </button>
                    <button 
                        type="button" 
                        className="pger-btn-base pger-btn-confirm" 
                        onClick={() => handleAction(onConfirm)}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupGeralConf;