import type { ReactNode } from 'react';
import type { AdvertenciaPublica } from '../types/advertencia';
import {
  COR_NIVEL,
  ROTULO_NIVEL,
  ROTULO_STATUS,
  formatarDataHora,
  formatarMoeda,
} from '../utils/advertencia';

interface ListaAdvertenciasProps {
  advertencias: AdvertenciaPublica[];
  mensagemVazia: string;
  renderAcoes?: (advertencia: AdvertenciaPublica) => ReactNode;
}

export function ListaAdvertencias({ advertencias, mensagemVazia, renderAcoes }: ListaAdvertenciasProps) {
  return (
    <div className="lista-adv">
      <style>{`
        .lista-adv {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .lista-adv-vazia {
          padding: 20px;
          text-align: center;
          color: var(--text-gray);
          font-size: 0.9rem;
          border: 1px dashed var(--border-color);
          border-radius: var(--radius);
        }

        .lista-adv-item {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-left-width: 5px;
          border-radius: var(--radius);
          padding: 16px 18px;
        }

        .lista-adv-item.cancelada {
          opacity: 0.6;
        }

        .lista-adv-topo {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .lista-adv-nivel {
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .lista-adv-status {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          color: var(--text-gray);
        }

        .lista-adv-data {
          margin-left: auto;
          font-size: 0.8rem;
          color: var(--text-gray);
        }

        .lista-adv-fato {
          color: var(--text-dark);
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 8px;
          white-space: pre-wrap;
        }

        .lista-adv-fundamentacao {
          font-size: 0.85rem;
          color: var(--text-gray);
          margin-bottom: 8px;
          white-space: pre-wrap;
        }

        .lista-adv-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 18px;
          font-size: 0.82rem;
          color: var(--text-gray);
        }

        .lista-adv-meta strong {
          color: var(--text-dark);
        }

        .lista-adv-acoes {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
      {advertencias.length === 0 && <div className="lista-adv-vazia">{mensagemVazia}</div>}
      {advertencias.map((advertencia) => (
        <div
          key={advertencia.id}
          className={`lista-adv-item ${advertencia.status === 'CANCELADA' ? 'cancelada' : ''}`}
          style={{ borderLeftColor: COR_NIVEL[advertencia.nivel] }}
        >
          <div className="lista-adv-topo">
            <span className="lista-adv-nivel" style={{ background: COR_NIVEL[advertencia.nivel] }}>
              {ROTULO_NIVEL[advertencia.nivel]}
            </span>
            <span className="lista-adv-status">{ROTULO_STATUS[advertencia.status]}</span>
            <span className="lista-adv-data">{formatarDataHora(advertencia.data)}</span>
          </div>
          <div className="lista-adv-fato">{advertencia.fato}</div>
          {advertencia.fundamentacao && (
            <div className="lista-adv-fundamentacao">Fundamentação: {advertencia.fundamentacao}</div>
          )}
          <div className="lista-adv-meta">
            <span>
              Artigo: <strong>{advertencia.artigo}</strong>
            </span>
            <span>
              Multa: <strong>{formatarMoeda(advertencia.multa)}</strong>
              {advertencia.multiplicador > 1 ? ` (×${advertencia.multiplicador})` : ''}
            </span>
            <span>
              Válida até: <strong>{formatarDataHora(advertencia.validaAte)}</strong>
            </span>
          </div>
          {renderAcoes && <div className="lista-adv-acoes">{renderAcoes(advertencia)}</div>}
        </div>
      ))}
    </div>
  );
}
