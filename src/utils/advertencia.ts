import type { NivelAdvertencia, StatusAdvertencia } from '../types/advertencia';

export const NIVEIS: NivelAdvertencia[] = ['LEVE', 'MEDIA', 'GRAVE', 'GRAVISSIMA'];

export const ROTULO_NIVEL: Record<NivelAdvertencia, string> = {
  LEVE: 'Leve',
  MEDIA: 'Média',
  GRAVE: 'Grave',
  GRAVISSIMA: 'Gravíssima',
};

export const COR_NIVEL: Record<NivelAdvertencia, string> = {
  LEVE: '#ca8a04',
  MEDIA: '#ea580c',
  GRAVE: '#dc2626',
  GRAVISSIMA: '#7f1d1d',
};

export const MULTA_BASE: Record<NivelAdvertencia, number> = {
  LEVE: 1000,
  MEDIA: 3000,
  GRAVE: 5000,
  GRAVISSIMA: 7000,
};

export const VALIDADE_DIAS: Record<NivelAdvertencia, number> = {
  LEVE: 20,
  MEDIA: 20,
  GRAVE: 20,
  GRAVISSIMA: 40,
};

export const ROTULO_STATUS: Record<StatusAdvertencia, string> = {
  ATIVA: 'Ativa',
  CONSUMIDA: 'Consumida',
  CANCELADA: 'Cancelada',
};

const HORAS_PRAZO_RECURSO = 24;

export function ehSuperintendencia(cargo?: string): boolean {
  return cargo === 'DIRETOR' || cargo === 'PROPRIETARIO';
}

export function podeGerenciarNivel(cargo: string | undefined, nivel: NivelAdvertencia): boolean {
  if (nivel === 'GRAVISSIMA') {
    return cargo === 'PROPRIETARIO';
  }
  return ehSuperintendencia(cargo);
}

export function formatarMoeda(valor: number): string {
  return `${valor.toLocaleString('pt-BR')} D$`;
}

export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function recursoAindaAberto(dataOficializacao: string): boolean {
  const limite = new Date(dataOficializacao).getTime() + HORAS_PRAZO_RECURSO * 60 * 60 * 1000;
  return Date.now() < limite;
}

interface ErroHttp {
  response?: {
    status?: number;
    data?: { message?: string };
  };
}

export function extrairMensagemErro(erro: unknown): string {
  const resposta = (erro as ErroHttp | null)?.response;
  if (resposta?.data?.message) {
    return resposta.data.message;
  }
  switch (resposta?.status) {
    case 400:
      return 'Dados inválidos. Revise os campos e tente novamente.';
    case 403:
      return 'Seu cargo não tem permissão para esta ação.';
    case 404:
      return 'Registro não encontrado.';
    case 409:
      return 'Esta ação não é mais possível para esta advertência.';
    default:
      return 'Não foi possível concluir a ação. Tente novamente.';
  }
}
