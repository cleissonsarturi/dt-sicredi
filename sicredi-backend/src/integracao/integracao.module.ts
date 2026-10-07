import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoIntegracao } from './entities/evento-integracao.entity.js';
import { IntegracaoController } from './integracao.controller.js';
import { IntegracaoService } from './integracao.service.js';
import { IntegracaoWorker } from './integracao.worker.js';
import { OutboxService } from './outbox.service.js';
import { SistemaExternoClient } from './sistema-externo.client.js';

@Module({
  imports: [TypeOrmModule.forFeature([EventoIntegracao])],
  controllers: [IntegracaoController],
  providers: [
    IntegracaoService,
    IntegracaoWorker,
    OutboxService,
    SistemaExternoClient,
  ],
  exports: [OutboxService, IntegracaoWorker],
})
export class IntegracaoModule {}
