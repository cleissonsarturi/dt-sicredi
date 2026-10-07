import dataSource from './data-source.js';
import { Prioridade } from '../solicitacoes/domain/prioridade.enum.js';
import { StatusSolicitacao } from '../solicitacoes/domain/status-solicitacao.enum.js';
import { HistoricoStatus } from '../solicitacoes/entities/historico-status.entity.js';
import { Solicitacao } from '../solicitacoes/entities/solicitacao.entity.js';

/**
 * Popula o banco com solicitações de exemplo para demonstração.
 * Só executa se a tabela estiver vazia (idempotente).
 */
type Exemplo = [
  titulo: string,
  area: string,
  solicitante: string,
  prioridade: Prioridade,
  status: StatusSolicitacao,
  diasAtras: number,
  comentario?: string,
];

const EXEMPLOS: Exemplo[] = [
  [
    'Acesso ao sistema de crédito rural',
    'Crédito',
    'Ana Paula Lima',
    Prioridade.ALTA,
    StatusSolicitacao.ABERTA,
    1,
  ],
  [
    'Novo notebook para analista',
    'Tecnologia',
    'Bruno Martins',
    Prioridade.MEDIA,
    StatusSolicitacao.EM_ANALISE,
    3,
  ],
  [
    'Ajuste no relatório mensal de inadimplência',
    'Riscos',
    'Carla Nunes',
    Prioridade.ALTA,
    StatusSolicitacao.APROVADA,
    6,
    'Aprovado: impacto direto no comitê de riscos.',
  ],
  [
    'Treinamento de LGPD para agências',
    'Compliance',
    'Diego Rocha',
    Prioridade.MEDIA,
    StatusSolicitacao.APROVADA,
    10,
    'Aprovado para o próximo trimestre.',
  ],
  [
    'Troca de mobiliário da sala de reuniões',
    'Administrativo',
    'Elisa Prado',
    Prioridade.BAIXA,
    StatusSolicitacao.REJEITADA,
    12,
    'Sem orçamento previsto neste ciclo.',
  ],
  [
    'Integração do CRM com a plataforma de cobrança',
    'Tecnologia',
    'Felipe Souza',
    Prioridade.ALTA,
    StatusSolicitacao.EM_ANALISE,
    2,
  ],
  [
    'Revisão da política de home office',
    'Pessoas',
    'Gabriela Costa',
    Prioridade.BAIXA,
    StatusSolicitacao.ABERTA,
    4,
  ],
  [
    'Licenças adicionais de BI',
    'Dados',
    'Henrique Alves',
    Prioridade.MEDIA,
    StatusSolicitacao.ABERTA,
    0,
  ],
  [
    'Campanha de consórcio para associados',
    'Marketing',
    'Isabela Freitas',
    Prioridade.MEDIA,
    StatusSolicitacao.REJEITADA,
    15,
    'Campanha semelhante já está em andamento.',
  ],
  [
    'Liberação de firewall para parceiro',
    'Segurança',
    'João Pedro Silva',
    Prioridade.ALTA,
    StatusSolicitacao.APROVADA,
    8,
    'Aprovado com restrição de IPs de origem.',
  ],
];

function diasAtras(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data.toISOString().slice(0, 10);
}

async function seed() {
  await dataSource.initialize();
  try {
    const existentes = await dataSource.getRepository(Solicitacao).count();
    if (existentes > 0) {
      console.log(`Seed ignorado: já existem ${existentes} solicitações.`);
      return;
    }

    await dataSource.transaction(async (manager) => {
      for (const [
        titulo,
        area,
        solicitante,
        prioridade,
        status,
        dias,
        comentario,
      ] of EXEMPLOS) {
        const solicitacao = await manager.save(
          manager.create(Solicitacao, {
            titulo,
            descricao: `${titulo}. Solicitação registrada para demonstração do protótipo.`,
            solicitante,
            areaSolicitante: area,
            prioridade,
            status,
            dataSolicitacao: diasAtras(dias),
          }),
        );

        const historico = [
          { de: null, para: StatusSolicitacao.ABERTA, comentario: null },
        ] as {
          de: StatusSolicitacao | null;
          para: StatusSolicitacao;
          comentario: string | null;
        }[];
        if (status !== StatusSolicitacao.ABERTA) {
          historico.push({
            de: StatusSolicitacao.ABERTA,
            para: status,
            comentario: comentario ?? null,
          });
        }

        for (const item of historico) {
          await manager.save(
            manager.create(HistoricoStatus, {
              solicitacaoId: solicitacao.id,
              statusAnterior: item.de,
              statusNovo: item.para,
              comentario: item.comentario,
            }),
          );
        }
      }
    });

    console.log(`Seed concluído: ${EXEMPLOS.length} solicitações criadas.`);
  } finally {
    await dataSource.destroy();
  }
}

await seed();
