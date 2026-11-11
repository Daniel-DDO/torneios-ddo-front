import { useState } from 'react';
import type { FormEvent } from 'react';
import { AdvertenciaModal } from './AdvertenciaModal';
import { useAppContext } from '../context/AppContext';
import { useAplicarAdvertencia, useFichaAdvertencias } from '../hooks/useAdvertencias';
import type { AplicarAdvertenciaPayload, NivelAdvertencia } from '../types/advertencia';
import {
  MULTA_BASE,
  NIVEIS,
  ROTULO_NIVEL,
  VALIDADE_DIAS,
  extrairMensagemErro,
  formatarMoeda,
  podeGerenciarNivel,
} from '../utils/advertencia';

interface PopupAdvertirProps {
  jogadorId: string;
  jogadorNome: string;
  onClose: () => void;
}

export function PopupAdvertir({ jogadorId, jogadorNome, onClose }: PopupAdvertirProps) {
  const { currentUser } = useAppContext();
  const cargo = currentUser?.cargo;
  const ficha = useFichaAdvertencias(jogadorId);
  const aplicar = useAplicarAdvertencia();

  const niveisPermitidos = NIVEIS.filter((nivelAtual) => podeGerenciarNivel(cargo, nivelAtual));
  const multiplicadorMaximo = cargo === 'PROPRIETARIO' ? 20 : 10;

  const [nivel, setNivel] = useState<NivelAdvertencia>(niveisPermitidos[0] ?? 'LEVE');
  const [fato, setFato] = useState('');
  const [artigo, setArtigo] = useState('');
  const [multiplicador, setMultiplicador] = useState(1);
  const [fundamentacao, setFundamentacao] = useState('');
  const [partidas, setPartidas] = useState(1);
  const [dias, setDias] = useState('10');

  const emRegime = ficha.data?.emRegimeReincidencia ?? false;
  const suspensaoImediata = emRegime && nivel !== 'LEVE';
  const exigeDias = emRegime && nivel === 'GRAVISSIMA';
  const contagem = ficha.data?.contagens.find((item) => item.nivel === nivel);
  const convertePorContagem =
    !suspensaoImediata &&
    nivel !== 'GRAVISSIMA' &&
    !!contagem &&
    contagem.ativas + 1 >= contagem.limiteConversao;
  const exigePartidas = (suspensaoImediata && nivel !== 'GRAVISSIMA') || convertePorContagem;

  const diasNumero = Number(dias);
  const multaPrevista = MULTA_BASE[nivel] * multiplicador;

  const multiplicadorValido =
    Number.isInteger(multiplicador) && multiplicador >= 1 && multiplicador <= multiplicadorMaximo;
  const fundamentacaoValida = multiplicador === 1 || fundamentacao.trim().length > 0;
  const diasValidos = !exigeDias || (Number.isInteger(diasNumero) && diasNumero >= 10 && diasNumero <= 90);
  const formularioValido =
    niveisPermitidos.length > 0 &&
    fato.trim().length > 0 &&
    artigo.trim().length > 0 &&
    multiplicadorValido &&
    fundamentacaoValida &&
    diasValidos &&
    !ficha.isLoading;

  function enviar(evento: FormEvent): void {
    evento.preventDefault();
    if (!formularioValido) {
      return;
    }

    const payload: AplicarAdvertenciaPayload = {
      nivel,
      fato: fato.trim(),
      artigo: artigo.trim(),
      multiplicador,
      fundamentacao: fundamentacao.trim() || undefined,
      partidasSuspensao: exigePartidas ? partidas : undefined,
      diasSuspensao: exigeDias ? diasNumero : undefined,
    };

    aplicar.mutate({ jogadorId, payload }, { onSuccess: () => onClose() });
  }

  return (
    <AdvertenciaModal titulo={`Advertir ${jogadorNome}`} onClose={onClose}>
      <form onSubmit={enviar}>
        <div className="adv-linha">
          <div className="adv-campo">
            <label htmlFor="adv-nivel">Nível</label>
            <select
              id="adv-nivel"
              className="adv-input"
              value={nivel}
              onChange={(evento) => setNivel(evento.target.value as NivelAdvertencia)}
            >
              {niveisPermitidos.map((nivelAtual) => (
                <option key={nivelAtual} value={nivelAtual}>
                  {ROTULO_NIVEL[nivelAtual]}
                </option>
              ))}
            </select>
            <small>
              Multa base {formatarMoeda(MULTA_BASE[nivel])} · vale por {VALIDADE_DIAS[nivel]} dias
            </small>
          </div>

          <div className="adv-campo">
            <label htmlFor="adv-artigo">Artigo</label>
            <input
              id="adv-artigo"
              className="adv-input"
              type="text"
              maxLength={100}
              placeholder="Ex.: Art. 12"
              value={artigo}
              onChange={(evento) => setArtigo(evento.target.value)}
            />
          </div>
        </div>

        <div className="adv-campo">
          <label htmlFor="adv-fato">Fato</label>
          <textarea
            id="adv-fato"
            className="adv-input"
            maxLength={4000}
            placeholder="Descreva o que aconteceu. Este texto fica público na ficha do jogador."
            value={fato}
            onChange={(evento) => setFato(evento.target.value)}
          />
        </div>

        <div className="adv-campo">
          <label htmlFor="adv-multiplicador">Multiplicador da multa (×1 a ×{multiplicadorMaximo})</label>
          <input
            id="adv-multiplicador"
            className="adv-input"
            type="number"
            min={1}
            max={multiplicadorMaximo}
            value={multiplicador}
            onChange={(evento) => setMultiplicador(Number(evento.target.value))}
          />
          <small>
            Multa prevista: {multiplicadorValido ? formatarMoeda(multaPrevista) : 'multiplicador inválido'}
            {cargo !== 'PROPRIETARIO' && ' · acima de ×10 só o proprietário (plenário) decide'}
          </small>
        </div>

        {multiplicador > 1 && (
          <div className="adv-campo">
            <label htmlFor="adv-fundamentacao">Fundamentação do multiplicador</label>
            <textarea
              id="adv-fundamentacao"
              className="adv-input"
              maxLength={4000}
              placeholder="Critérios aplicados (gravidade, reincidência, prejuízo, má-fé, impacto). Fica pública."
              value={fundamentacao}
              onChange={(evento) => setFundamentacao(evento.target.value)}
            />
          </div>
        )}

        {suspensaoImediata && (
          <div className="adv-aviso">
            {jogadorNome} está em regime de reincidência. Esta advertência gera suspensão disciplinar imediata
            {exigeDias ? ' e renova os 40 dias do regime.' : '.'}
          </div>
        )}

        {convertePorContagem && contagem && (
          <div className="adv-aviso">
            Esta será a {contagem.ativas + 1}ª advertência {ROTULO_NIVEL[nivel].toLowerCase()} ativa e
            converte em 1 suspensão disciplinar. As {contagem.limiteConversao} advertências usadas serão consumidas.
          </div>
        )}

        {exigePartidas && (
          <div className="adv-campo">
            <label htmlFor="adv-partidas">Partidas de suspensão</label>
            <select
              id="adv-partidas"
              className="adv-input"
              value={partidas}
              onChange={(evento) => setPartidas(Number(evento.target.value))}
            >
              <option value={1}>1 partida</option>
              <option value={2}>2 partidas</option>
              <option value={3}>3 partidas</option>
            </select>
          </div>
        )}

        {exigeDias && (
          <div className="adv-campo">
            <label htmlFor="adv-dias">Dias de suspensão (10 a 90)</label>
            <input
              id="adv-dias"
              className="adv-input"
              type="number"
              min={10}
              max={90}
              value={dias}
              onChange={(evento) => setDias(evento.target.value)}
            />
          </div>
        )}

        {aplicar.isError && <div className="adv-erro">{extrairMensagemErro(aplicar.error)}</div>}

        <div className="adv-rodape">
          <button type="button" className="adv-btn" onClick={onClose}>
            Voltar
          </button>
          <button
            type="submit"
            className="adv-btn adv-btn-primario"
            disabled={!formularioValido || aplicar.isPending}
          >
            {aplicar.isPending ? 'Aplicando...' : 'Aplicar advertência'}
          </button>
        </div>
      </form>
    </AdvertenciaModal>
  );
}
