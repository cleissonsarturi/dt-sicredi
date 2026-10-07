import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe.js';
import { EventoIntegracao } from './entities/evento-integracao.entity.js';
import { IntegracaoService } from './integracao.service.js';

@ApiBearerAuth()
@ApiTags('Integrações')
@Controller()
export class IntegracaoController {
  constructor(private readonly integracao: IntegracaoService) {}

  @Get('solicitacoes/:id/integracoes')
  @ApiOperation({
    summary: 'Lista os eventos de integração de uma solicitação',
  })
  @ApiOkResponse({ description: 'Eventos do mais recente ao mais antigo' })
  listar(@Param('id', ParseIdPipe) id: string): Promise<EventoIntegracao[]> {
    return this.integracao.listarPorSolicitacao(id);
  }

  @Post('integracoes/eventos/:id/reprocessar')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reenfileira um evento que falhou definitivamente' })
  @ApiNotFoundResponse({ description: 'Evento não encontrado' })
  @ApiConflictResponse({ description: 'Evento não está com status FALHA' })
  reprocessar(@Param('id', ParseIdPipe) id: string): Promise<EventoIntegracao> {
    return this.integracao.reprocessar(id);
  }
}
