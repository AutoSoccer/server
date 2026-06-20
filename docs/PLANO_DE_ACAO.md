# 📋 AutoSoccer — Plano de Ação (i18n · Swagger · Testes · Publicação)

> Documento de planejamento técnico para a próxima fase do projeto AutoSoccer (PUCPR).
> Cada **workstream** abaixo é auto-contido e pode ser executado por um agente isolado.
> Repositórios envolvidos: `server/` (Fastify + Sequelize + MySQL) e `front/` (Next.js 16 + React 19).

---

## 1. Resumo Executivo

O AutoSoccer possui base sólida (TypeScript strict, ESLint, Fastify + Sequelize no server, Next.js 16 + React 19 no front), porém apresenta **quatro lacunas críticas** que precisam ser endereçadas em paralelo:

1. **Internacionalização ausente** — 250+ strings hardcoded no front, 90+ no server, todas em pt-BR misturadas com inglês inconsistentemente.
2. **Cobertura Swagger em 75%** — 3 rotas de Equipe sem schema, 3 tags (Equipe, Itens, Ranking) não declaradas, e ausência de schemas reutilizáveis em `components.schemas`.
3. **Cobertura de testes server em 20%** — módulos críticos (auth, mercado, ranking, matchmaking `findOpponentSnapshot`) totalmente descobertos.
4. **Cobertura zero de testes no front** — sem framework instalado.

Este plano divide o trabalho em **13 workstreams** auto-contidos (WS-01 a WS-13), com dependências explícitas e **três grupos de paralelismo**, priorizando primeiro a infra (WS-01 error handler, WS-02 i18n server, WS-07 i18n front, WS-09 vitest front) para destravar as frentes de execução.

**Estimativa global:** 65–90 horas de trabalho distribuído.

---

## 2. Estado Atual (Snapshot)

| Eixo | Estado |
|---|---|
| **Saúde geral** | TS strict em ambos, ESLint mínimo, 6 throws de Error cru no server, sem `setErrorHandler` global, README/AGENTS.md desatualizados |
| **Swagger** | OpenAPI 3.0.3 em `/docs`; 12/16 rotas completas (75%); 1 parcial (`GET /itens`); 3 ausentes (rotas Equipe); 3 tags não declaradas |
| **Testes server** | 20% (8 arquivos sobre 40 fontes); auth/mercado/ranking/matchmaking críticos descobertos |
| **Testes front** | 0% — nenhum framework instalado |
| **i18n server** | 0 lib; 40+ erros + 18+ validações + 35+ Swagger + 50+ seeds hardcoded; mistura pt-BR/en |
| **i18n front** | 0 lib; 250+ strings em 7 páginas + 2 componentes + 11 validações Zod; sem locale routing |

---

## 3. Convenções Transversais (obrigatórias para todos os agentes)

### 3.1 Chaves i18n
- Padrão: `modulo.entidade.acao` em camelCase
- Exemplos: `auth.login.invalidCredentials`, `equipe.comprarAtleta.saldoInsuficiente`, `mercado.refresh.success`

### 3.2 Estrutura de arquivos i18n
```
server/src/i18n/locales/<locale>/<namespace>.json
front/src/i18n/messages/<locale>/<namespace>.json
```
Locales suportados: **`pt-BR` (default)** e **`en`**.
Fallback chain: lang requisitado → pt-BR → chave literal.

### 3.3 Detecção de locale
- **Server**: header `Accept-Language` → querystring `?lang=` → default `pt-BR`. Helper `req.t(key, params)` decorado no Fastify.
- **Front**: `next-intl` com routing baseado em **cookie** (`NEXT_LOCALE`), **sem `[locale]` segment** (não quebra rotas atuais).

### 3.4 Erros do server
- **SEMPRE** usar subclasses de `ServiceError` com `code` apontando para chave i18n.
- **Proibido**: `throw new Error('texto')`.

### 3.5 Tags Swagger padronizadas
`Auth`, `Mercado`, `Equipe`, `Itens`, `Partida`, `Ranking`, `Sistema` — todas declaradas em `swagger.ts` com descrição i18n.

### 3.6 Schemas Swagger reutilizáveis (`components.schemas`)
`ErrorResponse`, `AuthResponse`, `UserResponse`, `Athlete`, `MarketResponse`, `TeamResponse`, `SnapshotPosition`, `RodadaResult`, `RankingEntry`, `Item`, `Ability` — rotas referenciam via `$ref: '#/components/schemas/<Nome>'`.

### 3.7 Toda rota protegida
Declara `security: [{ BearerAuth: [] }]` e inclui responses 400/401/403/404 conforme aplicável, todas referenciando `ErrorResponse`.

### 3.8 Nomenclatura de testes
- **Server**: `<modulo>.<tipo>.test.ts` ao lado do fonte; integração em `src/__tests__/integration/<modulo>.int.test.ts`.
- **Front**: co-located `<componente>.test.tsx` ou `<modulo>.test.ts`; helpers em `src/__tests__/setup.ts` e `src/__tests__/utils/renderWithProviders.tsx`.

### 3.9 Framework de testes
- **Server**: `vitest` (já tem) + `@vitest/coverage-v8`.
- **Front**: `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `happy-dom`.

### 3.10 Cobertura mínima
- Server: 60% lines/branches
- Front: 50% lines/branches
- Provider `v8` no `vitest.config.ts`

### 3.11 Padrão de mocks
- Front: `vi.mock('@/providers/api')` para axios.
- Server: `vi.mock('../../database/models')` para Sequelize.
- Factories em `__tests__/factories/<entidade>.ts`.

### 3.12 Conventional Commits (pt-BR)
- `feat(i18n): adiciona infra next-intl`
- `test(auth): cobre login e register`
- `docs(swagger): documenta rotas de equipe`

### 3.13 Branches
- `feat/ws-XX-<slug-curto>` (ex: `feat/ws-02-i18n-server`, `test/ws-10-services-front`).

---

## 4. Grupos de Paralelismo

| Grupo | Workstreams (rodam em paralelo) | Pré-requisito |
|---|---|---|
| **Grupo 1** (infra) | WS-01 · WS-05 · WS-07 · WS-09 · WS-13 | — |
| **Grupo 2** (execução) | WS-02 · WS-04 · WS-06 · WS-08 · WS-10 · WS-11 | Grupo 1 |
| **Grupo 3** (fechamento) | WS-03 · WS-12 | Grupo 2 |

---

## 5. Workstreams

### WS-01 — Infra de erros tipados e error handler global do Fastify

- **Repo:** `server`
- **Objetivo:** Padronizar tratamento de erros para destravar i18n centralizada e documentação consistente, eliminando throws crus.
- **Depende de:** —
- **Estimativa:** 6–8h
- **Branch:** `feat/ws-01-error-handler-server`

#### Tarefas
- [ ] Refatorar `src/modules/simulador/simulador.service.ts` (linhas 148, 721, 757) para usar `SimuladorServiceError` com codes (`simulador.noReceiverAvailable`, `simulador.invalidTotalTurns`, `simulador.ballHolderNotFound`).
- [ ] Criar classe `SimuladorServiceError` seguindo padrão das 9 já existentes.
- [ ] Substituir `throw new Error()` em `src/database/seed.ts` e `src/config/env.ts` por erros tipados.
- [ ] Criar `src/plugins/errorHandler.ts` registrando `fastify.setErrorHandler()` mapeando `ServiceError` → status code + payload `{ code, message, details? }`.
- [ ] Registrar plugin em `src/app.ts` após swagger e antes das rotas.
- [ ] Remover try/catch redundantes em `mercado.routes.ts`, `equipe.routes.ts`, `itens.routes.ts`, `partida.routes.ts`.
- [ ] Criar enum `ErrorCode` em `src/modules/shared/errorCodes.ts`.

#### Critérios de aceite
- `grep -R 'throw new Error' src/` retorna zero ocorrências em módulos de negócio.
- Qualquer endpoint que erra responde com `{ code, message }` unificado.
- `yarn test` e `yarn typecheck` passam.

#### Arquivos
- **Criar:** `src/plugins/errorHandler.ts`, `src/modules/shared/errorCodes.ts`, `src/modules/simulador/simulador.errors.ts`
- **Tocar:** `src/app.ts`, `src/modules/simulador/simulador.service.ts`, `src/database/seed.ts`, `src/config/env.ts`, `src/modules/{mercado,equipe,itens,partida}/*.routes.ts`

#### Risco
Quebrar respostas que o front depende — alinhar com WS-08.

---

### WS-02 — Infraestrutura de i18n no server (Fastify + Accept-Language)

- **Repo:** `server`
- **Objetivo:** Instalar i18next no server com namespaces por módulo, decorator `req.t()` e parsing de Accept-Language.
- **Depende de:** WS-01
- **Estimativa:** 8–10h
- **Branch:** `feat/ws-02-i18n-server`
- **Libs:** `i18next`, `i18next-fs-backend`, `i18next-http-middleware`

#### Tarefas
- [ ] Instalar deps.
- [ ] Criar `src/i18n/locales/pt-BR/{common,auth,mercado,equipe,itens,partida,ranking,simulador,swagger}.json` e replicar para `en/`.
- [ ] Criar `src/plugins/i18n.ts`: inicializa i18next, registra middleware, decora `req.t` e `req.locale`, ordem `header > querystring > default`.
- [ ] Registrar plugin em `src/app.ts` antes de `errorHandler`.
- [ ] Mapear 90+ strings da auditoria para chaves; preencher pt-BR + traduzir en.
- [ ] Refatorar services para que erros contenham apenas `code` — mensagem resolve no error handler.
- [ ] Atualizar error handler para usar `req.t(error.code, error.params)`.
- [ ] Adicionar script `i18n:check` validando paridade pt-BR/en (em `scripts/check-i18n.ts`).

#### Critérios de aceite
- Request com `Accept-Language: en` retorna erro em inglês.
- Sem header retorna pt-BR.
- `yarn i18n:check` reporta zero divergências.
- Sem strings hardcoded em services (grep).

#### Risco
Volume grande — mitigado pelo script `i18n:check`.

---

### WS-03 — i18n de Swagger e dados de seed

- **Repo:** `server`
- **Objetivo:** Externalizar descrições Swagger e textos de seed (habilidades, itens) para i18n.
- **Depende de:** WS-02
- **Estimativa:** 5–6h
- **Branch:** `feat/ws-03-i18n-swagger-seed`

#### Tarefas
- [ ] Refatorar `src/plugins/swagger.ts` para usar `i18next.t('swagger:*')`.
- [ ] Mover `summary`/`description` de cada `*.routes.ts` para chaves `swagger:<modulo>.<endpoint>.*`.
- [ ] Adicionar `nameKey`/`descriptionKey` em itens e habilidades no `seed.ts`.
- [ ] Definir e documentar estratégia para nomes de atletas (manter literais ou pool por locale).
- [ ] Atualizar `seed.test.ts`.

#### Critérios de aceite
- `/docs` com locale `en` exibe descrições em inglês.
- Spec OpenAPI em `/docs/json` contém strings traduzidas.
- Seed funciona em ambiente novo.

#### Risco
Swagger gera spec uma vez na inicialização — pode exigir geração por requisição.

---

### WS-04 — Documentação Swagger completa: schemas reutilizáveis + rotas de Equipe

- **Repo:** `server`
- **Objetivo:** Elevar Swagger de 75% → 100%, declarar tags faltantes, centralizar schemas em `components.schemas`.
- **Depende de:** WS-01
- **Estimativa:** 6–8h
- **Branch:** `feat/ws-04-swagger-completo`

#### Tarefas
- [ ] Adicionar tags `Equipe`, `Itens`, `Ranking`, `Sistema` em `swagger.ts`.
- [ ] Criar `src/plugins/swagger.schemas.ts` exportando `components.schemas` com 11 schemas reutilizáveis (`ErrorResponse`, `AuthResponse`, `UserResponse`, `Athlete`, `MarketResponse`, `TeamResponse`, `SnapshotPosition`, `RodadaResult`, `RankingEntry`, `Item`, `Ability`).
- [ ] Documentar `GET /equipe`, `POST /equipe/comprar-atleta`, `POST /equipe/vender-atleta`.
- [ ] Adicionar `response.200` em `GET /itens`.
- [ ] Refatorar rotas para usar `$ref` em lugar de schemas inline.

#### Critérios de aceite
- `/docs` mostra 16 rotas, todas com tag, summary, security e responses.
- Spec OpenAPI válida em https://editor.swagger.io sem warnings.
- `components.schemas` com ≥11 schemas.

#### Risco
Refator pode quebrar validação Fastify — testar cada rota.

---

### WS-05 — Testes server: auth, mercado, equipe, itens

- **Repo:** `server`
- **Objetivo:** Cobrir 4 services críticas atualmente descobertas, atingindo ≥60%.
- **Depende de:** —
- **Estimativa:** 10–12h
- **Branch:** `test/ws-05-services-server`
- **Libs:** `@vitest/coverage-v8`

#### Tarefas
- [ ] Atualizar `vitest.config.ts` com `coverage.provider = 'v8'` + thresholds (60/60/60).
- [ ] Criar `src/__tests__/factories/{user,team,athlete,item}.ts`.
- [ ] Criar `auth.service.test.ts`: `registerUser`, `loginUser`, `createGuest`, `getMe` com casos OK/erro.
- [ ] Criar `auth.middleware.test.ts`: token ausente/expirado/válido.
- [ ] Criar `mercado.service.test.ts`: geração, refresh, saldo.
- [ ] Criar `equipe.service.test.ts`: `getMyTeam`, `buyAthlete`, `sellAthlete`.
- [ ] Criar `itens.service.test.ts`: compra + aplicação + stack.
- [ ] Adicionar script `test:coverage`.

#### Critérios de aceite
- `yarn test:coverage` passa com thresholds.
- Cada service tem ≥1 caso sucesso + 2 casos erro.

#### Risco
Mocks de Sequelize complexos — investir em factories.

---

### WS-06 — Testes server: matchmaking, rodada e integração

- **Repo:** `server`
- **Objetivo:** Fechar lacunas em `findOpponentSnapshot` (RN006), `rodada.service` e adicionar testes de integração via `app.inject()`.
- **Depende de:** WS-05
- **Estimativa:** 10–12h
- **Branch:** `test/ws-06-matchmaking-integracao`

#### Tarefas
- [ ] Estender `matchmaking.service.test.ts`: janelas crescentes de `victory_ratio`, ordenação por `rounds_played`, filtros, fallback bot.
- [ ] Criar `rodada.service.test.ts`: ausência de time/atletas, snapshot de outro user, sucesso com trofeus/moedas.
- [ ] Criar helper `src/__tests__/helpers/buildApp.ts` (Fastify isolado, models mockados).
- [ ] Criar `auth.int.test.ts`, `equipe.int.test.ts`, `partida.int.test.ts` via `app.inject()`.
- [ ] Adicionar script `test:integration`.

#### Critérios de aceite
- `findOpponentSnapshot` com ≥4 cenários de janela + fallback.
- `yarn test:integration` roda sem MySQL real.
- Cobertura global server ≥50%.

#### Risco
`inject()` exige montar plugins reais — mockar models corretamente.

---

### WS-07 — Infra de i18n no front (next-intl + cookie)

- **Repo:** `front`
- **Objetivo:** Instalar next-intl com routing baseado em cookie (sem `[locale]` segment).
- **Depende de:** —
- **Estimativa:** 8–10h
- **Branch:** `feat/ws-07-i18n-front`
- **Libs:** `next-intl`

#### Tarefas
- [ ] Instalar `next-intl` (compatível com Next 16 + App Router).
- [ ] Criar `src/i18n/config.ts` (`locales`, `defaultLocale`).
- [ ] Criar `src/i18n/request.ts` (loader server-side detectando cookie `NEXT_LOCALE` ou `Accept-Language`).
- [ ] Criar `src/i18n/messages/<locale>/<namespace>.json` para `common, home, auth, profile, game, battle, ranking, errors, validation`.
- [ ] Criar `src/i18n/messages/index.ts` (merge dos namespaces).
- [ ] Atualizar `layout.tsx`: envolver com `NextIntlClientProvider`, `lang` dinâmico, `metadata` via `getTranslations`.
- [ ] Criar `LanguageSwitcher.tsx` (alterna cookie + reload) e integrar em `ProfileCorner`.
- [ ] Configurar `next.config.ts` com `createNextIntlPlugin('./src/i18n/request.ts')`.
- [ ] Script `i18n:check` validando paridade.

#### Critérios de aceite
- App renderiza pt-BR default e troca para en via switcher (cookie persiste).
- `useTranslations('namespace')` funciona em client components.
- `getTranslations()` funciona em server components e `metadata`.

#### Risco
Next.js 16 + next-intl sem `[locale]` segment — ler docs antes.

---

### WS-08 — Migração de strings hardcoded das páginas/componentes do front

- **Repo:** `front`
- **Objetivo:** Substituir as 250+ strings hardcoded pelas chaves de WS-07.
- **Depende de:** WS-07
- **Estimativa:** 10–12h
- **Branch:** `feat/ws-08-i18n-paginas-front`

#### Tarefas
- [ ] Migrar `app/page.tsx` (Home): modal, botões, notice (`home.*`).
- [ ] Migrar `app/auth/login/page.tsx`, `app/auth/register/page.tsx` (`auth.*`).
- [ ] Migrar `app/profile/page.tsx` (`profile.*`).
- [ ] Migrar `app/game/MarketPage.tsx` (`game.market.*`, `errors.*`).
- [ ] Migrar `app/battle/BattlePage.tsx` (`battle.*`).
- [ ] Migrar `app/ranking/page.tsx` (`ranking.*`).
- [ ] Migrar `ProfileCorner.tsx`, `AthleteMarketItem.tsx` (`common.*`).
- [ ] Migrar `lib/schemas/auth.ts`: factory que recebe `t` (`validation.auth.*`).
- [ ] Centralizar `ROLE_LABELS` e `areaLabels` em `src/lib/labels.ts`.
- [ ] Corrigir acentuação inconsistente (Nao → Não).
- [ ] Atualizar `layout.tsx` metadata via `getTranslations`.

#### Critérios de aceite
- `grep -RE "(Vitórias|Derrotas|Troféus|Defesa|Centro|Ataque|Jogar|Mercado|Sair)" src/app src/components` retorna zero matches fora de arquivos i18n.
- App em `en` exibe tudo em inglês, incluindo erros Zod.
- Erros do server (WS-02) exibidos no locale atual (front consome `error.code` e resolve via `errors` namespace).

#### Risco
Volume alto — mitigado por grep + revisão manual.

---

### WS-09 — Setup vitest + Testing Library no front

- **Repo:** `front`
- **Objetivo:** Instalar e configurar vitest + RTL para Next.js 16 + React 19, com mocks base.
- **Depende de:** —
- **Estimativa:** 5–6h
- **Branch:** `test/ws-09-setup-vitest-front`
- **Libs:** `vitest`, `@vitest/coverage-v8`, `@vitest/ui`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `happy-dom`

#### Tarefas
- [ ] Adicionar devDependencies.
- [ ] Criar `vitest.config.ts` (`environment: 'happy-dom'`, `setupFiles`, alias `@/*`, coverage v8 + thresholds 50/40).
- [ ] Criar `src/__tests__/setup.ts` com `@testing-library/jest-dom/vitest`.
- [ ] Criar `src/__tests__/mocks/api.ts` (`mockApiGet`, `mockApiPost`).
- [ ] Criar `src/__tests__/mocks/router.ts` (mock `next/navigation`).
- [ ] Criar `src/__tests__/mocks/localStorage.ts`.
- [ ] Criar `src/__tests__/utils/renderWithProviders.tsx` (envolve com `NextIntlClientProvider`, `AuthProvider`, `AntdProvider`).
- [ ] Scripts `test`, `test:watch`, `test:coverage`, `test:ui`.

#### Critérios de aceite
- `yarn test` roda sem erros.
- `renderWithProviders(<div/>)` renderiza com todos providers.
- `yarn test:coverage` gera relatório HTML.

#### Risco
Confirmar versões RTL compatíveis com React 19 antes de começar.

---

### WS-10 — Testes front: lib, schemas, services

- **Repo:** `front`
- **Objetivo:** Cobrir Tier 1 (puro) e Tier 2 (services com axios mock).
- **Depende de:** WS-09
- **Estimativa:** 8–10h
- **Branch:** `test/ws-10-services-libs-front`

#### Tarefas
- [ ] Criar `src/lib/gameSession.test.ts`: 5 funções + normalizers.
- [ ] Criar `src/lib/schemas/auth.test.ts`: `loginSchema`, `registerSchema`, `profileSchema`.
- [ ] Criar `src/services/authService.test.ts`: `login`, `createGuest`, `getMe`, `register`.
- [ ] Criar `src/services/gameService.test.ts`: 8 funções com mocks.
- [ ] Criar `src/services/rankingService.test.ts`: `getRanking`.
- [ ] Criar `src/providers/api.test.ts`: interceptors request (Bearer) + response (401).

#### Critérios de aceite
- 4 services + 2 libs + 1 provider com ≥3 cenários cada.
- Cobertura `src/lib` e `src/services` ≥80%.

#### Risco
Interceptors usam `window.location` — usar happy-dom corretamente.

---

### WS-11 — Testes front: hooks, componentes, context

- **Repo:** `front`
- **Objetivo:** Cobrir Tier 3 e Tier 4 com React Testing Library.
- **Depende de:** WS-09
- **Estimativa:** 8–10h
- **Branch:** `test/ws-11-componentes-context-front`

#### Tarefas
- [ ] Criar `src/hooks/useAuth.test.tsx`: erro fora do provider, retorno correto dentro.
- [ ] Criar `src/components/AthleteMarketItem.test.tsx`: slot vazio, com atleta, `onDragStart`, custo formatado.
- [ ] Criar `src/components/ProfileCorner.test.tsx`: abrir/fechar menu, navegação, logout, sem usuário.
- [ ] Criar `src/context/AuthContext.test.tsx`: estado inicial, `login`, `loginAsGuest`, `logout`, `register`.

#### Critérios de aceite
- useAuth lança erro fora do provider.
- AuthContext.login dispara `router.push('/')`.
- Cobertura `src/components` + `src/context` ≥70%.

#### Risco
Antd usa portais — usar `screen.getByRole` + `userEvent.click`.

---

### WS-12 — Documentação + CI + fechamento

- **Repo:** `both`
- **Objetivo:** Atualizar READMEs, criar CONTRIBUTING.md, GitHub Actions com lint/typecheck/test/i18n-check.
- **Depende de:** WS-03, WS-04, WS-06, WS-08, WS-10, WS-11
- **Estimativa:** 4–6h
- **Branch:** `docs/ws-12-readme-ci-conventions`

#### Tarefas
- [ ] Atualizar `server/README.md` com seções i18n / Swagger / Testes.
- [ ] Atualizar `front/README.md` com mesma estrutura.
- [ ] Criar `CONTRIBUTING.md` em ambos.
- [ ] Substituir `front/AGENTS.md` por guia real (stack, convenções, comandos, testes).
- [ ] Sincronizar `front/CLAUDE.md`.
- [ ] Criar `.github/workflows/ci.yml` em cada repo (lint + typecheck + test + i18n:check).
- [ ] Badge de cobertura nos READMEs.
- [ ] Documentar mapping i18n ↔ error codes em `docs/i18n-errors.md`.

#### Critérios de aceite
- CI roda em PR sem erros.
- READMEs explicam como adicionar chave/rota.
- AGENTS.md no front substitui aviso de deprecation por guia acionável.

#### Risco
CI sem MySQL — manter unit + integration mockados.

---

### WS-13 — Publicação da API + Swagger no Render

- **Repo:** `server`
- **Objetivo:** Subir o server (com Swagger UI em `/docs`) no Render free tier, com banco MySQL externo (Railway/Aiven) e domínio público estável para apresentação.
- **Depende de:** —
- **Estimativa:** 4–6h
- **Branch:** `chore/ws-13-deploy-render`

#### Tarefas
- [ ] **Provisionar MySQL externo** (Render não tem MySQL managed):
  - Opção A (recomendada): **Railway** com MySQL plugin (~$5 credit free/mês)
  - Opção B: **Aiven** (free tier 1mês depois pago)
  - Opção C: **Clever Cloud** (free MySQL pequeno)
- [ ] Ajustar `src/index.ts` para usar `host: '0.0.0.0'` e `port: Number(process.env.PORT) || 3333`.
- [ ] Adicionar endpoint `GET /healthz` simples (já existe `/health` — confirmar caminho ou criar alias).
- [ ] Criar `render.yaml` na raiz do `server/`:
  ```yaml
  services:
    - type: web
      name: autosoccer-api
      runtime: node
      buildCommand: npm ci && npm run build && npm run db:migrate
      startCommand: node dist/index.js
      healthCheckPath: /health
      envVars:
        - key: NODE_ENV
          value: production
        - key: DATABASE_URL
          sync: false
        - key: JWT_SECRET
          sync: false
        - key: CORS_ORIGIN
          value: https://autosoccer.vercel.app
  ```
- [ ] Configurar `@fastify/cors` para aceitar origem do front (`process.env.CORS_ORIGIN`).
- [ ] Ajustar Sequelize para aceitar `DATABASE_URL` (connection string).
- [ ] Configurar Render Dashboard com variáveis sensíveis (`DATABASE_URL`, `JWT_SECRET`).
- [ ] Adicionar `preDeployCommand` rodando migrations (`npm run db:migrate`).
- [ ] Configurar **UptimeRobot** (free) pingando `/health` a cada 10min para evitar hibernação free tier.
- [ ] Atualizar `server/README.md` com URL pública (`https://autosoccer-api.onrender.com/docs`).
- [ ] Smoke test pós-deploy: registrar usuário, fazer login, listar mercado, rodar uma rodada.
- [ ] Adicionar badge "API · live" no README apontando para `/docs`.

#### Critérios de aceite
- `https://autosoccer-api.onrender.com/docs` acessível publicamente.
- `https://autosoccer-api.onrender.com/health` retorna 200.
- Migrations executadas com sucesso no deploy.
- CORS aceita requisições do front em produção.
- README documenta URL e fluxo de redeploy.

#### Riscos
- **Hibernação free tier**: 15min sem tráfego → cold start ~30s. Mitigação: UptimeRobot.
- **MySQL externo gratuito**: limites de conexões/storage. Documentar no README.
- **Build time**: free tier tem CPU limitada — `npm ci` + `tsc` pode passar dos 5min.

---

## 6. Caminho Crítico

```
WS-01 ──┬─→ WS-02 ──→ WS-03 ──┐
        │                      │
        └─→ WS-04 ─────────────┤
                               │
WS-07 ────→ WS-08 ─────────────┤
                               │
WS-05 ────→ WS-06 ─────────────┤
                               ├──→ WS-12 (fechamento)
WS-09 ──┬─→ WS-10 ─────────────┤
        └─→ WS-11 ─────────────┘

WS-13 (independente, pode iniciar em qualquer momento)
```

---

## 7. Riscos Globais

1. **i18n no Swagger é desafiador** — spec gerada uma vez na inicialização; pode exigir geração dinâmica por requisição ou aceitar `/docs` apenas no locale default.
2. **next-intl sem `[locale]` segment** exige config personalizada de cookie/header — risco de hidratação SSR/CSR.
3. **Mocks de Sequelize** podem mascarar bugs de query reais — considerar SQLite in-memory em iteração futura.
4. **Volume de strings (>340)** — script `i18n:check` deve rodar no CI desde o início.
5. **React 19 + Testing Library** — checar versões mínimas antes de WS-09.
6. **Mistura pt-BR/en existente** (ex: "Field already in use") — revisão manual em WS-02 para não traduzir literalmente strings já inglesas.
7. **Conflitos em `package.json`** quando workstreams paralelos adicionam deps — orquestrar merges sequenciais desses arquivos.
8. **Render free tier** dorme após 15min — UptimeRobot mitiga mas não elimina o cold start.

---

## 8. Priorização para Corte de Escopo

Se houver pressão de tempo, priorizar (nesta ordem):
1. **WS-01 + WS-02** — fundação i18n server
2. **WS-04** — Swagger 100% completo
3. **WS-13** — Render no ar (entrega visível)
4. **WS-07 + WS-08** — i18n front (entrega visível)
5. WS-05, WS-09, WS-10, WS-11 — testes
6. WS-03, WS-06, WS-12 — polish

---

## 9. Como Distribuir Entre Agentes

Sugestão de divisão **5 agentes** rodando em paralelo:

| Agente | Workstreams | Foco |
|---|---|---|
| **A** (Backend Lead) | WS-01 → WS-02 → WS-03 → WS-04 | Erros, i18n server, Swagger |
| **B** (QA Backend) | WS-05 → WS-06 | Testes server |
| **C** (Frontend Lead) | WS-07 → WS-08 | i18n front |
| **D** (QA Frontend) | WS-09 → WS-10 → WS-11 | Testes front |
| **E** (DevOps + Docs) | WS-13 → WS-12 | Deploy Render + CI + docs |

Cada agente abre uma branch por workstream, faz PR para `main`, merge ao concluir.

---

> **Documento gerado a partir de auditoria automatizada (6 agentes paralelos) em `2026-06-09`.**
> Base: `server/main` em `12d91b5`, `front/main` em `d12ca86`.
