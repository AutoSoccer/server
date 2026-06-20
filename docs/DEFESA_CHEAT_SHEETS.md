# Cheat Sheets de Defesa de Autoria — AutoSoccer

> **Disciplina:** Experiencia Criativa BSI PUCPR 2026/1
> **Apresentacao:** 23/06/2026 — defesa individual obrigatoria
> **Equipe:** Lucas Stopinski (front), Pedro Guligurski (back), Lucas Bruno (infra/QA)

Cada secao traz 10 perguntas previsiveis com respostas curtas (2-4 linhas, ~30s de fala). Use como roteiro mental, nao leia literal. Se uma pergunta nao for sua area, redirecione: "essa parte foi conduzida pelo X, mas conheco a decisao."

---

## Lucas Stopinski da Silva — Front-end

### 1. Por que Next.js App Router e nao Pages Router?
App Router e o modelo recomendado desde a versao 13 e da SSR por padrao com Server Components, que reduz JS no cliente. Layouts aninhados simplificam o `ProfileCorner` e o `ThemeProvider` ficarem em `app/layout.tsx` sem prop drilling. Pages Router ja esta em modo de manutencao e perderia suporte de bibliotecas novas como next-intl 4.

### 2. Como funciona o SSR de tema (dark mode) sem FOUC?
O tema vem de um cookie `THEME` lido no `app/layout.tsx` que e Server Component. Antes do React montar, ja escrevemos `data-theme="dark"` no `<html>` e as CSS vars resolvem o visual correto. Nao usamos `useEffect` para aplicar tema — isso causaria flash de tela branca.

### 3. Como o i18n e resolvido (server vs client)?
No server, `next-intl` le o cookie `NEXT_LOCALE` ou cai no Accept-Language para escolher o namespace. As mensagens chegam no client como prop do `NextIntlClientProvider` no layout. Componentes server usam `getTranslations()`, client usam `useTranslations()` — mesma API, contextos diferentes.

### 4. Como voce testou os componentes (RTL + Vitest)?
Criei um helper `renderWithProviders` que injeta `NextIntlClientProvider` em pt-BR (com os 9 namespaces pre-carregados), o `AntdProvider` e o `AuthProvider`. Mocks reutilizaveis para axios, localStorage e router em `src/__tests__/mocks/`. Cada teste foca em comportamento — "ao clicar em Comprar, dispara o axios.post correto" — em vez de implementacao. Vitest 4 roda em **happy-dom** (cerca de 2x mais rapido que jsdom), com cobertura V8 medindo branches e linhas. Hoje: ~94% de cobertura, 144 testes em 19 arquivos.

### 5. Por que antd 6 e nao Tailwind ou Material?
antd 6 ja resolve tres coisas que precisariamos integrar a mao com Tailwind: componentes acessiveis (Form, Modal, Drawer), theming nativo com tokens (essencial pro dark mode) e i18n integrado nos componentes de data e numero. Material teria curva maior e bundle mais pesado.

### 6. Como funciona o drag-and-drop do mercado?
Uso a **API nativa de Drag and Drop do HTML5** — sem biblioteca externa. O `AthleteMarketItem` tem atributo `draggable` e handler `onDragStart` que grava o ID no `dataTransfer`. Cada slot do campo tem `onDragOver` (permite soltar) e `onDrop` (le o ID e dispara a compra). Estado local `dragOverId` controla o highlight visual. Decidi nao usar `react-dnd` porque o caso e simples (1 tipo arrastavel para 1 tipo destino) — a lib traria ~30kb e contextos que nao pagariam o custo, ~50 linhas de handlers nativos resolveram.

### 7. Como o frontend autentica (JWT cookie ou localStorage)?
**localStorage com Bearer token no header `Authorization`** — decisao consciente de simplicidade para o contexto academico. O backend devolve `{ token, user }` no body do `/auth/login`, o front salva em `localStorage` e o `AuthContext` atualiza o estado. Um interceptor de request do axios injeta `Authorization: Bearer <token>` em todo request automaticamente. Se vier 401, o interceptor de response limpa o localStorage e redireciona para `/auth/login` via `window.location.href` (reset completo do estado React). Em producao real, migrar para cookie httpOnly + `SameSite=Lax` + `Secure` seria o proximo passo de seguranca contra XSS.

### 8. Como voce lida com hidratacao (use client vs server components)?
Por padrao tudo e server component. Marco `"use client"` so quando preciso de hook (useState, useEffect, useDrag) ou evento. Componentes de leitura — listas, headers estaticos — ficam server. O `ThemeProvider` e o `ProfileCorner` sao client porque dependem de interacao, mas o layout pai e server.

### 9. Como funciona o ProfileCorner + ThemeSwitcher + LanguageSwitcher?
Sao tres client components. O `ProfileCorner` e o container — renderiza `ThemeSwitcher` + `LanguageSwitcher` + avatar com dropdown (Profile/Market/Logout) e tem click-outside via `useEffect` no `mousedown` global. Os dois switchers tem mecanismos **diferentes**:
- **ThemeSwitcher:** ao clicar, atualiza `data-theme` direto no `<html>` via `setAttribute`, grava o cookie `NEXT_THEME` e atualiza o estado local. **Nao precisa de refresh do server** — as CSS vars sao reativas e o navegador repinta na hora. O cookie e so para o proximo SSR ficar consistente.
- **LanguageSwitcher:** grava o cookie `NEXT_LOCALE` e da **`window.location.reload()`** (dentro de `useTransition` para desabilitar o botao durante a transicao). Reload completo e necessario porque as mensagens do `next-intl` sao carregadas pelo servidor por request — trocar em runtime exigiria refazer toda a carga; mais simples deixar o servidor montar tudo novo no idioma novo.

### 10. O que voce mudaria se comecasse de novo?
Eu adotaria Tanstack Query desde o dia 1 — fizemos cache manual com `useState` e isso virou bug em duas telas. Tambem teria padronizado os DTOs com Zod no front (hoje sao tipos TS soltos) pra validar respostas da API e pegar mudancas de contrato cedo.

---

## Pedro Henrique Silva Guligurski — Back-end

### 1. Por que Fastify e nao Express?
Fastify e cerca de 2x mais rapido em throughput por causa do `find-my-way` e da serializacao via schema. Plugin system e mais previsivel — encapsulamento real com `register` — e a validacao via JSON Schema reaproveita o mesmo objeto que documenta o Swagger. Express exigiria celebrate + express-openapi para o mesmo efeito.

### 2. Como funciona a stored procedure dos relatorios?
Temos **3 stored procedures** registradas via migration unica (`20260610220000-create-reports-stored-procedures.cjs`):
- `sp_get_top_athletes_by_role(role, limit)` — top atletas por posicao tatica, ordenados por **poder bruto** (`attack + defense + velocity`).
- `sp_team_power_ranking(limit)` — ranking de equipes pelo somatorio do poder dos atletas + metricas de campanha (vitorias, derrotas, trofeus).
- `sp_market_overview()` — visao agregada do mercado: totais globais, breakdown por tier e por posicao. Emite **3 SELECTs** em sequencia.

Centralizamos as agregacoes no banco em vez de espalhar `JOIN`s pelo TypeScript — assim conseguimos tunar indices sem deploy de aplicacao, basta nova migration. Chamadas no service com `sequelize.query('CALL sp_nome(?)', { replacements: [...], type: QueryTypes.SELECT })`. Migration reversa implementada com `DROP PROCEDURE`.

### 3. Quais validacoes os schemas do Fastify fazem? (Zod nao e usado no back)
Validacao no back e em **dois niveis**:
- **Forma:** os **JSON Schema do Fastify** validam body, params e querystring na entrada — retornam **400 BAD REQUEST** antes de chegar no controller. O mesmo schema serve para o Swagger via `@fastify/swagger`, sem duplicacao.
- **Semantica:** regras de negocio que dependem de estado do banco (ex: "atleta ja esta no time", "saldo insuficiente", "snapshot vazio") vivem nos services como **erros tipados por modulo** — cada service tem sua propria `ServiceError` (ex: `RodadaServiceError`, `EquipeServiceError`, `MercadoServiceError`) com `code` tipado.

**Zod nao e usado no back** — fica restrito ao front nos forms de login/cadastro. No back nao precisariamos: ja temos JSON Schema para forma e erros tipados para semantica.

### 4. Como funciona o JWT com roles?
Payload do token tem **3 claims**: `id` do usuario, `nickname` e `role` (enum `'user'` / `'admin'`). Convidados e cadastros normais recebem `'user'`; contas admin so sao criadas direto no banco (sem rota publica de promocao — decisao de seguranca). Plugin `@fastify/jwt` decora `request.user` apos validar a assinatura. Em `auth.middleware.ts` temos `requireAuth` (qualquer logado) e `requireRole('admin')`. Rota admin que recebe token user retorna **403 FORBIDDEN com mensagem traduzida** via i18next.

### 5. Como rodam as migrations Sequelize?
Sequelize CLI com pasta `server/src/database/migrations/`. Cada migration tem `up` e `down` — toda mudanca e reversivel. No CI rodamos `yarn db:migrate` antes dos testes de integration. Em prod o deploy e no **Railway**: o `Start Command` configurado e `npm run db:migrate && node dist/index.js`, entao as migrations rodam **antes** do servidor subir — se falhar, a versao antiga continua no ar. O plugin MySQL nativo do Railway expoe `DATABASE_URL` via `${{MySQL.MYSQL_URL}}`. `sync: false` esta hardcoded no Sequelize — nunca confiamos em auto-sync de schema.

### 6. Como funciona o seed (runDatabaseSeeds)?
Arquivo unico `server/src/database/seed.ts` (nao pasta) — **idempotente**, usa `findOrCreate` e `count` para checar se ja existe antes de inserir. Cria as entidades base do jogo: usuario admin padrao (`admin@autosoccer.dev` com role `'admin'`), catalogo de atletas com habilidades, catalogo de itens, usuarios convidados/bots para o matchmaking ter adversarios, e times com lineup pre-montado. Roda no boot do server em dev (chamada do `index.ts`) e via comando manual em prod quando preciso resetar. Usa transactions para rollback automatico em caso de falha parcial.

### 7. Como voce documentou as rotas (Swagger)?
Cada rota tem `schema: { tags, summary, description, body, response }` que o `@fastify/swagger` converte em OpenAPI 3.0. Os schemas compartilhados vivem num **arquivo unico** em `server/src/plugins/swagger.schemas.ts`, sao registrados via `app.addSchema()` e referenciados nas rotas por `$ref`. Os textos (summaries, descriptions) sao **externalizados em i18n** nos arquivos `src/i18n/locales/<locale>/swagger.json` — Swagger UI muda de idioma com o `Accept-Language`. Endpoint WebSocket (`/ws/battle/:matchId`) nao aparece no Swagger UI (limitacao do OpenAPI 3.0 — nao suporta WebSocket nativo), mas e documentado na tag "WebSocket" e na descricao do `POST /match/play`. UI em `/docs`.

### 8. Como funciona o i18next no back?
Plugin `i18next-fs-backend` carrega os **10 namespaces** de `server/src/i18n/locales/{pt-BR,en}/*.json` — `auth`, `common`, `equipe`, `itens`, `mercado`, `partida`, `ranking`, `simulador`, `abilities` e `swagger`. Middleware le `Accept-Language` da request e decora `request.i18n.t`. Mensagens de erro usam keys como `equipe.errors.athlete_not_found` que sao resolvidas no `ErrorHandler`. Script `yarn i18n:check` valida paridade entre os dois idiomas — o CI quebra se faltar uma chave em algum lado.

### 9. Como voce lida com erros (estrutura por modulo)?
Padrao **uma classe de erro por modulo**, todas extendendo uma `ServiceError` base (`src/modules/auth/auth.service.ts:51`). Hoje temos `RankingServiceError`, `SimuladorServiceError`, `RodadaServiceError`, `CampaignServiceError`, `ItemServiceError`, `MercadoServiceError`, `MatchmakingError`, `EquipeServiceError`, `TeamSnapshotError`, `ReportsServiceError`, `SeedError`, `ConfigError`. Cada uma tem um **enum de `code` tipado** (ex: `RodadaServiceErrorCode`) e status HTTP correto. O `ErrorHandler` global em `src/plugins/errorHandler.ts` captura via `setErrorHandler`, traduz a chave i18n via `i18next` baseado no `Accept-Language` da request e responde JSON consistente `{ error: { code, message } }`. Erros do Fastify (validacao de schema, 404 de rota) tambem sao normalizados pro mesmo formato. Stack trace so vai em dev.

### 10. O que voce mudaria se comecasse de novo?
Adotaria Drizzle ORM no lugar do Sequelize — tipo gerado a partir do schema do banco evita o `as any` que aparece em queries com raw SQL. E investiria em um seed mais elaborado com Faker para popular massa de teste, em vez dos 10 atletas fixos que temos hoje.

---

## Lucas Bruno e Silva — Infraestrutura / QA

### 1. Como funciona o pipeline CI/CD (GitHub Actions)?
Workflow `.github/workflows/ci.yml` roda em PR e push na main. Jobs: `lint` (ESLint + Prettier check), `typecheck` (tsc --noEmit), `i18n:check` (script custom de paridade), `test` (vitest com cobertura uploadada pro Sonar) e `build` (next build / fastify bundle). Cache de `node_modules` via `actions/cache`. Falhou um job, falhou o PR.

### 2. Como o front e deployado (Vercel)?
Vercel conectado ao repo via GitHub App. Cada PR gera um preview deployment com URL unica — usamos pra QA visual. Merge na main dispara deploy de producao. Env vars `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_SENTRY_DSN` configuradas no painel da Vercel, separadas por ambiente (preview vs production).

### 3. Como o back e deployado (Railway + plugin MySQL)?
A API roda no **Railway** usando **Nixpacks** como builder e o **plugin MySQL nativo** do Railway (sem Docker custom). O servico esta configurado com Build Command `npm install && npm run build` e Start Command `npm run db:migrate && node dist/index.js` — migrations rodam **antes** do servidor subir, se falhar a versao antiga continua no ar. Auto-deploy a cada `git push origin main` via webhook do GitHub. `DATABASE_URL` injetado via `${{MySQL.MYSQL_URL}}` (referencia ao plugin). URL publica: `https://autosoccer-api-production.up.railway.app`. Para deploy manual rapido sem commit, uso a Railway CLI (`railway up`).

### 4. Como voce monitora producao (UptimeRobot)?
Tres monitors no UptimeRobot free: `https://api.autosoccer.app/health` (HTTP 200, ping 5min), `https://autosoccer.vercel.app` (HTTP 200, ping 5min) e cert SSL com alert 7 dias antes de expirar. Alertas vao para o canal Discord da equipe. Status publico em `https://stats.uptimerobot.com/autosoccer`.

### 5. Como funciona o SonarCloud (cobertura, qualidade)?
SonarCloud conectado aos dois repos. CI envia `coverage/lcov.info` apos os testes. Quality gate exige: cobertura nova >= 80%, zero bugs criticos, zero vulnerabilidades, debt ratio < 5%. Badge no README do server e do front mostra status atual. Pull request com gate falhando nao pode mergeada (branch protection).

### 6. Como funciona o Conventional Commits + branch naming?
Commits no padrao `tipo(escopo): descricao` em pt-BR sem acentos — tipos `feat`, `fix`, `chore`, `docs`, `refactor`, `test`. Husky + commitlint validam local. Branches no padrao `tipo/ws-XX-slug` (workstream) ou `tipo/slug` (apresentacao). Documentado em `server/CONTRIBUTING.md` e `front/AGENTS.md`.

### 7. Como o time gerencia sprints (TDE formal)?
GitHub Project central com kanban (To do / In progress / Done) e milestones por sprint (1 a 5). Cada workstream WS-01 a WS-16 virou issue com criterios de aceite. Retrospectivas escritas em `server/docs/sprints/sprint-N.md` cobrindo "o que deu certo", "o que melhorar" e "acoes". TDE formal no PLANO_DE_ACAO.md.

### 8. Como funcionam os user stories em formato BDD/Gherkin?
Tres `.feature` files em `server/docs/features/`: autenticacao, mercado e batalha. Cada feature tem cenarios `Given / When / Then` cobrindo happy path e erro (ex: "credenciais invalidas"). Tres user stories em `server/docs/user-stories.md` no formato "As X, I want Y, so that Z" com criterios de aceite e DoD.

### 9. Como voce prova rastreabilidade (US ↔ commit ↔ teste)?
Cada user story tem um ID (US-01, US-02, US-03). Branch e commit referenciam o ID na descricao: `feat(ws-04): US-02 listar atletas no mercado`. Teste correspondente tem `describe('US-02 - mercado', ...)`. PR no merge linka issue do GitHub Project, fechando o ciclo. README explica o fluxo na secao "Como contribuir".

### 10. O que voce mudaria se comecasse de novo?
Teria configurado o GitHub Project e os Conventional Commits desde a sprint 1 — fizemos retroativo e algumas issues nao casaram 100% com os commits antigos. Tambem teria investigado mais cedo a documentacao "as code" do Railway (`railway.toml` com config versionada em vez de configurar Build/Start Command no painel) — funcionou bem, mas evitariamos pequenas divergencias entre "o que o painel mostra" e "o que o repo descreve".

---

> Documento mantido por Lucas Stopinski. Ultima atualizacao: 10/06/2026.
