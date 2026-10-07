import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EventoIntegracao,
  StatusEventoIntegracao,
} from './entities/evento-integracao.entity.js';

@Injectable()
export class IntegracaoService {
  constructor(
    @InjectRepository(EventoIntegracao)
    private readonly eventos: Repository<EventoIntegracao>,
  ) {}

  listarPorSolicitacao(solicitacaoId: string): Promise<EventoIntegracao[]> {
    return this.eventos.find({
      where: { solicitacaoId },
      order: { criadoEm: 'DESC' },
    });
  }

  /** Recoloca na fila um evento que esgotou as tentativas automáticas. */
  async reprocessar(id: string): Promise<EventoIntegracao> {
    const evento = await this.eventos.findOneBy({ id });
    if (!evento) throw new NotFoundException(`Evento ${id} não encontrado`);
    if (evento.status !== StatusEventoIntegracao.FALHA) {
      throw new ConflictException(
        'Apenas eventos com status FALHA podem ser reprocessados',
      );
    }
    evento.status = StatusEventoIntegracao.PENDENTE;
    evento.tentativas = 0;
    evento.proximaTentativaEm = new Date();
    return this.eventos.save(evento);
  }
}
