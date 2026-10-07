import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { LoginDto, LoginResponse } from './dto/login.dto.js';
import { Usuario } from './entities/usuario.entity.js';
import { gerarHashSenha, verificarSenha } from './senha.js';
import type { PayloadToken } from './usuario-autenticado.js';

const CREDENCIAIS_INVALIDAS = 'E-mail ou senha inválidos';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);
  private hashFicticio?: Promise<string>;

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login({ email, senha }: LoginDto): Promise<LoginResponse> {
    const usuario = await this.usuarios.findOne({
      where: { email },
      select: { id: true, nome: true, email: true, senhaHash: true },
    });

    this.hashFicticio ??= gerarHashSenha('senha-ficticia');
    const valida = await verificarSenha(
      senha,
      usuario?.senhaHash ?? (await this.hashFicticio),
    );
    if (!usuario || !valida) {
      this.logger.warn({ mensagem: 'Falha de login', email });
      throw new UnauthorizedException(CREDENCIAIS_INVALIDAS);
    }

    const payload: PayloadToken = {
      sub: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    };
    this.logger.log({ mensagem: 'Login realizado', usuarioId: usuario.id });
    return {
      accessToken: await this.jwt.signAsync(payload),
      tipo: 'Bearer',
      expiraEm: this.config.get<number>('JWT_EXPIRACAO_SEGUNDOS', 28800),
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    };
  }

  async onApplicationBootstrap(): Promise<void> {
    const email = this.config.get<string>('USUARIO_INICIAL_EMAIL');
    const senha = this.config.get<string>('USUARIO_INICIAL_SENHA');
    if (!email || !senha) return;
    if ((await this.usuarios.count()) > 0) return;

    await this.usuarios.save(
      this.usuarios.create({
        nome: this.config.get<string>('USUARIO_INICIAL_NOME', 'Administrador'),
        email: email.trim().toLowerCase(),
        senhaHash: await gerarHashSenha(senha),
      }),
    );
    this.logger.log({ mensagem: 'Usuário inicial criado', email });
  }
}
