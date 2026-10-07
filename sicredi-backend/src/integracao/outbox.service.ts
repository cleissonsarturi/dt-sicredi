import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { RequestContext } from '../common/context/request-context.js';
import type { Solicitacao } from '../solicitacoes/entities/solicitacao.entity.js';
import {
  EventoIntegracao,
  StatusEventoIntegracao,
  TipoEventoIntegracao,
} from './entities/evento-integracao.entity.js';

/**
 * Registra eventos de integração usando o EntityManager da transação corrente
 * (padrão Transactional Outbox): a aprovação e o evento são gravados de forma
 * atômica, então nenhum evento é perdido nem enviado sem a aprovação existir.
 */
@Injectable()
export class OutboxService {
  async registrarAprovacao(
    manager: EntityManager,
    solicitacao: Solicitacao,
    comentario: string,
  ): Promise<EventoIntegracao> {
    const repo = manager.getRepository(EventoIntegracao);
    return repo.save(
      repo.create({
        tipo: TipoEventoIntegracao.SOLICITACAO_APROVADA,
        solicitacaoId: solicitacao.id,
        status: StatusEventoIntegracao.PENDENTE,
        tentativas: 0,
        proximaTentativaEm: new Date(),
        payload: {
          correlationId: RequestContext.requestId ?? null,
          solicitacao: {
            id: solicitacao.id,
            titulo: solicitacao.titulo,
            solicitante: solicitacao.solicitante,
            areaSolicitante: solicitacao.areaSolicitante,
            prioridade: solicitacao.prioridade,
            dataSolicitacao: solicitacao.dataSolicitacao,
          },
          decisao: {
            status: solicitacao.status,
            comentario,
            decididaEm: new Date().toISOString(),
          },
        },
      }),
    );
  }
}
