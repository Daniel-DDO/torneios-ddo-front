import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Gavel } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { BuscaJogador } from '../components/BuscaJogador';
import { PopupAdvertir } from '../components/PopupAdvertir';
import { PopupDecidirRecurso } from '../components/PopupDecidirRecurso';
import { useAppContext } from '../context/AppContext';
import { useRecursosPendentes } from '../hooks/useAdvertencias';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { JogadorBusca, RecursoPendente } from '../types/advertencia';
import {
  COR_NIVEL,
  ROTULO_NIVEL,
  ehSuperintendencia,
  formatarDataHora,
  formatarMoeda,
  podeGerenciarNivel,
} from '../utils/advertencia';

export function TelaAdvertenciasAdmin() {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAppContext();
  const permitido = ehSuperintendencia(currentUser?.cargo);
  const recursos = useRecursosPendentes(permitido);

  const [jogadorSelecionado, setJogadorSelecionado] = useState<JogadorBusca | null>(null);
  const [showAdvertir, setShowAdvertir] = useState(false);
  const [recursoDecidir, setRecursoDecidir] = useState<RecursoPendente | null>(null);

  if (!isAdmin) {
    return <LoadingSpinner isLoading={true} />;
  }

  if (!permitido) {
    return (
      <DashboardLayout esconderBusca>
        <p style={{ color: 'var(--text-gray)' }}>
          Esta área é restrita à Superintendência (diretores e proprietário).
        </p>
      </DashboardLayout>
    );
  }

  const listaRecursos = recursos.data ?? [];

  return (
    <DashboardLayout esconderBusca>
      <style>{`
        .adv-admin-titulo {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .adv-admin-subtitulo {
          color: var(--text-gray);
          font-size: 0.9rem;
          margin-bottom: 2rem;
        }

        .adv-admin-secao {
          margin-bottom: 2.5rem;
        }

        .adv-admin-secao h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 12px;
        }

        .adv-admin-selecionado {
          margin-top: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 16px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          max-width: 640px;
        }

        .adv-admin-selecionado strong {
          color: var(--text-dark);
          font-size: 1rem;
        }

        .adv-admin-selecionado span {
          display: block;
          color: var(--text-gray);
          font-size: 0.8rem;
        }

        .adv-admin-acoes {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .adv-admin-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-dark);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .adv-admin-btn:hover {
          border-color: var(--primary);
        }

        .adv-admin-btn-primario {
          background: var(--primary);
          border-color: var(--primary);
          color: #fff;
        }

        .adv-admin-recursos {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .adv-admin-recurso {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-left-width: 5px;
          border-radius: var(--radius);
          padding: 16px 18px;
        }

        .adv-admin-recurso-topo {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .adv-admin-recurso-nome {
          font-weight: 700;
          color: var(--text-dark);
        }

        .adv-admin-recurso-nivel {
          color: #fff;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          text-transform: uppercase;
        }

        .adv-admin-recurso-data {
          margin-left: auto;
          font-size: 0.8rem;
          color: var(--text-gray);
        }

        .adv-admin-recurso-texto {
          font-size: 0.9rem;
          color: var(--text-dark);
          line-height: 1.5;
          white-space: pre-wrap;
          margin-bottom: 4px;
        }

        .adv-admin-recurso-meta {
          font-size: 0.8rem;
          color: var(--text-gray);
          margin-bottom: 12px;
        }

        .adv-admin-vazio {
          padding: 20px;
          text-align: center;
          color: var(--text-gray);
          font-size: 0.9rem;
          border: 1px dashed var(--border-color);
          border-radius: var(--radius);
        }
      `}</style>

      <h2 className="adv-admin-titulo">Advertências</h2>
      <p className="adv-admin-subtitulo">Advirta jogadores e analise os recursos pendentes.</p>

      <div className="adv-admin-secao">
        <h3>Advertir jogador</h3>
        <BuscaJogador onSelecionar={setJogadorSelecionado} />

        {jogadorSelecionado && (
          <div className="adv-admin-selecionado">
            <div>
              <strong>{jogadorSelecionado.nome}</strong>
              {jogadorSelecionado.discord && <span>{jogadorSelecionado.discord}</span>}
            </div>
            <div className="adv-admin-acoes">
              <button
                type="button"
                className="adv-admin-btn"
                onClick={() => navigate(`/jogador/${jogadorSelecionado.id}/advertencias`)}
              >
                <FileText size={16} /> Ver ficha
              </button>
              <button
                type="button"
                className="adv-admin-btn adv-admin-btn-primario"
                onClick={() => setShowAdvertir(true)}
              >
                <Gavel size={16} /> Advertir
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="adv-admin-secao">
        <h3>Recursos pendentes ({listaRecursos.length})</h3>
        {recursos.isLoading && <LoadingSpinner isLoading={true} />}
        {!recursos.isLoading && listaRecursos.length === 0 && (
          <div className="adv-admin-vazio">Nenhum recurso aguardando decisão.</div>
        )}
        <div className="adv-admin-recursos">
          {listaRecursos.map((recurso) => {
            const podeDecidir = podeGerenciarNivel(currentUser?.cargo, recurso.nivel);
            return (
              <div
                key={recurso.id}
                className="adv-admin-recurso"
                style={{ borderLeftColor: COR_NIVEL[recurso.nivel] }}
              >
                <div className="adv-admin-recurso-topo">
                  <span className="adv-admin-recurso-nome">{recurso.jogadorNome}</span>
                  <span className="adv-admin-recurso-nivel" style={{ background: COR_NIVEL[recurso.nivel] }}>
                    {ROTULO_NIVEL[recurso.nivel]}
                  </span>
                  <span className="adv-admin-recurso-data">Recurso em {formatarDataHora(recurso.recursoEm)}</span>
                </div>
                <div className="adv-admin-recurso-texto">{recurso.recursoTexto}</div>
                <div className="adv-admin-recurso-meta">
                  {recurso.artigo} · multa {formatarMoeda(recurso.multaFinal)}
                  {recurso.multiplicador > 1 ? ` (×${recurso.multiplicador})` : ''}
                </div>
                <div className="adv-admin-acoes">
                  <button
                    type="button"
                    className="adv-admin-btn"
                    onClick={() => navigate(`/jogador/${recurso.jogadorId}/advertencias`)}
                  >
                    Ver ficha
                  </button>
                  {podeDecidir ? (
                    <button
                      type="button"
                      className="adv-admin-btn adv-admin-btn-primario"
                      onClick={() => setRecursoDecidir(recurso)}
                    >
                      Decidir
                    </button>
                  ) : (
                    <span className="adv-admin-recurso-meta">Só o proprietário decide recursos de gravíssima.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAdvertir && jogadorSelecionado && (
        <PopupAdvertir
          jogadorId={jogadorSelecionado.id}
          jogadorNome={jogadorSelecionado.nome}
          onClose={() => setShowAdvertir(false)}
        />
      )}

      {recursoDecidir && <PopupDecidirRecurso recurso={recursoDecidir} onClose={() => setRecursoDecidir(null)} />}
    </DashboardLayout>
  );
}
