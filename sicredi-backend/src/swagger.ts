import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configurarSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('API de Solicitações Internas')
    .setDescription(
      'Cadastro, consulta, análise e indicadores de solicitações internas. ' +
        'Erros seguem o envelope { statusCode, erro, mensagens[], caminho, requestId, timestamp }. ' +
        'Autentique em POST /auth/login e use o token no botão Authorize.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, config),
  );
}
