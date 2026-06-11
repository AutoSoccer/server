# Contribuindo com o server

Este guia define as convencoes em vigor no repositorio `server` do AutoSoccer.
Vale para tudo que entrar em `main` (ou em branches de integracao do grupo).

## Branches

Use sempre um dos prefixos abaixo + slug curto + numero do workstream:

- `feat/ws-XX-<slug>` — nova feature
- `fix/ws-XX-<slug>` — bug fix
- `test/ws-XX-<slug>` — adicao/refatoracao de testes
- `docs/ws-XX-<slug>` — documentacao (README, CONTRIBUTING, docs/)
- `chore/ws-XX-<slug>` — build, CI, dependencias, mexidas internas
- `refactor/ws-XX-<slug>` — refatoracao sem mudanca de comportamento

Exemplos: `feat/ws-04-swagger-rotas-equipe`,
`docs/ws-12-readme-ci-conventions`.

Branches de integracao usam o padrao `integration/grupo-N` e recebem merges
dos workstreams antes do PR para `main`.

## Conventional Commits (pt-BR, sem acentos)

Formato: `<tipo>(<escopo opcional>): <descricao no imperativo, ate 72 chars>`.

Tipos aceitos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`,
`ci`, `perf`, `build`, `wip` (apenas para snapshots intermediarios).

Regras:

- Tudo em portugues, **sem acentos** no titulo.
- Descricao no imperativo (`adiciona`, `corrige`, `remove`).
- Escopo opcional: nome do modulo, dominio ou workstream
  (`feat(auth): ...`, `chore(ci): ...`).
- Corpo opcional para detalhar o "porque"; respeita quebra em ~72 colunas.
- **Nunca** inclua `Co-Authored-By` automatico nos commits do projeto.
- **Nunca** rode com `--no-verify` ou `--no-gpg-sign` salvo pedido explicito.

Exemplos:

```text
feat(equipe): adiciona endpoint POST /equipe/snapshot
fix(simulador): impede divisao por zero quando time fica sem atletas
docs(server): atualiza README com secao de i18n
chore(ci): adiciona GitHub Actions com lint, typecheck e tests
test(partida): cobre cenario de empate na rodada
```

## Antes de abrir PR

Rode localmente, na raiz de `server/`:

```bash
yarn lint
yarn typecheck
yarn i18n:check
yarn test
```

O CI (`.github/workflows/ci.yml`) roda exatamente esses passos + `yarn build`
em Node 20. PRs com qualquer step vermelho nao podem ser merge-ados.

## Adicionar uma nova rota Swagger + i18n

1. Defina o schema de resposta em
   [`src/plugins/swagger.schemas.ts`](src/plugins/swagger.schemas.ts) com
   `$id` unico.
2. Na rota Fastify, importe o ref:

   ```ts
   const meuRef = { $ref: 'MeuRecurso#' } as const;
   ```

3. Preencha o `schema` com `tags`, `summary` e `description` apontando para
   chaves de i18n via `tSwagger('...')`:

   ```ts
   app.post(
     '/recurso',
     {
       schema: {
         tags: ['MinhaTag'],
         summary: tSwagger('minhaTag.criar.summary'),
         description: tSwagger('minhaTag.criar.description'),
         response: { 201: meuRef, 400: { $ref: 'ErrorResponse#' } }
       }
     },
     handler
   );
   ```

4. Adicione os textos em
   `src/i18n/locales/pt-BR/swagger.json` **e** em `en/swagger.json` (paridade
   obrigatoria — `yarn i18n:check`).
5. Se existir nova tag, registre em `registerSwagger` em
   `src/plugins/swagger.ts`.
6. Confirme a UI rodando `yarn dev` e abrindo `http://localhost:3333/docs`.

## Padrao de erros

1. Adicione o code em
   [`src/modules/shared/errorCodes.ts`](src/modules/shared/errorCodes.ts).
2. Adicione a mensagem em `errors.<CODE>` no namespace correto para `pt-BR`
   e `en`.
3. Lance `throw new ServiceError(ErrorCode.X, status, params)` no service.
4. Nao envolva com `try/catch` na rota — o
   [`errorHandler`](src/plugins/errorHandler.ts) traduz e responde.
5. Atualize [`docs/i18n-errors.md`](docs/i18n-errors.md) com o novo mapping.

## Testes

- **Unit**: ao lado do codigo, sufixo `.test.ts`.
- **Integration**: em `src/__tests__/integration/<modulo>.int.test.ts` usando
  `buildApp()` + `app.inject()`.
- **Factories**: reutilize / estenda os geradores em
  `src/__tests__/factories/`.
- Nomenclatura: `describe('<sujeito>')` + `it('<comportamento esperado>')`.
- Para suite integration, rode `yarn test:integration` antes de subir.

## Variaveis sensiveis

- Nunca comite `.env`, segredos, JWTs reais ou dumps do banco.
- Para deploy, secrets vao via Render Dashboard (`DATABASE_URL`,
  `JWT_SECRET`).
