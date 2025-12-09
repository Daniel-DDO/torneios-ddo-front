import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TorneiosPage } from './pages/TorneiosPage';
import { TelaJogadores } from './pages/TelaJogadores';
import { TelaClubes } from './pages/TelaClubes';
import { TelaCompeticoes } from './pages/TelaCompeticoes';
import { TelaMinhaConta } from './pages/TelaMinhaConta';
import { TelaAdmin } from './pages/TelaAdmin';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TorneiosPage />} />

        <Route path="/jogadores" element={<TelaJogadores />} />
        <Route path="/clubes" element={<TelaClubes />} />
        <Route path="/competicoes" element={<TelaCompeticoes />} />
        <Route path="/minha-conta" element={<TelaMinhaConta />} />
        <Route path="/admin" element={<TelaAdmin />} />

      </Routes>
    </Router>
  );
}

export default App;