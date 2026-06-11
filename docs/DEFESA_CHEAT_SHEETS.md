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

Criei um helper `renderWithProviders` que injeta `NextIntlClientProvider`, `ConfigProvider` do antd e router mockado. Cada teste foca em comportamento — "ao clicar em Comprar, dispara o axios.post correto" — em vez de implementacao. Vitest roda em jsdom, com cobertura V8 medindo branches e linhas.

### 5. Por que antd 6 e nao Tailwind ou Material?

antd 6 ja resolve tres coisas que precisariamos integrar a mao com Tailwind: componentes acessiveis (Form, Modal, Drawer), theming nativo com tokens (essencial pro dark mode) e i18n integrado nos componentes de data e numero. Material teria curva maior e bundle mais pesado.

### 6. Como funciona o drag-and-drop do mercado?

Uso `react-dnd` com backend HTML5 para desktop. O atleta na reserva e um `useDrag` source com payload `{ athleteId, fromSlot }`; o slot do campo e um `useDrop` target que valida posicao compativel. Ao soltar, disparo `PATCH /team/lineup` e atualizo o estado otimisticamente — se falhar, faco rollback.

### 7. Como o frontend autentica (JWT cookie ou localStorage)?

Cookie httpOnly setado pelo backend no `/auth/login`, com `SameSite=Lax` e `Secure` em prod. Evita XSS porque o JS nao acessa o token, e o axios envia automaticamente com `withCredentials: true`. localStorage seria vulneravel e exigiria injecao manual em todo request.

### 8. Como voce lida com hidratacao (use client vs server components)?

Por padrao tudo e server component. Marco `"use client"` so quando preciso de hook (useState, useEffect, useDrag) ou evento. Componentes de leitura — listas, headers estaticos — ficam server. O `ThemeProvider` e o `ProfileCorner` sao client porque dependem de interacao, mas o layout pai e server.

### 9. Como funciona o ProfileCorner + ThemeSwitcher + LanguageSwitcher?

Sao tres client components que ficam no `Header` global. `ProfileCorner` mostra avatar e dropdown; `ThemeSwitcher` chama uma server action que reescreve o cookie `THEME` e da `router.refresh()`; `LanguageSwitcher` faz o mesmo com `NEXT_LOCALE`. Refresh garante que as mensagens novas venham do server.

### 10. O que voce mudaria se comecasse de novo?

Eu adotaria Tanstack Query desde o dia 1 — fizemos cache manual com `useState` e isso virou bug em duas telas. Tambem teria padronizado os DTOs com Zod no front (hoje sao tipos TS soltos) pra validar respostas da API e pegar mudancas de contrato cedo.

---

## Pedro Henrique Silva Guligurski — Back-end

### 1. Por que Fastify e nao Express?

Fastify e cerca de 2x mais rapido em throughput por causa do `find-my-way` e da serializacao via schema. Plugin system e mais previsivel — encapsulamento real com `register` — e a validacao via JSON Schema reaproveita o mesmo objeto que documenta o Swagger. Express exigiria celebrate + express-openapi para o mesmo efeito.

### 2. Como funciona a stored procedure dos relatorios?

A SP `sp_relatorio_top_atletas` recebe `periodo_dias` e retorna top 10 atletas com mais compras nas ultimas N rodadas, agregando `purchase_log` com JOIN em `athletes`. Foi criada via migration Sequelize com `CREATE PROCEDURE`, com migration reversa fazendo `DROP PROCEDURE`. Chamada no service com `sequelize.query` e modo `SELECT`.

### 3. Quais validacoes o Zod e os schemas do Fastify fazem?

Os schemas do Fastify validam body, params e querystring na entrada — retornam 400 com mensagem antes de chegar no controller. Zod e usado dentro de services para validacoes de regra de negocio que dependem de estado do banco (ex: "atleta ja esta no time"). Schema vale para forma, Zod para semantica.

### 4. Como funciona o JWT com roles?

Payload do token tem `userId`, `email` e `role` (enum user/admin). Plugin `@fastify/jwt` decora `request.user` apos validar assinatura. Criei `auth.middleware.ts` com `requireAuth` (qualquer logado) e `requireRole('admin')` (so admin). Rota admin que recebe token user retorna 403 com mensagem traduzida.

### 5. Como rodam as migrations Sequelize?

Sequelize CLI com pasta `server/migrations/`. Cada migration tem `up` e `down`. No CI rodamos `yarn db:migrate` antes dos testes de integration. Em prod, o Start Command do Railway (`npm run db:migrate && node dist/index.js`) garante que migrations rodam antes do server subir. `sync: false` esta hardcoded — nunca confiamos em auto-sync.

### 6. Como funciona o seed (runDatabaseSeeds)?

Funcao `runDatabaseSeeds` em `server/src/database/seed/` que e idempotente — verifica se ja existe antes de inserir. Cria: 1 admin padrao, 10 atletas base, 5 itens, 1 usuario convidado. Roda no boot do server em dev, e via comando manual em prod. Cada seed usa transaction para rollback automatico se falhar.

### 7. Como voce documentou as rotas (Swagger)?

Cada rota tem `schema: { tags, summary, description, body, response }` que o `@fastify/swagger` converte em OpenAPI 3.0. 11 schemas vivem em `server/src/schemas/` e sao reaproveitados por `$ref`. Swagger UI esta em `/docs` em ambiente nao-prod, e o JSON cru em `/docs/json`.

### 8. Como funciona o i18next no back?

Plugin `i18next-fs-backend` carrega os 9 namespaces de `server/src/i18n/locales/{pt-BR,en}/*.json`. Middleware le `Accept-Language` e seta `request.i18n.t`. Mensagens de erro usam keys como `errors.athlete.not_found` que sao resolvidas no `ErrorHandler`. Script `yarn i18n:check` valida paridade entre idiomas.

### 9. Como voce lida com erros (errors.ts, labels.ts)?

Criei classes em `errors.ts`: `AppError`, `NotFoundError`, `ValidationError`, `ForbiddenError` — cada uma com status HTTP fixo e chave i18n. O `ErrorHandler` global do Fastify captura, traduz via i18next e responde JSON consistente `{ error: { code, message } }`. Stack trace so vai em dev. `labels.ts` centraliza chaves para evitar typo.

### 10. O que voce mudaria se comecasse de novo?

Adotaria Drizzle ORM no lugar do Sequelize — tipo gerado a partir do schema do banco evita o `as any` que aparece em queries com raw SQL. E investiria em um seed mais elaborado com Faker para popular massa de teste, em vez dos 10 atletas fixos que temos hoje.

---

## Lucas Bruno e Silva — Infraestrutura / QA

### 1. Como funciona o pipeline CI/CD (GitHub Actions)?

Workflow `.github/workflows/ci.yml` roda em PR e push na main. Jobs: `lint` (ESLint + Prettier check), `typecheck` (tsc --noEmit), `i18n:check` (script custom de paridade), `test` (vitest com cobertura uploadada pro Sonar) e `build` (next build / fastify bundle). Cache de `node_modules` via `actions/cache`. Falhou um job, falhou o PR.

### 2. Como o front e deployado (Vercel)?

Vercel conectado ao repo via GitHub App. Cada PR gera um preview deployment com URL unica — usamos pra QA visual. Merge na main dispara deploy de producao. Env vars `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_SENTRY_DSN` configuradas no painel da Vercel, separadas por ambiente (preview vs production).

### 3. Como o back e deployado (Railway + auto-deploy)?

Railway provisiona via Nixpacks (Node 20) com plugin MySQL gerenciado nativo. Cada `git push origin main` aciona webhook do GitHub que reconstroi a imagem, roda `db:migrate` no Start Command e sobe o container. Para deploy rapido sem commit uso `railway up` da CLI. Healthcheck em `/health` valida cada deploy automaticamente — falha o healthcheck, falha o deploy. URL publica em `autosoccer-api-production.up.railway.app`.

### 4. Como voce monitora producao (UptimeRobot)?

Tres monitors no UptimeRobot free: `https://autosoccer-api-production.up.railway.app/health` (HTTP 200, ping 5min), `https://autosoccer.vercel.app` (HTTP 200, ping 5min) e cert SSL com alert 7 dias antes de expirar. Alertas vao para o canal Discord da equipe. Status publico em `https://stats.uptimerobot.com/autosoccer`.

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

Teria configurado o GitHub Project e os Conventional Commits desde a sprint 1 — fizemos retroativo e algumas issues nao casaram 100% com os commits antigos. Tambem teria comecado pelo Railway desde o inicio: perdemos tempo com Render (yarn no build) e Cloudways (root-owned $HOME no stack PHP) antes de migrar para o Railway, que entregou tudo em <30 min.

---

> Documento mantido por Lucas Stopinski. Ultima atualizacao: 10/06/2026.
