import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Estrutura inicial do banco.
 *
 * Os domínios (prioridade/status) usam VARCHAR + CHECK em vez de ENUM nativo
 * do PostgreSQL: incluir um novo valor passa a ser uma migration simples
 * (DROP/ADD CONSTRAINT) e não exige ALTER TYPE.
 */
export class CriarEstruturaInicial1759180000000 implements MigrationInterface {
  name = 'CriarEstruturaInicial1759180000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE solicitacoes (
        id                uuid         NOT NULL DEFAULT gen_random_uuid(),
        titulo            varchar(150) NOT NULL,
        descricao         text         NOT NULL,
        solicitante       varchar(120) NOT NULL,
        area_solicitante  varchar(100) NOT NULL,
        prioridade        varchar(10)  NOT NULL,
        status            varchar(20)  NOT NULL DEFAULT 'ABERTA',
        data_solicitacao  date         NOT NULL DEFAULT CURRENT_DATE,
        criado_em         timestamptz  NOT NULL DEFAULT now(),
        atualizado_em     timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT pk_solicitacoes PRIMARY KEY (id),
        CONSTRAINT ck_solicitacoes_prioridade CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA')),
        CONSTRAINT ck_solicitacoes_status CHECK (status IN ('ABERTA', 'EM_ANALISE', 'APROVADA', 'REJEITADA')),
        CONSTRAINT ck_solicitacoes_titulo CHECK (length(trim(titulo)) > 0)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX ix_solicitacoes_status ON solicitacoes (status)`,
    );
    await queryRunner.query(
      `CREATE INDEX ix_solicitacoes_prioridade ON solicitacoes (prioridade)`,
    );
    await queryRunner.query(
      `CREATE INDEX ix_solicitacoes_data ON solicitacoes (data_solicitacao DESC, criado_em DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE historico_status (
        id               uuid        NOT NULL DEFAULT gen_random_uuid(),
        solicitacao_id   uuid        NOT NULL,
        status_anterior  varchar(20),
        status_novo      varchar(20) NOT NULL,
        comentario       text,
        criado_em        timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_historico_status PRIMARY KEY (id),
        CONSTRAINT fk_historico_status_solicitacao FOREIGN KEY (solicitacao_id)
          REFERENCES solicitacoes (id) ON DELETE CASCADE,
        CONSTRAINT ck_historico_status_novo CHECK (status_novo IN ('ABERTA', 'EM_ANALISE', 'APROVADA', 'REJEITADA'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX ix_historico_status_solicitacao ON historico_status (solicitacao_id, criado_em)`,
    );

    await queryRunner.query(`
      CREATE TABLE eventos_integracao (
        id                    uuid        NOT NULL DEFAULT gen_random_uuid(),
        tipo                  varchar(50) NOT NULL,
        solicitacao_id        uuid        NOT NULL,
        payload               jsonb       NOT NULL,
        status                varchar(20) NOT NULL DEFAULT 'PENDENTE',
        tentativas            integer     NOT NULL DEFAULT 0,
        proxima_tentativa_em  timestamptz NOT NULL DEFAULT now(),
        ultimo_erro           text,
        enviado_em            timestamptz,
        criado_em             timestamptz NOT NULL DEFAULT now(),
        atualizado_em         timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_eventos_integracao PRIMARY KEY (id),
        CONSTRAINT ck_eventos_integracao_status CHECK (status IN ('PENDENTE', 'ENVIADO', 'FALHA')),
        CONSTRAINT ck_eventos_integracao_tentativas CHECK (tentativas >= 0)
      )
    `);
    // Índice parcial: o worker só consulta eventos ainda pendentes.
    await queryRunner.query(
      `CREATE INDEX ix_eventos_integracao_pendentes ON eventos_integracao (proxima_tentativa_em) WHERE status = 'PENDENTE'`,
    );
    await queryRunner.query(
      `CREATE INDEX ix_eventos_integracao_solicitacao ON eventos_integracao (solicitacao_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE eventos_integracao`);
    await queryRunner.query(`DROP TABLE historico_status`);
    await queryRunner.query(`DROP TABLE solicitacoes`);
  }
}
