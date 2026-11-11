import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { buscarJogadoresRapido } from '../services/advertenciaService';
import type { JogadorBusca } from '../types/advertencia';

interface BuscaJogadorProps {
  onSelecionar: (jogador: JogadorBusca) => void;
  placeholder?: string;
}

const MINIMO_CARACTERES = 3;
const ATRASO_BUSCA_MS = 350;

export function BuscaJogador({ onSelecionar, placeholder = 'Buscar jogador (mín. 3 letras)' }: BuscaJogadorProps) {
  const [termo, setTermo] = useState('');
  const [termoDebounced, setTermoDebounced] = useState('');
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const temporizador = setTimeout(() => setTermoDebounced(termo.trim()), ATRASO_BUSCA_MS);
    return () => clearTimeout(temporizador);
  }, [termo]);

  const habilitado = termoDebounced.length >= MINIMO_CARACTERES;

  const { data: resultados = [], isFetching } = useQuery({
    queryKey: ['jogadores', 'busca-rapida', termoDebounced],
    queryFn: () => buscarJogadoresRapido(termoDebounced),
    enabled: habilitado,
    staleTime: 60_000,
  });

  function selecionar(jogador: JogadorBusca): void {
    onSelecionar(jogador);
    setTermo('');
    setTermoDebounced('');
    setAberto(false);
  }

  const mostrarLista = aberto && termo.trim().length >= MINIMO_CARACTERES;

  return (
    <div className="busca-jogador">
      <style>{`
        .busca-jogador {
          position: relative;
          width: 100%;
          max-width: 460px;
        }

        .busca-jogador-campo {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          background: var(--bg-card);
          color: var(--text-gray);
        }

        .busca-jogador-campo:focus-within {
          border-color: var(--primary);
        }

        .busca-jogador-campo input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          color: var(--text-dark);
          font-size: 0.95rem;
          font-family: inherit;
        }

        .busca-jogador-lista {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          box-shadow: var(--shadow-md);
          max-height: 280px;
          overflow-y: auto;
          z-index: 50;
        }

        .busca-jogador-item {
          display: flex;
          flex-direction: column;
          padding: 10px 14px;
          cursor: pointer;
          border-bottom: 1px solid var(--border-color);
        }

        .busca-jogador-item:last-child {
          border-bottom: none;
        }

        .busca-jogador-item:hover {
          background: rgba(128, 128, 128, 0.12);
        }

        .busca-jogador-nome {
          font-weight: 600;
          color: var(--text-dark);
          font-size: 0.95rem;
        }

        .busca-jogador-discord {
          font-size: 0.8rem;
          color: var(--text-gray);
        }

        .busca-jogador-vazio {
          padding: 12px 14px;
          font-size: 0.85rem;
          color: var(--text-gray);
        }
      `}</style>
      <div className="busca-jogador-campo">
        <Search size={18} />
        <input
          type="text"
          value={termo}
          placeholder={placeholder}
          onChange={(evento) => setTermo(evento.target.value)}
          onFocus={() => setAberto(true)}
          onBlur={() => setAberto(false)}
        />
      </div>
      {mostrarLista && (
        <div className="busca-jogador-lista">
          {resultados.map((jogador) => (
            <div
              key={jogador.id}
              className="busca-jogador-item"
              onMouseDown={(evento) => {
                evento.preventDefault();
                selecionar(jogador);
              }}
            >
              <span className="busca-jogador-nome">{jogador.nome}</span>
              {jogador.discord && <span className="busca-jogador-discord">{jogador.discord}</span>}
            </div>
          ))}
          {resultados.length === 0 && (
            <div className="busca-jogador-vazio">
              {isFetching || !habilitado ? 'Buscando...' : 'Nenhum jogador encontrado'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
