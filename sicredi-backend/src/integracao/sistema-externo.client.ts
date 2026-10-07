import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EventoIntegracao } from './entities/evento-integracao.entity.js';

/**
 * Cliente HTTP do sistema corporativo externo.
 *
 * - Timeout explícito para não prender o worker.
 * - `Idempotency-Key` = id do evento: o receptor pode descartar duplicatas
 *   (a entrega é "at-least-once").
 * - Sem INTEGRACAO_URL configurada, opera em modo simulado (apenas log).
 */
@Injectable()
export class SistemaExternoClient {
  private readonly logger = new Logger(SistemaExternoClient.name);

  constructor(private readonly config: ConfigService) {}

  async enviar(evento: EventoIntegracao): Promise<void> {
    const url = this.config.get<string>('INTEGRACAO_URL');
    const timeoutMs = this.config.get<number>('INTEGRACAO_TIMEOUT_MS', 5000);
    const correlationId = String(evento.payload.correlationId ?? evento.id);

    if (!url) {
      this.logger.log({
        mensagem: 'Modo simulado: evento considerado entregue',
        eventoId: evento.id,
        tipo: evento.tipo,
        correlationId,
      });
      return;
    }

    const resposta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': evento.id,
        'X-Correlation-Id': correlationId,
        'X-Event-Type': evento.tipo,
      },
      body: JSON.stringify({
        id: evento.id,
        tipo: evento.tipo,
        ...evento.payload,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!resposta.ok) {
      throw new Error(`Sistema externo respondeu HTTP ${resposta.status}`);
    }
  }
}
