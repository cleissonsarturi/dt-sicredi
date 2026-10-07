import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Trim } from '../../common/validators/trim.transform.js';
import {
  isStatusFinal,
  StatusSolicitacao,
} from '../domain/status-solicitacao.enum.js';

const STATUS_DESTINO = [
  StatusSolicitacao.EM_ANALISE,
  StatusSolicitacao.APROVADA,
  StatusSolicitacao.REJEITADA,
];

export class AlterarStatusDto {
  @ApiProperty({ enum: STATUS_DESTINO, example: StatusSolicitacao.APROVADA })
  @IsIn(STATUS_DESTINO, {
    message: 'status deve ser EM_ANALISE, APROVADA ou REJEITADA',
  })
  status: StatusSolicitacao;

  @ApiPropertyOptional({
    example: 'Aprovado conforme política de acessos.',
    description:
      'Obrigatório para APROVADA ou REJEITADA (mínimo 5 caracteres).',
  })
  @ValidateIf(
    (dto: AlterarStatusDto) =>
      isStatusFinal(dto.status) || dto.comentario !== undefined,
  )
  @Trim()
  @IsString({ message: 'comentario é obrigatório para aprovar ou rejeitar' })
  @MinLength(5)
  @MaxLength(2000)
  comentario?: string;
}
