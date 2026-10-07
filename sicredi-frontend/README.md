# sicredi-frontend

Interface web de gestão de solicitações internas (Next.js 16 + Tailwind CSS 4).

Instruções completas e decisões técnicas: veja o [README principal](../README.md).

```bash
cp .env.example .env.local   # API_URL aponta para a API NestJS
npm install
npm run dev                  # http://localhost:3000
```

## Estrutura

```
src/
├── app/
│   ├── login/                        # Tela e Server Actions de login/logout
│   ├── sessao-expirada/route.ts      # Apaga o cookie quando a API recusa o token
│   ├── page.tsx                      # Dashboard
│   ├── solicitacoes/page.tsx         # Listagem com busca, filtros e ordenação
│   ├── solicitacoes/nova/            # Cadastro
│   ├── solicitacoes/[id]/            # Detalhe, análise/decisão, histórico, integração
│   ├── solicitacoes/[id]/editar/     # Edição
│   ├── solicitacoes/actions.ts       # Server Actions (mutações)
│   └── error.tsx · not-found.tsx · loading.tsx
├── components/                       # Formulários, badges, paginação, navegação
├── proxy.ts                          # Redireciona ao login quem não tem sessão
└── lib/
    ├── api.ts                        # Cliente da API (somente servidor, envia o JWT)
    ├── sessao.ts · token.ts          # Leitura do cookie de sessão
    ├── types.ts                      # Contratos e rótulos
    └── format.ts                     # Datas e percentuais
```

A API é chamada apenas no servidor (Server Components e Server Actions); o navegador nunca acessa a API diretamente.
