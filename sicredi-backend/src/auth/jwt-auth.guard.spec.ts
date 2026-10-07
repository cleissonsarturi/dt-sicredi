import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { RequestAutenticada } from './usuario-autenticado.js';

const SEGREDO = 'segredo-de-teste-com-pelo-menos-32-caracteres';

function contexto(authorization?: string) {
  const request = { headers: { authorization } } as RequestAutenticada;
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: SEGREDO });
  let publica: boolean;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    publica = false;
    const reflector = { getAllAndOverride: () => publica };
    guard = new JwtAuthGuard(jwt, reflector as unknown as Reflector);
  });

  it('libera rotas marcadas como públicas sem token', async () => {
    publica = true;
    await expect(guard.canActivate(contexto().context)).resolves.toBe(true);
  });

  it('recusa requisição sem token', async () => {
    await expect(guard.canActivate(contexto().context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('recusa esquema diferente de Bearer', async () => {
    const token = await jwt.signAsync({ sub: 'u1' });
    await expect(
      guard.canActivate(contexto(`Basic ${token}`).context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('recusa token assinado com outro segredo', async () => {
    const falso = await new JwtService({
      secret: 'outro-segredo-com-pelo-menos-32-caracteres!!',
    }).signAsync({ sub: 'u1' });
    await expect(
      guard.canActivate(contexto(`Bearer ${falso}`).context),
    ).rejects.toThrow('Sessão inválida ou expirada');
  });

  it('recusa token expirado', async () => {
    const expirado = await jwt.signAsync({
      sub: 'u1',
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    await expect(
      guard.canActivate(contexto(`Bearer ${expirado}`).context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('aceita token válido e anexa o usuário à requisição', async () => {
    const token = await jwt.signAsync({
      sub: 'u1',
      nome: 'Ana',
      email: 'ana@sicredi.local',
    });
    const { context, request } = contexto(`Bearer ${token}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.usuario).toEqual({
      id: 'u1',
      nome: 'Ana',
      email: 'ana@sicredi.local',
    });
  });
});
