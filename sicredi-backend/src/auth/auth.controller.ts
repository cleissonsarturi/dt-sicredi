import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto, LoginResponse } from './dto/login.dto.js';
import { UsuarioResponse } from './dto/usuario.response.js';
import {
  Publico,
  UsuarioAtual,
  type UsuarioAutenticado,
} from './usuario-autenticado.js';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autentica com e-mail e senha e devolve um JWT' })
  @ApiOkResponse({ type: LoginResponse })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiUnauthorizedResponse({ description: 'E-mail ou senha inválidos' })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o usuário do token informado' })
  @ApiOkResponse({ type: UsuarioResponse })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou expirado',
  })
  me(@UsuarioAtual() usuario: UsuarioAutenticado): UsuarioResponse {
    return usuario;
  }
}
