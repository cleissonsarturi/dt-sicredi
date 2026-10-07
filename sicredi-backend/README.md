# sicredi-backend

API REST de gestão de solicitações internas (NestJS 12 + TypeORM + PostgreSQL).

Instruções completas, decisões técnicas e endpoints: veja o [README principal](../README.md).

```bash
cp .env.example .env
npm install
npm run start:dev      # http://localhost:3001/api/v1 · Swagger em /api/docs
npm test               # testes unitários
```

## Estrutura

```
src/
├── auth/            # login, JWT (guard global, @Publico, @UsuarioAtual), hash de senha, usuários
├── common/          # filtro de exceções, middleware de log/requestId, pipes e validadores
├── config/          # validação de variáveis de ambiente e configuração do TypeORM
├── database/        # migrations, data source da CLI e seed
├── solicitacoes/    # domínio principal: entidades, DTOs, regras de status, service e controller
├── dashboard/       # indicadores agregados
├── integracao/      # outbox, cliente do sistema externo e worker de entrega
├── health/          # health check
├── configurar-app.ts  # pipeline HTTP (prefixo, versionamento, validação)
└── main.ts
```
