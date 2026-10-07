import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UsuarioResponse } from './usuario.response.js';

export class LoginDto {
  @ApiProperty({ example: 'usuario@empresa.com.br' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(254, { message: 'E-mail deve ter no máximo 254 caracteres' })
  email: string;

  @ApiProperty({ format: 'password' })
  @IsString({ message: 'Senha deve ser um texto' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' })
  senha: string;
}

export class LoginResponse {
  @ApiProperty() accessToken: string;
  @ApiProperty({ example: 'Bearer' }) tipo: 'Bearer';
  @ApiProperty({ description: 'Validade do token em segundos', example: 28800 })
  expiraEm: number;
  @ApiProperty({ type: UsuarioResponse }) usuario: UsuarioResponse;
}
