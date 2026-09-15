import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Trophy,
  Shield,
  Target,
  Award,
  Percent,
  ShieldCheck,
  Swords,
  Flame,
  Zap,
  Landmark
} from 'lucide-react';
import { API } from '../services/api';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface RecordeJogador {
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string | null;
  valorFormatado: string;
  valorBruto: number;
}

interface RecordeTemporada {
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string | null;
  temporadaNome: string;
  valor: number;
  partidasJogadas: number;
}

interface TimeResumo {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorImagem: string | null;
  clubeId: string;
  clubeNome: string;
  clubeImagem: string | null;
  clubeSigla: string;
}

interface RecordePartida {
  partidaId: string;
  mandante: TimeResumo;
  visitante: TimeResumo;
  golsMandante: number;
  golsVisitante: number;
  dataHora: string;
  estadio: string | null;
}

interface RecordeClube {
  clubeId: string;
  clubeNome: string;
  clubeImagem: string | null;
  titulos: number;
}

interface HallDaFamaResponse {
  artilheiroMaximo: RecordeJogador[];
  maisTitulos: RecordeJogador[];
  maisFinais: RecordeJogador[];
  maisPartidas: RecordeJogador[];
  melhorAproveitamento: RecordeJogador | null;
  melhorAtaqueTemporada: RecordeTemporada[];
  melhorDefesaTemporada: RecordeTemporada[];
  partidaComMaisGols: RecordePartida[];
  maiorGoleada: RecordePartida[];
  clubeComMaisTitulos: RecordeClube[];
}

const fetchHallDaFamaService = async (): Promise<HallDaFamaResponse> => {
  const response = await API.get('/api/hall-da-fama');
  const data = (response && (response as any).data) ? (response as any).data : response;
  return data as HallDaFamaResponse;
};

export function TelaHallDaFama() {
  const { getAvatarUrl } = useAppContext();

  const { data: hallDaFama, isLoading: loading } = useQuery({
    queryKey: ['hall-da-fama'],
    queryFn: fetchHallDaFamaService,
    staleTime: 1000 * 60 * 10,
  });

  const resolveImagem = (imagem: string | null) => {
    return getAvatarUrl(imagem);
  };

  return (
    <DashboardLayout
      searchPlaceholder="Buscar jogador ou clube..."
      esconderBusca={false}
      contentStyle={{ padding: '1rem 2rem' }}
    >

      <LoadingSpinner isLoading={loading} />

      <style>{`
        .hof-page-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }

        .hof-page-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .hof-page-subtitle {
          font-size: 0.85rem;
          color: var(--text-gray);
          margin-top: 2px;
        }

        .hof-section {
          margin-bottom: 36px;
        }

        .hof-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 14px;
        }

        .hof-section-title svg {
          color: var(--primary);
        }

        .hof-empty {
          color: var(--text-gray);
          font-size: 0.9rem;
          padding: 12px 0;
        }

        /* ---- Lista de recordes (jogador / temporada / clube) ---- */
        .hof-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hof-row {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }

        .hof-row:hover {
          transform: translateX(4px);
          box-shadow: var(--shadow-sm);
          border-color: var(--primary);
        }

        .hof-row-rank {
          width: 26px;
          height: 26px;
          min-width: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #1e1e1e;
          font-weight: 700;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Avatar de jogador: foto, recorte circular */
        .hof-avatar-jogador {
          width: 52px;
          height: 52px;
          min-width: 52px;
          border-radius: 50%;
          flex-shrink: 0;
          overflow: hidden;
          background-color: var(--hover-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: var(--primary);
          font-size: 1rem;
          border: 2px solid var(--border-color);
        }

        .hof-avatar-jogador img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Avatar de clube: brasão, nunca cortado, sempre proporcional */
        .hof-avatar-clube {
          width: 52px;
          height: 52px;
          min-width: 52px;
          border-radius: 12px;
          flex-shrink: 0;
          background-color: var(--hover-bg);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: var(--primary);
          font-size: 0.9rem;
          padding: 6px;
        }

        .hof-avatar-clube img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .hof-row-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hof-row-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-dark);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hof-row-subtitle {
          font-size: 0.78rem;
          color: var(--text-gray);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hof-row-value-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
          text-align: right;
        }

        .hof-row-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--primary);
          white-space: nowrap;
        }

        .hof-row-value-label {
          font-size: 0.65rem;
          color: var(--text-gray);
          text-transform: uppercase;
        }

        /* ---- Cards de partida (mandante x visitante) ---- */
        .hof-match-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }

        .hof-match-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary);
        }

        .hof-match-team {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }

        .hof-match-logo {
          width: 52px;
          height: 52px;
          min-width: 52px;
          border-radius: 10px;
          background: var(--hover-bg);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
        }

        .hof-match-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .hof-match-player {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-dark);
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hof-match-club {
          font-size: 0.72rem;
          color: var(--text-gray);
        }

        .hof-match-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .hof-match-score-num {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
          white-space: nowrap;
        }

        .hof-match-meta {
          font-size: 0.7rem;
          color: var(--text-gray);
          text-align: center;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .hof-row { padding: 10px 14px; gap: 12px; }
          .hof-avatar-jogador, .hof-avatar-clube { width: 42px; height: 42px; min-width: 42px; font-size: 0.85rem; }
          .hof-row-rank { width: 22px; height: 22px; min-width: 22px; font-size: 0.68rem; }
          .hof-row-name { font-size: 0.88rem; }
          .hof-row-value { font-size: 0.95rem; }

          .hof-match-card { flex-direction: column; align-items: stretch; }
          .hof-match-team { flex-direction: row; justify-content: flex-start; }
          .hof-match-logo { width: 40px; height: 40px; min-width: 40px; }
          .hof-match-score { flex-direction: row; justify-content: space-between; }
        }
      `}</style>

      <div className="hof-page-header">
        <Landmark className="text-primary" size={22} />
        <div>
          <div className="hof-page-title">Hall da Fama</div>
          <div className="hof-page-subtitle">Os recordes históricos de todas as temporadas e torneios</div>
        </div>
      </div>

      {!loading && hallDaFama && (
        <>
          {/* Recordes individuais vitalícios */}
          <div className="hof-section">
            <div className="hof-section-title">
              <Target size={20} /> Artilheiro Máximo
            </div>
            <RecordeJogadorLista recordes={hallDaFama.artilheiroMaximo} resolveImagem={resolveImagem} />
          </div>

          <div className="hof-section">
            <div className="hof-section-title">
              <Trophy size={20} /> Maior Colecionador de Títulos
            </div>
            <RecordeJogadorLista recordes={hallDaFama.maisTitulos} resolveImagem={resolveImagem} />
          </div>

          <div className="hof-section">
            <div className="hof-section-title">
              <Award size={20} /> Mais Finais Disputadas
            </div>
            <RecordeJogadorLista recordes={hallDaFama.maisFinais} resolveImagem={resolveImagem} />
          </div>

          <div className="hof-section">
            <div className="hof-section-title">
              <Users size={20} /> Mais Partidas Disputadas
            </div>
            <RecordeJogadorLista recordes={hallDaFama.maisPartidas} resolveImagem={resolveImagem} />
          </div>

          {hallDaFama.melhorAproveitamento && (
            <div className="hof-section">
              <div className="hof-section-title">
                <Percent size={20} /> Melhor Aproveitamento
              </div>
              <RecordeJogadorLista recordes={[hallDaFama.melhorAproveitamento]} resolveImagem={resolveImagem} />
            </div>
          )}

          {/* Recordes por temporada */}
          <div className="hof-section">
            <div className="hof-section-title">
              <Swords size={20} /> Melhor Ataque numa Temporada
            </div>
            <RecordeTemporadaLista recordes={hallDaFama.melhorAtaqueTemporada} resolveImagem={resolveImagem} sufixo="gols" />
          </div>

          <div className="hof-section">
            <div className="hof-section-title">
              <ShieldCheck size={20} /> Melhor Defesa numa Temporada
            </div>
            <RecordeTemporadaLista recordes={hallDaFama.melhorDefesaTemporada} resolveImagem={resolveImagem} sufixo="gols sofridos" />
          </div>

          {/* Recordes de partida */}
          <div className="hof-section">
            <div className="hof-section-title">
              <Zap size={20} /> Partida com Mais Gols
            </div>
            <RecordePartidaLista recordes={hallDaFama.partidaComMaisGols} resolveImagem={resolveImagem} />
          </div>

          <div className="hof-section">
            <div className="hof-section-title">
              <Flame size={20} /> Maior Goleada da História
            </div>
            <RecordePartidaLista recordes={hallDaFama.maiorGoleada} resolveImagem={resolveImagem} />
          </div>

          {/* Recorde de clube */}
          <div className="hof-section">
            <div className="hof-section-title">
              <Shield size={20} /> Clube com Mais Títulos
            </div>
            {hallDaFama.clubeComMaisTitulos.length === 0 ? (
              <div className="hof-empty">Ainda sem dados suficientes.</div>
            ) : (
              <div className="hof-list">
                {hallDaFama.clubeComMaisTitulos.map((clube, index) => (
                  <HofListRow
                    key={clube.clubeId}
                    tipo="clube"
                    imagemUrl={resolveImagem(clube.clubeImagem)}
                    iniciais={clube.clubeNome.substring(0, 2).toUpperCase()}
                    nome={clube.clubeNome}
                    subtitulo="Clube"
                    valor={String(clube.titulos)}
                    valorLabel="Títulos"
                    rank={index + 1}
                    mostrarRank={hallDaFama.clubeComMaisTitulos.length > 1}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

    </DashboardLayout>
  );
}

// ---- Subcomponentes internos ----

function HofListRow({
  tipo = 'jogador',
  imagemUrl,
  iniciais,
  nome,
  subtitulo,
  valor,
  valorLabel,
  rank,
  mostrarRank,
}: {
  tipo?: 'jogador' | 'clube';
  imagemUrl: string | null;
  iniciais: string;
  nome: string;
  subtitulo: string;
  valor: string;
  valorLabel?: string;
  rank?: number;
  mostrarRank?: boolean;
}) {
  const avatarClass = tipo === 'clube' ? 'hof-avatar-clube' : 'hof-avatar-jogador';

  return (
    <div className="hof-row">
      {mostrarRank && <div className="hof-row-rank">#{rank}</div>}
      <div className={avatarClass}>
        {imagemUrl ? <img src={imagemUrl} alt={nome} /> : iniciais}
      </div>
      <div className="hof-row-info">
        <div className="hof-row-name">{nome}</div>
        <div className="hof-row-subtitle">{subtitulo}</div>
      </div>
      <div className="hof-row-value-wrap">
        <div className="hof-row-value">{valor}</div>
        {valorLabel && <div className="hof-row-value-label">{valorLabel}</div>}
      </div>
    </div>
  );
}

function RecordeJogadorLista({
  recordes,
  resolveImagem
}: {
  recordes: any[];
  resolveImagem: (img: string | null) => string | null;
}) {
  if (!recordes || recordes.length === 0) {
    return <div className="hof-empty">Ainda sem dados suficientes.</div>;
  }

  return (
    <div className="hof-list">
      {recordes.map((r, index) => (
        <HofListRow
          key={r.jogadorId}
          tipo="jogador"
          imagemUrl={resolveImagem(r.jogadorImagem)}
          iniciais={r.jogadorNome.substring(0, 2).toUpperCase()}
          nome={r.jogadorNome}
          subtitulo="Recorde histórico"
          valor={r.valorFormatado}
          rank={index + 1}
          mostrarRank={recordes.length > 1}
        />
      ))}
    </div>
  );
}

function RecordeTemporadaLista({
  recordes,
  resolveImagem,
  sufixo
}: {
  recordes: any[];
  resolveImagem: (img: string | null) => string | null;
  sufixo: string;
}) {
  if (!recordes || recordes.length === 0) {
    return <div className="hof-empty">Ainda sem dados suficientes.</div>;
  }

  return (
    <div className="hof-list">
      {recordes.map((r, index) => (
        <HofListRow
          key={`${r.jogadorId}-${r.temporadaNome}`}
          tipo="jogador"
          imagemUrl={resolveImagem(r.jogadorImagem)}
          iniciais={r.jogadorNome.substring(0, 2).toUpperCase()}
          nome={r.jogadorNome}
          subtitulo={`${r.temporadaNome} · ${r.partidasJogadas} partidas`}
          valor={String(r.valor)}
          valorLabel={sufixo}
          rank={index + 1}
          mostrarRank={recordes.length > 1}
        />
      ))}
    </div>
  );
}

function RecordePartidaLista({
  recordes,
  resolveImagem
}: {
  recordes: any[];
  resolveImagem: (img: string | null) => string | null;
}) {
  if (!recordes || recordes.length === 0) {
    return <div className="hof-empty">Ainda sem dados suficientes.</div>;
  }

  const formatarData = (dataString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date(dataString));
  };

  return (
    <div className="hof-list">
      {recordes.map((r) => {
        const logoMandante = resolveImagem(r.mandante.clubeImagem);
        const logoVisitante = resolveImagem(r.visitante.clubeImagem);
        return (
          <div key={r.partidaId} className="hof-match-card">
            <div className="hof-match-team">
              <div className="hof-match-logo">
                {logoMandante && <img src={logoMandante} alt={r.mandante.clubeNome} />}
              </div>
              <span className="hof-match-player">{r.mandante.jogadorNome}</span>
              <span className="hof-match-club">{r.mandante.clubeSigla}</span>
            </div>

            <div className="hof-match-score">
              <span className="hof-match-score-num">{r.golsMandante} × {r.golsVisitante}</span>
              <span className="hof-match-meta">
                {formatarData(r.dataHora)}{r.estadio ? ` · ${r.estadio}` : ''}
              </span>
            </div>

            <div className="hof-match-team">
              <div className="hof-match-logo">
                {logoVisitante && <img src={logoVisitante} alt={r.visitante.clubeNome} />}
              </div>
              <span className="hof-match-player">{r.visitante.jogadorNome}</span>
              <span className="hof-match-club">{r.visitante.clubeSigla}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}