import { useEffect, useRef, useState } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getActiveHttpBaseURL, getAllHttpBaseURLs } from '../services/api';

// Precisa bater com o registry.addEndpoint(...) do WebSocketConfig do back
const STOMP_PATH = '/ws-torneios';

export interface FeedItemDTO {
  idJogador: string;
  nomeJogador: string;
  idClube: string;
  nomeClube: string;
  imagemClube: string;
  valor: number;
  dataHora: string;
}

export interface LanceResumoDTO {
  clubeId: string;
  valorAtual: number;
  nomeJogadorGanhando: string;
  jogadorId: string;
}

interface LeilaoSocketHandlers {
  onFeed?: (item: FeedItemDTO) => void;
  onAtualizacoesLances?: (items: LanceResumoDTO[]) => void;
  onStatus?: (status: 'ABERTO' | 'FECHADO' | string) => void;
  onResultado?: (logs: string[]) => void;
}

/**
 * Conecta uma vez ao broker STOMP (/topic) e assina:
 * - /topic/leilao/status
 * - /topic/leilao/{leilaoId}/feed
 * - /topic/leilao/{leilaoId}/atualizacoes-lances
 * - /topic/leilao/{leilaoId}/resultado
 *
 * Segue o mesmo servidor ativo do axios (Render tem 2 instâncias com
 * failover) e, se a conexão cair, rotaciona pro outro na tentativa seguinte
 * — mesma lógica de shouldSwitchServer do api.ts, só que pro WS.
 */
export function useLeilaoSocket(leilaoId: string | null | undefined, handlers: LeilaoSocketHandlers) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const servers = getAllHttpBaseURLs();
    let serverIndex = servers.indexOf(getActiveHttpBaseURL());
    if (serverIndex < 0) serverIndex = 0;

    let deactivated = false;

    const client = new Client({
      webSocketFactory: () => {
        const url = `${servers[serverIndex]}${STOMP_PATH}`;
        return new SockJS(url) as any;
      },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      setConnected(true);

      client.subscribe('/topic/leilao/status', (msg: IMessage) => {
        handlersRef.current.onStatus?.(msg.body.replace(/"/g, ''));
      });

      if (leilaoId) {
        client.subscribe(`/topic/leilao/${leilaoId}/feed`, (msg: IMessage) => {
            try { handlersRef.current.onFeed?.(JSON.parse(msg.body)); } catch { /* payload inválido, ignora */ }
        });

        client.subscribe(`/topic/leilao/${leilaoId}/atualizacoes-lances`, (msg: IMessage) => {
            console.log('[WS] atualizacoes-lances recebido:', msg.body); // TEMP
            try { handlersRef.current.onAtualizacoesLances?.(JSON.parse(msg.body)); } catch { /* noop */ }
        });

        client.subscribe(`/topic/leilao/${leilaoId}/resultado`, (msg: IMessage) => {
            try { handlersRef.current.onResultado?.(JSON.parse(msg.body)); } catch { /* noop */ }
        });
      }
    };

    const handleDisconnect = () => {
      setConnected(false);
      if (deactivated) return;
      // próxima tentativa de reconexão (stompjs chama webSocketFactory de novo
      // sozinho por causa do reconnectDelay) já sobe no outro servidor
      serverIndex = (serverIndex + 1) % servers.length;
    };

    client.onWebSocketClose = handleDisconnect;
    client.onStompError = handleDisconnect;

    client.activate();

    return () => {
      deactivated = true;
      client.deactivate();
    };
  }, [leilaoId]);

  return { connected };
}