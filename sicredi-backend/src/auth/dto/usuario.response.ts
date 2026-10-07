import { ApiProperty } from '@nestjs/swagger';

export class UsuarioResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nome: string;
  @ApiProperty() email: string;
}
