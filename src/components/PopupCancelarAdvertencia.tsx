import { useState } from 'react';
import type { FormEvent } from 'react';
import { AdvertenciaModal } from './AdvertenciaModal';
import { useCancelarAdvertencia } from '../hooks/useAdvertencias';
import type { AdvertenciaPublica } from '../types/advertencia';
import { ROTULO_NIVEL, extrairMensagemErro, formatarMoeda } from '../utils/advertencia';

interface PopupCancelarAdvertenciaProps {
  advertencia: AdvertenciaPublica;
  onClose: () => void;
}

export function PopupCancelarAdvertencia({ advertencia, onClose }: PopupCancelarAdvertenciaProps) {
  const cancelar = useCancelarAdvertencia();
  const [motivo, setMotivo] = useState('');

  function enviar(evento: FormEvent): void {
    evento.preventDefault();
    if (motivo.trim().length === 0) {
      return;
    }
    cancelar.mutate({ advertenciaId: advertencia.id, motivo: motivo.trim() }, { onSuccess: () => onClose() });
  }

  return (
    <AdvertenciaModal titulo="Desfazer advertência" onClose={onClose}>
      <form onSubmit={enviar}>
        <div className="adv-aviso">
          Advertência <strong>{ROTULO_NIVEL[advertencia.nivel].toLowerCase()}</strong> ({advertencia.artigo}) com
          multa de {formatarMoeda(advertencia.multa)}. Se a multa já foi debitada, o valor volta ao saldo do
          jogador.
          {advertencia.status === 'CONSUMIDA' &&
            ' Como ela já foi usada em uma suspensão, a suspensão será cancelada e as demais advertências usadas voltam a ficar ativas.'}
        </div>

        <div className="adv-campo">
          <label htmlFor="adv-motivo">Motivo do cancelamento</label>
          <textarea
            id="adv-motivo"
            className="adv-input"
            maxLength={4000}
            placeholder="Explique por que a advertência está sendo desfeita."
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
          />
        </div>

        {cancelar.isError && <div className="adv-erro">{extrairMensagemErro(cancelar.error)}</div>}

        <div className="adv-rodape">
          <button type="button" className="adv-btn" onClick={onClose}>
            Voltar
          </button>
          <button
            type="submit"
            className="adv-btn adv-btn-perigo"
            disabled={motivo.trim().length === 0 || cancelar.isPending}
          >
            {cancelar.isPending ? 'Desfazendo...' : 'Desfazer advertência'}
          </button>
        </div>
      </form>
    </AdvertenciaModal>
  );
}
