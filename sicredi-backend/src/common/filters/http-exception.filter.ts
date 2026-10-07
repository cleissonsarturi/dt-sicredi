import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { RequestContext } from '../context/request-context.js';

export interface ErroResponse {
  statusCode: number;
  erro: string;
  mensagens: string[];
  caminho: string;
  requestId?: string;
  timestamp: string;
}

const ERROS_POSTGRES: Record<string, { status: HttpStatus; mensagem: string }> =
  {
    '23505': { status: HttpStatus.CONFLICT, mensagem: 'Registro duplicado' },
    '23503': {
      status: HttpStatus.CONFLICT,
      mensagem: 'Violação de integridade referencial',
    },
    '23514': {
      status: HttpStatus.BAD_REQUEST,
      mensagem: 'Valor fora do domínio permitido',
    },
    '22P02': {
      status: HttpStatus.BAD_REQUEST,
      mensagem: 'Formato de valor inválido',
    },
  };

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { status, mensagens } = this.resolver(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        {
          requestId: RequestContext.requestId,
          caminho: request.originalUrl,
          erro:
            exception instanceof Error ? exception.message : String(exception),
        },
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErroResponse = {
      statusCode: status,
      erro: HttpStatus[status] ?? 'ERROR',
      mensagens,
      caminho: request.originalUrl,
      requestId: RequestContext.requestId,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(body);
  }

  private resolver(exception: unknown): {
    status: number;
    mensagens: string[];
  } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : (res as { message?: string | string[] }).message;
      return {
        status: exception.getStatus(),
        mensagens: Array.isArray(message)
          ? message
          : [message ?? exception.message],
      };
    }

    if (exception instanceof QueryFailedError) {
      const code = (exception.driverError as { code?: string } | undefined)
        ?.code;
      const mapeado = code ? ERROS_POSTGRES[code] : undefined;
      if (mapeado)
        return { status: mapeado.status, mensagens: [mapeado.mensagem] };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      mensagens: ['Erro interno. Tente novamente mais tarde.'],
    };
  }
}
