import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { Prioridade } from '../domain/prioridade.enum.js';
import { StatusSolicitacao } from '../domain/status-solicitacao.enum.js';
import { HistoricoStatus } from './historico-status.entity.js';

@Entity({ name: 'solicitacoes' })
export class Solicitacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  titulo: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'varchar', length: 120 })
  solicitante: string;

  @Column({ name: 'area_solicitante', type: 'varchar', length: 100 })
  areaSolicitante: string;

  @Column({ type: 'varchar', length: 10 })
  prioridade: Prioridade;

  @Column({ type: 'varchar', length: 20, default: StatusSolicitacao.ABERTA })
  status: StatusSolicitacao;

  /** Data em que a solicitação foi feita (pode ser anterior ao cadastro). */
  @Column({ name: 'data_solicitacao', type: 'date' })
  dataSolicitacao: string;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;

  @OneToMany(() => HistoricoStatus, (historico) => historico.solicitacao)
  historico?: Relation<HistoricoStatus[]>;
}
