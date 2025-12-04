import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TorneiosPage.css';

interface Torneio {
  id: number;
  nome: string;
  descricao: string;
  status: 'em_andamento' | 'inscricoes_abertas' | 'finalizado';
  imagem?: string;
  botao_texto?: string;
}

interface Player {
  id: number;
  nome: string;
  pontos: number;
  posicao: number;
}

const Icons = {
  Menu: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Dashboard: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Users: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Trophy: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17"></path><path d="M14 14.66V17"></path><path d="M12 2v1"></path><path d="M12 22v-3"></path><path d="M12 2a7 7 0 0 0-7 7c0 4.3 4 8 8 9a7 7 0 0 0 7-9 7 7 0 0 0-7-7z"></path></svg>,
  Shield: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  Calendar: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Wallet: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
  Settings: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Search: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Bell: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
};

export function TorneiosPage() {
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const torneios: Torneio[] = [
    {
      id: 1,
      nome: 'Liga Real DDO',
      descricao: 'A liga de pontos corridos mais disputada da comunidade.',
      status: 'em_andamento',
      imagem: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Ver Tabela',
    },
    {
      id: 2,
      nome: 'Copa das Nações',
      descricao: 'Escolha sua seleção e represente suas cores no mata-mata.',
      status: 'inscricoes_abertas',
      imagem: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Inscrever-se',
    },
    {
      id: 3,
      nome: 'Copa do Brasil',
      descricao: 'O caminho para o título nacional. Jogos de ida e volta.',
      status: 'em_andamento',
      imagem: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      botao_texto: 'Assistir Jogos',
    },
  ];

  const players: Player[] = [
    { id: 1, nome: 'Lúcio DDO', pontos: 2850, posicao: 1 },
    { id: 2, nome: 'Daniel DDO', pontos: 2720, posicao: 2 },
    { id: 3, nome: 'OLS DDO', pontos: 2680, posicao: 3 },
    { id: 4, nome: 'Segredo_0', pontos: 2590, posicao: 4 },
    { id: 5, nome: 'Índio Mala', pontos: 2400, posicao: 5 },
    { id: 6, nome: 'Deatch DDO', pontos: 2300, posicao: 6 },
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_andamento': return 'Ao Vivo';
      case 'inscricoes_abertas': return 'Aberto';
      case 'finalizado': return 'Fim';
      default: return status;
    }
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="logo-area">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
               <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/>
            </svg>
          </div>
          <span className="logo-text">Torneios <span>DDO</span></span>
        </div>

        <nav className="nav-menu">
          <a onClick={() => navigate('/')} className="nav-item active" style={{cursor: 'pointer'}}><Icons.Dashboard /> Dashboard</a>
          <a onClick={() => navigate('/jogadores')} className="nav-item" style={{cursor: 'pointer'}}><Icons.Users /> Jogadores</a>
          <a onClick={() => navigate('/clubes')} className="nav-item" style={{cursor: 'pointer'}}><Icons.Shield /> Clubes</a>
          <a href="#" className="nav-item"><Icons.Trophy /> Torneios</a>
          <a href="#" className="nav-item"><Icons.Shield /> Títulos</a>
          <div className="nav-separator"></div>
          <a href="#" className="nav-item"><Icons.Calendar /> Partidas</a>
          <a href="#" className="nav-item"><Icons.Wallet /> Minha conta</a>
          <a href="#" className="nav-item"><Icons.Settings /> Suporte</a>
        </nav>
      </aside>

      <main className="main-content">
        
        <header className="top-header compact">
          <div className="left-header">
            <button 
              className="toggle-btn menu-toggle" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Alternar Menu"
            >
              <Icons.Menu />
            </button>
            <div className="search-bar">
              <Icons.Search />
              <input type="text" placeholder="Buscar..." />
            </div>
          </div>
          
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
              💡
            </button>
            <button className="icon-btn"><Icons.Bell /></button>
            <div className="user-avatar-mini">A</div>
          </div>
        </header>

        <div className="hero-banner full-width-banner">
            <div className="hero-overlay"></div>
            <div className="hero-content">
            <span className="badge-live">Ao Vivo em Breve</span>
            <h2>Grande Final da Liga Real DDO</h2>
            <div className="matchup-text">
                LÚCIO <span className="vs">VS</span> DANIEL DDO
            </div>
            <div className="timer-pill">
                Domingo 07/12 - 19:00H
            </div>
            </div>
        </div>

        <div className="content-split">
          
          <div className="left-column">
            <div className="section-header">
              <h3>Torneios em Destaque</h3>
              <a href="#" className="view-all">Ver todos</a>
            </div>

            <div className="tournaments-list">
              {torneios.map(torneio => (
                <div key={torneio.id} className="tournament-row">
                  <div className="t-image" style={{backgroundImage: `url(${torneio.imagem})`}}></div>
                  <div className="t-info">
                    <h4>{torneio.nome}</h4>
                    <p>{torneio.descricao}</p>
                  </div>
                  <div className="t-status">
                     <span className={`status-pill ${torneio.status}`}>
                       {getStatusLabel(torneio.status)}
                     </span>
                  </div>
                  <button className="t-btn">{torneio.botao_texto}</button>
                </div>
              ))}
            </div>
          </div>

          <aside className="right-column">
            <div className="ranking-card">
              <div className="ranking-header">
                <h3>Top Players</h3>
                <span>Global</span>
              </div>
              
              <div className="leader-graph">
                 <div className="bar bar-2"><span>2</span></div>
                 <div className="bar bar-1"><span>1</span></div>
                 <div className="bar bar-3"><span>3</span></div>
              </div>

              <div className="players-list">
                {players.map((player) => (
                  <div key={player.id} className="player-row">
                    <div className="player-rank">#{player.posicao}</div>
                    <div className="player-avatar">
                      {player.nome.charAt(0)}
                    </div>
                    <div className="player-details">
                      <span className="p-name">{player.nome}</span>
                      <span className="p-location">Brasil</span>
                    </div>
                    <div className="player-points">
                      {player.pontos}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}