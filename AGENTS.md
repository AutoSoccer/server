# AutoSoccer Server — guia do agente

> Agentes (humanos ou Claude) que vao mexer neste repo: leia este guia antes
> de tocar codigo. Ele resume a stack, as convencoes vigentes e como executar
> as tarefas mais comuns sem quebrar contratos com o front ou a paridade i18n.

## Stack atual

- **Node.js 20+** (Railway usa Nixpacks com Node detectado pelo `package.json`).
- **Fastify 5** com plugin system (encapsulamento via `register`).
- **TypeScript 5** em modo `strict`.
- **Sequelize 6** + **MySQL 8** (`sync: false` hardcoded — nunca auto-sync).
- **`@fastify/jwt`** para autenticacao JWT (`{ id, nickname, role }` no payload).
- **`@fastify/websocket`** para o stream da batalha (`/ws/battle/:matchId`).
- **`@fastify/swagger`** + **`@fastify/swagger-ui`** — UI em `/docs`.
- **i18next** com `i18next-fs-backend` — 10 namespaces, paridade pt-BR/en.
- **Vitest 4** com `vitest --run` (sem watch por default no CI).

Lockfile oficial e o `yarn.lock`. Nao use npm para instalar.

## Layout do repo

```
src/
  app.ts                 build do Fastify (registra plugins + rotas + i18n)
  index.ts               entrypoint que sobe o server na porta certa
  config/
    env.ts               valida env vars (CORS_ORIGIN em prod nao pode ser *)
  database/
    config.cjs           Sequelize CLI (aceita DATABASE_URL ou DB_HOST etc)
    migrations/          .cjs reversiveis (up + down)
    models/              models Sequelize
    seed.ts              seed idempotente (admin, atletas, itens, bots)
  i18n/
    locales/{pt-BR,en}/  9 namespaces de runtime + swagger.json
  modules/
    auth/                registro, login, perfil, conta convidado
    equipe/              time, compra/venda, snapshots
    itens/               catalogo + compra + aplicacao
    matchmaking/         encontra adversario por victory_ratio
    mercado/             janela rotativa por usuario
    partida/             motor de batalha, REST + WebSocket
    ranking/             listagem por trofeus
    reports/             relatorios admin via stored procedures
    simulador/           motor puro (sem I/O, sem DB) — testavel
    admin/               listagem de usuarios (role admin)
    shared/              utilitarios compartilhados
  plugins/
    errorHandler.ts      normaliza ServiceError + erros do Fastify
    i18n.ts              middleware Accept-Language
    swagger.ts           registro do Swagger UI
    swagger.schemas.ts   schemas compartilhados via app.addSchema()
  __tests__/             setup do vitest + helpers
scripts/check-i18n.mjs   paridade pt-BR x en
```

## Convencoes

- **Branches**: `feat|fix|test|docs|chore|refactor/ws-XX-<slug>` +
  integracoes em `integration/grupo-N`.
- **Commits**: Conventional Commits em **pt-BR sem acentos**, titulo <= 72
  chars, imperativo (`adiciona`, `corrige`). Sem `Co-Authored-By` desde a
  Sprint 4. Detalhes em [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **Erros**: cada modulo tem sua `ServiceError` (ex: `RodadaServiceError`)
  com `code` tipado. O `ErrorHandler` global traduz via i18next e responde
  `{ error: { code, message } }`.
- **Validacao**: forma com JSON Schema do Fastify (vira Swagger de graca),
  semantica com `ServiceError` nos services. **Zod nao e usado aqui** — fica
  restrito ao front nos forms.
- **Testes**: nome igual ao arquivo testado (`servico.test.ts`).
  `describe` descreve o sujeito; `it` descreve o comportamento esperado.
  Suites de integration sobem MySQL via Docker Compose (`docker-compose.yml`).
- **Imports**: alias `@/*` configurado no `tsconfig` aponta para `src/*`.

## Comandos uteis

```bash
yarn dev                # tsx watch em http://localhost:3333
yarn build              # tsc -> dist/
yarn start              # node dist/index.js (producao)
yarn lint               # eslint
yarn typecheck          # tsc --noEmit (idem CI)
yarn test               # vitest run
yarn test:watch         # vitest watch
yarn test:coverage      # cobertura v8 (gera lcov pro SonarCloud)
yarn i18n:check         # paridade pt-BR x en (CI quebra se faltar chave)
yarn db:up              # sobe MySQL via docker-compose
yarn db:migrate         # aplica migrations
yarn db:seed            # roda seed manual
```

Pipeline CI esperado (Node 20): `yarn install --frozen-lockfile`, `yarn lint`,
`yarn typecheck`, `yarn i18n:check`, `yarn test:coverage`, `yarn build`.

## Como adicionar uma rota i18n-friendly

1. Criar `src/modules/<modulo>/<modulo>.routes.ts` (ou adicionar handler em rota existente).
2. Definir o `schema` da rota com `body`, `params`, `querystring`, `response` — esse mesmo objeto **vira a documentacao Swagger automaticamente**.
3. Implementar o handler no `<modulo>.service.ts`. Para erros de regra de negocio:
   ```ts
   throw new EquipeServiceError(
     EquipeServiceErrorCode.AthleteNotFound,
     422,
     { athleteId },
   );
   ```
4. Adicionar a chave de erro em `src/i18n/locales/pt-BR/<namespace>.json` **e** `en/<namespace>.json` (mesma key, traducao diferente).
5. Para namespace novo: registrar em `src/plugins/i18n.ts` e adicionar arquivo `.json` nos dois locales.
6. Rodar `yarn i18n:check`.

## Como criar uma migration nova

```bash
npx sequelize-cli migration:generate --name <nome-em-kebab>
# edite o arquivo .cjs criado em src/database/migrations/
yarn db:migrate          # aplica
yarn db:migrate:undo     # reverte (testa o `down`!)
```

**Regra:** toda migration tem `up` E `down`. Sem `down` reversivel, nao mergeia.

## Como criar uma stored procedure

Mesma migration, dentro do `up`:

```js
await queryInterface.sequelize.query(`
  DROP PROCEDURE IF EXISTS sp_nome;
  CREATE PROCEDURE sp_nome(IN p_arg INT)
  BEGIN
    SELECT ...;
  END
`);
```

E no `down`:

```js
await queryInterface.sequelize.query('DROP PROCEDURE IF EXISTS sp_nome;');
```

Chamada no service:

```ts
const rows = await sequelize.query(
  'CALL sp_nome(?)',
  { replacements: [42], type: QueryTypes.SELECT },
);
```

## Deploy

Producao roda no **Railway** com auto-deploy a cada `git push origin main`.
Plugin MySQL gerenciado expoe `DATABASE_URL` via `${{MySQL.MYSQL_URL}}`.
Detalhes completos (Build/Start Commands, env vars) no
[README.md](README.md#deploy-railway--mysql-plugin).

## Integracao com o front

- Front esperado em `http://localhost:3000` (dev) ou `https://autosoccer.vercel.app` (prod).
- O `CORS_ORIGIN` em prod **nao pode ser `*`** — boot do server quebra (guard em `src/config/env.ts`).
- Contratos consumidos por `src/services/*` no front via axios. Shape de erro: `{ error: { code, message } }` documentado em [`docs/i18n-errors.md`](docs/i18n-errors.md).
- Auth: JWT enviado pelo front em `Authorization: Bearer <token>` (localStorage no front, nao cookie httpOnly).

## WebSocket de batalha

- `POST /match/play` cria a partida e devolve `matchId` + `wsUrl`.
- Cliente abre WS em `/ws/battle/:matchId?token=<jwt>` (token vai por query param porque a browser WebSocket API nao suporta headers customizados).
- Server emite `{ type: "turn", data: TurnEvent }` x 12 com sleep de 800ms, depois `{ type: "result", data: MatchResponse }` via `sendAndClose` (garante que a ultima mensagem sai antes do socket fechar).
- Store em memoria (`match-stream.store.ts`) com TTL de 60s — buffer para o streaming, **nao** persiste eventos no banco (resultado ja persistido em `POST /match/play`).

### Validar WebSocket sem abrir o front

```bash
node scripts/test-ws-battle.mjs                          # contra producao (Railway)
node scripts/test-ws-battle.mjs --base=http://localhost:3333  # contra dev local
```

Script faz fluxo completo: `/auth/guest` -> `/team/buy-athlete` x N -> `/match/play` -> conecta WS e imprime cada turno com `kind` (move/tackle/shot), `success%` e descricao traduzida. Util para defesa de autoria ("WebSocket realmente esta funcionando") e debug rapido se a batalha nao chegar no front.
