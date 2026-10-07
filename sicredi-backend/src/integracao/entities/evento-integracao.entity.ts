import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StatusEventoIntegracao {
  PENDENTE = 'PENDENTE',
  ENVIADO = 'ENVIADO',
  FALHA = 'FALHA',
}

export enum TipoEventoIntegracao {
  SOLICITACAO_APROVADA = 'SOLICITACAO_APROVADA',
}

/**
 * Outbox transacional: o evento é gravado na mesma transação da aprovação e
 * entregue ao sistema externo de forma assíncrona, com retentativas.
 * Não possui FK para a solicitação para preservar a trilha mesmo após exclusão.
 */
@Entity({ name: 'eventos_integracao' })
export class EventoIntegracao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tipo: TipoEventoIntegracao;

  @Column({ name: 'solicitacao_id', type: 'uuid' })
  solicitacaoId: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({
    type: 'varchar',
    length: 20,
    default: StatusEventoIntegracao.PENDENTE,
  })
  status: StatusEventoIntegracao;

  @Column({ type: 'int', default: 0 })
  tentativas: number;

  @Column({ name: 'proxima_tentativa_em', type: 'timestamptz' })
  proximaTentativaEm: Date;

  @Column({ name: 'ultimo_erro', type: 'text', nullable: true })
  ultimoErro: string | null;

  @Column({ name: 'enviado_em', type: 'timestamptz', nullable: true })
  enviadoEm: Date | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}
