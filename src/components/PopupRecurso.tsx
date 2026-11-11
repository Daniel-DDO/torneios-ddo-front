import { useState } from 'react';
import type { FormEvent } from 'react';
import { AdvertenciaModal } from './AdvertenciaModal';
import { useInterporRecurso } from '../hooks/useAdvertencias';
import type { AdvertenciaPublica } from '../types/advertencia';
import { ROTULO_NIVEL, extrairMensagemErro, formatarDataHora } from '../utils/advertencia';

interface PopupRecursoProps {
  advertencia: AdvertenciaPublica;
  onClose: () => void;
}

const HORAS_PRAZO_RECURSO = 24;

export function PopupRecurso({ advertencia, onClose }: PopupRecursoProps) {
  const interpor = useInterporRecurso();
  const [texto, setTexto] = useState('');

  const prazoFinal = new Date(new Date(advertencia.data).getTime() + HORAS_PRAZO_RECURSO * 60 * 60 * 1000);

  function enviar(evento: FormEvent): void {
    evento.preventDefault();
    if (texto.trim().length === 0) {
      return;
    }
    interpor.mutate({ advertenciaId: advertencia.id, texto: texto.trim() }, { onSuccess: () => onClose() });
  }

  return (
    <AdvertenciaModal titulo="Recorrer da advertência" onClose={onClose}>
      <form onSubmit={enviar}>
        <div className="adv-aviso">
          Advertência {ROTULO_NIVEL[advertencia.nivel].toLowerCase()} ({advertencia.artigo}). O prazo para
          recorrer termina em <strong>{formatarDataHora(prazoFinal.toISOString())}</strong>. Enquanto o recurso
          estiver em análise, a multa não é debitada. Só é possível interpor um recurso por advertência.
        </div>

        <div className="adv-campo">
          <label htmlFor="adv-recurso-texto">Seus argumentos</label>
          <textarea
            id="adv-recurso-texto"
            className="adv-input"
            maxLength={4000}
            placeholder="Explique por que a advertência deve ser cancelada ou reduzida."
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
          />
        </div>

        {interpor.isError && <div className="adv-erro">{extrairMensagemErro(interpor.error)}</div>}

        <div className="adv-rodape">
          <button type="button" className="adv-btn" onClick={onClose}>
            Voltar
          </button>
          <button
            type="submit"
            className="adv-btn adv-btn-primario"
            disabled={texto.trim().length === 0 || interpor.isPending}
          >
            {interpor.isPending ? 'Enviando...' : 'Enviar recurso'}
          </button>
        </div>
      </form>
    </AdvertenciaModal>
  );
}
