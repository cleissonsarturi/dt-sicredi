import type { ConfigService } from '@nestjs/config';
import type { DataSource } from 'typeorm';
import {
  type EventoIntegracao,
  StatusEventoIntegracao,
  TipoEventoIntegracao,
} from './entities/evento-integracao.entity.js';
import { IntegracaoWorker } from './integracao.worker.js';
import type { SistemaExternoClient } from './sistema-externo.client.js';

function evento(tentativas = 0): EventoIntegracao {
  return {
    id: 'evt-1',
    tipo: TipoEventoIntegracao.SOLICITACAO_APROVADA,
    solicitacaoId: 'sol-1',
    payload: {},
    status: StatusEventoIntegracao.PENDENTE,
    tentativas,
    proximaTentativaEm: new Date(),
    ultimoErro: null,
    enviadoEm: null,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };
}

describe('IntegracaoWorker', () => {
  let pendentes: EventoIntegracao[];
  let enviar: ReturnType<typeof vi.fn>;
  let worker: IntegracaoWorker;

  beforeEach(() => {
    pendentes = [];
    enviar = vi.fn();

    const qb = {
      where: () => qb,
      andWhere: () => qb,
      orderBy: () => qb,
      limit: () => qb,
      setLock: () => qb,
      setOnLocked: () => qb,
      getMany: async () => pendentes,
    };
    const manager = {
      getRepository: () => ({ createQueryBuilder: () => qb }),
      save: vi.fn(),
    };
    const dataSource = {
      transaction: (cb: (m: unknown) => unknown) => cb(manager),
    };
    const config = { get: (_k: string, padrao: unknown) => padrao };

    worker = new IntegracaoWorker(
      dataSource as unknown as DataSource,
      { enviar } as unknown as SistemaExternoClient,
      config as unknown as ConfigService,
    );
  });

  it('marca como ENVIADO quando a entrega funciona', async () => {
    const e = evento();
    pendentes.push(e);

    await expect(worker.processarPendentes()).resolves.toBe(1);

    expect(e.status).toBe(StatusEventoIntegracao.ENVIADO);
    expect(e.tentativas).toBe(1);
    expect(e.enviadoEm).toBeInstanceOf(Date);
  });

  it('reagenda com backoff quando a entrega falha', async () => {
    enviar.mockRejectedValue(new Error('HTTP 503'));
    const e = evento();
    pendentes.push(e);
    const antes = Date.now();

    await worker.processarPendentes();

    expect(e.status).toBe(StatusEventoIntegracao.PENDENTE);
    expect(e.ultimoErro).toBe('HTTP 503');
    expect(e.proximaTentativaEm.getTime()).toBeGreaterThanOrEqual(
      antes + 10_000,
    );
  });

  it('move para FALHA ao esgotar as tentativas', async () => {
    enviar.mockRejectedValue(new Error('timeout'));
    const e = evento(4); // padrão: 5 tentativas
    pendentes.push(e);

    await worker.processarPendentes();

    expect(e.status).toBe(StatusEventoIntegracao.FALHA);
    expect(e.tentativas).toBe(5);
  });
});
