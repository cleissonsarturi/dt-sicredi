import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { Repository } from 'typeorm';
import { AuthService } from './auth.service.js';
import type { Usuario } from './entities/usuario.entity.js';
import { gerarHashSenha, verificarSenha } from './senha.js';

describe('AuthService', () => {
  let usuarios: {
    findOne: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let jwt: { signAsync: ReturnType<typeof vi.fn> };
  let env: Record<string, unknown>;
  let service: AuthService;

  beforeEach(() => {
    usuarios = {
      findOne: vi.fn(),
      count: vi.fn(),
      save: vi.fn(),
      create: vi.fn((dados: object) => dados),
    };
    jwt = { signAsync: vi.fn().mockResolvedValue('token-assinado') };
    env = { JWT_EXPIRACAO_SEGUNDOS: 3600 };
    const config = {
      get: vi.fn((chave: string, padrao?: unknown) => env[chave] ?? padrao),
    };
    service = new AuthService(
      usuarios as unknown as Repository<Usuario>,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  describe('login', () => {
    it('devolve token com id, nome e e-mail no payload', async () => {
      usuarios.findOne.mockResolvedValue({
        id: 'u1',
        nome: 'Ana',
        email: 'ana@sicredi.local',
        senhaHash: await gerarHashSenha('senha-correta'),
      });

      const resposta = await service.login({
        email: 'ana@sicredi.local',
        senha: 'senha-correta',
      });

      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        nome: 'Ana',
        email: 'ana@sicredi.local',
      });
      expect(resposta).toEqual({
        accessToken: 'token-assinado',
        tipo: 'Bearer',
        expiraEm: 3600,
        usuario: { id: 'u1', nome: 'Ana', email: 'ana@sicredi.local' },
      });
    });

    it('recusa senha errada', async () => {
      usuarios.findOne.mockResolvedValue({
        id: 'u1',
        nome: 'Ana',
        email: 'ana@sicredi.local',
        senhaHash: await gerarHashSenha('senha-correta'),
      });

      await expect(
        service.login({ email: 'ana@sicredi.local', senha: 'errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });

    it('usa a mesma mensagem para e-mail inexistente e senha errada', async () => {
      usuarios.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ninguem@sicredi.local', senha: 'x' }),
      ).rejects.toThrow('E-mail ou senha inválidos');
    });
  });

  describe('usuário inicial', () => {
    it('cria o usuário configurado quando a base está vazia', async () => {
      env.USUARIO_INICIAL_EMAIL = 'Admin@Exemplo.com';
      env.USUARIO_INICIAL_SENHA = 'Senha@Teste123';
      usuarios.count.mockResolvedValue(0);

      await service.onApplicationBootstrap();

      const criado = usuarios.save.mock.calls[0][0] as Usuario;
      expect(criado.email).toBe('admin@exemplo.com');
      expect(criado.nome).toBe('Administrador');
      await expect(
        verificarSenha('Senha@Teste123', criado.senhaHash),
      ).resolves.toBe(true);
    });

    it('não cria quando já existem usuários', async () => {
      env.USUARIO_INICIAL_EMAIL = 'admin@exemplo.com';
      env.USUARIO_INICIAL_SENHA = 'Senha@Teste123';
      usuarios.count.mockResolvedValue(1);

      await service.onApplicationBootstrap();

      expect(usuarios.save).not.toHaveBeenCalled();
    });

    it('não faz nada sem configuração', async () => {
      await service.onApplicationBootstrap();
      expect(usuarios.count).not.toHaveBeenCalled();
    });
  });
});
