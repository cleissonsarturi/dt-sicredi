import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import {
  buildDataSourceOptions,
  type DatabaseEnv,
} from './config/database.config.js';
import { AuthModule } from './auth/auth.module.js';
import { validateEnv } from './config/env.validation.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { HealthController } from './health/health.controller.js';
import { IntegracaoModule } from './integracao/integracao.module.js';
import { SolicitacoesModule } from './solicitacoes/solicitacoes.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<DatabaseEnv, true>) =>
        buildDataSourceOptions({
          DB_HOST: config.get('DB_HOST'),
          DB_PORT: config.get('DB_PORT'),
          DB_USER: config.get('DB_USER'),
          DB_PASSWORD: config.get('DB_PASSWORD'),
          DB_NAME: config.get('DB_NAME'),
          DB_MIGRATIONS_RUN: config.get('DB_MIGRATIONS_RUN'),
        }),
    }),
    AuthModule,
    SolicitacoesModule,
    DashboardModule,
    IntegracaoModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
