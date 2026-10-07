import {
  Controller,
  Get,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Publico } from '../auth/usuario-autenticado.js';

@Publico()
@ApiTags('Health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Verifica a disponibilidade da API e do banco' })
  @ApiOkResponse({ schema: { example: { status: 'ok', banco: 'ok' } } })
  async verificar() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', banco: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Banco de dados indisponível');
    }
  }
}
