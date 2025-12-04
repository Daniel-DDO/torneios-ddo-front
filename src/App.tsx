import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TorneiosPage } from './pages/TorneiosPage';
import { TelaJogadores } from './pages/TelaJogadores';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota principal (Dashboard/Torneios) */}
        <Route path="/" element={<TorneiosPage />} />

        {/* Rota de Jogadores */}
        <Route path="/jogadores" element={<TelaJogadores />} />
      </Routes>
    </Router>
  );
}

export default App;