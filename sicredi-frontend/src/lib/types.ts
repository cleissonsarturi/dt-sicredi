/* Contratos da API (espelham os DTOs de resposta do back-end). */

export const PRIORIDADES = ["BAIXA", "MEDIA", "ALTA"] as const;
export type Prioridade = (typeof PRIORIDADES)[number];

export const STATUS = ["ABERTA", "EM_ANALISE", "APROVADA", "REJEITADA"] as const;
export type Status = (typeof STATUS)[number];

export const STATUS_FINAIS: readonly Status[] = ["APROVADA", "REJEITADA"];

export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export interface RespostaLogin {
  accessToken: string;
  tipo: "Bearer";
  /** Validade do token em segundos. */
  expiraEm: number;
  usuario: Usuario;
}

export interface HistoricoStatus {
  id: string;
  statusAnterior: Status | null;
  statusNovo: Status;
  comentario: string | null;
  /** Quem fez a mudança (nulo em registros anteriores à autenticação). */
  usuario: Usuario | null;
  criadoEm: string;
}

export interface Solicitacao {
  id: string;
  titulo: string;
  descricao: string;
  solicitante: string;
  areaSolicitante: string;
  prioridade: Prioridade;
  status: Status;
  dataSolicitacao: string;
  criadoEm: string;
  atualizadoEm: string;
  historico?: HistoricoStatus[];
}

export interface Paginado<T> {
  dados: T[];
  paginacao: {
    pagina: number;
    tamanhoPagina: number;
    total: number;
    totalPaginas: number;
  };
}

export interface ResumoDashboard {
  total: number;
  porStatus: Record<Status, number>;
  porPrioridade: Record<Prioridade, number>;
}

export interface EventoIntegracao {
  id: string;
  tipo: string;
  status: "PENDENTE" | "ENVIADO" | "FALHA";
  tentativas: number;
  ultimoErro: string | null;
  enviadoEm: string | null;
  proximaTentativaEm: string;
  criadoEm: string;
}

export interface FiltrosSolicitacoes {
  busca?: string;
  status?: Status;
  prioridade?: Prioridade;
  ordem?: "asc" | "desc";
  pagina?: number;
  tamanhoPagina?: number;
}

/* Rótulos de exibição */

export const ROTULO_STATUS: Record<Status, string> = {
  ABERTA: "Aberta",
  EM_ANALISE: "Em análise",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
};

export const ROTULO_PRIORIDADE: Record<Prioridade, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};
