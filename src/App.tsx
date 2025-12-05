import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TorneiosPage } from './pages/TorneiosPage';
import { TelaJogadores } from './pages/TelaJogadores';
import { TelaClubes } from './pages/TelaClubes';
import { TelaCompeticoes } from './pages/TelaCompeticoes';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota principal (Dashboard/Torneios) */}
        <Route path="/" element={<TorneiosPage />} />

        <Route path="/jogadores" element={<TelaJogadores />} />
        <Route path="/clubes" element={<TelaClubes />} />
        <Route path="/competicoes" element={<TelaCompeticoes />} />

      </Routes>
    </Router>
  );
}

export default App;