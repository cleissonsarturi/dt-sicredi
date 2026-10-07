import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NaoFutura } from '../../common/validators/nao-futura.validator.js';
import { Trim } from '../../common/validators/trim.transform.js';
import { Prioridade } from '../domain/prioridade.enum.js';

export class CriarSolicitacaoDto {
  @ApiProperty({ example: 'Acesso ao sistema de crédito', maxLength: 150 })
  @Trim()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  titulo: string;

  @ApiProperty({
    example: 'Liberar perfil de consulta para o novo colaborador.',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  descricao: string;

  @ApiProperty({ example: 'Maria Souza', maxLength: 120 })
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  solicitante: string;

  @ApiProperty({ example: 'Operações', maxLength: 100 })
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  areaSolicitante: string;

  @ApiProperty({ enum: Prioridade, example: Prioridade.MEDIA })
  @IsEnum(Prioridade, { message: 'prioridade deve ser BAIXA, MEDIA ou ALTA' })
  prioridade: Prioridade;

  @ApiPropertyOptional({
    example: '2026-09-29',
    description: 'Data da solicitação (YYYY-MM-DD). Padrão: data atual.',
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: 'dataSolicitacao deve estar no formato YYYY-MM-DD',
  })
  @NaoFutura()
  dataSolicitacao?: string;
}
