import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Search, Check, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { API } from '../services/api';
import './PopupEditarJogadorClube.css';

interface ClubeOpcao {
  id: string;
  nome: string;
  sigla: string;
  imagem: string;
}

interface ClubeAtualizado {
  id: string;
  clubeId: string;
  clubeNome: string;
  clubeSigla: string;
  clubeImagem: string;
}

// Só os campos que o popup mexe na linha do cache
interface LinhaInscrito {
  id: string;
  clubeId: string;
  clubeNome: string;
  clubeSigla: string;
  clubeImagem: string;
}

interface Props {
  jogadorClubeId: string;
  jogadorNome: string;
  // Clube atual vem da própria linha da tela (não depende da lista de clubes carregar)
  clubeAtualId: string;
  clubeAtualNome: string;
  clubeAtualImagem: string;
  temporadaId: string;
  onClose: () => void;
}

export default function PopupEditarJogadorClube({
  jogadorClubeId,
  jogadorNome,
  clubeAtualId,
  clubeAtualNome,
  clubeAtualImagem,
  temporadaId,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const [fadeout, setFadeout] = useState(false);
  // Clube escolhido para a troca (null = nada escolhido ainda)
  const [novoClubeId, setNovoClubeId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');
  const [salvo, setSalvo] = useState(false);

  const handleClose = () => {
    setFadeout(true);
    setTimeout(onClose, 300);
  };

  // Lista leve (id, nome, sigla, imagem), cacheada por bastante tempo
  const { data: clubes = [], isLoading } = useQuery<ClubeOpcao[]>({
    queryKey: ['clubes-opcoes'],
    queryFn: async () => {
      const response = await API.get('/clube/resumo');
      return response.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const clubeNovo = useMemo(
    () => clubes.find((c) => c.id === novoClubeId),
    [clubes, novoClubeId]
  );

  const clubesFiltrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return clubes.filter(
      (c) => c.nome.toLowerCase().includes(t) || (c.sigla ?? '').toLowerCase().includes(t)
    );
  }, [clubes, busca]);

  const mutation = useMutation({
    mutationFn: async (): Promise<ClubeAtualizado> => {
      const response = await API.patch(`/inscricao/${jogadorClubeId}/clube`, {
        clubeId: novoClubeId,
      });
      return response.data;
    },
    onSuccess: (atualizado) => {
      setSalvo(true);
      // Atualiza só a linha alterada no cache, sem refazer a busca inteira
      queryClient.setQueryData<LinhaInscrito[]>(['inscritos', temporadaId], (antigo) =>
        (antigo ?? []).map((item) =>
          item.id === atualizado.id
            ? {
                ...item,
                clubeId: atualizado.clubeId,
                clubeNome: atualizado.clubeNome,
                clubeSigla: atualizado.clubeSigla,
                clubeImagem: atualizado.clubeImagem,
              }
            : item
        )
      );
      handleClose();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErro(msg || 'Não foi possível atualizar o clube.');
    },
  });

  // Não dá para trocar A por A: sem escolha ou escolha igual ao atual bloqueia o salvar
  const semMudanca = !novoClubeId || novoClubeId === clubeAtualId;

  const salvar = () => {
    if (semMudanca || mutation.isPending || salvo) return;
    setErro('');
    mutation.mutate();
  };

  return (
    <div className={`pejc-overlay ${fadeout ? 'fade-out' : ''}`} onClick={handleClose}>
      <div className="pejc-content" onClick={(e) => e.stopPropagation()}>
        <button className="pejc-close-btn" onClick={handleClose} aria-label="Fechar">
          <X size={16} />
        </button>

        <div className="pejc-header">
          <div className="pejc-badge">
            <Shield size={30} />
          </div>
          <h2 className="pejc-title">Editar clube/seleção</h2>
          <p className="pejc-subtitle">
            Escolha o novo clube de <strong>{jogadorNome}</strong>
          </p>

          <div className="pejc-compare">
            <div className="pejc-compare-side">
              <img src={clubeAtualImagem} alt={clubeAtualNome} />
              <span>{clubeAtualNome}</span>
            </div>
            <ArrowRight size={20} className={`pejc-compare-arrow ${semMudanca ? '' : 'active'}`} />
            <div className={`pejc-compare-side ${clubeNovo ? 'novo' : 'muted'}`}>
              {clubeNovo ? (
                <img key={clubeNovo.id} src={clubeNovo.imagem} alt={clubeNovo.nome} />
              ) : (
                <div className="pejc-compare-ph" />
              )}
              <span>{clubeNovo ? clubeNovo.nome : 'Selecione um clube'}</span>
            </div>
          </div>
        </div>

        <div className="pejc-body">
          <div className="pejc-search-wrap">
            <Search size={16} />
            <input
              className="pejc-search"
              placeholder="Buscar clube ou seleção..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="pejc-list pejc-scroll">
            {isLoading ? (
              <div className="pejc-empty">
                <div className="pejc-spinner dark" />
                Carregando clubes...
              </div>
            ) : clubesFiltrados.length === 0 ? (
              <div className="pejc-empty">Nenhum clube encontrado</div>
            ) : (
              clubesFiltrados.map((c, i) => {
                const ehAtual = c.id === clubeAtualId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={ehAtual}
                    title={ehAtual ? 'Clube atual do jogador' : undefined}
                    className={`pejc-item ${c.id === novoClubeId ? 'selected' : ''} ${ehAtual ? 'atual' : ''}`}
                    style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
                    onClick={() => {
                      setNovoClubeId(c.id);
                      setErro('');
                    }}
                  >
                    <img src={c.imagem} alt={c.nome} loading="lazy" />
                    <span className="pejc-item-nome">{c.nome}</span>
                    {ehAtual && <em className="pejc-tag">atual</em>}
                    <small>{c.sigla}</small>
                    <span className="pejc-check">
                      <Check size={14} />
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {erro && (
            <div className="pejc-error">
              <AlertCircle size={16} /> {erro}
            </div>
          )}
        </div>

        <div className="pejc-footer">
          <button type="button" className="pejc-btn secondary" onClick={handleClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="pejc-btn primary"
            disabled={semMudanca || mutation.isPending || salvo}
            onClick={salvar}
          >
            {mutation.isPending ? <div className="pejc-spinner" /> : 'Salvar alteração'}
          </button>
        </div>
      </div>
    </div>
  );
}