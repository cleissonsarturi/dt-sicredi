import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';

export interface UsuarioAutenticado {
  id: string;
  nome: string;
  email: string;
}

export interface PayloadToken {
  sub: string;
  nome: string;
  email: string;
}

export type RequestAutenticada = Request & { usuario?: UsuarioAutenticado };

export const ROTA_PUBLICA = 'rotaPublica';

export const Publico = () => SetMetadata(ROTA_PUBLICA, true);

export const UsuarioAtual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado =>
    ctx.switchToHttp().getRequest<RequestAutenticada>().usuario!,
);
