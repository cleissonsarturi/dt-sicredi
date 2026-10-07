import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { validationExceptionFactory } from '../../common/validators/validation-exception.factory.js';
import { AlterarStatusDto } from './alterar-status.dto.js';
import { CriarSolicitacaoDto } from './criar-solicitacao.dto.js';

async function mensagens<T extends object>(cls: new () => T, dados: object) {
  const erros = await validate(plainToInstance(cls, dados));
  if (erros.length === 0) return [];
  return validationExceptionFactory(erros).getResponse() as {
    message: string[];
  };
}

const valido = {
  titulo: 'Acesso ao sistema',
  descricao: 'Preciso de acesso',
  solicitante: 'Maria',
  areaSolicitante: 'Crédito',
  prioridade: 'ALTA',
};

describe('CriarSolicitacaoDto', () => {
  it('aceita um payload válido e remove espaços das extremidades', async () => {
    const dto = plainToInstance(CriarSolicitacaoDto, {
      ...valido,
      titulo: '  Título  ',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.titulo).toBe('Título');
  });

  it('informa campos obrigatórios ausentes com uma mensagem por campo', async () => {
    const r = await mensagens(CriarSolicitacaoDto, {});
    expect(r).toMatchObject({
      message: expect.arrayContaining([
        'titulo é obrigatório',
        'descricao é obrigatório',
        'prioridade deve ser BAIXA, MEDIA ou ALTA',
      ]),
    });
  });

  it('rejeita prioridade inválida e data futura', async () => {
    const r = await mensagens(CriarSolicitacaoDto, {
      ...valido,
      prioridade: 'URGENTE',
      dataSolicitacao: '2999-01-01',
    });
    expect(r).toMatchObject({
      message: [
        'prioridade deve ser BAIXA, MEDIA ou ALTA',
        'dataSolicitacao não pode ser uma data futura',
      ],
    });
  });

  it('rejeita data em formato inválido', async () => {
    const r = await mensagens(CriarSolicitacaoDto, {
      ...valido,
      dataSolicitacao: '29/09/2026',
    });
    expect(r).toMatchObject({
      message: ['dataSolicitacao deve estar no formato YYYY-MM-DD'],
    });
  });

  it('traduz limites de tamanho', async () => {
    const r = await mensagens(CriarSolicitacaoDto, { ...valido, titulo: 'ab' });
    expect(r).toMatchObject({
      message: ['titulo deve ter no mínimo 3 caracteres'],
    });
  });
});

describe('AlterarStatusDto', () => {
  it('exige comentário para aprovar ou rejeitar', async () => {
    for (const status of ['APROVADA', 'REJEITADA']) {
      const r = await mensagens(AlterarStatusDto, { status });
      expect(r).toMatchObject({
        message: ['comentario é obrigatório para aprovar ou rejeitar'],
      });
    }
  });

  it('não exige comentário para iniciar a análise', async () => {
    expect(await mensagens(AlterarStatusDto, { status: 'EM_ANALISE' })).toEqual(
      [],
    );
  });

  it('não permite voltar para ABERTA', async () => {
    const r = await mensagens(AlterarStatusDto, { status: 'ABERTA' });
    expect(r).toMatchObject({
      message: ['status deve ser EM_ANALISE, APROVADA ou REJEITADA'],
    });
  });
});
