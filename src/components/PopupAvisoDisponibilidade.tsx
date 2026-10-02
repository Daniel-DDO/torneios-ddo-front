import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import './PopupGeral.css';

interface PopupAvisoDisponibilidadeProps {
  onPreencherAgora: () => void;
  onDepois: () => void;
  onNuncaMais: () => void;
}

const PopupAvisoDisponibilidade: React.FC<PopupAvisoDisponibilidadeProps> = ({
  onPreencherAgora,
  onDepois,
  onNuncaMais,
}) => {
  const [fadeout, setFadeout] = useState(false);

  const executar = (acao: () => void) => {
    setFadeout(true);
    setTimeout(acao, 300);
  };

  return (
    <div className={`pger-overlay ${fadeout ? 'pger-fade-out' : ''}`}>
      <div className="pger-content pger-width" style={{ maxWidth: 460 }}>
        {/* o X conta como "depois" */}
        <button className="pger-close-btn" onClick={() => executar(onDepois)} aria-label="Fechar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="pger-header-fixed">
          <div className="pger-icon-badge pger-is-info">
            <CalendarClock size={30} />
          </div>
          <h2 className="pger-title" style={{ fontSize: '1.4rem' }}>Preencha sua disponibilidade</h2>
        </div>

        <div className="pger-body-scroll pger-scrollbar">
          <div className="pger-message-container" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p className="pger-message-text">
              Agora você pode informar em quais <strong>dias da semana</strong> e <strong>turnos</strong> (madrugada, manhã, tarde e noite)
              costuma conseguir jogar. Isso ajuda na marcação das partidas e serve de respaldo para você e para a organização.
            </p>
            <p className="pger-message-text">
              <strong>Importante:</strong> a disponibilidade é necessária para se inscrever nos campeonatos. Os curtos exigem
              pelo menos 2 dias, e os longos (liga + mata-mata) pelo menos 4 dias, com algum turno de manhã, tarde ou noite.
              A madrugada sozinha não conta.
            </p>
            <p className="pger-message-text" style={{ fontSize: '0.85rem' }}>
              Os horários seguem o fuso de Brasília e, depois de salvar, a grade só pode ser alterada novamente após 24 horas.
              Ela não obriga ninguém a jogar apenas naqueles horários.
            </p>
          </div>
        </div>

        <div className="pger-footer-fixed" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            className="pger-confirm-btn pger-btn-info"
            onClick={() => executar(onPreencherAgora)}
          >
            Preencher agora
          </button>
          <button
            type="button"
            className="pger-confirm-btn"
            style={{ background: 'var(--pger-btn-close-bg)', color: 'var(--pger-text-primary)', boxShadow: 'none' }}
            onClick={() => executar(onDepois)}
          >
            Ok, depois eu preencho
          </button>
          <button
            type="button"
            className="pger-confirm-btn"
            style={{ background: 'transparent', color: 'var(--pger-text-secondary)', boxShadow: 'none', fontWeight: 600, fontSize: '0.9rem', padding: 8 }}
            onClick={() => executar(onNuncaMais)}
          >
            Ok, não mostrar mais
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupAvisoDisponibilidade;