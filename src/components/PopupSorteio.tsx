import React, { useState, useEffect } from 'react';
import { API } from '../services/api';
import { Dices, CheckCircle2, X, Info, Trophy, Users, AlertCircle } from 'lucide-react';
import './PopupSorteio.css';

interface FaseDetalhes {
  id: string;
  nome: string;
  tipoTorneio: string;
  faseInicialMataMata?: string;
}

interface Classificado {
  posicao: number;
  idJogadorClube: string;
  nomeJogador: string;
  nomeClube: string;
  fotoUrl?: string;
}

interface PreviaData {
  idFaseAnterior: string;
  nomeFaseAnterior: string;
  quantidadeClassificados: number;
  classificados: Classificado[];
}

interface PopupSorteioProps {
  faseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PopupSorteio: React.FC<PopupSorteioProps> = ({ faseId, onClose, onSuccess }) => {
  const [fadeout, setFadeout] = useState(false);
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingGeracao, setLoadingGeracao] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [faseDetalhes, setFaseDetalhes] = useState<FaseDetalhes | null>(null);
  const [previa, setPrevia] = useState<PreviaData | null>(null);

  useEffect(() => {
    carregarDadosIniciais();
  }, [faseId]);

  const carregarDadosIniciais = async () => {
    try {
      setLoadingInitial(true);
      setError('');

      const respFase = await API.get(`/fase-torneio/${faseId}`);
      const dadosFase: FaseDetalhes = respFase.data;
      setFaseDetalhes(dadosFase);

      if (dadosFase.tipoTorneio === 'MATA_MATA') {
        try {
            const respPrevia = await API.get(`/fase-torneio/${faseId}/previa-classificados`);
            setPrevia(respPrevia.data);
        } catch (err) {
            console.warn("Não foi possível carregar a prévia, seguindo sem ela.");
        }
      }

    } catch (err: any) {
      console.error(err);
      setError("Erro ao carregar dados da fase. Verifique sua conexão.");
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => onClose(), 300);
  };

  const handleConfirmSorteio = async () => {
    setError('');
    setLoadingGeracao(true);

    try {
      const isMataMata = faseDetalhes?.tipoTorneio === 'MATA_MATA';
      
      let url = `/api/fases/${faseId}/gerar`;
      let bodyData: any = {};

      if (isMataMata) {
        url = `/fase-torneio/${faseId}/gerar-mata-mata`;
        
        if (previa && previa.classificados?.length > 0) {
           const idsOrdenados = previa.classificados.map(c => c.idJogadorClube);
           bodyData = { idJogadoresOrdenados: idsOrdenados };
        }
      }

      await API.post(url, bodyData);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);

    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data || "Erro ao gerar fase.";
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoadingGeracao(false);
    }
  };

  const getLimitByPhase = (phase?: string) => {
    switch (phase) {
        case 'FINAL': return 2;
        case 'SEMIFINAL': return 4;
        case 'QUARTAS': return 8;
        case 'OITAVAS': return 16;
        case 'DEZESSEIS_AVOS': return 32;
        case 'TRINTA_E_DOIS_AVOS': return 64;
        case 'SESSENTA_E_QUATRO_AVOS': return 128;
        default: return 999;
    }
  };

  const isMataMata = faseDetalhes?.tipoTorneio === 'MATA_MATA';
  const displayLimit = isMataMata ? getLimitByPhase(faseDetalhes?.faseInicialMataMata) : 999;

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className={`popup-content ${isMataMata ? 'sorteio-popup-large' : 'sorteio-popup-width'}`}>
        
        <button className="popup-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="popup-header-fixed">
            <div className={`icon-badge-wrapper ${success ? 'success-badge-bg' : 'season-badge'}`}>
               {success ? <CheckCircle2 size={32} /> : (isMataMata ? <Trophy size={32} /> : <Dices size={32} />)}
            </div>
            
            <h2 className="popup-title">
                {success ? 'Sucesso!' : (faseDetalhes ? faseDetalhes.nome : 'Carregando...')}
            </h2>
            
            <p className="popup-subtitle">
                {success 
                   ? 'Estrutura gerada com sucesso.' 
                   : (loadingInitial 
                        ? 'Obtendo informações...' 
                        : (isMataMata && previa 
                            ? `Classificados vindos de: ${previa.nomeFaseAnterior}` 
                            : 'Gere os confrontos desta fase'))}
            </p>
        </div>

        <div className="popup-body-scroll custom-scrollbar">
            
            {loadingInitial && (
                <div className="sorteio-status-container">
                    <div className="popup-spinner-blue"></div>
                    <span>Analisando estrutura...</span>
                </div>
            )}

            {error && !loadingInitial && (
                <div className="temporada-error-msg">
                    <AlertCircle size={16} style={{display:'inline', marginBottom:-3, marginRight:5}} />
                    {error}
                </div>
            )}

            {!loadingInitial && !success && isMataMata && previa && (
                <div className="classificados-wrapper">
                    <div className="info-box mb-3">
                        <div className="info-icon"><Info size={20} /></div>
                        <p>O chaveamento (1º x {displayLimit}º, 2º x {displayLimit-1}º...) será baseado na ordem abaixo:</p>
                    </div>

                    <ul className="classificados-list">
                        {previa.classificados.slice(0, displayLimit).map((item) => (
                            <li key={item.idJogadorClube} className="classificado-item">
                                <span className="posicao-badge">{item.posicao}º</span>
                                
                                {item.fotoUrl ? (
                                    <img src={item.fotoUrl} alt="" className="classificado-img" 
                                           onError={(e) => (e.currentTarget.style.display = 'none')}/> 
                                ) : (
                                    <div className="classificado-placeholder"><Users size={14}/></div>
                                )}
                                
                                <div className="classificado-info">
                                    <span className="c-nome">{item.nomeJogador}</span>
                                    <span className="c-clube">{item.nomeClube}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {!loadingInitial && !success && (!isMataMata || !previa) && !error && (
                <div className="info-box">
                    <div className="info-icon"><Info size={20} /></div>
                    <p>Esta ação irá sortear os jogos e configurar as rodadas automaticamente. Dados anteriores não salvos podem ser perdidos.</p>
                </div>
            )}

            {loadingGeracao && (
                <div className="sorteio-status-container overlay-loading">
                    <div className="popup-spinner-blue"></div>
                    <span>Processando algoritmos...</span>
                </div>
            )}

        </div>

        <div className="popup-footer-fixed">
            {!success && !loadingInitial && !loadingGeracao && (
                <button 
                    type="button" 
                    onClick={handleConfirmSorteio} 
                    className="submit-season-btn"
                >
                    {isMataMata ? 'Gerar Mata-Mata' : 'Gerar Jogos'}
                </button>
            )}
            
            {success && (
                <button type="button" className="submit-season-btn success-btn" onClick={handleClose}>
                    Concluído
                </button>
            )}

            {loadingInitial && (
                 <button className="submit-season-btn" disabled style={{opacity: 0.6}}>Aguarde...</button>
            )}
        </div>

      </div>
    </div>
  );
};

export default PopupSorteio;