export type NivelAdvertencia = 'LEVE' | 'MEDIA' | 'GRAVE' | 'GRAVISSIMA';
export type StatusAdvertencia = 'ATIVA' | 'CONSUMIDA' | 'CANCELADA';
export type ResultadoRecurso = 'ACOLHIDO' | 'REDUZIDO' | 'NEGADO';

export interface AdvertenciaPublica {
  id: string;
  data: string;
  fato: string;
  artigo: string;
  nivel: NivelAdvertencia;
  multa: number;
  multiplicador: number;
  fundamentacao: string | null;
  status: StatusAdvertencia;
  validaAte: string;
}

export interface ContagemNivel {
  nivel: NivelAdvertencia;
  ativas: number;
  limiteConversao: number;
}

export interface FichaAdvertencias {
  jogadorId: string;
  jogadorNome: string;
  emRegimeReincidencia: boolean;
  regimeReincidenciaAte: string | null;
  contagens: ContagemNivel[];
  advertenciasAtivas: AdvertenciaPublica[];
}

export interface PaginaAdvertencias {
  content: AdvertenciaPublica[];
  number: number;
  totalPages: number;
  last: boolean;
}

export interface AplicarAdvertenciaPayload {
  nivel: NivelAdvertencia;
  fato: string;
  artigo: string;
  multiplicador: number;
  fundamentacao?: string;
  partidasSuspensao?: number;
  diasSuspensao?: number;
}

export interface DecidirRecursoPayload {
  resultado: ResultadoRecurso;
  novoMultiplicador?: number;
  fundamentacao: string;
}

export interface RecursoPendente {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  nivel: NivelAdvertencia;
  fato: string;
  artigo: string;
  multiplicador: number;
  multaFinal: number;
  oficializadaEm: string;
  recursoTexto: string;
  recursoEm: string;
}

export interface JogadorBusca {
  id: string;
  nome: string;
  discord?: string;
}
