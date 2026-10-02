import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Clock, History, MessageSquare, RotateCcw, Save, Info } from 'lucide-react';
import { API } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupGeral from '../components/PopupGeral';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

// ---------------------------------------------------------------------------
// Tipos (espelham os DTOs do backend)
// ---------------------------------------------------------------------------

type DiaSemana = 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SAB' | 'DOM';
type Turno = 'MADRUGADA' | 'MANHA' | 'TARDE' | 'NOITE';
type Grade = Record<DiaSemana, Turno[]>;

interface DisponibilidadeDTO {
  jogadorId: string;
  grade: Partial<Record<DiaSemana, Turno[]>>;
  atualizadoEm: string | null;
  proximaAlteracaoEm: string | null;
  podeAlterarAgora: boolean;
}

interface HistoricoDTO {
  id: number;
  grade: Partial<Record<DiaSemana, Turno[]>>;
  criadoEm: string;
}

interface ObservacaoDTO {
  id: number;
  texto: string;
  criadoEm: string;
}

interface PaginaNormalizada<T> {
  itens: T[];
  proxima: number | undefined;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const DIAS: { chave: DiaSemana; nome: string; curto: string }[] = [
  { chave: 'SEG', nome: 'Segunda', curto: 'Seg' },
  { chave: 'TER', nome: 'Terça', curto: 'Ter' },
  { chave: 'QUA', nome: 'Quarta', curto: 'Qua' },
  { chave: 'QUI', nome: 'Quinta', curto: 'Qui' },
  { chave: 'SEX', nome: 'Sexta', curto: 'Sex' },
  { chave: 'SAB', nome: 'Sábado', curto: 'Sáb' },
  { chave: 'DOM', nome: 'Domingo', curto: 'Dom' }
];

const TURNOS: { chave: Turno; nome: string; faixa: string; contaParaMinimo: boolean }[] = [
  { chave: 'MADRUGADA', nome: 'Madrugada', faixa: '0h às 5h59', contaParaMinimo: false },
  { chave: 'MANHA', nome: 'Manhã', faixa: '6h às 11h59', contaParaMinimo: true },
  { chave: 'TARDE', nome: 'Tarde', faixa: '12h às 17h59', contaParaMinimo: true },
  { chave: 'NOITE', nome: 'Noite', faixa: '18h às 23h59', contaParaMinimo: true }
];

const MINIMO_DIAS_EDICAO = 2;
const TAMANHO_MAXIMO_OBSERVACAO = 500;
const CARGOS_STAFF = ['PROPRIETARIO', 'DIRETOR', 'ADMINISTRADOR'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function desembrulhar<T>(response: unknown): T {
  const r = response as { data?: T } | null;
  return (r?.data ?? response) as T;
}

function extrairMensagemErro(err: unknown, padrao: string): string {
  const e = err as {
    response?: { data?: unknown };
    data?: unknown;
    message?: string;
  };

  const candidatos = [e?.response?.data, e?.data];
  for (const c of candidatos) {
    if (typeof c === 'string' && c.trim()) return c;
    if (c && typeof c === 'object') {
      const o = c as Record<string, unknown>;
      for (const chave of ['message', 'mensagem', 'erro', 'error']) {
        if (typeof o[chave] === 'string' && (o[chave] as string).trim()) return o[chave] as string;
      }
    }
  }
  return e?.message || padrao;
}

function normalizarPagina<T>(response: unknown, paginaSolicitada: number): PaginaNormalizada<T> {
  const r = desembrulhar<{
    content?: T[];
    conteudo?: T[];
    last?: boolean;
    ultimaPagina?: boolean;
    totalPages?: number;
    totalPaginas?: number;
  }>(response);

  const itens = r.content ?? r.conteudo ?? [];
  const totalPaginas = r.totalPages ?? r.totalPaginas;
  const ultima = r.last ?? r.ultimaPagina ?? (totalPaginas !== undefined ? paginaSolicitada + 1 >= totalPaginas : itens.length === 0);

  return { itens, proxima: ultima ? undefined : paginaSolicitada + 1 };
}

function gradeVazia(): Grade {
  return { SEG: [], TER: [], QUA: [], QUI: [], SEX: [], SAB: [], DOM: [] };
}

function normalizarGrade(grade: Partial<Record<DiaSemana, Turno[]>> | undefined): Grade {
  const base = gradeVazia();
  DIAS.forEach(({ chave }) => {
    base[chave] = [...(grade?.[chave] ?? [])];
  });
  return base;
}

function assinaturaGrade(grade: Grade): string {
  return DIAS.map(({ chave }) => [...grade[chave]].sort().join('+')).join('|');
}

/** Um dia só conta pro mínimo se tiver manhã, tarde ou noite (madrugada sozinha não conta). */
function contarDiasValidos(grade: Grade): number {
  const turnosValidos = TURNOS.filter(t => t.contaParaMinimo).map(t => t.chave);
  return DIAS.filter(({ chave }) => grade[chave].some(t => turnosValidos.includes(t))).length;
}

function montarPayload(grade: Grade): Partial<Record<DiaSemana, Turno[]>> {
  const ordem = TURNOS.map(t => t.chave);
  const payload: Partial<Record<DiaSemana, Turno[]>> = {};
  DIAS.forEach(({ chave }) => {
    if (grade[chave].length > 0) {
      payload[chave] = [...grade[chave]].sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
    }
  });
  return payload;
}

function resumirGrade(grade: Partial<Record<DiaSemana, Turno[]>>): string {
  const partes = DIAS
    .filter(({ chave }) => (grade[chave]?.length ?? 0) > 0)
    .map(({ chave, curto }) => {
      const nomes = TURNOS.filter(t => grade[chave]!.includes(t.chave)).map(t => t.nome.toLowerCase());
      return `${curto}: ${nomes.join(', ')}`;
    });
  return partes.length > 0 ? partes.join(' · ') : 'Sem disponibilidade marcada';
}

/**
 * O servidor devolve LocalDateTime em horário de Brasília, sem fuso.
 * Por isso o texto é formatado direto, sem passar por new Date() (que converteria pro fuso do navegador).
 */
function formatarDataHoraBrasilia(valor: string | null | undefined): string {
  if (!valor) return '--';
  const m = valor.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return valor;
  return `${m[3]}/${m[2]}/${m[1]} às ${m[4]}:${m[5]}`;
}

function agoraBrasilia(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T');
}

// ---------------------------------------------------------------------------
// Grade (tabela dia x turno)
// ---------------------------------------------------------------------------

function GradeDisponibilidade({
  grade,
  editavel,
  onToggle
}: {
  grade: Grade;
  editavel: boolean;
  onToggle?: (dia: DiaSemana, turno: Turno) => void;
}) {
  return (
    <div className="td-grade" role="group" aria-label="Grade de disponibilidade">
      <div className="td-grade-canto" />
      {TURNOS.map(turno => (
        <div key={turno.chave} className="td-grade-cabecalho">
          <span className="td-grade-turno-nome">{turno.nome}</span>
          <span className="td-grade-turno-faixa">{turno.faixa}</span>
        </div>
      ))}

      {DIAS.map(dia => (
        <div key={dia.chave} className="td-grade-linha">
          <div className="td-grade-dia">
            <span className="td-grade-dia-nome">{dia.nome}</span>
            <span className="td-grade-dia-curto">{dia.curto}</span>
          </div>
          {TURNOS.map(turno => {
            const marcado = grade[dia.chave].includes(turno.chave);
            const rotulo = `${dia.nome}, ${turno.nome}`;

            return editavel ? (
              <button
                key={turno.chave}
                type="button"
                className={`td-celula td-celula-editavel ${marcado ? 'marcada' : ''}`}
                aria-pressed={marcado}
                aria-label={rotulo}
                onClick={() => onToggle?.(dia.chave, turno.chave)}
              >
                {marcado && <Check size={18} />}
              </button>
            ) : (
              <div
                key={turno.chave}
                className={`td-celula ${marcado ? 'marcada' : ''}`}
                aria-label={`${rotulo}: ${marcado ? 'disponível' : 'indisponível'}`}
              >
                {marcado && <Check size={18} />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tela
// ---------------------------------------------------------------------------

interface PopupState {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  buttonText?: string;
  onConfirm?: () => void;
}

export function TelaDisponibilidade() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const { currentUser, isMobile, abrirLogin } = useAppContext();

  const cargo = (currentUser as { cargo?: string } | null)?.cargo;
  const ehProprio = !!currentUser && !!id && currentUser.id === id;
  const ehStaff = !!cargo && CARGOS_STAFF.includes(cargo);
  const podeVerRegistros = ehProprio || ehStaff;

  const [rascunho, setRascunho] = useState<Grade>(gradeVazia());
  const [textoObservacao, setTextoObservacao] = useState('');
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [agora, setAgora] = useState<string>(agoraBrasilia());

  // ---- Grade atual (visível pra qualquer usuário logado) ----
  const { data: disponibilidade, isLoading: carregandoGrade } = useQuery({
    queryKey: ['disponibilidade', id],
    queryFn: async () => {
      const response = await API.get(`disponibilidades/jogador/${id}`);
      return desembrulhar<DisponibilidadeDTO>(response);
    },
    enabled: !!currentUser && !!id,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  // ---- Histórico de alterações (dono e organização) ----
  const {
    data: historicoData,
    fetchNextPage: carregarMaisHistorico,
    hasNextPage: temMaisHistorico,
    isFetchingNextPage: carregandoMaisHistorico
  } = useInfiniteQuery({
    queryKey: ['disponibilidadeHistorico', id],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await API.get(`disponibilidades/jogador/${id}/historico?page=${pageParam}&size=10`);
      return normalizarPagina<HistoricoDTO>(response, pageParam);
    },
    getNextPageParam: (ultima) => ultima.proxima,
    initialPageParam: 0,
    enabled: !!currentUser && !!id && podeVerRegistros,
    staleTime: 0
  });

  // ---- Observações / imprevistos (dono e organização) ----
  const {
    data: observacoesData,
    fetchNextPage: carregarMaisObservacoes,
    hasNextPage: temMaisObservacoes,
    isFetchingNextPage: carregandoMaisObservacoes
  } = useInfiniteQuery({
    queryKey: ['disponibilidadeObservacoes', id],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await API.get(`disponibilidades/jogador/${id}/observacoes?page=${pageParam}&size=10`);
      return normalizarPagina<ObservacaoDTO>(response, pageParam);
    },
    getNextPageParam: (ultima) => ultima.proxima,
    initialPageParam: 0,
    enabled: !!currentUser && !!id && podeVerRegistros,
    staleTime: 0
  });

  const historico = useMemo(() => historicoData?.pages.flatMap(p => p.itens) ?? [], [historicoData]);
  const observacoes = useMemo(() => observacoesData?.pages.flatMap(p => p.itens) ?? [], [observacoesData]);

  // Rascunho parte da grade do servidor; só é refeito quando a versão salva muda
  useEffect(() => {
    if (!disponibilidade) return;
    setRascunho(normalizarGrade(disponibilidade.grade));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disponibilidade?.atualizadoEm, id]);

  // Libera o botão sozinho quando as 24h passam, sem precisar recarregar a página
  useEffect(() => {
    if (!ehProprio) return;
    const timer = setInterval(() => setAgora(agoraBrasilia()), 30000);
    return () => clearInterval(timer);
  }, [ehProprio]);

  const gradeServidor = useMemo(() => normalizarGrade(disponibilidade?.grade), [disponibilidade]);
  const alterado = assinaturaGrade(rascunho) !== assinaturaGrade(gradeServidor);
  const diasValidos = contarDiasValidos(rascunho);
  const jaCadastrou = !!disponibilidade?.atualizadoEm;

  const podeAlterar =
    !!disponibilidade &&
    (disponibilidade.podeAlterarAgora ||
      !disponibilidade.proximaAlteracaoEm ||
      agora >= disponibilidade.proximaAlteracaoEm.slice(0, 19));

  // ---- Mutations ----
  const salvarGrade = useMutation({
    mutationFn: async (grade: Grade) => {
      const response = await API.put('disponibilidades/me', { grade: montarPayload(grade) });
      return desembrulhar<DisponibilidadeDTO>(response);
    },
    onSuccess: (nova) => {
      queryClient.setQueryData(['disponibilidade', id], nova);
      queryClient.invalidateQueries({ queryKey: ['disponibilidadeHistorico', id] });
      setPopup({
        title: 'Disponibilidade salva',
        message: `Você poderá alterar novamente a partir de ${formatarDataHoraBrasilia(nova.proximaAlteracaoEm)} (horário de Brasília).`,
        type: 'success',
        buttonText: 'OK'
      });
    },
    onError: (err) => {
      setPopup({
        title: 'Não foi possível salvar',
        message: extrairMensagemErro(err, 'Erro ao salvar sua disponibilidade. Tente novamente.'),
        type: 'error',
        buttonText: 'OK'
      });
    }
  });

  const registrarObservacao = useMutation({
    mutationFn: async (texto: string) => {
      const response = await API.post('disponibilidades/me/observacoes', { texto });
      return desembrulhar<ObservacaoDTO>(response);
    },
    onSuccess: () => {
      setTextoObservacao('');
      queryClient.invalidateQueries({ queryKey: ['disponibilidadeObservacoes', id] });
    },
    onError: (err) => {
      setPopup({
        title: 'Não foi possível registrar',
        message: extrairMensagemErro(err, 'Erro ao registrar a observação. Tente novamente.'),
        type: 'error',
        buttonText: 'OK'
      });
    }
  });

  // ---- Ações ----
  const alternarTurno = (dia: DiaSemana, turno: Turno) => {
    setRascunho(prev => ({
      ...prev,
      [dia]: prev[dia].includes(turno) ? prev[dia].filter(t => t !== turno) : [...prev[dia], turno]
    }));
  };

  const pedirConfirmacao = () => {
    if (diasValidos < MINIMO_DIAS_EDICAO) {
      setPopup({
        title: 'Marque mais dias',
        message: `Marque pelo menos ${MINIMO_DIAS_EDICAO} dias da semana com algum horário de manhã, tarde ou noite. A madrugada sozinha não conta.`,
        type: 'warning',
        buttonText: 'Entendi'
      });
      return;
    }

    setPopup({
      title: 'Confirmar alteração',
      message: 'Depois de salvar, você só poderá alterar sua grade novamente daqui a 24 horas. Deseja salvar agora?',
      type: 'warning',
      buttonText: 'Salvar',
      onConfirm: () => salvarGrade.mutate(rascunho)
    });
  };

  const enviarObservacao = () => {
    const texto = textoObservacao.trim();
    if (!texto || registrarObservacao.isPending) return;
    registrarObservacao.mutate(texto);
  };

  // ---- Não logado ----
  if (!currentUser) {
    return (
      <>
        <DashboardLayout esconderBusca>
          <div />
        </DashboardLayout>
        <PopupGeral
          title="Login Necessário"
          message="Faça login para visualizar as disponibilidades."
          type="warning"
          buttonText="Fazer Login"
          onClose={() => navigate('/')}
          onConfirm={() => {
            navigate('/');
            abrirLogin();
          }}
        />
      </>
    );
  }

  const textoRestante = TAMANHO_MAXIMO_OBSERVACAO - textoObservacao.length;

  return (
    <DashboardLayout esconderBusca contentStyle={{ padding: isMobile ? '1rem' : undefined }}>
      <LoadingSpinner isLoading={carregandoGrade || salvarGrade.isPending} />

      <style>{`
    .td-page-content {
      padding: 0;
      display: flex;
      justify-content: center;
    }

    .td-container {
      width: 100%;
      max-width: 900px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .td-back-btn {
      align-self: flex-start;
      display: flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: none;
      color: var(--text-gray);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 0;
    }

    .td-back-btn:hover {
      color: var(--text-dark);
    }

    .td-title-block {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .td-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-dark);
      margin: 0;
    }

    .td-subtitle {
      color: var(--text-gray);
      font-size: 0.95rem;
      margin: 0;
    }

    .td-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
    }

    .td-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--text-dark);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.8rem;
    }

    .td-aviso {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--text-gray);
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 0.75rem 1rem;
      line-height: 1.45;
    }

    .td-aviso svg {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .td-aviso-bloqueio {
      border-color: var(--danger);
      color: var(--danger);
      background: rgba(var(--danger-rgb), 0.06);
    }

    .td-aviso-destaque {
      border-color: var(--primary);
      color: var(--text-dark);
      background: rgba(var(--primary-rgb), 0.06);
    }

    .td-grade {
      display: grid;
      grid-template-columns: minmax(84px, auto) repeat(4, 1fr);
      gap: 6px;
      align-items: stretch;
    }

    .td-grade-linha {
      display: contents;
    }

    .td-grade-canto {
      min-height: 1px;
    }

    .td-grade-cabecalho {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      text-align: center;
      padding-bottom: 4px;
    }

    .td-grade-turno-nome {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-dark);
    }

    .td-grade-turno-faixa {
      font-size: 0.72rem;
      color: var(--text-gray);
    }

    .td-grade-dia {
      display: flex;
      align-items: center;
      font-weight: 600;
      color: var(--text-dark);
      font-size: 0.95rem;
    }

    .td-grade-dia-curto {
      display: none;
    }

    .td-celula {
      min-height: 48px;
      border-radius: var(--radius);
      border: 1px solid var(--border-color);
      background: var(--bg-main);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 0;
      font: inherit;
    }

    .td-celula.marcada {
      background: var(--primary);
      border-color: var(--primary);
    }

    .td-celula-editavel {
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .td-celula-editavel:hover:not(.marcada) {
      border-color: var(--primary);
    }

    .td-celula-editavel:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }

    .td-acoes {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .td-contador {
      font-size: 0.85rem;
      color: var(--text-gray);
    }

    .td-contador.insuficiente {
      color: var(--danger);
    }

    .td-botoes {
      display: flex;
      gap: 0.75rem;
    }

    .td-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-dark);
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .td-btn-primario {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }

    .td-btn:hover:not(:disabled) {
      opacity: 0.9;
    }

    .td-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .td-textarea {
      width: 100%;
      min-height: 90px;
      resize: vertical;
      background: var(--bg-main);
      color: var(--text-dark);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 0.75rem;
      font: inherit;
      font-size: 0.9rem;
      box-sizing: border-box;
    }

    .td-textarea:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 1px;
    }

    .td-lista {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .td-item {
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      background: var(--bg-main);
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .td-item-data {
      font-size: 0.8rem;
      color: var(--text-gray);
    }

    .td-item-texto {
      color: var(--text-dark);
      font-size: 0.9rem;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .td-vazio {
      text-align: center;
      padding: 1.5rem;
      color: var(--text-gray);
      font-size: 0.9rem;
      border: 1px dashed var(--border-color);
      border-radius: var(--radius);
    }

    .td-ver-mais {
      align-self: center;
    }

    @media (max-width: 768px) {
      .td-card {
        padding: 1rem;
      }
      .td-grade {
        grid-template-columns: 44px repeat(4, 1fr);
        gap: 4px;
      }
      .td-grade-dia-nome {
        display: none;
      }
      .td-grade-dia-curto {
        display: inline;
      }
      .td-grade-turno-faixa {
        display: none;
      }
      .td-grade-turno-nome {
        font-size: 0.78rem;
      }
      .td-acoes {
        flex-direction: column;
        align-items: stretch;
      }
      .td-botoes {
        justify-content: stretch;
      }
      .td-botoes .td-btn {
        flex: 1;
        justify-content: center;
      }
    }
  `}</style>

      <div className="td-page-content">
        <div className="td-container">
          <button className="td-back-btn" onClick={() => navigate(`/jogador/${id}`)}>
            <ArrowLeft size={16} /> Voltar ao perfil
          </button>

          <div className="td-title-block">
            <h1 className="td-title">{ehProprio ? 'Minha disponibilidade' : 'Disponibilidade do jogador'}</h1>
            <p className="td-subtitle">
              {ehProprio
                ? 'Marque os dias e turnos em que você costuma poder jogar. Todos os horários seguem o fuso de Brasília.'
                : 'Dias e turnos que o jogador declarou como disponíveis. Todos os horários seguem o fuso de Brasília.'}
            </p>
            <p className="td-subtitle">
              {jaCadastrou
                ? `Última atualização: ${formatarDataHoraBrasilia(disponibilidade?.atualizadoEm)}`
                : 'Ainda não cadastrada.'}
            </p>
          </div>

          {/* ---------------- Grade ---------------- */}
          <div className="td-card">
            <div className="td-card-header">
              <Clock size={18} /> Dias e turnos
            </div>

            {ehProprio && !jaCadastrou && (
              <div className="td-aviso td-aviso-destaque">
                <Info size={16} />
                <span>
                  Preencha sua disponibilidade para poder se inscrever nos campeonatos. Campeonatos curtos exigem pelo menos
                  2 dias e campeonatos longos (liga + mata-mata) pelo menos 4 dias, com algum turno de manhã, tarde ou noite.
                </span>
              </div>
            )}

            {ehProprio && jaCadastrou && !podeAlterar && (
              <div className="td-aviso td-aviso-bloqueio">
                <Clock size={16} />
                <span>
                  Você poderá alterar sua grade novamente a partir de{' '}
                  {formatarDataHoraBrasilia(disponibilidade?.proximaAlteracaoEm)} (horário de Brasília).
                </span>
              </div>
            )}

            <GradeDisponibilidade
              grade={ehProprio ? rascunho : gradeServidor}
              editavel={ehProprio && podeAlterar}
              onToggle={alternarTurno}
            />

            {!ehProprio && !jaCadastrou && (
              <div className="td-vazio">Esse jogador ainda não cadastrou a disponibilidade.</div>
            )}

            {ehProprio && (
              <div className="td-acoes">
                <span className={`td-contador ${diasValidos < MINIMO_DIAS_EDICAO ? 'insuficiente' : ''}`}>
                  {diasValidos} {diasValidos === 1 ? 'dia válido' : 'dias válidos'} (mínimo {MINIMO_DIAS_EDICAO}, madrugada sozinha não conta)
                </span>
                <div className="td-botoes">
                  <button
                    className="td-btn"
                    disabled={!alterado || !podeAlterar}
                    onClick={() => setRascunho(gradeServidor)}
                  >
                    <RotateCcw size={16} /> Descartar
                  </button>
                  <button
                    className="td-btn td-btn-primario"
                    disabled={!alterado || !podeAlterar || salvarGrade.isPending}
                    onClick={pedirConfirmacao}
                  >
                    <Save size={16} /> Salvar alterações
                  </button>
                </div>
              </div>
            )}

            <div className="td-aviso">
              <Info size={16} />
              <span>
                A disponibilidade não obriga ninguém a jogar apenas nesses horários. Ela serve de respaldo para o jogador e
                para a organização e é um elemento de análise em disputas, não um determinante isolado.
              </span>
            </div>
          </div>

          {/* ---------------- Observações ---------------- */}
          {podeVerRegistros && (
            <div className="td-card">
              <div className="td-card-header">
                <MessageSquare size={18} /> Registro de imprevistos
              </div>

              {ehProprio && (
                <>
                  <div className="td-aviso">
                    <Info size={16} />
                    <span>
                      Avise aqui quando algo fugir da sua grade. Cada registro fica salvo com data e hora e não pode ser
                      editado depois. Eles ficam visíveis só para você e para a organização, então evite dados pessoais
                      sensíveis.
                    </span>
                  </div>
                  <textarea
                    className="td-textarea"
                    value={textoObservacao}
                    maxLength={TAMANHO_MAXIMO_OBSERVACAO}
                    placeholder="Ex.: Esta semana só consigo jogar depois das 22h por causa de uma viagem de trabalho."
                    onChange={(e) => setTextoObservacao(e.target.value)}
                  />
                  <div className="td-acoes">
                    <span className="td-contador">{textoRestante} caracteres restantes</span>
                    <button
                      className="td-btn td-btn-primario"
                      disabled={!textoObservacao.trim() || registrarObservacao.isPending}
                      onClick={enviarObservacao}
                    >
                      <MessageSquare size={16} /> Registrar imprevisto
                    </button>
                  </div>
                </>
              )}

              <div className="td-lista">
                {observacoes.length > 0 ? (
                  observacoes.map(obs => (
                    <div key={obs.id} className="td-item">
                      <span className="td-item-data">{formatarDataHoraBrasilia(obs.criadoEm)}</span>
                      <span className="td-item-texto">{obs.texto}</span>
                    </div>
                  ))
                ) : (
                  <div className="td-vazio">Nenhum imprevisto registrado.</div>
                )}
              </div>

              {temMaisObservacoes && (
                <button
                  className="td-btn td-ver-mais"
                  disabled={carregandoMaisObservacoes}
                  onClick={() => carregarMaisObservacoes()}
                >
                  {carregandoMaisObservacoes ? 'Carregando...' : 'Ver mais registros'}
                </button>
              )}
            </div>
          )}

          {/* ---------------- Histórico ---------------- */}
          {podeVerRegistros && (
            <div className="td-card">
              <div className="td-card-header">
                <History size={18} /> Histórico de alterações
              </div>

              <div className="td-lista">
                {historico.length > 0 ? (
                  historico.map((versao, indice) => (
                    <div key={versao.id} className="td-item">
                      <span className="td-item-data">
                        {formatarDataHoraBrasilia(versao.criadoEm)}
                        {indice === 0 ? ' (versão atual)' : ''}
                      </span>
                      <span className="td-item-texto">{resumirGrade(versao.grade)}</span>
                    </div>
                  ))
                ) : (
                  <div className="td-vazio">Nenhuma alteração registrada.</div>
                )}
              </div>

              {temMaisHistorico && (
                <button
                  className="td-btn td-ver-mais"
                  disabled={carregandoMaisHistorico}
                  onClick={() => carregarMaisHistorico()}
                >
                  {carregandoMaisHistorico ? 'Carregando...' : 'Ver versões anteriores'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {popup && (
        <PopupGeral
          title={popup.title}
          message={popup.message}
          type={popup.type}
          buttonText={popup.buttonText ?? 'OK'}
          onClose={() => setPopup(null)}
          onConfirm={() => {
            const acao = popup.onConfirm;
            setPopup(null);
            acao?.();
          }}
        />
      )}
    </DashboardLayout>
  );
}