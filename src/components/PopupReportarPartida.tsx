import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  WifiOff, 
  UserX, 
  Swords, 
  HelpCircle,
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  Loader2,
  Gavel,
  FileText
} from 'lucide-react';
import { API } from '../services/api';
import './PopupReportarPartida.css';

interface PopupReportarPartidaProps {
  isOpen: boolean;
  onClose: () => void;
  partidaId: string;
  mandante: string;
  timeMandante: string;
  visitante: string;
  timeVisitante: string;
}

type CategoriaProblema = 'ANTI_JOGO' | 'CONEXAO' | 'OFENSA' | 'OUTRO';

interface ReportResponse {
  id: string;
  partida: any;
  relatoAdmin: string;
  analiseIA: string;
  vereditoSugerido: string;
  nivelConfiabilidade: number;
  dataReport: string;
}

export default function PopupReportarPartida({ 
  isOpen, 
  onClose, 
  partidaId,
  mandante,
  timeMandante,
  visitante,
  timeVisitante
}: PopupReportarPartidaProps) {
  const [categoria, setCategoria] = useState<CategoriaProblema | null>(null);
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucessoData, setSucessoData] = useState<ReportResponse | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  const categorias = [
    { 
      id: 'ANTI_JOGO', 
      label: 'Anti-Jogo', 
      icon: <Swords size={24} />, 
      desc: 'Cera, inatividade ou gol contra.' 
    },
    { 
      id: 'CONEXAO', 
      label: 'Conexão', 
      icon: <WifiOff size={24} />, 
      desc: 'Lag intencional ou quedas.' 
    },
    { 
      id: 'OFENSA', 
      label: 'Comportamento', 
      icon: <UserX size={24} />, 
      desc: 'Ofensas, racismo ou toxicidade.' 
    },
    { 
      id: 'OUTRO', 
      label: 'Outros', 
      icon: <HelpCircle size={24} />, 
      desc: 'Bugs ou problemas gerais.' 
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria || descricao.trim().length < 15) return;

    setLoading(true);
    setErro(null);

    const categoriaLabel = categorias.find(c => c.id === categoria)?.label || 'Desconhecido';
    
    try {
      const payload = {
        nomeMandante: mandante,
        timeMandante: timeMandante,
        nomeVisitante: visitante,
        timeVisitante: timeVisitante,
        relato: `(Problema: ${categoriaLabel}) - ${descricao}`
      };

      const response = await API.post(`/partida/${partidaId}/analisar-problema`, payload);

      setSucessoData(response.data);
    } catch (error) {
      setErro('Ocorreu um erro ao processar sua solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setCategoria(null);
      setDescricao('');
      setSucessoData(null);
      setErro(null);
      setIsClosing(false);
      onClose();
    }, 200);
  };

  return (
    <div className={`popup-overlay ${isClosing ? 'closing' : ''}`}>
      <div className={`popup-content ${isClosing ? 'closing' : ''}`}>
        <button className="popup-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="popup-header-fixed">
          <div className="icon-badge-wrapper">
            <ShieldAlert size={32} strokeWidth={2.5} />
          </div>
          <h2 className="popup-title">Reportar Problema</h2>
          <p className="popup-subtitle">Ajude a manter a comunidade limpa e justa</p>
        </div>

        <div className="popup-body-scroll">
          {sucessoData ? (
            <div className="success-container">
              <div className="success-icon-circle">
                <CheckCircle2 size={50} strokeWidth={3} />
              </div>
              <h3 className="success-title">Julgamento Realizado</h3>
              <p className="success-desc">
                O Juiz Virtual analisou o caso com {sucessoData.nivelConfiabilidade}% de confiabilidade.
              </p>
              
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <div style={{ padding: '15px', background: '#f1f5f9', borderRadius: '8px', textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                    <FileText size={14} /> Análise Técnica
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {sucessoData.analiseIA}
                  </p>
                </div>

                <div style={{ padding: '15px', background: '#eef2ff', borderRadius: '8px', borderLeft: '4px solid #4f46e5', textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#4f46e5', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                    <Gavel size={14} /> Veredito Final
                  </h4>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e1b4b', lineHeight: '1.4' }}>
                    {sucessoData.vereditoSugerido}
                  </p>
                </div>

              </div>

              <div className="protocol-ticket" style={{ marginTop: '20px' }}>
                <div className="protocol-label">ID do Protocolo</div>
                <div className="protocol-value">#{sucessoData.id.substring(0, 8).toUpperCase()}</div>
              </div>
            </div>
          ) : (
            <form id="reportForm" onSubmit={handleSubmit}>
              {erro && <div className="error-banner">{erro}</div>}

              <div>
                <span className="section-label">Selecione o motivo</span>
                <div className="report-grid">
                  {categorias.map((cat) => (
                    <div 
                      key={cat.id}
                      className={`report-option-card ${categoria === cat.id ? 'selected' : ''}`}
                      onClick={() => setCategoria(cat.id as CategoriaProblema)}
                    >
                      <div className="option-icon">{cat.icon}</div>
                      <div>
                        <div className="option-title">{cat.label}</div>
                        <div className="option-desc">{cat.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <span className="section-label">Descrição detalhada</span>
                <textarea
                  className="description-area"
                  placeholder="Descreva o que aconteceu, minuto da infração e detalhes relevantes..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength={1000}
                  disabled={loading}
                />
                <div className="char-counter">
                  {descricao.length}/1000 (Mínimo: 15)
                </div>
              </div>

              <div className="warning-box" style={{ marginTop: 20 }}>
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Atenção:</strong> Denúncias falsas podem resultar em punições para sua própria conta. Utilize esta ferramenta com responsabilidade.
                </span>
              </div>
            </form>
          )}
        </div>

        <div className="popup-footer-fixed">
          {sucessoData ? (
            <button className="submit-btn" onClick={handleClose}>
              Entendido
            </button>
          ) : (
            <>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="reportForm" 
                className="submit-btn"
                disabled={!categoria || descricao.trim().length < 15 || loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Analisando...
                  </>
                ) : (
                  <>
                    Enviar Denúncia <Send size={18} />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}