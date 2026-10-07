import type { DataSourceOptions } from 'typeorm';
import { Usuario } from '../auth/entities/usuario.entity.js';
import { EventoIntegracao } from '../integracao/entities/evento-integracao.entity.js';
import { HistoricoStatus } from '../solicitacoes/entities/historico-status.entity.js';
import { Solicitacao } from '../solicitacoes/entities/solicitacao.entity.js';
import { CriarEstruturaInicial1759180000000 } from '../database/migrations/1759180000000-CriarEstruturaInicial.js';
import { CriarUsuarios1759900000000 } from '../database/migrations/1759900000000-CriarUsuarios.js';

export interface DatabaseEnv {
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_MIGRATIONS_RUN?: boolean;
}

export const ENTITIES = [
  Usuario,
  Solicitacao,
  HistoricoStatus,
  EventoIntegracao,
];
export const MIGRATIONS = [
  CriarEstruturaInicial1759180000000,
  CriarUsuarios1759900000000,
];

export function buildDataSourceOptions(env: DatabaseEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    entities: ENTITIES,
    migrations: MIGRATIONS,
    migrationsRun: env.DB_MIGRATIONS_RUN ?? false,
    migrationsTableName: 'migrations',
    synchronize: false,
  };
}
