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
  Loader2 
} from 'lucide-react';
import './PopupReportarPartida.css';

interface PopupReportarPartidaProps {
  isOpen: boolean;
  onClose: () => void;
  partidaId: string;
}

type CategoriaProblema = 'ANTI_JOGO' | 'CONEXAO' | 'OFENSA' | 'OUTRO';

interface ReportResponse {
  id: string;
  status: string;
}

export default function PopupReportarPartida({ isOpen, onClose, partidaId }: PopupReportarPartidaProps) {
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
    const textoFormatado = `(Problema: ${categoriaLabel}) - ${descricao}`;

    try {
      const response = await fetch(`/partida/${partidaId}/analisar-problema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: textoFormatado }),
      });

      if (!response.ok) throw new Error('Falha ao enviar reporte.');

      const data = await response.json();
      setSucessoData(data);
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
              <h3 className="success-title">Relato Enviado!</h3>
              <p className="success-desc">
                Sua denúncia foi registrada e será analisada pela nossa equipe de moderação.
              </p>
              
              <div className="protocol-ticket">
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
                    <Loader2 size={20} className="animate-spin" /> Processando...
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