import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

// Lê o valor bruto (obj[key]): a conversão implícita transformaria "false" em true.
const toBoolean = ({
  obj,
  key,
}: {
  obj: Record<string, unknown>;
  key: string;
}) => {
  const raw = obj[key];
  return raw === undefined
    ? undefined
    : raw === true || raw === 'true' || raw === '1';
};

export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:3000';

  @IsString()
  DB_HOST: string = 'localhost';

  @IsInt()
  DB_PORT: number = 5432;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  @Transform(toBoolean)
  @IsBoolean()
  DB_MIGRATIONS_RUN: boolean = true;

  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @IsUrl({ require_tld: false })
  INTEGRACAO_URL?: string;

  @IsInt()
  @Min(100)
  INTEGRACAO_TIMEOUT_MS: number = 5000;

  @IsInt()
  @Min(500)
  INTEGRACAO_INTERVALO_MS: number = 5000;

  @IsInt()
  @Min(1)
  INTEGRACAO_MAX_TENTATIVAS: number = 5;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET deve ter pelo menos 32 caracteres' })
  JWT_SECRET: string;

  @IsInt()
  @Min(60)
  JWT_EXPIRACAO_SEGUNDOS: number = 28800;

  // Usuário criado na inicialização quando a base não tem nenhum usuário.
  @IsOptional()
  @IsString()
  USUARIO_INICIAL_NOME?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @IsEmail()
  USUARIO_INICIAL_EMAIL?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @MinLength(8, {
    message: 'USUARIO_INICIAL_SENHA deve ter pelo menos 8 caracteres',
  })
  USUARIO_INICIAL_SENHA?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map(
        (e) =>
          `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`,
      )
      .join('; ');
    throw new Error(`Configuração de ambiente inválida — ${details}`);
  }

  return validated;
}
