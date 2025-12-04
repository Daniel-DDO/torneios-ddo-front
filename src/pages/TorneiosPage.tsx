import { useState, useEffect } from 'react'
import { API } from '../services/api'
import '../styles/TorneiosPage.css'

interface Torneio {
  id: number
  nome: string
  descricao: string
  status: 'em_andamento' | 'inscricoes_abertas' | 'finalizado'
  imagem?: string
  botao_texto?: string
  botao_acao?: string
}

interface Player {
  id: number
  nome: string
  pontos: number
  posicao: number
}

export function TorneiosPage() {
  const [torneios, setTorneios] = useState<Torneio[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)

      // Tenta carregar dados do backend
      // Ajuste os endpoints conforme sua API
      const [torneiosData, playersData] = await Promise.allSettled([
        API.get('/torneios'),
        API.get('/players'),
      ]).then((results) => [
        results[0].status === 'fulfilled' ? results[0].value : [],
        results[1].status === 'fulfilled' ? results[1].value : [],
      ])

      setTorneios(torneiosData)
      setPlayers(playersData)

      // Dados de fallback caso o backend não tenha dados
      if (!torneiosData || torneiosData.length === 0) {
        setTorneios(getDadosPadrao())
      }
      if (!playersData || playersData.length === 0) {
        setPlayers(getPlayersPadrao())
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      // Se falhar, usa dados padrão
      setTorneios(getDadosPadrao())
      setPlayers(getPlayersPadrao())
    } finally {
      setLoading(false)
    }
  }

  const getDadosPadrao = (): Torneio[] => [
    {
      id: 1,
      nome: 'Liga Real DDO',
      descricao: 'A liga de pontos corridos mais disputada da comunidade. Quem levará a taça?',
      status: 'em_andamento',
      imagem:
        'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Ver Tabela',
      botao_acao: '/liga',
    },
    {
      id: 2,
      nome: 'Copa das Nações DDO',
      descricao: 'Escolha sua seleção e represente suas cores. Formato mata-mata.',
      status: 'inscricoes_abertas',
      imagem:
        'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Inscrever-se',
      botao_acao: '/inscricao',
    },
    {
      id: 3,
      nome: 'Copa do Brasil DDO',
      descricao: 'O caminho para o título nacional. Jogos de ida e volta emocionantes.',
      status: 'em_andamento',
      imagem:
        'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Assistir Jogos',
      botao_acao: '/jogos',
    },
  ]

  const getPlayersPadrao = (): Player[] => [
    { id: 1, nome: 'Lúcio DDO', pontos: 2850, posicao: 1 },
    { id: 2, nome: 'Daniel DDO', pontos: 2720, posicao: 2 },
    { id: 3, nome: 'OLS DDO', pontos: 2680, posicao: 3 },
    { id: 4, nome: 'Segredo_0', pontos: 2590, posicao: 4 },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return 'status-live'
      case 'inscricoes_abertas':
        return 'status-open'
      case 'finalizado':
        return 'status-finished'
      default:
        return ''
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return 'Em Andamento'
      case 'inscricoes_abertas':
        return 'Inscrições Abertas'
      case 'finalizado':
        return 'Finalizado'
      default:
        return status
    }
  }

  const getRankClass = (posicao: number) => {
    switch (posicao) {
      case 1:
        return 'rank-1'
      case 2:
        return 'rank-2'
      case 3:
        return 'rank-3'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ textAlign: 'center', padding: '2rem', color: '#a0a0a0' }}>
          Carregando torneios...
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <header>
        <div className="logo">
          Torneios <span>DDO</span>
        </div>

        <nav>
          <ul className="nav-links">
            <li>
              <a href="#">Torneios</a>
            </li>
            <li>
              <a href="#">Ranking</a>
            </li>
            <li>
              <a href="#">Regras</a>
            </li>
          </ul>
        </nav>

        <a href="#" className="yt-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
          </svg>
          DDO
        </a>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>Grande Final Copa das Nações</h1>
          <span className="matchup">
            SEGREDO <span style={{ fontSize: '2rem', color: 'white', verticalAlign: 'middle', opacity: 0.7 }}>VS</span> ÍNDIO MALA
          </span>

          <div className="timer-box">
            <div className="timer-title">Domingo 07/12 - 20:00H</div>
            <div className="timer-display" id="countdown">
              00:00:00
            </div>
            <div className="timer-sub">Faltam 3 dias para o confronto</div>
          </div>
        </div>
      </section>

      <div className="container">
        <main>
          <div className="section-title">Torneios Ativos (PES 2017)</div>

          <div className="tournament-grid">
            {torneios.map((torneio) => (
              <div key={torneio.id} className="card">
                <div
                  className="card-img"
                  style={{ backgroundImage: `url('${torneio.imagem}')` }}
                >
                  <span className="game-tag">PES 2017</span>
                </div>
                <div className="card-body">
                  <span className={`status-badge ${getStatusBadge(torneio.status)}`}>
                    {getStatusLabel(torneio.status)}
                  </span>
                  <h3 className="card-title">{torneio.nome}</h3>
                  <p className="card-info">{torneio.descricao}</p>
                  <a href="#" className="btn">
                    {torneio.botao_texto || 'Ver Mais'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </main>

        <aside>
          <div className="section-title">Top Players DDO</div>
          <div className="ranking-box">
            <div className="rank-header">Rank Global</div>
            {players.map((player) => (
              <div key={player.id} className="rank-item">
                <span className={`rank-pos ${getRankClass(player.posicao)}`}>
                  {player.posicao}
                </span>
                <div className="rank-info">
                  <span className="player-name">{player.nome}</span>
                  <span className="player-pts">{player.pontos} pts</span>
                </div>
              </div>
            ))}

            <div style={{ padding: '15px', textAlign: 'center', borderTop: '1px solid #252836' }}>
              <a
                href="#"
                style={{
                  color: '#0079ff',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                Ver Ranking Completo →
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
