import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { RequestContext } from '../context/request-context.js';

export const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const recebido = req.header(REQUEST_ID_HEADER);
    const requestId =
      recebido && /^[\w-]{1,64}$/.test(recebido) ? recebido : randomUUID();
    const inicio = process.hrtime.bigint();

    res.setHeader(REQUEST_ID_HEADER, requestId);
    res.on('finish', () => {
      const duracaoMs = Number(process.hrtime.bigint() - inicio) / 1e6;
      const registro = {
        requestId,
        metodo: req.method,
        caminho: req.originalUrl,
        status: res.statusCode,
        duracaoMs: Math.round(duracaoMs * 10) / 10,
      };
      if (res.statusCode >= 500) this.logger.error(registro);
      else if (res.statusCode >= 400) this.logger.warn(registro);
      else this.logger.log(registro);
    });

    RequestContext.run({ requestId }, next);
  }
}
