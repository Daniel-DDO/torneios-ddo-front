import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API } from '../services/api';
import {
  Repeat,
  CheckCircle2,
  X,
  Info,
  Search,
  AlertCircle,
  Users,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import './PopupSubstituirJogPartida.css';

interface JogadorClubeDTO {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string | null;
  clubeId: string;
  clubeNome: string;
  clubeImagem: string;
  clubeSigla: string;
}

interface TrocaResultadoDTO {
  jogadorClubeNovoId: string;
  jogadorClubeNovoCriado: boolean;
  participacaoFaseCriada: boolean;
  partidasAtualizadas: string[];
}

type Lado = 'mandante' | 'visitante';
type Etapa = 'selecionar-lado' | 'buscar-jogador' | 'confirmar' | 'sucesso';

interface PopupSubstituirJogPartidaProps {
  partidaId: string;
  temporadaId: string;
  mandante: JogadorClubeDTO;
  visitante: JogadorClubeDTO;
  onClose: () => void;
  onSuccess: () => void;
}

const PopupSubstituirJogPartida: React.FC<PopupSubstituirJogPartidaProps> = ({
  partidaId,
  temporadaId,
  mandante,
  visitante,
  onClose,
  onSuccess
}) => {
  const [fadeout, setFadeout] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>('selecionar-lado');

  const [ladoSelecionado, setLadoSelecionado] = useState<Lado | null>(null);

  const [termoBusca, setTermoBusca] = useState('');
  const [resultados, setResultados] = useState<JogadorClubeDTO[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscaFeita, setBuscaFeita] = useState(false);

  const [novoJogador, setNovoJogador] = useState<JogadorClubeDTO | null>(null);

  const [loadingTroca, setLoadingTroca] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<TrocaResultadoDTO | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jogadorAtual: JogadorClubeDTO | null =
    ladoSelecionado === 'mandante' ? mandante : ladoSelecionado === 'visitante' ? visitante : null;

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => onClose(), 300);
  };

  const handleSelecionarLado = (lado: Lado) => {
    setLadoSelecionado(lado);
    setEtapa('buscar-jogador');
    setTermoBusca('');
    setResultados([]);
    setBuscaFeita(false);
    setNovoJogador(null);
    setError('');
  };

  const handleVoltarSelecaoLado = () => {
    setEtapa('selecionar-lado');
    setLadoSelecionado(null);
    setTermoBusca('');
    setResultados([]);
    setBuscaFeita(false);
    setNovoJogador(null);
    setError('');
  };

  const handleVoltarBusca = () => {
    setEtapa('buscar-jogador');
    setNovoJogador(null);
    setError('');
  };

  const buscarJogadores = useCallback(async (termo: string) => {
    if (!termo.trim()) {
      setResultados([]);
      setBuscaFeita(false);
      return;
    }

    try {
      setBuscando(true);
      const resp = await API.get('/inscricao/buscar-autocomplete/temporada', {
        params: { termo, temporadaId }
      });
      const lista: JogadorClubeDTO[] = Array.isArray(resp.data) ? resp.data : [];

      const excluirId = jogadorAtual?.jogadorId;
      const filtrados = excluirId ? lista.filter((jc) => jc.jogadorId !== excluirId) : lista;

      setResultados(filtrados);
      setBuscaFeita(true);
    } catch (err) {
      console.error(err);
      setResultados([]);
      setBuscaFeita(true);
    } finally {
      setBuscando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temporadaId, jogadorAtual?.jogadorId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      buscarJogadores(termoBusca);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termoBusca]);

  const handleSelecionarNovoJogador = (jc: JogadorClubeDTO) => {
    setNovoJogador(jc);
    setEtapa('confirmar');
    setError('');
  };

  const handleConfirmarTroca = async () => {
    if (!jogadorAtual || !novoJogador) return;

    setError('');
    setLoadingTroca(true);

    try {
      const resp = await API.post('/inscricao/trocar-na-partida', {
        partidaId,
        jogadorClubeAntigoId: jogadorAtual.id,
        novoJogadorId: novoJogador.jogadorId
      });

      setResultado(resp.data as TrocaResultadoDTO);
      setEtapa('sucesso');

      setTimeout(() => {
        onSuccess();
      }, 400);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.response?.data || 'Erro ao trocar jogador na partida.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoadingTroca(false);
    }
  };

  const ladoLabel = ladoSelecionado === 'mandante' ? 'Mandante' : 'Visitante';

  const headerTitulo =
    etapa === 'selecionar-lado' ? 'Trocar Jogador' :
    etapa === 'buscar-jogador' ? `Substituir ${ladoLabel}` :
    etapa === 'confirmar' ? 'Confirmar Troca' :
    'Troca Realizada!';

  const headerSubtitulo =
    etapa === 'selecionar-lado' ? 'Selecione qual lado da partida deseja substituir' :
    etapa === 'buscar-jogador' ? `Busque o jogador que assumirá o lugar de ${jogadorAtual?.jogadorNome}` :
    etapa === 'confirmar' ? 'Revise os dados antes de confirmar' :
    'A partida foi atualizada com sucesso.';

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content troca-popup-width">

        <button className="popup-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="popup-header-fixed">
          <div className={`icon-badge-wrapper ${etapa === 'sucesso' ? 'success-badge-bg' : 'troca-badge'}`}>
            {etapa === 'sucesso' ? <CheckCircle2 size={32} /> : <Repeat size={32} />}
          </div>

          <h2 className="popup-title">{headerTitulo}</h2>
          <p className="popup-subtitle">{headerSubtitulo}</p>
        </div>

        <div className="popup-body-scroll custom-scrollbar">

          {/* ETAPA 1 — Selecionar lado */}
          {etapa === 'selecionar-lado' && (
            <div className="lado-selector-wrapper">
              {([
                { lado: 'mandante' as Lado, jc: mandante, tag: 'Mandante' },
                { lado: 'visitante' as Lado, jc: visitante, tag: 'Visitante' }
              ]).map(({ lado, jc, tag }) => (
                <button
                  key={lado}
                  type="button"
                  className="lado-card"
                  onClick={() => handleSelecionarLado(lado)}
                >
                  <span className="lado-tag">{tag}</span>

                  <div className="lado-card-body">
                    {jc.clubeImagem ? (
                      <img src={jc.clubeImagem} alt={jc.clubeSigla} className="lado-clube-img" />
                    ) : (
                      <div className="lado-clube-placeholder"><Users size={20} /></div>
                    )}

                    <div className="lado-info">
                      <span className="lado-clube-nome">{jc.clubeNome}</span>
                      <span className="lado-jogador-nome">
                        <Users size={12} /> {jc.jogadorNome}
                      </span>
                    </div>
                  </div>

                  <ArrowRight size={18} className="lado-card-arrow" />
                </button>
              ))}
            </div>
          )}

          {/* ETAPA 2 — Buscar novo jogador */}
          {etapa === 'buscar-jogador' && jogadorAtual && (
            <div className="busca-wrapper">
              <div className="troca-atual-box">
                <span className="troca-atual-label">Saindo</span>
                <div className="troca-atual-content">
                  {jogadorAtual.clubeImagem ? (
                    <img src={jogadorAtual.clubeImagem} alt={jogadorAtual.clubeSigla} className="classificado-img" />
                  ) : (
                    <div className="classificado-placeholder"><Users size={14} /></div>
                  )}
                  <div className="classificado-info">
                    <span className="c-nome">{jogadorAtual.jogadorNome}</span>
                    <span className="c-clube">{jogadorAtual.clubeNome}</span>
                  </div>
                </div>
              </div>

              <div className="busca-input-wrapper">
                <Search size={18} className="busca-input-icon" />
                <input
                  type="text"
                  className="busca-input"
                  placeholder="Digite o nome do jogador..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  autoFocus
                />
                {buscando && <Loader2 size={16} className="busca-spinner-icon" />}
              </div>

              {!buscando && buscaFeita && termoBusca.trim() && resultados.length === 0 && (
                <div className="busca-empty-state">
                  <AlertCircle size={16} />
                  Nenhum jogador encontrado nesta temporada.
                </div>
              )}

              {!termoBusca.trim() && (
                <div className="info-box">
                  <div className="info-icon"><Info size={20} /></div>
                  <p>Digite ao menos uma letra para buscar jogadores inscritos nesta temporada.</p>
                </div>
              )}

              {resultados.length > 0 && (
                <ul className="classificados-list resultado-busca-list">
                  {resultados.map((jc) => (
                    <li key={jc.id} className="classificado-item resultado-busca-item" onClick={() => handleSelecionarNovoJogador(jc)}>
                      {jc.clubeImagem ? (
                        <img src={jc.clubeImagem} alt={jc.clubeSigla} className="classificado-img" />
                      ) : (
                        <div className="classificado-placeholder"><Users size={14} /></div>
                      )}

                      <div className="classificado-info">
                        <span className="c-nome">{jc.jogadorNome}</span>
                        <span className="c-clube">{jc.clubeNome}</span>
                      </div>

                      <ArrowRight size={16} className="resultado-busca-arrow" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ETAPA 3 — Confirmar */}
          {etapa === 'confirmar' && jogadorAtual && novoJogador && (
            <div className="confirmar-wrapper">
              <div className="troca-visual">
                <div className="troca-visual-side">
                  {jogadorAtual.clubeImagem ? (
                    <img src={jogadorAtual.clubeImagem} alt={jogadorAtual.clubeSigla} className="troca-visual-img saindo" />
                  ) : (
                    <div className="classificado-placeholder"><Users size={18} /></div>
                  )}
                  <span className="troca-visual-nome saindo-nome">{jogadorAtual.jogadorNome}</span>
                  <span className="troca-visual-tag saindo-tag">Sai</span>
                </div>

                <div className="troca-visual-icon">
                  <Repeat size={22} />
                </div>

                <div className="troca-visual-side">
                  {novoJogador.clubeImagem ? (
                    <img src={novoJogador.clubeImagem} alt={novoJogador.clubeSigla} className="troca-visual-img entrando" />
                  ) : (
                    <div className="classificado-placeholder"><Users size={18} /></div>
                  )}
                  <span className="troca-visual-nome entrando-nome">{novoJogador.jogadorNome}</span>
                  <span className="troca-visual-tag entrando-tag">Entra</span>
                </div>
              </div>

              <div className="info-box mb-3">
                <div className="info-icon"><Info size={20} /></div>
                <p>
                  <strong>{novoJogador.jogadorNome}</strong> assumirá a posição de <strong>{ladoLabel.toLowerCase()}</strong>{' '}
                  com o clube <strong>{jogadorAtual.clubeNome}</strong>. Esta ação pode afetar outras partidas já registradas desta fase.
                </p>
              </div>

              {error && (
                <div className="temporada-error-msg">
                  <AlertCircle size={16} style={{ display: 'inline', marginBottom: -3, marginRight: 5 }} />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ETAPA 4 — Sucesso */}
          {etapa === 'sucesso' && resultado && (
            <div className="sucesso-wrapper">
              <div className="info-box success-box mb-3">
                <div className="info-icon success-icon"><ShieldCheck size={20} /></div>
                <p>
                  {resultado.jogadorClubeNovoCriado
                    ? 'Um novo vínculo de jogador/clube foi criado para esta temporada.'
                    : 'O jogador já possuía vínculo com este clube na temporada.'}
                  {resultado.participacaoFaseCriada && ' Uma nova participação na fase também foi registrada.'}
                </p>
              </div>

              <div className="partidas-atualizadas-box">
                <div className="partidas-atualizadas-header">
                  <Sparkles size={16} />
                  <span>
                    {resultado.partidasAtualizadas.length}{' '}
                    {resultado.partidasAtualizadas.length === 1 ? 'partida atualizada' : 'partidas atualizadas'}
                  </span>
                </div>
                <p className="partidas-atualizadas-desc">
                  Todas as partidas futuras envolvendo esse confronto foram sincronizadas com o novo jogador.
                </p>
              </div>
            </div>
          )}

        </div>

        <div className="popup-footer-fixed">
          {etapa === 'selecionar-lado' && (
            <button type="button" className="submit-season-btn" disabled style={{ opacity: 0.5, cursor: 'default' }}>
              Selecione um lado acima
            </button>
          )}

          {etapa === 'buscar-jogador' && (
            <button type="button" className="submit-season-btn secondary-btn" onClick={handleVoltarSelecaoLado}>
              Voltar
            </button>
          )}

          {etapa === 'confirmar' && (
            <div className="footer-btn-group">
              <button type="button" className="submit-season-btn secondary-btn" onClick={handleVoltarBusca} disabled={loadingTroca}>
                Voltar
              </button>
              <button type="button" className="submit-season-btn" onClick={handleConfirmarTroca} disabled={loadingTroca}>
                {loadingTroca ? (
                  <>
                    <span className="popup-spinner-small" style={{ marginRight: 8 }}></span>
                    Trocando...
                  </>
                ) : (
                  <>
                    <Repeat size={18} style={{ marginRight: 8 }} />
                    Confirmar Troca
                  </>
                )}
              </button>
            </div>
          )}

          {etapa === 'sucesso' && (
            <button type="button" className="submit-season-btn success-btn" onClick={handleClose}>
              Concluído
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default PopupSubstituirJogPartida;