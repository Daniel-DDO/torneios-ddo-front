import React, { useState } from 'react';
import './PopupGeral.css';

interface PopupGeralProps {
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    buttonText?: string;
    onClose: () => void;
}

const PopupGeral: React.FC<PopupGeralProps> = ({ 
    title, 
    message, 
    type = 'info', 
    buttonText = 'Entendido', 
    onClose 
}) => {
    const [fadeout, setFadeout] = useState(false);

    const handleClose = () => {
        setFadeout(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                );
            case 'error':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                );
            case 'warning':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                );
            default: 
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                );
        }
    };

    return (
        <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
            <div className="popup-content popup-geral-width">
                <button className="popup-close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="popup-header-fixed">
                    <div className={`icon-badge-status is-${type}`}>
                        {getIcon()}
                    </div>
                    <h2 className="popup-title">{title}</h2>
                </div>

                <div className="popup-body-scroll custom-scrollbar">
                    <div className="popup-message-container">
                        <p className="popup-message-text">{message}</p>
                    </div>
                </div>

                <div className="popup-footer-fixed">
                    <button 
                        type="button" 
                        className={`conceder-btn btn-${type}`} 
                        onClick={handleClose}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupGeral;