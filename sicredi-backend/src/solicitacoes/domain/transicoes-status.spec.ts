import { StatusSolicitacao as S } from './status-solicitacao.enum.js';
import {
  podeTransicionar,
  transicoesDisponiveis,
} from './transicoes-status.js';

describe('transições de status', () => {
  it.each([
    [S.ABERTA, S.EM_ANALISE],
    [S.ABERTA, S.APROVADA],
    [S.ABERTA, S.REJEITADA],
    [S.EM_ANALISE, S.APROVADA],
    [S.EM_ANALISE, S.REJEITADA],
  ])('permite %s → %s', (de, para) => {
    expect(podeTransicionar(de, para)).toBe(true);
  });

  it.each([
    [S.ABERTA, S.ABERTA],
    [S.EM_ANALISE, S.ABERTA],
    [S.EM_ANALISE, S.EM_ANALISE],
    [S.APROVADA, S.REJEITADA],
    [S.REJEITADA, S.APROVADA],
    [S.APROVADA, S.EM_ANALISE],
  ])('bloqueia %s → %s', (de, para) => {
    expect(podeTransicionar(de, para)).toBe(false);
  });

  it('não oferece transições a partir de status finais', () => {
    expect(transicoesDisponiveis(S.APROVADA)).toEqual([]);
    expect(transicoesDisponiveis(S.REJEITADA)).toEqual([]);
  });
});
