import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Usuario } from '../../auth/entities/usuario.entity.js';
import { StatusSolicitacao } from '../domain/status-solicitacao.enum.js';
import { Solicitacao } from './solicitacao.entity.js';

/**
 * Trilha de auditoria das mudanças de status. Cada decisão (aprovação ou
 * rejeição) fica registrada aqui com o comentário e a data da atualização.
 */
@Entity({ name: 'historico_status' })
export class HistoricoStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'solicitacao_id', type: 'uuid' })
  solicitacaoId: string;

  @ManyToOne(() => Solicitacao, (solicitacao) => solicitacao.historico, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'solicitacao_id' })
  solicitacao?: Relation<Solicitacao>;

  @Column({
    name: 'status_anterior',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  statusAnterior: StatusSolicitacao | null;

  @Column({ name: 'status_novo', type: 'varchar', length: 20 })
  statusNovo: StatusSolicitacao;

  @Column({ type: 'text', nullable: true })
  comentario: string | null;

  /** Quem fez a mudança (nulo em registros anteriores à autenticação). */
  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario> | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;
}
