# server

API base com Fastify, TypeScript e Sequelize (MySQL).

Porta local padrao da API: `3333`.

## Documentacao formal

- [Features BDD (Gherkin)](docs/features/) — 3 features cobrindo
  autenticacao, mercado e batalha, com cenarios mapeados para rotas e
  services reais.
- [User Stories](docs/user-stories.md) — 3 user stories detalhadas
  (login convidado, ranking, itens) com criterios de aceite e DoD.
- [Diagramas UML](docs/diagrams/) — classes, sequencias (login e jogar
  rodada) e atividade da campanha em Mermaid, renderizados direto no GitHub.
- [Plano de acao consolidado](docs/PLANO_DE_ACAO.md) — RF001-014,
  RN001-013 e sprint planning do server.
- [Plano de apresentacao final](docs/PLANO_APRESENTACAO_FINAL.md) —
  cronograma da entrega de 23/06.

## Requisitos

- Node.js 20+
- Yarn 1.x
- Docker

## Como iniciar

1. Instale as dependencias:

```bash
yarn install
```

2. Crie seu arquivo de ambiente:

```bash
cp .env.example .env
```

3. Suba o MySQL:

```bash
yarn db:up
```

4. Aplique as migrations:

```bash
yarn db:migrate
```

5. Inicie a API em modo desenvolvimento:

```bash
yarn dev
```

API local: `http://localhost:3333`

Documentacao Swagger: `http://localhost:3333/docs`

## Comandos uteis

```bash
yarn db:logs            # logs do MySQL
yarn db:down            # derruba containers e rede
yarn typecheck          # tsc --noEmit
yarn lint               # eslint
yarn test               # executa todos os testes (unit + integration)
yarn test:watch         # vitest em watch mode
yarn test:coverage      # cobertura com v8
yarn test:integration   # apenas suites em src/__tests__/integration
yarn i18n:check         # valida paridade de chaves entre pt-BR e en
yarn build              # compila para dist/
```

O contrato usado pelo frontend esta documentado em
[`docs/api-equipe.md`](docs/api-equipe.md).

## Internacionalizacao

Toda mensagem de erro, descricao de rota e texto de Swagger passa pelo plugin
[`src/plugins/i18n.ts`](src/plugins/i18n.ts), que usa `i18next` com
`i18next-fs-backend`. Os locales ficam em
[`src/i18n/locales/<locale>/<namespace>.json`](src/i18n/locales) e os namespaces
ativos sao: `common`, `auth`, `equipe`, `itens`, `mercado`, `partida`,
`ranking`, `simulador`, `abilities` e `swagger`.

### Adicionar um novo locale

1. Criar a pasta `src/i18n/locales/<locale>/` (ex.: `es`).
2. Copiar todos os arquivos `.json` do `pt-BR` e traduzir os valores
   mantendo a estrutura de chaves exatamente igual.
3. Registrar o locale no plugin (`src/plugins/i18n.ts`) atualizando
   `supportedLngs`.
4. Rodar `yarn i18n:check` para garantir paridade com o `pt-BR`.

### Adicionar uma nova chave em namespace existente

1. Acrescente a chave em **todos** os locales (`pt-BR` e `en`) preservando o
   path hierarquico (`namespace.errors.MEU_CODE`, por exemplo).
2. Consuma via `req.t('namespace:path.subpath', { variavel })` (ver
   [`src/plugins/errorHandler.ts`](src/plugins/errorHandler.ts) para o padrao
   de erro com `code` + `params`).
3. Atualize ou adicione testes em `src/i18n` / `src/plugins/i18n.test.ts`
   conforme necessario.

### Rodar a checagem de paridade

```bash
yarn i18n:check
```

O script [`scripts/check-i18n.mjs`](scripts/check-i18n.mjs) percorre os
namespaces de `pt-BR` (base) e compara com `en`. Falha (exit 1) listando as
chaves faltantes em cada lado. Roda no CI.

### Mapping completo de erros

Veja [`docs/i18n-errors.md`](docs/i18n-errors.md) para a tabela definitiva
`ErrorCode` -> chave de i18n por namespace.

## Swagger

A spec OpenAPI vive em [`src/plugins/swagger.ts`](src/plugins/swagger.ts). Os
schemas compartilhados ficam em
[`src/plugins/swagger.schemas.ts`](src/plugins/swagger.schemas.ts) e sao
registrados com `app.addSchema({ $id, ... })` para que tanto o serializer
quanto o validador (`Ajv`) consigam resolver `$ref: '<Nome>#'`. A UI fica em
`http://localhost:3333/docs`.

### Documentar uma nova rota

1. Defina o schema de resposta em `swagger.schemas.ts` exportando um objeto
   com `$id` unico (ex.: `MeuRecurso`).
2. Na rota, importe o ref:

   ```ts
   const meuRecursoRef = { $ref: 'MeuRecurso#' } as const;
   ```

3. No `schema` da rota Fastify, preencha `tags`, `summary`, `description`
   (usando `tSwagger('<namespace>.<chave>')`) e os `response` codes:

   ```ts
   {
     schema: {
       tags: ['MinhaTag'],
       summary: tSwagger('minhaTag.criar.summary'),
       description: tSwagger('minhaTag.criar.description'),
       response: { 200: meuRecursoRef, 400: { $ref: 'ErrorResponse#' } }
     }
   }
   ```

4. Adicione as chaves de texto em
   `src/i18n/locales/<locale>/swagger.json` (manter paridade pt-BR/en).
5. Confirme com `yarn dev` em `http://localhost:3333/docs`.

### Adicionar uma nova tag

1. Acrescente a entrada em `tags: [...]` dentro de `registerSwagger`
   (`src/plugins/swagger.ts`).
2. Adicione `tags.<minhatag>` em `swagger.json` para cada locale.

## Testes

Estrutura em [`src/__tests__/`](src/__tests__):

- `factories/` — geradores de fixtures (`user`, `team`, `athlete`, `item`).
- `helpers/` — utilitarios como `buildApp()` e `sequelizeStub`.
- `integration/` — suites end-to-end usando `app.inject()` com o Fastify
  inteiro registrado (`auth.int.test.ts`, `equipe.int.test.ts`,
  `partida.int.test.ts`).
- Testes unitarios convivem com o codigo em
  `src/modules/<modulo>/<arquivo>.test.ts`.

```bash
yarn test                # roda tudo
yarn test:watch          # watch mode
yarn test:coverage       # gera coverage/ via v8
yarn test:integration    # apenas src/__tests__/integration
```

Nomenclatura: arquivos de teste seguem `<arquivo>.test.ts` (unit) ou
`<modulo>.int.test.ts` (integration). Suites descrevem o sujeito
(`describe('rodadaService', ...)`) e os casos comecam com o comportamento
esperado (`it('lanca SNAPSHOT_FORBIDDEN quando snapshot e de outro user')`).

## Erros

O server segue um padrao unico de erro de dominio:

1. **`ServiceError`** (`src/modules/<modulo>/<modulo>.service.ts`) carrega
   `code: ErrorCode` (enum em
   [`src/modules/shared/errorCodes.ts`](src/modules/shared/errorCodes.ts)),
   `status` HTTP e `params` opcionais para interpolacao i18n.
2. **`errorHandler`** global
   ([`src/plugins/errorHandler.ts`](src/plugins/errorHandler.ts)) intercepta
   qualquer erro, resolve a chave via `req.t('<namespace>:errors.<code>', params)`
   e responde no formato `{ code, message }`.
3. **Rotas** lancam `ServiceError`s direto, sem `try/catch` redundantes; o
   handler cuida do mapeamento HTTP e da traducao.

Para adicionar um novo erro:

1. Inclua o code em `ErrorCode` (`src/modules/shared/errorCodes.ts`).
2. Crie/atualize a mensagem em `errors.<CODE>` de cada locale do namespace
   correto.
3. Lance `throw new ServiceError(ErrorCode.MeuCode, 422, { detalhe })` no
   service.
4. Atualize [`docs/i18n-errors.md`](docs/i18n-errors.md).

## Deploy (Railway + MySQL plugin)

A API roda no [Railway](https://railway.com) usando Nixpacks como builder e o
plugin MySQL gerenciado nativo do proprio Railway.

URL publica:

- API: `https://autosoccer-api-production.up.railway.app`
- Swagger UI: `https://autosoccer-api-production.up.railway.app/docs`
- Health check: `https://autosoccer-api-production.up.railway.app/health`

### Arquivos relevantes

- [`.env.production.example`](.env.production.example): template das variaveis de
  ambiente para o painel do Railway.
- [`src/database/config.cjs`](src/database/config.cjs): a Sequelize CLI aceita tanto
  `DATABASE_URL` (PaaS) quanto vars individuais (`DB_HOST`/`DB_USER`/etc).

### Variaveis de ambiente em producao

| Variavel         | Onde definir               | Valor                                                                                           |
| ---------------- | -------------------------- | ----------------------------------------------------------------------------------------------- |
| `NODE_ENV`       | Railway Variables          | `production`                                                                                    |
| `APP_HOST`       | Railway Variables          | `0.0.0.0`                                                                                       |
| `PORT`           | Railway Variables          | `3000` (Railway expoe a porta interna automaticamente)                                          |
| `CORS_ORIGIN`    | Railway Variables          | URL do frontend (ex.: `https://autosoccer.vercel.app`) — `*` ou vazio quebra o boot em producao |
| `DATABASE_URL`   | Railway Variables          | `${{MySQL.MYSQL_URL}}` (referencia ao plugin MySQL)                                             |
| `DB_SSL`         | Railway Variables          | `false` (MySQL plugin nao exige SSL na rede interna)                                            |
| `JWT_SECRET`     | Railway Variables (secret) | gerar com `openssl rand -base64 48`                                                             |
| `JWT_EXPIRES_IN` | Railway Variables          | `7d`                                                                                            |

### Passos para subir no Railway

1. Criar um **New Project > Empty Project** em https://railway.com.
2. Adicionar o plugin **+ New > Database > MySQL** (o plugin expoe `MYSQL_URL`).
3. Adicionar o servico **+ New > GitHub Repo > AutoSoccer/server** (Railway detecta
   Node.js via Nixpacks).
4. Em **Settings > Build**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run db:migrate && node dist/index.js`
5. Em **Variables**, configurar todas as vars da tabela acima — em especial
   `DATABASE_URL=${{MySQL.MYSQL_URL}}` e `CORS_ORIGIN` com a URL real do front.
6. Em **Settings > Networking**, clicar em **Generate Domain**.
7. Validar:
   - `GET /health` retorna `200` com `{ status: 'ok' }`.
   - `GET /docs` exibe o Swagger UI.

### Deploy continuo (auto-deploy)

A cada `git push origin main`, o Railway reconstroi e publica via webhook do
GitHub. Para deploy rapido sem commit, use a Railway CLI:

```bash
npm install -g @railway/cli
railway login
railway link        # dentro de server/, selecionar o service autosoccer-api
railway up          # upload direto + build + deploy
```

### Monitoramento (UptimeRobot)

Para checar uptime gratuitamente, configurar um monitor em
[UptimeRobot](https://uptimerobot.com):

1. Criar conta e novo monitor do tipo **HTTP(s)**.
2. URL: `https://autosoccer-api-production.up.railway.app/health`.
3. Intervalo: 5 minutos.

### Smoke test pos-deploy

```bash
# Registrar usuario
curl -X POST https://autosoccer-api-production.up.railway.app/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"Demo@1234","name":"Demo"}'

# Login
curl -X POST https://autosoccer-api-production.up.railway.app/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"Demo@1234"}'

# Listar mercado (use o token do login)
curl https://autosoccer-api-production.up.railway.app/market \
  -H 'Authorization: Bearer <token>'

# Jogar uma rodada
curl -X POST https://autosoccer-api-production.up.railway.app/match/play-round \
  -H 'Authorization: Bearer <token>'
```

### Smoke test local antes do deploy

```bash
yarn install
yarn build
NODE_ENV=production \
  DATABASE_URL="mysql://user:password@host:3306/auto_soccer" \
  JWT_SECRET="$(openssl rand -base64 48)" \
  CORS_ORIGIN="http://localhost:3000" \
  APP_HOST=0.0.0.0 \
  PORT=3333 \
  node dist/index.js
```
