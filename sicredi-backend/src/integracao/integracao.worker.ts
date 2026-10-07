import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { calcularBackoffMs } from './backoff.js';
import {
  EventoIntegracao,
  StatusEventoIntegracao,
} from './entities/evento-integracao.entity.js';
import { SistemaExternoClient } from './sistema-externo.client.js';

const LOTE = 10;

/**
 * Worker que entrega os eventos pendentes do outbox.
 *
 * Usa `FOR UPDATE SKIP LOCKED`, permitindo várias instâncias da API em
 * paralelo sem que o mesmo evento seja processado duas vezes. Falhas são
 * reagendadas com backoff exponencial; esgotadas as tentativas, o evento vai
 * para FALHA e pode ser reprocessado manualmente.
 */
@Injectable()
export class IntegracaoWorker
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(IntegracaoWorker.name);
  private timer?: NodeJS.Timeout;
  private executando = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly cliente: SistemaExternoClient,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    const intervalo = this.config.get<number>('INTEGRACAO_INTERVALO_MS', 5000);
    this.timer = setInterval(() => void this.processarPendentes(), intervalo);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  /** Processa um lote de eventos. Retorna quantos foram tratados. */
  async processarPendentes(): Promise<number> {
    if (this.executando) return 0;
    this.executando = true;
    try {
      return await this.dataSource.transaction(async (manager) => {
        const eventos = await manager
          .getRepository(EventoIntegracao)
          .createQueryBuilder('e')
          .where('e.status = :status', {
            status: StatusEventoIntegracao.PENDENTE,
          })
          .andWhere('e.proximaTentativaEm <= now()')
          .orderBy('e.criadoEm', 'ASC')
          .limit(LOTE)
          .setLock('pessimistic_write')
          .setOnLocked('skip_locked')
          .getMany();

        for (const evento of eventos) {
          await this.entregar(evento);
          await manager.save(evento);
        }
        return eventos.length;
      });
    } catch (erro) {
      this.logger.error({
        mensagem: 'Falha ao processar outbox',
        erro: String(erro),
      });
      return 0;
    } finally {
      this.executando = false;
    }
  }

  private async entregar(evento: EventoIntegracao): Promise<void> {
    const maxTentativas = this.config.get<number>(
      'INTEGRACAO_MAX_TENTATIVAS',
      5,
    );
    evento.tentativas += 1;

    try {
      await this.cliente.enviar(evento);
      evento.status = StatusEventoIntegracao.ENVIADO;
      evento.enviadoEm = new Date();
      evento.ultimoErro = null;
      this.logger.log({
        mensagem: 'Evento entregue',
        eventoId: evento.id,
        solicitacaoId: evento.solicitacaoId,
        tentativas: evento.tentativas,
      });
    } catch (erro) {
      evento.ultimoErro = erro instanceof Error ? erro.message : String(erro);
      const esgotou = evento.tentativas >= maxTentativas;
      evento.status = esgotou
        ? StatusEventoIntegracao.FALHA
        : StatusEventoIntegracao.PENDENTE;
      evento.proximaTentativaEm = new Date(
        Date.now() + calcularBackoffMs(evento.tentativas),
      );
      this.logger.warn({
        mensagem: esgotou
          ? 'Evento esgotou as tentativas'
          : 'Falha na entrega; reagendado',
        eventoId: evento.id,
        solicitacaoId: evento.solicitacaoId,
        tentativas: evento.tentativas,
        erro: evento.ultimoErro,
      });
    }
  }
}
