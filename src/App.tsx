import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TorneiosPage } from './pages/TorneiosPage';
import { TelaJogadores } from './pages/TelaJogadores';
import { TelaClubes } from './pages/TelaClubes';
import { TelaCompeticoes } from './pages/TelaCompeticoes';
import { TelaMinhaConta } from './pages/TelaMinhaConta';
import { TelaAdmin } from './pages/TelaAdmin';
import { TelaPerfilJogador } from './pages/TelaPerfilJogador';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
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
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;