import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Gavel, ShieldAlert } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { ListaAdvertencias } from '../components/ListaAdvertencias';
import { PopupAdvertir } from '../components/PopupAdvertir';
import { PopupCancelarAdvertencia } from '../components/PopupCancelarAdvertencia';
import { PopupRecurso } from '../components/PopupRecurso';
import { useAppContext } from '../context/AppContext';
import { useFichaAdvertencias, useHistoricoAdvertencias } from '../hooks/useAdvertencias';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { AdvertenciaPublica } from '../types/advertencia';
import {
  COR_NIVEL,
  ROTULO_NIVEL,
  VALIDADE_DIAS,
  ehSuperintendencia,
  formatarDataHora,
  podeGerenciarNivel,
  recursoAindaAberto,
} from '../utils/advertencia';

export function TelaAdvertenciasJogador() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAppContext();
  const ficha = useFichaAdvertencias(id);
  const historico = useHistoricoAdvertencias(id);

  const [showAdvertir, setShowAdvertir] = useState(false);
  const [advertenciaCancelar, setAdvertenciaCancelar] = useState<AdvertenciaPublica | null>(null);
  const [advertenciaRecurso, setAdvertenciaRecurso] = useState<AdvertenciaPublica | null>(null);

  const ehProprioJogador = !!currentUser && currentUser.id === id;
  const superintendencia = ehSuperintendencia(currentUser?.cargo);

  if (ficha.isLoading) {
    return <LoadingSpinner isLoading={true} />;
  }

  if (ficha.isError || !ficha.data) {
    return (
      <DashboardLayout esconderBusca>
        <p style={{ color: 'var(--text-gray)' }}>Não foi possível carregar a ficha de advertências.</p>
      </DashboardLayout>
    );
  }

  const dadosFicha = ficha.data;
  const paginas = historico.data?.pages ?? [];
  const advertenciasHistorico = paginas.flatMap((pagina) => pagina.content);

  function renderAcoes(advertencia: AdvertenciaPublica) {
    const podeRecorrer =
      ehProprioJogador && advertencia.status !== 'CANCELADA' && recursoAindaAberto(advertencia.data);
    const podeDesfazer =
      superintendencia &&
      advertencia.status !== 'CANCELADA' &&
      podeGerenciarNivel(currentUser?.cargo, advertencia.nivel);

    if (!podeRecorrer && !podeDesfazer) {
      return null;
    }

    return (
      <>
        {podeRecorrer && (
          <button type="button" className="ficha-btn" onClick={() => setAdvertenciaRecurso(advertencia)}>
            Recorrer
          </button>
        )}
        {podeDesfazer && (
          <button
            type="button"
            className="ficha-btn ficha-btn-perigo"
            onClick={() => setAdvertenciaCancelar(advertencia)}
          >
            Desfazer
          </button>
        )}
      </>
    );
  }

  return (
    <DashboardLayout esconderBusca>
      <style>{`
        .ficha-topo {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .ficha-voltar {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-gray);
          font-size: 0.9rem;
          padding: 0;
          margin-bottom: 8px;
        }

        .ficha-titulo {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .ficha-subtitulo {
          color: var(--text-gray);
          font-size: 0.9rem;
        }

        .ficha-btn {
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

        .ficha-btn:hover {
          border-color: var(--primary);
        }

        .ficha-btn-primario {
          background: var(--primary);
          border-color: var(--primary);
          color: #fff;
        }

        .ficha-btn-perigo {
          color: #dc2626;
          border-color: #dc2626;
        }

        .ficha-regime {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border-radius: var(--radius);
          border: 1px solid #7f1d1d;
          background: rgba(127, 29, 29, 0.14);
          color: var(--text-dark);
          font-size: 0.92rem;
          margin-bottom: 1.5rem;
        }

        .ficha-contagens {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 2rem;
        }

        .ficha-contagem {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 16px;
        }

        .ficha-contagem-nivel {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .ficha-contagem-valor {
          font-size: 1.7rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 6px 0;
        }

        .ficha-contagem-detalhe {
          font-size: 0.78rem;
          color: var(--text-gray);
        }

        .ficha-barra {
          height: 6px;
          border-radius: 999px;
          background: var(--border-color);
          overflow: hidden;
          margin-bottom: 8px;
        }

        .ficha-barra-preenchida {
          height: 100%;
          border-radius: 999px;
        }

        .ficha-secao {
          margin-bottom: 2rem;
        }

        .ficha-secao h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 12px;
        }

        .ficha-mais {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }
      `}</style>

      <div className="ficha-topo">
        <div>
          <button type="button" className="ficha-voltar" onClick={() => navigate(`/jogador/${dadosFicha.jogadorId}`)}>
            <ArrowLeft size={16} /> Perfil do jogador
          </button>
          <h2 className="ficha-titulo">Advertências de {dadosFicha.jogadorNome}</h2>
          <p className="ficha-subtitulo">Ficha pública conforme o Art. 42 do regulamento.</p>
        </div>
        {superintendencia && (
          <button type="button" className="ficha-btn ficha-btn-primario" onClick={() => setShowAdvertir(true)}>
            <Gavel size={16} /> Advertir jogador
          </button>
        )}
      </div>

      {dadosFicha.emRegimeReincidencia && (
        <div className="ficha-regime">
          <ShieldAlert size={22} />
          <span>
            Em regime de reincidência até <strong>{formatarDataHora(dadosFicha.regimeReincidenciaAte)}</strong>.
            Nova advertência média, grave ou gravíssima gera suspensão imediata.
          </span>
        </div>
      )}

      <div className="ficha-contagens">
        {dadosFicha.contagens.map((contagem) => {
          const cor = COR_NIVEL[contagem.nivel];
          const converte = contagem.limiteConversao > 0;
          const percentual = converte ? Math.min(100, (contagem.ativas / contagem.limiteConversao) * 100) : 0;
          return (
            <div key={contagem.nivel} className="ficha-contagem" style={{ borderTop: `4px solid ${cor}` }}>
              <div className="ficha-contagem-nivel" style={{ color: cor }}>
                {ROTULO_NIVEL[contagem.nivel]}
              </div>
              <div className="ficha-contagem-valor">
                {converte ? `${contagem.ativas}/${contagem.limiteConversao}` : contagem.ativas}
              </div>
              {converte && (
                <div className="ficha-barra">
                  <div className="ficha-barra-preenchida" style={{ width: `${percentual}%`, background: cor }} />
                </div>
              )}
              <div className="ficha-contagem-detalhe">
                {converte
                  ? `${contagem.limiteConversao} ativas = 1 suspensão · valem ${VALIDADE_DIAS[contagem.nivel]} dias`
                  : `Ativas · valem ${VALIDADE_DIAS[contagem.nivel]} dias e iniciam o regime de reincidência`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="ficha-secao">
        <h3>Advertências ativas</h3>
        <ListaAdvertencias
          advertencias={dadosFicha.advertenciasAtivas}
          mensagemVazia="Nenhuma advertência ativa no momento."
          renderAcoes={renderAcoes}
        />
      </div>

      <div className="ficha-secao">
        <h3>Histórico completo</h3>
        {historico.isLoading ? (
          <LoadingSpinner isLoading={true} />
        ) : (
          <ListaAdvertencias
            advertencias={advertenciasHistorico}
            mensagemVazia="Este jogador nunca recebeu advertências."
            renderAcoes={renderAcoes}
          />
        )}
        {historico.hasNextPage && (
          <div className="ficha-mais">
            <button
              type="button"
              className="ficha-btn"
              onClick={() => historico.fetchNextPage()}
              disabled={historico.isFetchingNextPage}
            >
              {historico.isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
            </button>
          </div>
        )}
      </div>

      {showAdvertir && (
        <PopupAdvertir
          jogadorId={dadosFicha.jogadorId}
          jogadorNome={dadosFicha.jogadorNome}
          onClose={() => setShowAdvertir(false)}
        />
      )}

      {advertenciaCancelar && (
        <PopupCancelarAdvertencia advertencia={advertenciaCancelar} onClose={() => setAdvertenciaCancelar(null)} />
      )}

      {advertenciaRecurso && (
        <PopupRecurso advertencia={advertenciaRecurso} onClose={() => setAdvertenciaRecurso(null)} />
      )}
    </DashboardLayout>
  );
}
