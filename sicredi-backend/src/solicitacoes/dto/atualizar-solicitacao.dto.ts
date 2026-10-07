import { PartialType } from '@nestjs/swagger';
import { CriarSolicitacaoDto } from './criar-solicitacao.dto.js';

/**
 * Atualização parcial dos dados cadastrais. O status não é alterado por aqui:
 * mudanças de status passam pelo endpoint dedicado, que aplica as regras de
 * transição e registra o histórico.
 */
export class AtualizarSolicitacaoDto extends PartialType(CriarSolicitacaoDto) {}
