# Gestão de Solicitações Internas

Protótipo web que centraliza solicitações internas (hoje dispersas em e-mail, mensagens e planilhas), permite acompanhar seu andamento, registrar a análise/decisão com rastreabilidade e visualizar indicadores da operação.

| Camada         | Tecnologia                                                        |
| -------------- | ----------------------------------------------------------------- |
| Front-end      | Next.js 16 (App Router, Server Components, Server Actions), Tailwind CSS 4 |
| Back-end       | NestJS 12, TypeORM, class-validator, Swagger                     |
| Banco de dados | PostgreSQL 17 (schema versionado por migrations)                  |
| Infra          | Docker / Docker Compose                                           |

```
.
├── sicredi-backend/          # API REST (NestJS)
├── sicredi-frontend/         # Interface web (Next.js)
└── docker-compose.yml        # PostgreSQL + API + front-end
```

---

## 1. Como executar

### Opção A — tudo com Docker (recomendado para avaliação)

Pré-requisito: Docker.

```bash
cp .env.example .env                       # depois preencha os valores (ver abaixo)
docker compose up -d --build
docker compose exec backend npm run seed   # opcional: 10 solicitações de exemplo
```

Variáveis do `.env` da raiz:

| Variável | Obrigatória | Descrição |
| --- | :---: | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | sim | Usuário e senha do PostgreSQL (criados pelo container) |
| `POSTGRES_DB` / `POSTGRES_PORT` | não | Nome do banco (padrão `solicitacoes`) e porta no host (padrão `5433`) |
| `JWT_SECRET` | sim | Segredo de assinatura do token, com no mínimo 32 caracteres (ex.: `openssl rand -base64 48`) |
| `USUARIO_INICIAL_EMAIL` / `USUARIO_INICIAL_SENHA` | sim | Credenciais de acesso à aplicação (senha com no mínimo 8 caracteres) |
| `USUARIO_INICIAL_NOME` | não | Nome exibido do usuário inicial (padrão `Administrador`) |
| `INTEGRACAO_URL` | não | URL do sistema externo notificado na aprovação (vazio = modo simulado) |

| Serviço                | URL                                |
| ---------------------- | ---------------------------------- |
| Aplicação web          | http://localhost:3000              |
| API                    | http://localhost:3001/api/v1       |
| Documentação (Swagger) | http://localhost:3001/api/docs     |
| Health check           | http://localhost:3001/api/health   |

As migrations são executadas automaticamente quando a API sobe.

> O PostgreSQL é exposto na porta **5433** do host (para não conflitar com uma instância local na 5432). Altere com `POSTGRES_PORT` se necessário.

### Acesso à aplicação

Entre com o e-mail e a senha definidos em `USUARIO_INICIAL_EMAIL` e `USUARIO_INICIAL_SENHA`. Esse usuário é criado automaticamente na primeira inicialização, quando a base ainda não tem nenhum usuário. No Swagger, faça `POST /auth/login` e cole o `accessToken` no botão **Authorize**.

> Credenciais e segredos não ficam no código nem no repositório: vêm do `.env` (não versionado), criado a partir do `.env.example`, que traz apenas as chaves. O `docker compose` se recusa a subir se faltar algum valor obrigatório.

### Opção B — desenvolvimento local

Pré-requisitos: **Node.js ≥ 22.18** (recomendado 24, ver `.nvmrc`), npm e Docker (apenas para o banco).

```bash
# 1. Banco de dados
cp .env.example .env            # preencha como na opção A
docker compose up -d postgres

# 2. API (http://localhost:3001)
cd sicredi-backend
cp .env.example .env            # preencha (ver abaixo)
npm install
npm run start:dev               # aplica as migrations ao iniciar
npm run build && npm run seed   # opcional: dados de exemplo

# 3. Front-end (http://localhost:3000), em outro terminal
cd sicredi-frontend
cp .env.example .env.local      # API_URL=http://localhost:3001/api/v1
npm install
npm run dev
```

No `sicredi-backend/.env`, use em `DB_USER`, `DB_PASSWORD` e `DB_NAME` os mesmos valores de `POSTGRES_*` do `.env` da raiz, com `DB_HOST=localhost` e `DB_PORT=5433`. `JWT_SECRET` e `USUARIO_INICIAL_*` seguem as regras da tabela acima. Nas demais chaves, use os valores padrão: `PORT=3001`, `NODE_ENV=development`, `CORS_ORIGIN=http://localhost:3000`, `DB_MIGRATIONS_RUN=true`, `INTEGRACAO_TIMEOUT_MS=5000`, `INTEGRACAO_INTERVALO_MS=5000`, `INTEGRACAO_MAX_TENTATIVAS=5` e `JWT_EXPIRACAO_SEGUNDOS=28800`.

> A CLI do Nest 12 não funciona em versões antigas do Node 22 (ex.: 22.14 falha com `ERR_REQUIRE_CYCLE_MODULE`). Use Node 24 ou ≥ 22.18.

### Scripts úteis (back-end)

| Comando                    | Descrição                                                   |
| -------------------------- | ----------------------------------------------------------- |
| `npm run migration:run`    | Aplica migrations pendentes (requer `npm run build` antes)   |
| `npm run migration:revert` | Reverte a última migration                                   |
| `npm run seed`             | Popula dados de exemplo (só se a base estiver vazia)         |
| `npm test`                 | Testes unitários                                             |
| `npm run lint`             | Lint (oxlint)                                                |

---

## 2. Funcionalidades entregues

| Requisito do desafio                           | Status | Onde                                                                  |
| ---------------------------------------------- | :----: | --------------------------------------------------------------------- |
| 4.1 Cadastro (todos os campos pedidos)         |   ✅   | `/solicitacoes/nova` · `POST /solicitacoes`                           |
| 4.2 Listagem, pesquisa por texto, filtros por status e prioridade, ordenação por data | ✅ | `/solicitacoes` · `GET /solicitacoes` (com paginação) |
| 4.3 Análise e decisão com comentário e data    |   ✅   | Detalhe da solicitação · `PATCH /solicitacoes/:id/status` + histórico |
| 4.4 Dashboard (total, abertas, aprovadas, rejeitadas, distribuição por prioridade) | ✅ | `/` · `GET /dashboard/resumo` |
| 5. API: cadastrar, consultar, atualizar, excluir |  ✅   | Ver tabela de endpoints abaixo                                        |
| 6. Persistência com migrations                 |   ✅   | `sicredi-backend/src/database/migrations`              |
| 7. Validação, tratamento de erros, organização |   ✅   | Ver seção 4                                                           |

**Diferenciais implementados**

- **Docker**: stack completa com `docker compose up`, imagens multi-stage e health checks.
- **Autenticação JWT**: login por e-mail e senha, todas as rotas da API protegidas e histórico registrando **quem** fez cada mudança de status (seção 4).
- **Testes automatizados**: 49 testes unitários (regras de status, validação, serviço, worker de integração, autenticação).
- **Logs estruturados**: JSON em produção, com `requestId` por requisição (propagado no header `x-request-id`).
- **Integração com serviço externo**: outbox transacional e worker com retentativas. É acionada na aprovação (seção 7.2).

Não há **perfis de acesso** (autorização): qualquer usuário autenticado pode executar todas as operações (ver limitações).

---

## 3. API

Base: `/api/v1` · Documentação interativa: `/api/docs`

Todas as rotas exigem o header `Authorization: Bearer <token>`, exceto `POST /auth/login` e o health check.

| Método   | Rota                                   | Descrição                                        | Sucesso |
| -------- | -------------------------------------- | ------------------------------------------------ | ------- |
| `POST`   | `/solicitacoes`                        | Cadastra (status inicial `ABERTA`)               | 201     |
| `GET`    | `/solicitacoes`                        | Lista com `busca`, `status`, `prioridade`, `ordem` (asc/desc), `pagina`, `tamanhoPagina` | 200 |
| `GET`    | `/solicitacoes/:id`                    | Consulta uma solicitação com o histórico         | 200     |
| `PATCH`  | `/solicitacoes/:id`                    | Atualiza dados cadastrais (parcial)              | 200     |
| `PATCH`  | `/solicitacoes/:id/status`             | Inicia análise, aprova ou rejeita                | 200     |
| `DELETE` | `/solicitacoes/:id`                    | Exclui a solicitação e o histórico               | 204     |
| `GET`    | `/solicitacoes/:id/integracoes`        | Eventos de integração da solicitação             | 200     |
| `POST`   | `/integracoes/eventos/:id/reprocessar` | Reenfileira um evento que falhou definitivamente | 200     |
| `GET`    | `/dashboard/resumo`                    | Indicadores agregados                            | 200     |
| `POST`   | `/auth/login`                          | Autentica e devolve o JWT (público)              | 200     |
| `GET`    | `/auth/me`                             | Usuário do token                                 | 200     |
| `GET`    | `/api/health` (sem versão)             | Disponibilidade da API e do banco (público)      | 200/503 |

**Códigos de erro**: `400` para entrada inválida, `401` para token ausente, inválido ou expirado (ou credenciais incorretas no login), `404` para recurso inexistente, `409` para regra de negócio violada (transição de status inválida ou edição de solicitação finalizada) e `500` para erro inesperado. Todos usam o mesmo envelope:

```json
{
  "statusCode": 409,
  "erro": "CONFLICT",
  "mensagens": ["Transição de APROVADA para REJEITADA não é permitida"],
  "caminho": "/api/v1/solicitacoes/…/status",
  "requestId": "2229c55f-…",
  "timestamp": "2026-09-29T19:19:57.771Z"
}
```

Exemplo — decisão (o `accessToken` vem do `POST /auth/login`):

```bash
curl -X PATCH http://localhost:3001/api/v1/solicitacoes/<id>/status \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"status": "APROVADA", "comentario": "Aprovado conforme política de acessos."}'
```

---

## 4. Decisões técnicas

### Modelagem de dados

```
solicitacoes 1 ──── N historico_status N ──── 1 usuarios        eventos_integracao (outbox)
  id (uuid)            solicitacao_id (FK, CASCADE)    id (uuid)       solicitacao_id (sem FK)
  titulo, descricao    status_anterior / status_novo   nome            tipo, payload (jsonb)
  solicitante          comentario                      email (único)   status, tentativas
  area_solicitante     usuario_id (FK, SET NULL)       senha_hash      proxima_tentativa_em, ultimo_erro
  prioridade, status   criado_em  ← data da decisão    criado_em       enviado_em
  data_solicitacao (date)
  criado_em, atualizado_em
```

- **Histórico em tabela própria.** Cada mudança de status (incluindo a criação) gera um registro com status anterior e novo, comentário e data. Assim a decisão pedida no item 4.3 vira uma trilha de auditoria completa, e não apenas um "último comentário" que seria sobrescrito.
- **`data_solicitacao` separada de `criado_em`.** A data informada pelo usuário pode ser anterior ao cadastro, já que a solicitação pode ter chegado por e-mail dias antes. `criado_em` é a data técnica do registro.
- **Domínios com `VARCHAR + CHECK`**, não `ENUM` nativo. A integridade é garantida no banco, e incluir um novo status passa a ser uma migration trivial, sem `ALTER TYPE`.
- **Índices** para os filtros e a ordenação usados na listagem (`status`, `prioridade`, `data_solicitacao DESC`). O índice do outbox é **parcial** (`WHERE status = 'PENDENTE'`).
- **UUID** como chave: não expõe volume nem sequência e facilita a integração entre sistemas.
- `synchronize` desligado: o schema evolui **somente por migrations** versionadas.

### Regras de negócio (máquina de estados)

```
ABERTA ──► EM_ANALISE ──► APROVADA
  │              └──────► REJEITADA
  └──► APROVADA | REJEITADA
```

- Aprovar ou rejeitar **exige comentário** com pelo menos 5 caracteres.
- `APROVADA` e `REJEITADA` são **estados finais**: não aceitam nova decisão nem edição (`409`).
- O status **não** é alterado pelo `PATCH /solicitacoes/:id`: passa sempre pela rota de status, que valida a transição e registra o histórico.
- **Concorrência**: a decisão usa `SELECT … FOR UPDATE`, então duas decisões simultâneas não se sobrepõem. A edição usa um `UPDATE` condicionado ao status, evitando editar algo que acabou de ser finalizado.

### Back-end

- Organização **modular por domínio** (`auth`, `solicitacoes`, `dashboard`, `integracao`), com camadas controller → service → repositório (TypeORM). As regras de transição ficam em funções puras (`domain/`), fáceis de testar.
- **Validação** com DTOs (`class-validator`), `whitelist` + `forbidNonWhitelisted` (campos desconhecidos são rejeitados), `trim` automático e mensagens em pt-BR, uma por campo.
- **Tratamento de erros** centralizado em um filtro global. Ele padroniza o envelope, converte erros do PostgreSQL (ex.: violação de `CHECK`) em 4xx e nunca devolve stack ou SQL ao cliente.
- **Configuração validada na inicialização**: a API não sobe com variável de ambiente inválida.
- **Dashboard agregado no banco** com uma única consulta `GROUPING SETS`, sem carregar registros em memória.
- **Versionamento de URI** (`/api/v1`) desde o início, para permitir evolução sem quebrar clientes.

### Autenticação

- **JWT (HS256) com guard global**: toda rota exige token, e as exceções são declaradas explicitamente com `@Publico()` (login e health check). Uma rota nova já nasce protegida, sem depender de alguém lembrar de protegê-la.
- **Stateless**: o guard valida assinatura e expiração sem consultar o banco. O token carrega id, nome e e-mail e vale 8 horas (`JWT_EXPIRACAO_SEGUNDOS`).
- **Senhas com `scrypt`** (nativo do Node, salt aleatório por senha), comparadas em tempo constante. A coluna `senha_hash` fica fora dos `SELECT`s por padrão, então nunca aparece em respostas nem em relações carregadas.
- **Login sem revelar contas**: e-mail inexistente e senha errada devolvem a mesma mensagem, e o hash é calculado nos dois casos, para que o tempo de resposta também não diferencie.
- **Rastreabilidade**: o histórico grava o `usuario_id` de quem criou e de quem mudou cada status, e os logs de edição e exclusão também registram o usuário. Registros anteriores à autenticação ficam com autor nulo.
- **Usuário inicial**: criado na inicialização quando a base não tem nenhum usuário (`USUARIO_INICIAL_*`), para o sistema nunca nascer inacessível.
- **No front-end**, o token fica em um cookie `httpOnly` + `SameSite=Lax`: o JavaScript do navegador não consegue lê-lo, o que protege contra roubo por XSS, e ele só é enviado à API pelo servidor do Next.js. Um `proxy.ts` redireciona ao login quem não tem sessão. Se a API recusar o token (expirado ou adulterado), o cookie é apagado e o usuário volta ao login com aviso.

### Front-end

- **Server Components** buscam os dados e **Server Actions** executam as mutações. O navegador nunca chama a API diretamente: a URL da API fica só no servidor (`API_URL`), não há CORS a configurar e o JavaScript enviado ao cliente é mínimo.
- **Filtros na URL** (formulário `GET`): a busca é compartilhável por link, funciona sem JavaScript e sobrevive ao recarregar a página.
- Validação nativa do HTML para feedback imediato; a **validação que vale é a do back-end**, e suas mensagens aparecem no formulário sem perder o que foi digitado.
- Estados de carregamento, vazio, 404 e erro (API indisponível) tratados. Layout responsivo.

---

## 5. Premissas adotadas

1. Toda solicitação nasce com status **Aberta**. O status é consequência do fluxo e não é escolhido no cadastro.
2. A "análise" do item 4.3 foi modelada como o status intermediário **Em análise**, que é opcional: uma solicitação aberta pode ser decidida diretamente.
3. A data da solicitação é informada pelo usuário (padrão: hoje) e **não pode ser futura**.
4. Só é possível editar solicitações **não finalizadas**. A exclusão é permitida em qualquer status e remove o histórico junto (os eventos de integração são preservados).
5. "Solicitações abertas" no dashboard conta o status `ABERTA`. As em análise aparecem em separado para não misturar etapas.
6. O **solicitante** continua sendo um campo de texto (pré-preenchido com o nome do usuário logado), porque quem registra a solicitação nem sempre é quem pediu: ela pode ter chegado por e-mail. O **autor** do registro e de cada decisão é gravado separadamente no histórico.
7. Horários exibidos no fuso de Brasília.

## 6. Limitações e próximos passos

| Pendente / limitação | Como seria implementado |
| --- | --- |
| **Perfis de acesso (autorização)** | Hoje qualquer usuário autenticado pode decidir. Próximo passo: perfis (solicitante, analista, gestor) aplicados com um decorator `@Roles` sobre o guard já existente, com o solicitante vendo apenas as próprias solicitações. |
| **Identidade corporativa** | Trocar o login local por SSO via OIDC (ex.: Keycloak/Azure AD). O guard passaria a validar tokens do provedor (RS256/JWKS), e a tabela `usuarios` viraria só um espelho do provedor. |
| **Sessão** | Sem refresh token nem revogação: o token vale até expirar (8h), e o logout apenas apaga o cookie. Também falta cadastro de usuários pela interface e *rate limiting* no login (ex.: `@nestjs/throttler`) contra força bruta. |
| Exclusão física | Trocar por *soft delete* (`excluido_em`) para preservar auditoria, restringindo a exclusão a solicitações abertas. |
| Busca com `ILIKE` | Adequada ao volume de um protótipo. Com volume maior: índice trigram (`pg_trgm`) ou full-text search do PostgreSQL. |
| Testes do front-end | Adicionar testes de componentes (Vitest + Testing Library) no CI. O fluxo completo da interface foi validado manualmente com Playwright durante o desenvolvimento. |
| Worker de integração no mesmo processo da API | Adequado ao protótipo. Em produção, seria separado em um processo próprio (ver 7.1). |
| Paginação por *offset* | Trocar por *cursor* (keyset) se o volume crescer. |

**Critérios de priorização:** primeiro, todos os requisitos obrigatórios com qualidade (integridade dos dados, regras de negócio, validação e erros consistentes). Depois, os diferenciais que **reforçam a confiabilidade** e respondem às perguntas arquiteturais com código real: testes, Docker, logs e integração com outbox. Por último, entrou uma autenticação JWT simples, que não depende de nenhum provedor e foi pensada para ser trocada por SSO corporativo sem mexer nas rotas. Os perfis de acesso ficaram de fora porque dependem de regras de negócio (quem pode decidir o quê) que o enunciado não define.

---

## 7. Considerações arquiteturais

### 7.1 Evolução da solução

**Mudanças arquiteturais para suportar crescimento**

- Manter o **monólito modular** enquanto o domínio for pequeno. Os módulos (`solicitacoes`, `dashboard`, `integracao`) já têm fronteiras claras e podem virar serviços quando houver motivo real: escala independente, times distintos ou ciclos de deploy diferentes.
- **Separar o worker de integração** em um processo ou deploy próprio, escalando independentemente da API. O código já está isolado e o `SKIP LOCKED` permite várias instâncias sem duplicidade.
- Substituir o *polling* do outbox por um **broker de mensagens** (Kafka/RabbitMQ), publicando via outbox + CDC (ex.: Debezium). Outros sistemas passariam a consumir os eventos de domínio (`SolicitacaoAprovada`, etc.).
- Evoluir o modelo: **tipos de solicitação** com campos e fluxos configuráveis, anexos em object storage, SLA por tipo/prioridade e responsáveis atribuídos.
- Para os indicadores: **réplica de leitura** e, com mais volume, visões materializadas ou um data warehouse/BI em vez de agregações na base transacional.

**Principais riscos técnicos**

- **Ausência de perfis de acesso**: qualquer usuário autenticado pode decidir solicitações. É o primeiro item a resolver antes de qualquer uso real, junto com o SSO corporativo.
- **Crescimento do escopo** (formulários dinâmicos, workflows) sem uma modelagem que suporte variação, levando a colunas genéricas e regras espalhadas.
- **Dependência do sistema externo**: indisponibilidade, mudanças de contrato ou lentidão. Mitigado pelo outbox, mas exige monitoramento da fila e dos eventos em `FALHA`.
- **Consultas de busca e dashboard** degradando com volume (ver `pg_trgm` e réplica de leitura).
- **Dados pessoais** (nome do solicitante, conteúdo livre): exigem aderência à LGPD, com retenção, mascaramento em logs e controle de acesso.

**Escalabilidade, disponibilidade e manutenibilidade**

- *Escalabilidade*: a API é **stateless**, então escala horizontalmente atrás de um load balancer (Kubernetes/ECS com HPA). Com mais volume, entram pool de conexões (PgBouncer), cache de leituras frequentes (Redis) e réplicas de leitura.
- *Disponibilidade*: múltiplas réplicas da API, PostgreSQL gerenciado com failover e backups/PITR, health checks (já existentes) ligados a readiness/liveness, *graceful shutdown* (já habilitado) e deploy sem downtime (rolling/blue-green). Integrações assíncronas (já implementadas) evitam que falhas externas derrubem o fluxo principal.
- *Manutenibilidade*: CI com lint e testes automatizados a cada PR, migrations versionadas, contrato OpenAPI gerado do código (base para gerar o client do front-end e testes de contrato), versionamento de API e observabilidade (logs estruturados já presentes, mais métricas e tracing com OpenTelemetry).

**Componentes/camadas para uma evolução futura**

API Gateway (autenticação, rate limiting, roteamento) · provedor de identidade (OIDC) · broker de mensagens · cache (Redis) · object storage para anexos · serviço de notificações (e-mail/Teams) · observabilidade (OpenTelemetry, Prometheus/Grafana, agregação de logs) · feature flags · BI/data warehouse para indicadores históricos.

### 7.2 Integração com sistemas externos

Esse cenário **foi implementado** no protótipo. Quando uma solicitação é aprovada, o sistema externo é notificado automaticamente.

```
PATCH /status (APROVADA)
   └─ transação única ─┬─ UPDATE solicitacoes (status)
                       ├─ INSERT historico_status (comentário, data)
                       └─ INSERT eventos_integracao (PENDENTE)   ← outbox
                                   │
IntegracaoWorker (a cada 5s) ──────┘
   SELECT … FOR UPDATE SKIP LOCKED
   POST <INTEGRACAO_URL>  (Idempotency-Key, X-Correlation-Id, timeout)
     ├─ 2xx  → ENVIADO
     └─ erro → PENDENTE com backoff exponencial (10s, 20s, 40s… máx. 5 min)
               após 5 tentativas → FALHA (reprocessamento manual via API)
```

**Como realizaria esta integração?**
Com o padrão **Transactional Outbox**. O evento é gravado na **mesma transação** da aprovação, então é impossível aprovar sem gerar o evento, ou gerar um evento de algo que não foi aprovado (o que aconteceria chamando o sistema externo dentro da requisição, com risco de *dual write*). Um worker entrega os eventos de forma assíncrona. Sem `INTEGRACAO_URL` configurada, a entrega roda em **modo simulado** (apenas log), o que permite demonstrar o fluxo sem depender de um sistema real.

**Quais padrões ou tecnologias utilizaria?**
Outbox transacional, entrega *at-least-once* com **chave de idempotência** (`Idempotency-Key` = id do evento, para o receptor descartar duplicatas), retry com **backoff exponencial**, **dead letter** (status `FALHA`) e timeout explícito. No protótipo: HTTP/REST + PostgreSQL. Em produção, conforme o que o sistema corporativo oferecer: publicação em **Kafka/RabbitMQ** (via outbox + CDC/Debezium), ou chamada REST passando por API Gateway. Se a chamada for síncrona, entra também um **circuit breaker** para não sobrecarregar um sistema já degradado. Os contratos do evento seriam versionados (schema registry/AsyncAPI).

**Como trataria falhas de comunicação?**
Cada falha (timeout, erro de rede ou HTTP não-2xx) incrementa `tentativas`, grava `ultimo_erro` e reagenda com backoff exponencial. Esgotadas as tentativas, o evento vai para `FALHA`, pode ser reprocessado com `POST /integracoes/eventos/:id/reprocessar` e deveria gerar alerta para a operação. Erros **permanentes** (ex.: 4xx de contrato) poderiam ir direto para `FALHA`, sem retentativas. O `FOR UPDATE SKIP LOCKED` garante que múltiplas instâncias não entreguem o mesmo evento em paralelo.

**Como garantiria rastreabilidade das operações realizadas?**
- A tabela `eventos_integracao` guarda o payload enviado, tentativas, último erro e data de entrega. Ela não tem FK para a solicitação, então a trilha é preservada mesmo após exclusão.
- O `requestId` da requisição de aprovação vira o **`correlationId`** do evento e é enviado no header `X-Correlation-Id`: dá para seguir a operação do clique do usuário até o sistema externo, cruzando os logs estruturados dos dois lados.
- O `historico_status` registra a decisão (comentário e data) e a tela de detalhe mostra a situação da integração.
- O histórico registra o **usuário** responsável por cada mudança de status, inclusive a aprovação que gerou o evento.
- Evolução: tracing distribuído com OpenTelemetry.

**Como evitaria impacto na experiência do usuário caso o sistema externo estivesse indisponível?**
A aprovação **não depende** do sistema externo: o usuário recebe a confirmação assim que a transação local é concluída, e a entrega acontece em segundo plano. Uma indisponibilidade externa só atrasa a notificação, que é reenviada automaticamente quando o sistema volta. A interface mostra o estado da integração (pendente, enviado ou falha) no detalhe da solicitação, com transparência e sem bloquear o fluxo. Para testar a falha, basta apontar `INTEGRACAO_URL` para um endereço inexistente e observar as retentativas no log.

---

## 8. Testes

```bash
cd sicredi-backend
npm test
```

- **Unitários (49)**: máquina de estados, cálculo de backoff, validação e mensagens dos DTOs, regras do serviço (transições, autor no histórico, bloqueio de edição, concorrência, 404), worker de integração (sucesso, reagendamento, esgotamento) e autenticação (hash de senha, login, usuário inicial e guard JWT com token ausente, adulterado, expirado e válido).
