import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../auth/usuario-autenticado.js';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe.js';
import { AlterarStatusDto } from './dto/alterar-status.dto.js';
import { AtualizarSolicitacaoDto } from './dto/atualizar-solicitacao.dto.js';
import { CriarSolicitacaoDto } from './dto/criar-solicitacao.dto.js';
import { ListarSolicitacoesQuery } from './dto/listar-solicitacoes.query.js';
import {
  SolicitacaoResponse,
  SolicitacoesPaginadasResponse,
} from './dto/solicitacao.response.js';
import { Solicitacao } from './entities/solicitacao.entity.js';
import { type Paginado, SolicitacoesService } from './solicitacoes.service.js';

@ApiBearerAuth()
@ApiTags('Solicitações')
@Controller('solicitacoes')
export class SolicitacoesController {
  constructor(private readonly service: SolicitacoesService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra uma solicitação (status inicial ABERTA)' })
  @ApiCreatedResponse({ type: SolicitacaoResponse })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  criar(
    @Body() dto: CriarSolicitacaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<Solicitacao> {
    return this.service.criar(dto, usuario);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista solicitações com busca, filtros, ordenação e paginação',
  })
  @ApiOkResponse({ type: SolicitacoesPaginadasResponse })
  listar(
    @Query() query: ListarSolicitacoesQuery,
  ): Promise<Paginado<Solicitacao>> {
    return this.service.listar(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulta uma solicitação com seu histórico de status',
  })
  @ApiOkResponse({ type: SolicitacaoResponse })
  @ApiNotFoundResponse({ description: 'Solicitação não encontrada' })
  buscar(@Param('id', ParseIdPipe) id: string): Promise<Solicitacao> {
    return this.service.buscarPorId(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados cadastrais de uma solicitação' })
  @ApiOkResponse({ type: SolicitacaoResponse })
  @ApiNotFoundResponse({ description: 'Solicitação não encontrada' })
  @ApiConflictResponse({ description: 'Solicitação já finalizada' })
  atualizar(
    @Param('id', ParseIdPipe) id: string,
    @Body() dto: AtualizarSolicitacaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<Solicitacao> {
    return this.service.atualizar(id, dto, usuario);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Altera o status (análise, aprovação ou rejeição)',
    description:
      'Transições: ABERTA → EM_ANALISE | APROVADA | REJEITADA; EM_ANALISE → APROVADA | REJEITADA. ' +
      'Aprovar ou rejeitar exige comentário. A aprovação dispara a integração com o sistema externo.',
  })
  @ApiOkResponse({ type: SolicitacaoResponse })
  @ApiNotFoundResponse({ description: 'Solicitação não encontrada' })
  @ApiConflictResponse({ description: 'Transição de status não permitida' })
  alterarStatus(
    @Param('id', ParseIdPipe) id: string,
    @Body() dto: AlterarStatusDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<Solicitacao> {
    return this.service.alterarStatus(id, dto, usuario);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui uma solicitação e seu histórico' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Solicitação não encontrada' })
  remover(
    @Param('id', ParseIdPipe) id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<void> {
    return this.service.remover(id, usuario);
  }
}
