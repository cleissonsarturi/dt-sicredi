export enum StatusSolicitacao {
  ABERTA = 'ABERTA',
  EM_ANALISE = 'EM_ANALISE',
  APROVADA = 'APROVADA',
  REJEITADA = 'REJEITADA',
}

/** Status que encerram o ciclo de vida da solicitação. */
export const STATUS_FINAIS: readonly StatusSolicitacao[] = [
  StatusSolicitacao.APROVADA,
  StatusSolicitacao.REJEITADA,
];

export const isStatusFinal = (status: StatusSolicitacao) =>
  STATUS_FINAIS.includes(status);
