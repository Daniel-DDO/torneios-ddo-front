import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API } from '../services/api';
import {
  TrendingUp,
  CheckCircle2,
  X,
  Info,
  Search,
  AlertCircle,
  Building2,
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import './PopupMultiplicarMercado.css';

interface Clube {
  id: string;
  nome: string;
  sigla?: string;
  imagem?: string;
  valorAtual?: number;
}

interface MultiplicacaoResultadoDTO {
  clubesAtualizados: number;
  multiplicador: number;
}

type Modo = 'todos' | 'clube';
type Etapa = 'buscar-clube' | 'definir-multiplicador' | 'sucesso';

interface PopupMultiplicarMercadoProps {
  modo: Modo;
  onClose: () => void;
  onSuccess: (mensagem: string) => void;
}

const PopupMultiplicarMercado: React.FC<PopupMultiplicarMercadoProps> = ({ modo, onClose, onSuccess }) => {
  const [fadeout, setFadeout] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>(modo === 'clube' ? 'buscar-clube' : 'definir-multiplicador');

  const [termoBusca, setTermoBusca] = useState('');
  const [resultados, setResultados] = useState<Clube[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscaFeita, setBuscaFeita] = useState(false);

  const [clubeSelecionado, setClubeSelecionado] = useState<Clube | null>(null);
  const [multiplicador, setMultiplicador] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [resultadoTodos, setResultadoTodos] = useState<MultiplicacaoResultadoDTO | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(() => onClose(), 300);
  };

  const buscarClubes = useCallback(async (termo: string) => {
    if (!termo.trim()) {
      setResultados([]);
      setBuscaFeita(false);
      return;
    }

    try {
      setBuscando(true);
      const resp = await API.get('/clube/buscar-autocomplete', { params: { termo } });
      const lista: Clube[] = Array.isArray(resp.data) ? resp.data : [];
      setResultados(lista);
      setBuscaFeita(true);
    } catch (err) {
      console.error(err);
      setResultados([]);
      setBuscaFeita(true);
    } finally {
      setBuscando(false);
    }
  }, []);

  useEffect(() => {
    if (modo !== 'clube') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      buscarClubes(termoBusca);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [termoBusca, modo, buscarClubes]);

  const handleSelecionarClube = (clube: Clube) => {
    setClubeSelecionado(clube);
    setEtapa('definir-multiplicador');
    setError('');
  };

  const handleVoltarBusca = () => {
    setEtapa('buscar-clube');
    setClubeSelecionado(null);
    setMultiplicador('');
    setError('');
  };

  const multiplicadorNumerico = parseFloat(multiplicador.replace(',', '.'));
  const multiplicadorValido = !isNaN(multiplicadorNumerico) && multiplicadorNumerico > 0;

  const valorPrevisto = clubeSelecionado?.valorAtual && multiplicadorValido
    ? clubeSelecionado.valorAtual * multiplicadorNumerico
    : null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleConfirmar = async () => {
    if (!multiplicadorValido) {
      setError('Informe um multiplicador numérico maior que zero.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (modo === 'todos') {
        const resp = await API.patch('/clube/mercado/multiplicar-todos', {
          multiplicador: multiplicadorNumerico
        });
        const data = resp.data as MultiplicacaoResultadoDTO;
        setResultadoTodos(data);
        setEtapa('sucesso');
        setTimeout(() => {
          onSuccess(`${data.clubesAtualizados} clube(s) tiveram seu valor de mercado multiplicado por ${data.multiplicador}x.`);
        }, 400);
      } else if (clubeSelecionado) {
        await API.patch(`/clube/${clubeSelecionado.id}/mercado/multiplicar`, {
          multiplicador: multiplicadorNumerico
        });
        setEtapa('sucesso');
        setTimeout(() => {
          onSuccess(`O valor de mercado de ${clubeSelecionado.nome} foi multiplicado por ${multiplicadorNumerico}x.`);
        }, 400);
      }
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data?.error || err.response?.data;
      setError(
        status === 403
          ? 'Apenas o Proprietário pode realizar esta ação.'
          : (typeof msg === 'string' ? msg : 'Erro ao aplicar o multiplicador. Tente novamente.')
      );
    } finally {
      setLoading(false);
    }
  };

  const headerTitulo =
    etapa === 'sucesso' ? 'Multiplicação Aplicada!' :
    modo === 'todos' ? 'Multiplicar Todos os Clubes' :
    etapa === 'buscar-clube' ? 'Buscar Clube' : 'Definir Multiplicador';

  const headerSubtitulo =
    etapa === 'sucesso' ? 'Os valores de mercado foram reajustados.' :
    modo === 'todos' ? 'Aplique um fator sobre o valor de mercado de todos os clubes cadastrados' :
    etapa === 'buscar-clube' ? 'Selecione o clube que terá o valor de mercado ajustado' :
    `Definindo o novo valor de mercado de ${clubeSelecionado?.nome}`;

  return (
    <div className={`popup-overlay ${fadeout ? 'fade-out' : ''}`}>
      <div className="popup-content multiplicar-popup-width">

        <button className="popup-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="popup-header-fixed">
          <div className={`icon-badge-wrapper ${etapa === 'sucesso' ? 'success-badge-bg' : 'multiplicar-badge'}`}>
            {etapa === 'sucesso' ? <CheckCircle2 size={32} /> : <TrendingUp size={32} />}
          </div>

          <h2 className="popup-title">{headerTitulo}</h2>
          <p className="popup-subtitle">{headerSubtitulo}</p>
        </div>

        <div className="popup-body-scroll custom-scrollbar">

          {/* Etapa: buscar clube (apenas modo="clube") */}
          {etapa === 'buscar-clube' && (
            <div className="busca-wrapper">
              <div className="busca-input-wrapper">
                <Search size={18} className="busca-input-icon" />
                <input
                  type="text"
                  className="busca-input"
                  placeholder="Digite o nome do clube..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  autoFocus
                />
                {buscando && <Loader2 size={16} className="busca-spinner-icon" />}
              </div>

              {!termoBusca.trim() && (
                <div className="info-box">
                  <div className="info-icon"><Info size={20} /></div>
                  <p>Digite ao menos uma letra para buscar entre os clubes cadastrados.</p>
                </div>
              )}

              {!buscando && buscaFeita && termoBusca.trim() && resultados.length === 0 && (
                <div className="busca-empty-state">
                  <AlertCircle size={16} />
                  Nenhum clube encontrado com esse termo.
                </div>
              )}

              {resultados.length > 0 && (
                <ul className="clube-resultado-list">
                  {resultados.map((clube) => (
                    <li key={clube.id} className="clube-resultado-item" onClick={() => handleSelecionarClube(clube)}>
                      {clube.imagem ? (
                        <img src={clube.imagem} alt={clube.sigla || clube.nome} className="clube-resultado-img" />
                      ) : (
                        <div className="clube-resultado-placeholder"><Building2 size={16} /></div>
                      )}

                      <div className="clube-resultado-info">
                        <span className="clube-resultado-nome">{clube.nome}</span>
                        {clube.valorAtual !== undefined && (
                          <span className="clube-resultado-valor">{formatCurrency(clube.valorAtual)}</span>
                        )}
                      </div>

                      <ArrowRight size={16} className="clube-resultado-arrow" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Etapa: definir multiplicador */}
          {etapa === 'definir-multiplicador' && (
            <div className="multiplicador-wrapper">
              {modo === 'clube' && clubeSelecionado && (
                <div className="clube-atual-box">
                  {clubeSelecionado.imagem ? (
                    <img src={clubeSelecionado.imagem} alt={clubeSelecionado.sigla || clubeSelecionado.nome} className="clube-atual-img" />
                  ) : (
                    <div className="clube-resultado-placeholder"><Building2 size={18} /></div>
                  )}
                  <div className="clube-resultado-info">
                    <span className="clube-resultado-nome">{clubeSelecionado.nome}</span>
                    {clubeSelecionado.valorAtual !== undefined && (
                      <span className="clube-resultado-valor">
                        Valor atual: {formatCurrency(clubeSelecionado.valorAtual)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <label className="multiplicador-label">Multiplicador</label>
              <div className="multiplicador-input-wrapper">
                <input
                  type="text"
                  inputMode="decimal"
                  className="multiplicador-input"
                  placeholder="Ex: 1.5"
                  value={multiplicador}
                  onChange={(e) => setMultiplicador(e.target.value)}
                  autoFocus
                />
                <span className="multiplicador-suffix">x</span>
              </div>

              {multiplicadorValido && valorPrevisto !== null && clubeSelecionado?.valorAtual !== undefined && (
                <div className="preview-box">
                  <span className="preview-valor-atual">{formatCurrency(clubeSelecionado.valorAtual)}</span>
                  <ArrowRight size={16} className="preview-arrow" />
                  <span className="preview-valor-novo">{formatCurrency(valorPrevisto)}</span>
                </div>
              )}

              <div className="info-box mb-3">
                <div className="info-icon"><Info size={20} /></div>
                <p>
                  {modo === 'todos'
                    ? 'O multiplicador será aplicado sobre o valor de mercado atual de todos os clubes cadastrados no sistema.'
                    : 'O multiplicador será aplicado apenas sobre o valor de mercado deste clube.'}
                  {' '}Valores acima de 1x aumentam o preço; entre 0 e 1x reduzem.
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

          {/* Etapa: sucesso */}
          {etapa === 'sucesso' && (
            <div className="sucesso-wrapper">
              <div className="info-box success-box">
                <div className="info-icon success-icon"><Sparkles size={20} /></div>
                {modo === 'todos' && resultadoTodos ? (
                  <p>
                    <strong>{resultadoTodos.clubesAtualizados}</strong> clube(s) tiveram o valor de mercado
                    multiplicado por <strong>{resultadoTodos.multiplicador}x</strong>.
                  </p>
                ) : (
                  <p>
                    O valor de mercado de <strong>{clubeSelecionado?.nome}</strong> foi multiplicado por{' '}
                    <strong>{multiplicadorNumerico}x</strong> com sucesso.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        <div className="popup-footer-fixed">
          {etapa === 'buscar-clube' && (
            <button type="button" className="submit-season-btn" disabled style={{ opacity: 0.5, cursor: 'default' }}>
              Selecione um clube acima
            </button>
          )}

          {etapa === 'definir-multiplicador' && (
            <div className="footer-btn-group">
              {modo === 'clube' && (
                <button type="button" className="submit-season-btn secondary-btn" onClick={handleVoltarBusca} disabled={loading}>
                  Voltar
                </button>
              )}
              <button
                type="button"
                className="submit-season-btn multiplicar-confirm-btn"
                onClick={handleConfirmar}
                disabled={loading || !multiplicadorValido}
              >
                {loading ? (
                  <>
                    <span className="popup-spinner-small" style={{ marginRight: 8 }}></span>
                    Aplicando...
                  </>
                ) : (
                  <>
                    <TrendingUp size={18} style={{ marginRight: 8 }} />
                    Aplicar Multiplicador
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

export default PopupMultiplicarMercado;