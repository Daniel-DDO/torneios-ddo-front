import { API } from './api';
import type {
  AdvertenciaPublica,
  AplicarAdvertenciaPayload,
  DecidirRecursoPayload,
  FichaAdvertencias,
  JogadorBusca,
  PaginaAdvertencias,
  RecursoPendente,
} from '../types/advertencia';

export async function buscarJogadoresRapido(termo: string): Promise<JogadorBusca[]> {
  const resposta = await API.get('/jogador/busca-rapida', { params: { termo } });
  return resposta.data;
}

export async function buscarFichaAdvertencias(jogadorId: string): Promise<FichaAdvertencias> {
  const resposta = await API.get(`/players/${jogadorId}/warnings`);
  return resposta.data;
}

export async function buscarHistoricoAdvertencias(
  jogadorId: string,
  pagina: number,
  tamanho: number,
): Promise<PaginaAdvertencias> {
  const resposta = await API.get(`/players/${jogadorId}/warnings/history`, {
    params: { pagina, tamanho },
  });
  return resposta.data;
}

export async function aplicarAdvertencia(
  jogadorId: string,
  payload: AplicarAdvertenciaPayload,
): Promise<AdvertenciaPublica> {
  const resposta = await API.post(`/players/${jogadorId}/warnings`, payload);
  return resposta.data;
}

export async function cancelarAdvertencia(advertenciaId: string, motivo: string): Promise<AdvertenciaPublica> {
  const resposta = await API.post(`/warnings/${advertenciaId}/cancel`, { motivo });
  return resposta.data;
}

export async function interporRecurso(advertenciaId: string, texto: string): Promise<AdvertenciaPublica> {
  const resposta = await API.post(`/warnings/${advertenciaId}/appeal`, { texto });
  return resposta.data;
}

export async function decidirRecurso(
  advertenciaId: string,
  payload: DecidirRecursoPayload,
): Promise<AdvertenciaPublica> {
  const resposta = await API.post(`/warnings/${advertenciaId}/appeal/decision`, payload);
  return resposta.data;
}

export async function listarRecursosPendentes(): Promise<RecursoPendente[]> {
  const resposta = await API.get('/warnings/appeals/pending');
  return resposta.data;
}