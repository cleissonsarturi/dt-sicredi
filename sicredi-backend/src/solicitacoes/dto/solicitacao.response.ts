import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UsuarioResponse } from '../../auth/dto/usuario.response.js';
import { Prioridade } from '../domain/prioridade.enum.js';
import { StatusSolicitacao } from '../domain/status-solicitacao.enum.js';

/* Contratos de saída documentados no Swagger. */

export class HistoricoStatusResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: StatusSolicitacao, nullable: true })
  statusAnterior: StatusSolicitacao | null;
  @ApiProperty({ enum: StatusSolicitacao }) statusNovo: StatusSolicitacao;
  @ApiProperty({ nullable: true, type: String }) comentario: string | null;
  @ApiProperty({
    type: UsuarioResponse,
    nullable: true,
    description:
      'Quem fez a mudança (nulo em registros anteriores à autenticação)',
  })
  usuario: UsuarioResponse | null;
  @ApiProperty() criadoEm: Date;
}

export class SolicitacaoResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() titulo: string;
  @ApiProperty() descricao: string;
  @ApiProperty() solicitante: string;
  @ApiProperty() areaSolicitante: string;
  @ApiProperty({ enum: Prioridade }) prioridade: Prioridade;
  @ApiProperty({ enum: StatusSolicitacao }) status: StatusSolicitacao;
  @ApiProperty({ example: '2026-09-29' }) dataSolicitacao: string;
  @ApiProperty() criadoEm: Date;
  @ApiProperty() atualizadoEm: Date;
  @ApiPropertyOptional({
    type: [HistoricoStatusResponse],
    description: 'Presente apenas na consulta por id',
  })
  historico?: HistoricoStatusResponse[];
}

export class PaginacaoResponse {
  @ApiProperty() pagina: number;
  @ApiProperty() tamanhoPagina: number;
  @ApiProperty() total: number;
  @ApiProperty() totalPaginas: number;
}

export class SolicitacoesPaginadasResponse {
  @ApiProperty({ type: [SolicitacaoResponse] }) dados: SolicitacaoResponse[];
  @ApiProperty({ type: PaginacaoResponse }) paginacao: PaginacaoResponse;
}
