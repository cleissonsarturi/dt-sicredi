import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js';
import { hojeIso } from '../common/validators/nao-futura.validator.js';
import { OutboxService } from '../integracao/outbox.service.js';
import {
  isStatusFinal,
  StatusSolicitacao,
} from './domain/status-solicitacao.enum.js';
import { podeTransicionar } from './domain/transicoes-status.js';
import { AlterarStatusDto } from './dto/alterar-status.dto.js';
import { AtualizarSolicitacaoDto } from './dto/atualizar-solicitacao.dto.js';
import { CriarSolicitacaoDto } from './dto/criar-solicitacao.dto.js';
import { ListarSolicitacoesQuery } from './dto/listar-solicitacoes.query.js';
import { HistoricoStatus } from './entities/historico-status.entity.js';
import { Solicitacao } from './entities/solicitacao.entity.js';

export interface Paginado<T> {
  dados: T[];
  paginacao: {
    pagina: number;
    tamanhoPagina: number;
    total: number;
    totalPaginas: number;
  };
}

/** Escapa curingas do LIKE para que a busca seja literal. */
const escaparLike = (texto: string) => texto.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class SolicitacoesService {
  private readonly logger = new Logger(SolicitacoesService.name);

  constructor(
    @InjectRepository(Solicitacao)
    private readonly solicitacoes: Repository<Solicitacao>,
    private readonly dataSource: DataSource,
    private readonly outbox: OutboxService,
  ) {}

  async criar(
    dto: CriarSolicitacaoDto,
    usuario: UsuarioAutenticado,
  ): Promise<Solicitacao> {
    const criada = await this.dataSource.transaction(async (manager) => {
      const solicitacao = await manager.save(
        manager.create(Solicitacao, {
          ...dto,
          dataSolicitacao: dto.dataSolicitacao ?? hojeIso(),
          status: StatusSolicitacao.ABERTA,
        }),
      );
      await manager.save(
        manager.create(HistoricoStatus, {
          solicitacaoId: solicitacao.id,
          statusAnterior: null,
          statusNovo: StatusSolicitacao.ABERTA,
          comentario: null,
          usuarioId: usuario.id,
        }),
      );
      return solicitacao;
    });

    this.logger.log({
      mensagem: 'Solicitação criada',
      solicitacaoId: criada.id,
      usuarioId: usuario.id,
    });
    return criada;
  }

  async listar(query: ListarSolicitacoesQuery): Promise<Paginado<Solicitacao>> {
    const { busca, status, prioridade, ordem, pagina, tamanhoPagina } = query;
    const direcao = ordem === 'asc' ? 'ASC' : 'DESC';

    const qb = this.solicitacoes.createQueryBuilder('s');

    if (busca) {
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('s.titulo ILIKE :busca')
            .orWhere('s.descricao ILIKE :busca')
            .orWhere('s.solicitante ILIKE :busca')
            .orWhere('s.areaSolicitante ILIKE :busca'),
        ),
        { busca: `%${escaparLike(busca)}%` },
      );
    }
    if (status) qb.andWhere('s.status = :status', { status });
    if (prioridade) qb.andWhere('s.prioridade = :prioridade', { prioridade });

    const [dados, total] = await qb
      .orderBy('s.dataSolicitacao', direcao)
      .addOrderBy('s.criadoEm', direcao)
      .skip((pagina - 1) * tamanhoPagina)
      .take(tamanhoPagina)
      .getManyAndCount();

    return {
      dados,
      paginacao: {
        pagina,
        tamanhoPagina,
        total,
        totalPaginas: Math.ceil(total / tamanhoPagina),
      },
    };
  }

  async buscarPorId(id: string): Promise<Solicitacao> {
    const solicitacao = await this.solicitacoes.findOne({
      where: { id },
      relations: { historico: { usuario: true } },
      order: { historico: { criadoEm: 'ASC' } },
    });
    if (!solicitacao) {
      throw new NotFoundException(`Solicitação ${id} não encontrada`);
    }
    return solicitacao;
  }

  async atualizar(
    id: string,
    dto: AtualizarSolicitacaoDto,
    usuario: UsuarioAutenticado,
  ): Promise<Solicitacao> {
    const solicitacao = await this.buscarPorId(id);
    if (isStatusFinal(solicitacao.status)) {
      throw new ConflictException(
        `Solicitação ${solicitacao.status.toLowerCase()} não pode ser editada`,
      );
    }

    if (Object.keys(dto).length === 0) return solicitacao;

    // Condição no próprio UPDATE: se uma decisão concorrente finalizar a
    // solicitação entre a leitura e a escrita, nada é alterado.
    const { affected } = await this.solicitacoes.update(
      {
        id,
        status: In([StatusSolicitacao.ABERTA, StatusSolicitacao.EM_ANALISE]),
      },
      dto,
    );
    if (!affected) {
      throw new ConflictException(
        'Solicitação foi finalizada e não pode ser editada',
      );
    }
    this.logger.log({
      mensagem: 'Solicitação atualizada',
      solicitacaoId: id,
      usuarioId: usuario.id,
    });
    return this.buscarPorId(id);
  }

  /**
   * Altera o status respeitando a máquina de estados, registra o histórico
   * (comentário + data) e, na aprovação, grava o evento de integração no outbox
   * — tudo na mesma transação. O lock pessimista evita decisões concorrentes.
   */
  async alterarStatus(
    id: string,
    dto: AlterarStatusDto,
    usuario: UsuarioAutenticado,
  ): Promise<Solicitacao> {
    await this.dataSource.transaction(async (manager) => {
      const solicitacao = await manager.findOne(Solicitacao, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!solicitacao) {
        throw new NotFoundException(`Solicitação ${id} não encontrada`);
      }

      const anterior = solicitacao.status;
      if (!podeTransicionar(anterior, dto.status)) {
        throw new ConflictException(
          `Transição de ${anterior} para ${dto.status} não é permitida`,
        );
      }

      solicitacao.status = dto.status;
      await manager.save(solicitacao);
      await manager.save(
        manager.create(HistoricoStatus, {
          solicitacaoId: id,
          statusAnterior: anterior,
          statusNovo: dto.status,
          comentario: dto.comentario ?? null,
          usuarioId: usuario.id,
        }),
      );

      if (dto.status === StatusSolicitacao.APROVADA) {
        await this.outbox.registrarAprovacao(
          manager,
          solicitacao,
          dto.comentario ?? '',
        );
      }

      this.logger.log({
        mensagem: 'Status alterado',
        solicitacaoId: id,
        de: anterior,
        para: dto.status,
        usuarioId: usuario.id,
      });
    });

    return this.buscarPorId(id);
  }

  async remover(id: string, usuario: UsuarioAutenticado): Promise<void> {
    const { affected } = await this.solicitacoes.delete({ id });
    if (!affected) {
      throw new NotFoundException(`Solicitação ${id} não encontrada`);
    }
    this.logger.log({
      mensagem: 'Solicitação removida',
      solicitacaoId: id,
      usuarioId: usuario.id,
    });
  }
}
