import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  aplicarAdvertencia,
  buscarFichaAdvertencias,
  buscarHistoricoAdvertencias,
  cancelarAdvertencia,
  decidirRecurso,
  interporRecurso,
  listarRecursosPendentes,
} from '../services/advertenciaService';
import type { AplicarAdvertenciaPayload, DecidirRecursoPayload } from '../types/advertencia';

const TAMANHO_PAGINA = 15;
const STALE_TIME = 15_000;

export function useFichaAdvertencias(jogadorId: string | undefined) {
  return useQuery({
    queryKey: ['advertencias', 'ficha', jogadorId],
    queryFn: () => buscarFichaAdvertencias(jogadorId as string),
    enabled: !!jogadorId,
    staleTime: STALE_TIME,
  });
}

export function useHistoricoAdvertencias(jogadorId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['advertencias', 'historico', jogadorId],
    queryFn: ({ pageParam }) => buscarHistoricoAdvertencias(jogadorId as string, pageParam, TAMANHO_PAGINA),
    initialPageParam: 0,
    getNextPageParam: (ultimaPagina) => (ultimaPagina.last ? undefined : ultimaPagina.number + 1),
    enabled: !!jogadorId,
    staleTime: STALE_TIME,
  });
}

export function useRecursosPendentes(habilitado: boolean) {
  return useQuery({
    queryKey: ['advertencias', 'recursos'],
    queryFn: listarRecursosPendentes,
    enabled: habilitado,
    staleTime: STALE_TIME,
  });
}

export function useAplicarAdvertencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: { jogadorId: string; payload: AplicarAdvertenciaPayload }) =>
      aplicarAdvertencia(dados.jogadorId, dados.payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['advertencias'] }),
  });
}

export function useCancelarAdvertencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: { advertenciaId: string; motivo: string }) =>
      cancelarAdvertencia(dados.advertenciaId, dados.motivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['advertencias'] }),
  });
}

export function useInterporRecurso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: { advertenciaId: string; texto: string }) =>
      interporRecurso(dados.advertenciaId, dados.texto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['advertencias'] }),
  });
}

export function useDecidirRecurso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: { advertenciaId: string; payload: DecidirRecursoPayload }) =>
      decidirRecurso(dados.advertenciaId, dados.payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['advertencias'] }),
  });
}
