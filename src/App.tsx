import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TorneiosPage } from './pages/TorneiosPage';
import { TelaJogadores } from './pages/TelaJogadores';
import { TelaClubes } from './pages/TelaClubes';
import { TelaCompeticoes } from './pages/TelaCompeticoes';
import { TelaMinhaConta } from './pages/TelaMinhaConta';
import { TelaAdmin } from './pages/TelaAdmin';
import { TelaPerfilJogador } from './pages/TelaPerfilJogador';
import { TelaTemporadas } from './pages/TelaTemporadas';
import { TelaTorneios } from './pages/TelaTorneios';
import { TelaTorneiosJogadores } from './pages/TelaTorneiosJogadores';
import { TelaTorneiosFases } from './pages/TelaTorneiosFases';
import { TelaFase } from './pages/TelaFase';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 6,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<TorneiosPage />} />
          <Route path="/jogadores" element={<TelaJogadores />} />
          <Route path="/clubes" element={<TelaClubes />} />
          <Route path="/competicoes" element={<TelaCompeticoes />} />
          <Route path="/minha-conta" element={<TelaMinhaConta />} />
          <Route path="/admin" element={<TelaAdmin />} />
          <Route path="/jogador/:id" element={<TelaPerfilJogador />} />
          <Route path="/temporadas" element={<TelaTemporadas />} />
          <Route path="/:temporadaId/torneios" element={<TelaTorneios />} />
          <Route path="/:temporadaId/torneios/jogadores" element={<TelaTorneiosJogadores />} />
          <Route path="/:temporadaId/:torneioId/fases" element={<TelaTorneiosFases />} />
          <Route path="/:temporadaId/torneio/:torneioId/fase/:faseId" element={<TelaFase />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;