import { ApiProperty } from '@nestjs/swagger';

export class ResumoDashboard {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({
    example: { ABERTA: 10, EM_ANALISE: 5, APROVADA: 20, REJEITADA: 7 },
  })
  porStatus: Record<string, number>;

  @ApiProperty({ example: { BAIXA: 12, MEDIA: 18, ALTA: 12 } })
  porPrioridade: Record<string, number>;
}
