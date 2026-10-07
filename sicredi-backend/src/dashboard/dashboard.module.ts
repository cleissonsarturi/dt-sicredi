import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Solicitacao } from '../solicitacoes/entities/solicitacao.entity.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Solicitacao])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
