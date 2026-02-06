import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { API } from '../services/api';
import PopupNotificacao from './PopupNotificacao';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  link: string;
  tipo: string;
  lida: boolean;
  dataCriacao: string;
}

interface BotaoNotificacaoProps {
  user: { id: string } | null;
}

const fetchMinhasNotificacoesService = async () => {
  const response = await API.get('/api/notificacoes/minhas');
  return response.data || [];
};

export function BotaoNotificacao({ user }: BotaoNotificacaoProps) {
  const [showPopup, setShowPopup] = useState(false);

  const { data: notificacoes = [] } = useQuery<Notificacao[]>({
    queryKey: ['notificacoesMinhas'],
    queryFn: fetchMinhasNotificacoesService,
    enabled: !!user,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 5 
  });

  const temNotificacaoNaoLida = useMemo(() => {
    return notificacoes.some(n => !n.lida);
  }, [notificacoes]);

  return (
    <>
      <button 
        className="icon-btn" 
        onClick={() => setShowPopup(true)}
        style={{ position: 'relative' }}
      >
          <Bell size={20} />
          {user && temNotificacaoNaoLida && (
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '8px',
              height: '8px',
              backgroundColor: '#ff4757',
              borderRadius: '50%',
              border: '1px solid var(--header-bg, #fff)'
            }}></span>
          )}
      </button>

      {showPopup && (
        <PopupNotificacao 
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
}