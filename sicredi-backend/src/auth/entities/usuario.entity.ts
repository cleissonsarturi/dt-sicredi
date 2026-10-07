import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'usuarios' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({ type: 'varchar', length: 254, unique: true })
  email: string;

  @Column({ name: 'senha_hash', type: 'varchar', length: 255, select: false })
  senhaHash: string;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;
}
