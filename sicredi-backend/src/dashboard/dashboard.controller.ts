import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import { ResumoDashboard } from './resumo-dashboard.response.js';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('resumo')
  @ApiOperation({ summary: 'Indicadores: total, por status e por prioridade' })
  @ApiOkResponse({ type: ResumoDashboard })
  resumo(): Promise<ResumoDashboard> {
    return this.dashboard.resumo();
  }
}
