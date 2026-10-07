import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../common/validators/trim.transform.js';
import { Prioridade } from '../domain/prioridade.enum.js';
import { StatusSolicitacao } from '../domain/status-solicitacao.enum.js';

export type Ordem = 'asc' | 'desc';

export class ListarSolicitacoesQuery {
  @ApiPropertyOptional({
    description: 'Busca por título, descrição, solicitante ou área',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  busca?: string;

  @ApiPropertyOptional({ enum: StatusSolicitacao })
  @IsOptional()
  @IsEnum(StatusSolicitacao)
  status?: StatusSolicitacao;

  @ApiPropertyOptional({ enum: Prioridade })
  @IsOptional()
  @IsEnum(Prioridade)
  prioridade?: Prioridade;

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Ordenação pela data da solicitação',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  ordem: Ordem = 'desc';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  tamanhoPagina: number = 10;
}
