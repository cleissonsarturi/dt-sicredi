import { StatusSolicitacao } from './status-solicitacao.enum.js';

/**
 * Máquina de estados da solicitação.
 *
 *   ABERTA ──► EM_ANALISE ──► APROVADA
 *     │             └───────► REJEITADA
 *     └──► APROVADA | REJEITADA (decisão direta)
 *
 * APROVADA e REJEITADA são estados finais.
 */
const TRANSICOES_PERMITIDAS: Record<
  StatusSolicitacao,
  readonly StatusSolicitacao[]
> = {
  [StatusSolicitacao.ABERTA]: [
    StatusSolicitacao.EM_ANALISE,
    StatusSolicitacao.APROVADA,
    StatusSolicitacao.REJEITADA,
  ],
  [StatusSolicitacao.EM_ANALISE]: [
    StatusSolicitacao.APROVADA,
    StatusSolicitacao.REJEITADA,
  ],
  [StatusSolicitacao.APROVADA]: [],
  [StatusSolicitacao.REJEITADA]: [],
};

export function podeTransicionar(
  atual: StatusSolicitacao,
  proximo: StatusSolicitacao,
): boolean {
  return TRANSICOES_PERMITIDAS[atual].includes(proximo);
}

export function transicoesDisponiveis(
  atual: StatusSolicitacao,
): readonly StatusSolicitacao[] {
  return TRANSICOES_PERMITIDAS[atual];
}
