# Cheat Sheet de Defesa — Back-end

> **Integrante:** Pedro Henrique Silva Guligurski
> **Disciplina:** Experiencia Criativa BSI PUCPR 2026/1
> **Apresentacao:** 23/06/2026 — defesa individual obrigatoria
> **Documento irmao:** [`ARQUITETURA_SERVER.md`](./ARQUITETURA_SERVER.md) — fonte da verdade tecnica
> **Ultima revisao:** 20/06/2026 (alinhada com codigo real apos varredura — todas as respostas batem com `server/src/`)

10 perguntas previsiveis da banca com respostas curtas (2-4 linhas, ~30s de fala). Use como roteiro mental, nao leia literal. Se uma pergunta nao for sua area, redirecione: "essa parte foi conduzida pelo Lucas Stopinski (front) / Lucas Bruno (infra), mas conheco a decisao."

---

## 1. Por que Fastify e nao Express?
Fastify e cerca de 2x mais rapido em throughput por causa do `find-my-way` e da serializacao via schema. Plugin system e mais previsivel — encapsulamento real com `register` cria escopo, em Express middlewares sao globais por padrao — e a validacao via JSON Schema reaproveita o mesmo objeto que documenta o Swagger. Express exigiria celebrate + express-openapi para o mesmo efeito.

## 2. Como funcionam as stored procedures dos relatorios?
Temos **3 stored procedures** registradas via migration unica (`20260610220000-create-reports-stored-procedures.cjs`):
- **`sp_get_top_athletes_by_role(role, limit)`** — top atletas por posicao tatica, ordenados por **poder bruto** (`attack + defense + velocity`).
- **`sp_team_power_ranking(limit)`** — ranking de equipes pelo somatorio do poder dos atletas + metricas de campanha (vitorias, derrotas, trofeus).
- **`sp_market_overview()`** — visao agregada do mercado: totais globais, breakdown por tier e por posicao. Emite **3 SELECTs** em sequencia.

Centralizamos as agregacoes no banco em vez de espalhar `JOIN`s pelo TypeScript — assim conseguimos tunar indices sem deploy de aplicacao, basta nova migration. Chamadas no service com `sequelize.query('CALL sp_nome(?)', { replacements: [...], type: QueryTypes.SELECT })`. Migration reversa implementada com `DROP PROCEDURE`.

## 3. Quais validacoes os schemas do Fastify fazem? (e por que Zod nao e usado no back)
Validacao no back e em **dois niveis**:
- **Forma:** os **JSON Schema do Fastify** validam body, params e querystring na entrada — retornam **400 BAD REQUEST** antes de chegar no controller. O mesmo schema serve para o Swagger via `@fastify/swagger`, sem duplicacao.
- **Semantica:** regras de negocio que dependem de estado do banco (ex: "atleta ja esta no time", "saldo insuficiente", "snapshot vazio") vivem nos services como **erros tipados por modulo** — cada service tem sua propria `ServiceError` (ex: `RodadaServiceError`, `EquipeServiceError`, `MercadoServiceError`) com `code` tipado.

**Zod nao e usado no back** — fica restrito ao front nos forms de login/cadastro. No back nao precisariamos: ja temos JSON Schema para forma e erros tipados para semantica.

## 4. Como funciona o JWT com roles?
Payload do token tem **3 claims**: `id` do usuario, `nickname` e `role` (enum `'user'` / `'admin'`). Convidados e cadastros normais recebem `'user'`; contas admin so sao criadas direto no banco (sem rota publica de promocao — decisao de seguranca). Plugin `@fastify/jwt` decora `request.user` apos validar a assinatura. Em `auth.middleware.ts` temos `requireAuth` (qualquer logado) e `requireRole('admin')`. Rota admin que recebe token user retorna **403 FORBIDDEN com mensagem traduzida** via i18next.

## 5. Como rodam as migrations Sequelize?
Sequelize CLI com pasta `server/src/database/migrations/`. Cada migration tem `up` e `down` — toda mudanca e reversivel. No CI rodamos `yarn db:migrate` antes dos testes de integration. Em prod o deploy e no **Railway**: o `Start Command` configurado e `npm run db:migrate && node dist/index.js`, entao as migrations rodam **antes** do servidor subir — se falhar, a versao antiga continua no ar. O plugin MySQL nativo do Railway expoe `DATABASE_URL` via `${{MySQL.MYSQL_URL}}`. `sync: false` esta hardcoded no Sequelize — nunca confiamos em auto-sync de schema.

## 6. Como funciona o seed (runDatabaseSeeds)?
Arquivo unico `server/src/database/seed.ts` (nao pasta) — **idempotente**, usa `findOrCreate` e `count` para checar se ja existe antes de inserir. Cria as entidades base do jogo: usuario admin padrao (`admin@autosoccer.dev` com role `'admin'`), catalogo de atletas com habilidades, catalogo de itens, usuarios convidados/bots para o matchmaking ter adversarios, e times com lineup pre-montado. Roda no boot do server em dev (chamada do `index.ts`) e via comando manual em prod quando preciso resetar. Usa transactions para rollback automatico em caso de falha parcial.

## 7. Como voce documentou as rotas (Swagger)?
Cada rota tem `schema: { tags, summary, description, body, response }` que o `@fastify/swagger` converte em OpenAPI 3.0. Os schemas compartilhados vivem num **arquivo unico** em `server/src/plugins/swagger.schemas.ts`, sao registrados via `app.addSchema()` e referenciados nas rotas por `$ref`. Os textos (summaries, descriptions) sao **externalizados em i18n** nos arquivos `src/i18n/locales/<locale>/swagger.json` — Swagger UI muda de idioma com o `Accept-Language`. Endpoint WebSocket (`/ws/battle/:matchId`) nao aparece no Swagger UI (limitacao do OpenAPI 3.0 — nao suporta WebSocket nativo), mas e documentado na tag "WebSocket" e na descricao do `POST /match/play`. UI em `/docs`.

## 8. Como funciona o i18next no back?
Plugin `i18next-fs-backend` carrega os **10 namespaces** de `server/src/i18n/locales/{pt-BR,en}/*.json` — `auth`, `common`, `equipe`, `itens`, `mercado`, `partida`, `ranking`, `simulador`, `abilities` e `swagger`. Middleware le `Accept-Language` da request e decora `request.i18n.t`. Mensagens de erro usam keys como `equipe.errors.athlete_not_found` que sao resolvidas no `ErrorHandler`. Script `yarn i18n:check` valida paridade entre os dois idiomas — o CI quebra se faltar uma chave em algum lado.

## 9. Como voce lida com erros (estrutura por modulo)?
Padrao **uma classe de erro por modulo**, todas extendendo uma `ServiceError` base (`src/modules/auth/auth.service.ts:51`). Hoje temos `RankingServiceError`, `SimuladorServiceError`, `RodadaServiceError`, `CampaignServiceError`, `ItemServiceError`, `MercadoServiceError`, `MatchmakingError`, `EquipeServiceError`, `TeamSnapshotError`, `ReportsServiceError`, `SeedError`, `ConfigError`. Cada uma tem um **enum de `code` tipado** (ex: `RodadaServiceErrorCode`) e status HTTP correto. O `ErrorHandler` global em `src/plugins/errorHandler.ts` captura via `setErrorHandler`, traduz a chave i18n via `i18next` baseado no `Accept-Language` da request e responde JSON consistente `{ error: { code, message } }`. Erros do Fastify (validacao de schema, 404 de rota) tambem sao normalizados pro mesmo formato. Stack trace so vai em dev.

## 10. O que voce mudaria se comecasse de novo?
Adotaria **Drizzle ORM** no lugar do Sequelize — tipo gerado a partir do schema do banco evita o `as any` que aparece em queries com raw SQL e tem migrations mais ergonomicas. E investiria em um seed mais elaborado com **Faker** para popular massa de teste, em vez dos atletas fixos que temos hoje — isso teria facilitado os testes de matchmaking e de balanceamento.

---

> Documento mantido por Pedro Guligurski (com varredura de alinhamento codigo↔fala feita por Lucas Stopinski em 20/06/2026).
