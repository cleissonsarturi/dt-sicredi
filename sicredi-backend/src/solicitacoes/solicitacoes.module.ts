import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegracaoModule } from '../integracao/integracao.module.js';
import { HistoricoStatus } from './entities/historico-status.entity.js';
import { Solicitacao } from './entities/solicitacao.entity.js';
import { SolicitacoesController } from './solicitacoes.controller.js';
import { SolicitacoesService } from './solicitacoes.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Solicitacao, HistoricoStatus]),
    IntegracaoModule,
  ],
  controllers: [SolicitacoesController],
  providers: [SolicitacoesService],
})
export class SolicitacoesModule {}
