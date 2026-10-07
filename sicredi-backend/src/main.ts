import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configurarApp } from './configurar-app.js';
import { configurarSwagger } from './swagger.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: process.env.NODE_ENV === 'production',
      colors: process.env.NODE_ENV !== 'production',
    }),
  });

  const config = app.get(ConfigService);
  configurarApp(app);
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', '').split(','),
    exposedHeaders: ['x-request-id'],
  });
  app.enableShutdownHooks();
  configurarSwagger(app);

  await app.listen(config.get<number>('PORT', 3001));
}
await bootstrap();
