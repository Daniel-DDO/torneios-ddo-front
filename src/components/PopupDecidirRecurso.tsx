import { useState } from 'react';
import type { FormEvent } from 'react';
import { AdvertenciaModal } from './AdvertenciaModal';
import { useDecidirRecurso } from '../hooks/useAdvertencias';
import type { DecidirRecursoPayload, RecursoPendente, ResultadoRecurso } from '../types/advertencia';
import {
  MULTA_BASE,
  ROTULO_NIVEL,
  extrairMensagemErro,
  formatarDataHora,
  formatarMoeda,
} from '../utils/advertencia';

interface PopupDecidirRecursoProps {
  recurso: RecursoPendente;
  onClose: () => void;
}

export function PopupDecidirRecurso({ recurso, onClose }: PopupDecidirRecursoProps) {
  const decidir = useDecidirRecurso();
  const podeReduzir = recurso.multiplicador > 1;

  const [resultado, setResultado] = useState<ResultadoRecurso>('NEGADO');
  const [novoMultiplicador, setNovoMultiplicador] = useState(Math.max(1, recurso.multiplicador - 1));
  const [fundamentacao, setFundamentacao] = useState('');

  const multiplicadorValido =
    resultado !== 'REDUZIDO' ||
    (Number.isInteger(novoMultiplicador) && novoMultiplicador >= 1 && novoMultiplicador < recurso.multiplicador);
  const formularioValido = fundamentacao.trim().length > 0 && multiplicadorValido;

  function enviar(evento: FormEvent): void {
    evento.preventDefault();
    if (!formularioValido) {
      return;
    }

    const payload: DecidirRecursoPayload = {
      resultado,
      novoMultiplicador: resultado === 'REDUZIDO' ? novoMultiplicador : undefined,
      fundamentacao: fundamentacao.trim(),
    };

    decidir.mutate({ advertenciaId: recurso.id, payload }, { onSuccess: () => onClose() });
  }

  return (
    <AdvertenciaModal titulo={`Recurso de ${recurso.jogadorNome}`} onClose={onClose} largura={600}>
      <form onSubmit={enviar}>
        <div className="adv-aviso">
          Advertência <strong>{ROTULO_NIVEL[recurso.nivel].toLowerCase()}</strong> ({recurso.artigo}) de{' '}
          {formatarDataHora(recurso.oficializadaEm)}, multa de {formatarMoeda(recurso.multaFinal)}
          {recurso.multiplicador > 1 ? ` (×${recurso.multiplicador})` : ''}.
          <br />
          <strong>Fato:</strong> {recurso.fato}
        </div>

        <div className="adv-campo">
          <label>Argumentos do jogador ({formatarDataHora(recurso.recursoEm)})</label>
          <div className="adv-input" style={{ whiteSpace: 'pre-wrap' }}>
            {recurso.recursoTexto}
          </div>
        </div>

        <div className="adv-campo">
          <label htmlFor="adv-resultado">Decisão</label>
          <select
            id="adv-resultado"
            className="adv-input"
            value={resultado}
            onChange={(evento) => setResultado(evento.target.value as ResultadoRecurso)}
          >
            <option value="NEGADO">Negar recurso (a multa será debitada)</option>
            <option value="ACOLHIDO">Acolher recurso (cancela a advertência)</option>
            {podeReduzir && <option value="REDUZIDO">Reduzir multiplicador da multa</option>}
          </select>
        </div>

        {resultado === 'REDUZIDO' && (
          <div className="adv-campo">
            <label htmlFor="adv-novo-multiplicador">Novo multiplicador (menor que ×{recurso.multiplicador})</label>
            <input
              id="adv-novo-multiplicador"
              className="adv-input"
              type="number"
              min={1}
              max={recurso.multiplicador - 1}
              value={novoMultiplicador}
              onChange={(evento) => setNovoMultiplicador(Number(evento.target.value))}
            />
            <small>
              Nova multa:{' '}
              {multiplicadorValido ? formatarMoeda(MULTA_BASE[recurso.nivel] * novoMultiplicador) : 'multiplicador inválido'}
            </small>
          </div>
        )}

        <div className="adv-campo">
          <label htmlFor="adv-decisao-fundamentacao">Fundamentação da decisão (pública)</label>
          <textarea
            id="adv-decisao-fundamentacao"
            className="adv-input"
            maxLength={4000}
            value={fundamentacao}
            onChange={(evento) => setFundamentacao(evento.target.value)}
          />
        </div>

        {decidir.isError && <div className="adv-erro">{extrairMensagemErro(decidir.error)}</div>}

        <div className="adv-rodape">
          <button type="button" className="adv-btn" onClick={onClose}>
            Voltar
          </button>
          <button
            type="submit"
            className="adv-btn adv-btn-primario"
            disabled={!formularioValido || decidir.isPending}
          >
            {decidir.isPending ? 'Salvando...' : 'Registrar decisão'}
          </button>
        </div>
      </form>
    </AdvertenciaModal>
  );
}
