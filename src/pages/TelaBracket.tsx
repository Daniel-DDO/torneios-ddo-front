import { useMemo, useLayoutEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Shield, Loader2, Trophy, AlertCircle, MapPin, Download } from 'lucide-react';
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
  tipoPartida: 'MATA_MATA_IDA' | 'MATA_MATA_VOLTA' | 'MATA_MATA_UNICA' | 'FINAL_IDA' | 'FINAL_VOLTA' | 'FINAL_UNICA';
  realizada: boolean;
  mandante: TeamData | null;
  visitante: TeamData | null;
  golsMandante: number | null;
  golsVisitante: number | null;
  placarAgregadoMandante: number | null;
  placarAgregadoVisitante: number | null;
  penaltisMandante: number | null;
  penaltisVisitante: number | null;
  houvePenaltis: boolean;
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
  penaltisMandante?: number | null;
  penaltisVisitante?: number | null;
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
  const [isDownloading, setIsDownloading] = useState(false);

  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  const { data: bracketInfo, isLoading, isError, refetch } = useQuery<BracketResponse>({
    queryKey: ['bracket', faseId],
    queryFn: async () => {
      const response = await API.get(`/api/bracket/${faseId}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 2
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
          
          const isIda = match.tipoPartida === 'MATA_MATA_IDA' || match.tipoPartida === 'FINAL_IDA';
          const isVolta = match.tipoPartida === 'MATA_MATA_VOLTA' || match.tipoPartida === 'FINAL_VOLTA';
          const isUnica = match.tipoPartida === 'MATA_MATA_UNICA' || match.tipoPartida === 'FINAL_UNICA';
          
          if (match.realizada || (match.golsMandante !== null && match.golsVisitante !== null)) {
            current.realizada = true;
            current.status = 'finalizado';
            
            const gm = match.golsMandante;
            const gv = match.golsVisitante;
            const isInverted = current.mandante?.id !== match.mandante?.id;

            if (isIda) {
              if (isInverted) {
                 current.placarMandanteIda = gv;
                 current.placarVisitanteIda = gm;
              } else {
                 current.placarMandanteIda = gm;
                 current.placarVisitanteIda = gv;
              }
            } 
            else if (isVolta) {
              if (isInverted) {
                 current.placarMandanteVolta = gv;
                 current.placarVisitanteVolta = gm;
              } else {
                 current.placarMandanteVolta = gm;
                 current.placarVisitanteVolta = gv;
              }
            }

            if (isVolta || isUnica) {
              if (isInverted) {
                  current.placarMandanteTotal = match.placarAgregadoVisitante;
                  current.placarVisitanteTotal = match.placarAgregadoMandante;
                  if (match.houvePenaltis) {
                    current.penaltisMandante = match.penaltisVisitante;
                    current.penaltisVisitante = match.penaltisMandante;
                  }
              } else {
                  current.placarMandanteTotal = match.placarAgregadoMandante;
                  current.placarVisitanteTotal = match.placarAgregadoVisitante;
                  if (match.houvePenaltis) {
                    current.penaltisMandante = match.penaltisMandante;
                    current.penaltisVisitante = match.penaltisVisitante;
                  }
              }
            } 
            else if (isIda && current.placarMandanteTotal === null) {
               if (isInverted) {
                  current.placarMandanteTotal = match.placarAgregadoVisitante;
                  current.placarVisitanteTotal = match.placarAgregadoMandante;
               } else {
                  current.placarMandanteTotal = match.placarAgregadoMandante;
                  current.placarVisitanteTotal = match.placarAgregadoVisitante;
               }
            }
          }
        });

        Object.values(matchesByChave).forEach(m => {
            if (m.realizada && m.placarMandanteTotal !== null && m.placarVisitanteTotal !== null) {
                if (m.placarMandanteTotal > m.placarVisitanteTotal) {
                  m.vencedor = 'mandante';
                } else if (m.placarVisitanteTotal > m.placarMandanteTotal) {
                  m.vencedor = 'visitante';
                } else {
                  const pm = m.penaltisMandante ?? -1;
                  const pv = m.penaltisVisitante ?? -1;
                  if (pm !== -1 && pv !== -1) {
                    if (pm > pv) m.vencedor = 'mandante';
                    else if (pv > pm) m.vencedor = 'visitante';
                  }
                }
            }
        });

        return {
          id: key,
          label: STAGE_LABELS[key] || key,
          matches: Object.values(matchesByChave).sort((a, b) => a.chaveIndex - b.chaveIndex)
        };
      });
  }, [bracketInfo]);

  const handleDownloadBracket = async () => {
    if (!processedStages.length || !bracketInfo) return;
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const width = 1920;
      const height = 1080;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not supported');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#001e4d'); 
      gradient.addColorStop(0.5, '#0047ba');
      gradient.addColorStop(1, '#000814');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 400, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      
      ctx.font = 'bold 30px Montserrat, Arial, sans-serif';
      ctx.fillText('ROAD TO', width / 2, 60);

      ctx.font = '900 60px Montserrat, Arial, sans-serif';
      const estadioNome = (bracketInfo.estadioFinal || 'GRANDE FINAL').toUpperCase();
      ctx.fillText(estadioNome, width / 2, 120);

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect((width / 2) - 100, 140, 200, 4);

      const loadImg = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => {
            const fallback = new Image();
            fallback.width = 1; 
            resolve(fallback);
          };
          img.src = src;
        });
      };

      const stagesCount = processedStages.length;
      const paddingX = 80;
      const startY = 200;
      const usableHeight = height - startY - 50;
      const colWidth = (width - (paddingX * 2)) / stagesCount;
      const cardWidth = 240;
      const cardHeight = 80;

      for (let sIndex = 0; sIndex < processedStages.length; sIndex++) {
        const stage = processedStages[sIndex];
        const x = paddingX + (sIndex * colWidth) + (colWidth / 2) - (cardWidth / 2);
        const matchesCount = stage.matches.length;
        const rowHeight = usableHeight / matchesCount;

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(stage.label.toUpperCase(), x + (cardWidth/2), startY - 20);

        for (let mIndex = 0; mIndex < stage.matches.length; mIndex++) {
          const match = stage.matches[mIndex];
          const y = startY + (mIndex * rowHeight) + (rowHeight / 2) - (cardHeight / 2);

          ctx.fillStyle = '#1e293b';
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 10;
          ctx.fillRect(x, y, cardWidth, cardHeight);
          ctx.shadowBlur = 0;

          ctx.strokeStyle = match.realizada ? '#fbbf24' : '#334155';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, cardWidth, cardHeight);

          const drawTeamRow = async (team: TeamData | null, score: number | null, isWinner: boolean, rowY: number, penaltis: number | null) => {
            if (isWinner) {
               ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
               ctx.fillRect(x + 2, rowY, cardWidth - 4, (cardHeight/2) - 2);
            }

            if (team && team.clubeImagem) {
              const img = await loadImg(team.clubeImagem);
              
              const maxDim = 28;
              const scale = Math.min(maxDim / img.width, maxDim / img.height);
              const w = img.width * scale;
              const h = img.height * scale;
              const offsetX = (maxDim - w) / 2;
              const offsetY = (maxDim - h) / 2;

              ctx.drawImage(img, x + 8 + offsetX, rowY + 6 + offsetY, w, h);
            } else {
               ctx.fillStyle = '#475569';
               ctx.beginPath();
               ctx.arc(x + 22, rowY + 20, 10, 0, Math.PI * 2);
               ctx.fill();
            }

            ctx.fillStyle = '#ffffff';
            ctx.font = isWinner ? 'bold 14px Arial' : '14px Arial';
            ctx.textAlign = 'left';
            const name = team ? (team.jogadorNome.length > 12 ? team.jogadorNome.substring(0,12)+'...' : team.jogadorNome) : 'Aguardando';
            ctx.fillText(name, x + 44, rowY + 26);

            if (match.realizada && score !== null) {
              ctx.fillStyle = isWinner ? '#fbbf24' : '#ffffff';
              ctx.font = 'bold 16px Arial';
              ctx.textAlign = 'right';
              
              let scoreText = score.toString();
              if (penaltis !== null && penaltis !== undefined) {
                 scoreText += ` (${penaltis})`;
                 ctx.font = 'bold 12px Arial';
              }
              
              ctx.fillText(scoreText, x + cardWidth - 10, rowY + 26);
            }
          };

          await drawTeamRow(
            match.mandante, 
            match.placarMandanteTotal, 
            match.vencedor === 'mandante',
            y + 1,
            match.penaltisMandante ?? null
          );

          ctx.fillStyle = '#334155';
          ctx.fillRect(x, y + (cardHeight/2), cardWidth, 1);

          await drawTeamRow(
            match.visitante, 
            match.placarVisitanteTotal, 
            match.vencedor === 'visitante',
            y + (cardHeight/2),
            match.penaltisVisitante ?? null
          );
        }
      }

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('Torneios DDO', width - 40, height - 30);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `bracket-${bracketInfo.estadioFinal.toLowerCase().replace(/\s/g, '-')}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
        setIsDownloading(false);
      }, 'image/png');

    } catch (err) {
      console.error(err);
      setIsDownloading(false);
      alert('Erro ao gerar a imagem.');
    }
  };

  const handleMatchClick = (etapa: string, chaveIndex: number) => {
    navigate(`${window.location.pathname}/${etapa}/${chaveIndex}`);
  };

  const renderConnector = (stageIndex: number, matchIndex: number) => {
    if (stageIndex === processedStages.length - 1) return null;
    const isEven = matchIndex % 2 === 0;
    return (
      <div className={`tb-connector ${isEven ? 'tb-connect-down' : 'tb-connect-up'}`}>
        <div className="tb-connector-line"></div>
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
    scoreVolta?: number | null,
    penaltis?: number | null
  ) => {
    if (!team) {
      return (
        <div className="tb-team-row">
          <div className="tb-team-info">
            <div className="tb-team-logo-placeholder">
                <Shield size={14} />
            </div>
            <span className="tb-team-name tb-waiting-text">Aguardando</span>
          </div>
          <div className="tb-score-container">
            <span className="tb-score-main">-</span>
          </div>
        </div>
      );
    }

    return (
      <div className={`tb-team-row ${isWinner ? 'tb-winner' : ''}`}>
        <div className="tb-team-info">
          <img 
            src={team.clubeImagem} 
            alt={team.clubeNome} 
            className="tb-team-logo" 
          />
          <span className="tb-team-name" title={team.jogadorNome}>{team.jogadorNome}</span>
        </div>
        
        <div className="tb-score-container">
            {(scoreIda !== undefined || scoreVolta !== undefined) && (
                <div className="tb-score-details">
                    {scoreIda !== undefined && <span>{renderScore(scoreIda, realizada)}</span>}
                    {scoreVolta !== undefined && <span>{renderScore(scoreVolta, realizada)}</span>}
                </div>
            )}
            <div className="tb-score-main-wrapper">
              <span className="tb-score-main">
                  {renderScore(totalScore, realizada)}
              </span>
              {penaltis !== undefined && penaltis !== null && (
                 <span className="tb-score-penalties">({penaltis})</span>
              )}
            </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="tb-screen">
        <div className="tb-loading-container">
          <Loader2 size={48} className="tb-spinner" />
          <span className="tb-loading-text">Carregando chaveamento...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="tb-screen">
        <div className="tb-error-container">
          <AlertCircle size={48} />
          <div className="tb-error-content">
            <h2>Não foi possível carregar o chaveamento</h2>
            <p>Verifique sua conexão e tente novamente.</p>
          </div>
          <button className="tb-btn-retry" onClick={() => refetch()}>
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tb-screen">
      <header className="tb-header">
        <div className="tb-header-left">
          <button onClick={() => navigate(-1)} className="tb-btn-icon-back">
            <ArrowLeft size={20} />
          </button>
        </div>
        
        <div className="tb-header-center">
          <div className="tb-road-badge">
            <Trophy size={14} />
            <span>ROAD TO</span>
          </div>
          <h1 className="tb-stadium-title">
            <MapPin size={20} className="tb-map-icon" />
            {bracketInfo?.estadioFinal || 'GRANDE FINAL'}
          </h1>
        </div>

        <div className="tb-header-right">
           <button 
             className="tb-btn-icon-share" 
             onClick={handleDownloadBracket}
             disabled={isDownloading}
             title="Baixar Bracket"
           >
             {isDownloading ? <Loader2 size={20} className="tb-spinner" /> : <Download size={20} />}
           </button>
        </div>
      </header>

      <div className="tb-scroll-area">
        <div className="tb-container">
          {processedStages.map((stage, stageIndex) => (
            <div key={stage.id} className="tb-column">
              <div className="tb-column-header">
                <span className="tb-stage-name">{stage.label}</span>
                <div className="tb-stage-indicator"></div>
              </div>
              
              <div className="tb-matches-list">
                {stage.matches.map((match, matchIndex) => (
                  <div 
                    key={match.chaveIndex} 
                    className="tb-match-wrapper"
                    style={{ animationDelay: `${stageIndex * 0.1 + matchIndex * 0.05}s` }}
                  >
                    <div 
                        className="tb-match-card" 
                        onClick={() => handleMatchClick(stage.id, match.chaveIndex)}
                    >
                      {renderTeamRow(
                        match.mandante, 
                        match.placarMandanteTotal, 
                        match.vencedor === 'mandante',
                        match.realizada,
                        match.placarMandanteIda,
                        match.placarMandanteVolta,
                        match.penaltisMandante ?? null
                      )}
                      {renderTeamRow(
                        match.visitante, 
                        match.placarVisitanteTotal, 
                        match.vencedor === 'visitante',
                        match.realizada,
                        match.placarVisitanteIda,
                        match.placarVisitanteVolta,
                        match.penaltisVisitante ?? null
                      )}
                    </div>
                    {renderConnector(stageIndex, matchIndex)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}