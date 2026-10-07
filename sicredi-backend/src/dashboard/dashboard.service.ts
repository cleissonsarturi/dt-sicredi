import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prioridade } from '../solicitacoes/domain/prioridade.enum.js';
import { StatusSolicitacao } from '../solicitacoes/domain/status-solicitacao.enum.js';
import { Solicitacao } from '../solicitacoes/entities/solicitacao.entity.js';
import { ResumoDashboard } from './resumo-dashboard.response.js';

/** Inicializa um contador zerado para cada valor do enum. */
const zerado = <T extends string>(valores: T[]) =>
  Object.fromEntries(valores.map((v) => [v, 0])) as Record<T, number>;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Solicitacao)
    private readonly solicitacoes: Repository<Solicitacao>,
  ) {}

  async resumo(): Promise<ResumoDashboard> {
    const linhas: {
      status: string | null;
      prioridade: string | null;
      quantidade: string;
    }[] = await this.solicitacoes.query(`
        SELECT status, prioridade, COUNT(*) AS quantidade
          FROM solicitacoes
         GROUP BY GROUPING SETS ((status), (prioridade))
      `);

    const porStatus = zerado(Object.values(StatusSolicitacao));
    const porPrioridade = zerado(Object.values(Prioridade));

    for (const linha of linhas) {
      const quantidade = Number(linha.quantidade);
      if (linha.status)
        porStatus[linha.status as StatusSolicitacao] = quantidade;
      if (linha.prioridade)
        porPrioridade[linha.prioridade as Prioridade] = quantidade;
    }

    const total = Object.values(porStatus).reduce((soma, n) => soma + n, 0);
    return { total, porStatus, porPrioridade };
  }
}
