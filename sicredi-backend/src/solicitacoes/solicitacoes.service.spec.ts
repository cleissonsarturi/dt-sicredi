import { ConflictException, NotFoundException } from '@nestjs/common';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js';
import type { OutboxService } from '../integracao/outbox.service.js';
import { Prioridade } from './domain/prioridade.enum.js';
import { StatusSolicitacao } from './domain/status-solicitacao.enum.js';
import type { Solicitacao } from './entities/solicitacao.entity.js';
import { SolicitacoesService } from './solicitacoes.service.js';

const USUARIO: UsuarioAutenticado = {
  id: 'c3f1a2b4-1d2e-4f3a-8b9c-0d1e2f3a4b5c',
  nome: 'Analista',
  email: 'analista@sicredi.local',
};

function solicitacao(status: StatusSolicitacao): Solicitacao {
  return {
    id: '7b0e8a52-5b1c-4c55-9a3b-2c1e1f0d8a11',
    titulo: 'Acesso',
    descricao: 'Descrição',
    solicitante: 'Maria',
    areaSolicitante: 'Crédito',
    prioridade: Prioridade.ALTA,
    status,
    dataSolicitacao: '2026-09-29',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };
}

describe('SolicitacoesService', () => {
  let manager: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let repo: {
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let outbox: { registrarAprovacao: ReturnType<typeof vi.fn> };
  let service: SolicitacoesService;

  beforeEach(() => {
    manager = {
      findOne: vi.fn(),
      save: vi.fn(async (entidade: unknown) => entidade),
      create: vi.fn((_classe: unknown, dados: object) => ({ ...dados })),
    };
    repo = { findOne: vi.fn(), update: vi.fn(), delete: vi.fn() };
    outbox = { registrarAprovacao: vi.fn() };
    const dataSource = {
      transaction: vi.fn((cb: (m: EntityManager) => unknown) =>
        cb(manager as unknown as EntityManager),
      ),
    };
    service = new SolicitacoesService(
      repo as unknown as Repository<Solicitacao>,
      dataSource as unknown as DataSource,
      outbox as unknown as OutboxService,
    );
  });

  describe('criar', () => {
    it('cria com status ABERTA e registra o autor no histórico', async () => {
      manager.save.mockImplementation(async (entidade: object) => ({
        id: 'nova',
        ...entidade,
      }));

      const criada = await service.criar(
        {
          titulo: 'Acesso',
          descricao: 'Descrição',
          solicitante: 'Maria',
          areaSolicitante: 'Crédito',
          prioridade: Prioridade.ALTA,
        },
        USUARIO,
      );

      expect(criada.status).toBe(StatusSolicitacao.ABERTA);
      expect(manager.create).toHaveBeenLastCalledWith(expect.anything(), {
        solicitacaoId: 'nova',
        statusAnterior: null,
        statusNovo: StatusSolicitacao.ABERTA,
        comentario: null,
        usuarioId: USUARIO.id,
      });
    });
  });

  describe('alterarStatus', () => {
    it('aprova, registra histórico com comentário e autor e grava evento no outbox', async () => {
      const atual = solicitacao(StatusSolicitacao.EM_ANALISE);
      manager.findOne.mockResolvedValue(atual);
      repo.findOne.mockResolvedValue({
        ...atual,
        status: StatusSolicitacao.APROVADA,
      });

      const resultado = await service.alterarStatus(
        atual.id,
        {
          status: StatusSolicitacao.APROVADA,
          comentario: 'Aprovado pela gestão',
        },
        USUARIO,
      );

      expect(resultado.status).toBe(StatusSolicitacao.APROVADA);
      expect(manager.create).toHaveBeenCalledWith(expect.anything(), {
        solicitacaoId: atual.id,
        statusAnterior: StatusSolicitacao.EM_ANALISE,
        statusNovo: StatusSolicitacao.APROVADA,
        comentario: 'Aprovado pela gestão',
        usuarioId: USUARIO.id,
      });
      expect(outbox.registrarAprovacao).toHaveBeenCalledWith(
        manager,
        expect.objectContaining({
          id: atual.id,
          status: StatusSolicitacao.APROVADA,
        }),
        'Aprovado pela gestão',
      );
    });

    it('rejeição não dispara integração', async () => {
      manager.findOne.mockResolvedValue(solicitacao(StatusSolicitacao.ABERTA));
      repo.findOne.mockResolvedValue(solicitacao(StatusSolicitacao.REJEITADA));

      await service.alterarStatus(
        'id',
        { status: StatusSolicitacao.REJEITADA, comentario: 'Fora do escopo' },
        USUARIO,
      );

      expect(outbox.registrarAprovacao).not.toHaveBeenCalled();
    });

    it('bloqueia transição a partir de status final', async () => {
      manager.findOne.mockResolvedValue(
        solicitacao(StatusSolicitacao.REJEITADA),
      );

      await expect(
        service.alterarStatus(
          'id',
          { status: StatusSolicitacao.APROVADA, comentario: 'Tentativa' },
          USUARIO,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('retorna 404 quando a solicitação não existe', async () => {
      manager.findOne.mockResolvedValue(null);
      await expect(
        service.alterarStatus(
          'id',
          { status: StatusSolicitacao.EM_ANALISE },
          USUARIO,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('atualizar', () => {
    it('não permite editar solicitação finalizada', async () => {
      repo.findOne.mockResolvedValue(solicitacao(StatusSolicitacao.APROVADA));
      await expect(
        service.atualizar('id', { titulo: 'Novo' }, USUARIO),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('aplica a atualização condicionada a status não final', async () => {
      repo.findOne.mockResolvedValue(solicitacao(StatusSolicitacao.ABERTA));
      repo.update.mockResolvedValue({ affected: 1 });

      await service.atualizar('id', { titulo: 'Novo' }, USUARIO);

      expect(repo.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'id' }),
        { titulo: 'Novo' },
      );
    });

    it('detecta finalização concorrente entre leitura e escrita', async () => {
      repo.findOne.mockResolvedValue(solicitacao(StatusSolicitacao.EM_ANALISE));
      repo.update.mockResolvedValue({ affected: 0 });
      await expect(
        service.atualizar('id', { titulo: 'Novo' }, USUARIO),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('remover', () => {
    it('retorna 404 quando nada foi excluído', async () => {
      repo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remover('id', USUARIO)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
