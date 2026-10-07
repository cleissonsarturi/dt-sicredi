import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  type PayloadToken,
  type RequestAutenticada,
  ROTA_PUBLICA,
} from './usuario-autenticado.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (publica) return true;

    const request = context.switchToHttp().getRequest<RequestAutenticada>();
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Autenticação necessária');
    }

    try {
      const payload = await this.jwt.verifyAsync<PayloadToken>(token);
      request.usuario = {
        id: payload.sub,
        nome: payload.nome,
        email: payload.email,
      };
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }
    return true;
  }
}
