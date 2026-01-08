import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Share2, Shield, Loader2, Trophy } from 'lucide-react';
import { API } from '../services/api';
import '../styles/TelaBracket.css';

interface TeamData {
  id: string;
  jogadorNome: string;
  clubeNome: string;
  clubeImagem: string;
  clubeSigla: string;
}

interface MatchRaw {
  id: string;
  etapaMataMata: string;
  chaveIndex: number;
  tipoPartida: 'MATA_MATA_IDA' | 'MATA_MATA_VOLTA' | 'MATA_MATA_UNICA';
  realizada: boolean;
  mandante: TeamData | null;
  visitante: TeamData | null;
  golsMandante: number | null;
  golsVisitante: number | null;
}

interface ProcessedMatch {
  chaveIndex: number;
  mandante: TeamData | null;
  visitante: TeamData | null;
  placarMandanteIda?: number | null;
  placarMandanteVolta?: number | null;
  placarVisitanteIda?: number | null;
  placarVisitanteVolta?: number | null;
  placarMandanteTotal: number | null;
  placarVisitanteTotal: number | null;
  vencedor?: 'mandante' | 'visitante';
  realizada: boolean;
  status: 'agendado' | 'em_andamento' | 'finalizado';
}

interface BracketData {
  [key: string]: MatchRaw[];
}

interface BracketResponse {
  estadioFinal: string;
  partidas: BracketData;
}

const STAGE_ORDER = [
  'SESSENTA_E_QUATRO_AVOS',
  'TRINTA_E_DOIS_AVOS',
  'DEZESSEIS_AVOS',
  'OITAVAS',
  'QUARTAS',
  'SEMIFINAL',
  'FINAL'
];

const STAGE_LABELS: Record<string, string> = {
  'SESSENTA_E_QUATRO_AVOS': '64 Avos',
  'TRINTA_E_DOIS_AVOS': '32 Avos',
  'DEZESSEIS_AVOS': '16 Avos',
  'OITAVAS': 'Oitavas',
  'QUARTAS': 'Quartas',
  'SEMIFINAL': 'Semifinal',
  'FINAL': 'Final'
};

export default function TelaBracket() {
  const { faseId } = useParams();
  const navigate = useNavigate();

  const { data: bracketInfo, isLoading } = useQuery<BracketResponse>({
    queryKey: ['bracket', faseId],
    queryFn: async () => {
      const response = await API.get(`/api/bracket/${faseId}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  });

  const processedStages = useMemo(() => {
    if (!bracketInfo?.partidas) return [];
    const data = bracketInfo.partidas;

    return STAGE_ORDER.filter(key => data[key] && data[key].length > 0)
      .map(key => {
        const matchesRaw = data[key];
        const matchesByChave: Record<number, ProcessedMatch> = {};

        matchesRaw.forEach(match => {
          if (!matchesByChave[match.chaveIndex]) {
            matchesByChave[match.chaveIndex] = {
              chaveIndex: match.chaveIndex,
              mandante: match.mandante,
              visitante: match.visitante,
              placarMandanteTotal: null,
              placarVisitanteTotal: null,
              realizada: false,
              status: 'agendado'
            };
          }

          const current = matchesByChave[match.chaveIndex];
          const isIda = match.tipoPartida === 'MATA_MATA_IDA';
          
          if (match.realizada || (match.golsMandante !== null && match.golsVisitante !== null)) {
            current.realizada = true;
            current.status = 'finalizado';
            
            const gm = match.golsMandante || 0;
            const gv = match.golsVisitante || 0;

            if (current.placarMandanteTotal === null) current.placarMandanteTotal = 0;
            if (current.placarVisitanteTotal === null) current.placarVisitanteTotal = 0;

            current.placarMandanteTotal += gm;
            current.placarVisitanteTotal += gv;

            if (isIda) {
              current.placarMandanteIda = gm;
              current.placarVisitanteIda = gv;
            } else {
              current.placarMandanteVolta = gm;
              current.placarVisitanteVolta = gv;
            }
          }
        });

        Object.values(matchesByChave).forEach(m => {
            if (m.realizada && m.placarMandanteTotal !== null && m.placarVisitanteTotal !== null) {
                if (m.placarMandanteTotal > m.placarVisitanteTotal) m.vencedor = 'mandante';
                else if (m.placarVisitanteTotal > m.placarMandanteTotal) m.vencedor = 'visitante';
            }
        });

        return {
          id: key,
          label: STAGE_LABELS[key] || key,
          matches: Object.values(matchesByChave).sort((a, b) => a.chaveIndex - b.chaveIndex)
        };
      });
  }, [bracketInfo]);

  const handleMatchClick = (etapa: string, chaveIndex: number) => {
    navigate(`${window.location.pathname}/${etapa}/${chaveIndex}`);
  };

  const renderConnector = (stageIndex: number, matchIndex: number) => {
    if (stageIndex === processedStages.length - 1) return null;

    const isEven = matchIndex % 2 === 0;
    
    return (
      <div className={`connector ${isEven ? 'connect-down' : 'connect-up'}`}>
        <div className="connector-line"></div>
      </div>
    );
  };

  const renderScore = (score: number | null | undefined, realizada: boolean) => {
    if (!realizada || score === null || score === undefined) return '-';
    return score;
  };

  const renderTeamRow = (
    team: TeamData | null, 
    totalScore: number | null, 
    isWinner: boolean, 
    realizada: boolean,
    scoreIda?: number | null, 
    scoreVolta?: number | null
  ) => {
    if (!team) {
      return (
        <div className="team-row">
          <div className="team-info">
            <div className="team-logo-placeholder">
                <Shield size={14} />
            </div>
            <span className="team-name waiting-text">Aguardando</span>
          </div>
          <div className="score-container">
            <span className="score-main">-</span>
          </div>
        </div>
      );
    }

    return (
      <div className={`team-row ${isWinner ? 'winner' : ''}`}>
        <div className="team-info">
          <img 
            src={team.clubeImagem} 
            alt={team.clubeNome} 
            className="team-logo" 
          />
          <span className="team-name">{team.jogadorNome}</span>
        </div>
        
        <div className="score-container">
            {(scoreIda !== undefined || scoreVolta !== undefined) && (
                <div className="score-details">
                    {scoreIda !== undefined && <span>{renderScore(scoreIda, realizada)}</span>}
                    {scoreVolta !== undefined && <span>{renderScore(scoreVolta, realizada)}</span>}
                </div>
            )}
            <span className="score-main">
                {renderScore(totalScore, realizada)}
            </span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 size={48} className="spinner" />
      </div>
    );
  }

  return (
    <div className="bracket-screen">
      <header className="bracket-header">
        <div className="header-actions">
          <button onClick={() => navigate(-1)} className="btn-back">
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>
        </div>
        
        <div className="header-title">
          <div className="road-to-label">
            <Trophy size={12} />
            ROAD TO
          </div>
          <div className="stadium-name">
            {bracketInfo?.estadioFinal || 'Grande Final'}
          </div>
        </div>

        <div className="header-actions">
           <button className="btn-back">
             <Share2 size={20} />
           </button>
        </div>
      </header>

      <div className="bracket-scroll-area">
        <div className="bracket-container">
          {processedStages.map((stage, stageIndex) => (
            <div key={stage.id} className="bracket-column">
              <div className="column-title">{stage.label}</div>
              {stage.matches.map((match, matchIndex) => (
                <div 
                  key={match.chaveIndex} 
                  className="match-wrapper" 
                  style={{ animationDelay: `${matchIndex * 0.1}s` }}
                >
                  <div 
                      className="match-card" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleMatchClick(stage.id, match.chaveIndex)}
                  >
                    {renderTeamRow(
                      match.mandante, 
                      match.placarMandanteTotal, 
                      match.vencedor === 'mandante',
                      match.realizada,
                      match.placarMandanteIda,
                      match.placarMandanteVolta
                    )}
                    {renderTeamRow(
                      match.visitante, 
                      match.placarVisitanteTotal, 
                      match.vencedor === 'visitante',
                      match.realizada,
                      match.placarVisitanteIda,
                      match.placarVisitanteVolta
                    )}
                  </div>
                  {renderConnector(stageIndex, matchIndex)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}