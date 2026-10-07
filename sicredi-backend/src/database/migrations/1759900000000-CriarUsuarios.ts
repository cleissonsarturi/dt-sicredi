import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Autenticação: tabela de usuários e registro de quem fez cada mudança de
 * status. A coluna no histórico é opcional porque os registros anteriores
 * à autenticação não têm autor; se o usuário for removido, o histórico fica.
 */
export class CriarUsuarios1759900000000 implements MigrationInterface {
  name = 'CriarUsuarios1759900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE usuarios (
        id          uuid         NOT NULL DEFAULT gen_random_uuid(),
        nome        varchar(120) NOT NULL,
        email       varchar(254) NOT NULL,
        senha_hash  varchar(255) NOT NULL,
        criado_em   timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT pk_usuarios PRIMARY KEY (id),
        CONSTRAINT uq_usuarios_email UNIQUE (email),
        CONSTRAINT ck_usuarios_email_minusculo CHECK (email = lower(email))
      )
    `);
    await queryRunner.query(`
      ALTER TABLE historico_status
        ADD COLUMN usuario_id uuid,
        ADD CONSTRAINT fk_historico_status_usuario FOREIGN KEY (usuario_id)
          REFERENCES usuarios (id) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE historico_status DROP COLUMN usuario_id`,
    );
    await queryRunner.query(`DROP TABLE usuarios`);
  }
}
