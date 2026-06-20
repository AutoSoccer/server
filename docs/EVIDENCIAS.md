# EVIDENCIAS — Mapa de Rastreabilidade por Integrante

> Disciplina Experiencia Criativa BSI PUCPR 2026/1 — entrega final 23/06/2026.
> Este documento prova autoria de cada integrante mapeando features -> commits reais -> arquivos -> slides da apresentacao.
> Os commits foram extraidos via `git log --all --oneline --no-merges` dos repos `front/` e `server/`. Quando o autor do git diverge do dono logico definido em `docs/sprints/SPRINT_PLANNING.md` (caso comum, pois durante varias sessoes o Lucas Stopinski era o committer do par), a coluna "Commit" indica o hash e o autor original; a evidencia esta no PR/branch correspondente (referenciado pelo prefixo `feat/ws-XX-...`) e na atribuicao formal do Sprint Planning.
>
> Convencao:
> - **Repo**: `server` ou `front`.
> - **Commit**: hash curto `<7 chars>` + autor original do git.
> - **Slide**: numero do slide associado em `apresentacao/SLIDES_CONTENT.md`.
> - Quando uma feature foi pareada, indicamos os dois donos no Sprint Planning.

---

## Lucas Stopinski da Silva — Front-end

Dono logico das US-001, US-003, US-004, US-005, US-007, US-008 (Sprint 1); refino visual do mercado e drag-and-drop (Sprint 2); US-033, US-034, US-035 e ajustes de UX (Sprint 3); US-038 a US-044, US-049, US-050 e US-058 (Sprint 4).

| Feature | Commit | Arquivo | Slide |
|---|---|---|---|
| Scaffolding inicial do Next.js + axios | `c5d12c3` Lucas Stopinski (front) | `src/` (estrutura base) | 6 |
| Tela de login responsiva com Zod + RHF | `33a732e` Lucas Stopinski (front) | `src/app/auth/login/` | 6 |
| Tela de cadastro responsiva | `d06c78b` Lucas Stopinski (front) | `src/app/auth/register/` | 6 |
| Auth context + token persistido | `fff3422` Lucas Stopinski (front) | `src/context/AuthContext.tsx` | 6 |
| Home com renderizacao condicional auth-aware | `616ce9d` Lucas Stopinski (front) | `src/app/page.tsx` | 6 |
| Infra next-intl com cookie + namespaces | `c65559c` Lucas Stopinski (front) | `src/i18n/` | 7 |
| Namespaces base pt-BR e en | `68e3827` Lucas Stopinski (front) | `src/i18n/messages/<locale>/` | 7 |
| LanguageSwitcher no ProfileCorner | `19f92e5` Lucas Stopinski (front) | `src/components/LanguageSwitcher.tsx` | 7 |
| Migracao de Home/Auth/Profile para next-intl | `0191213` Lucas Stopinski (front) | varias paginas | 7 |
| Migracao de Market/Battle/Ranking para next-intl | `cf1e1cd` Lucas Stopinski (front) | varias paginas | 7 |
| Header unificado da batalha (titulo+placar+turno) | `48f0712` Lucas Stopinski (front) | `src/app/battle/BattlePage.tsx` | 8 |
| Sidebar vertical de logs com scroll proprio | `9e7424d` Lucas Stopinski (front) | `src/app/battle/BattlePage.module.css` | 8 |
| Bola animada acompanhando as jogadas (RF006) | `a7f1a39` Lucas Stopinski (front) | `src/app/battle/BattlePage.tsx` | 8 |
| Polimento de layout da batalha (WS-15) | `b920aa3` Lucas Stopinski (front) | `src/app/battle/` | 8 |
| Paleta dark mode em globals.css | `7063da9` Lucas Stopinski (front) | `src/app/globals.css` | 9 |
| Dashboard com graficos Recharts e filtros | `7756cbf` Lucas Stopinski (front) | `src/app/ranking/RankingDashboard.tsx` | 10 |
| Smoke do dashboard + transformacao de dados | `6bb5681` Lucas Stopinski (front) | `src/app/ranking/RankingDashboard.test.tsx` | 10/11 |
| Infra Vitest + RTL + setup base | `0112a19` Lucas Stopinski (front) | `src/__tests__/setup.ts` | 11 |
| Helper renderWithProviders | `e3ad7ef` Lucas Stopinski (front) | `src/__tests__/utils/renderWithProviders.tsx` | 11 |
| Cobertura de services (auth, game, ranking) | `f4383af` Lucas Stopinski (front) | `src/services/*.test.ts` | 11 |
| Cobertura de hooks (useAuth) | `3fe4d7e` Lucas Stopinski (front) | `src/hooks/useAuth.test.tsx` | 11 |
| Cobertura de components (ProfileCorner, AthleteMarketItem) | `4fe95b2` Lucas Stopinski (front) | `src/components/*.test.tsx` | 11 |

**Total Lucas Stopinski (front): 22 evidencias.**

---

## Pedro Henrique Silva Guligurski — Back-end

Dono logico das US-002 e US-006 (Sprint 1); US-009 a US-016 (Sprint 2); US-017 a US-031 (Sprint 3); US-036, US-037, US-045, US-054, US-055, US-056 (Sprint 4).
Observacao: nas Sprints 2-4, varios commits foram empurrados em sessoes de pareamento com o committer Lucas Stopinski; a atribuicao logica esta documentada em `docs/sprints/SPRINT_PLANNING.md`.

| Feature | Commit | Arquivo | Slide |
|---|---|---|---|
| Scaffolding Fastify + Sequelize + TypeScript | `7ba0aeb` pedroguligurski (server) | `src/app.ts`, `src/index.ts` | 13 |
| Ajuste de migration de economia | `9bf8a3a` pedroguligurski (server) | `src/database/migrations/` | 13 |
| Middleware JWT + GET /auth/me | `bcd0702` Lucas Stopinski (server) — par com Pedro | `src/modules/auth/auth.middleware.ts` | 13/17 |
| Modelagem do banco com Sequelize migrations | `e218bbe` Lucas Bruno e Silva (server) — par com Pedro | `src/database/migrations/` | 13 |
| Coluna coins + cost (mercado) | `3a6d447` Lucas Stopinski (server) — par com Pedro | `src/database/migrations/20260504220000-add-coins-and-cost.cjs` | 13 |
| Tabela team_snapshots (matchmaking RN006) | `f3b9187` Lucas Stopinski (server) — par com Pedro | `src/database/migrations/20260527000000-create-team-snapshots.cjs` | 13 |
| Compra de atletas com transacao atomica | `655ac6e` Lucas Stopinski (server) — par com Pedro | `src/modules/equipe/equipe.service.ts` | 13 |
| Motor de simulacao de 12 turnos com RNG e RN | `f329f59` Lucas Stopinski (server) — par com Pedro | `src/modules/simulador/simulador.service.ts` | 14 |
| Rota POST /partida/simular | `03d29de` Lucas Stopinski (server) — par com Pedro | `src/modules/partida/partida.routes.ts` | 14 |
| Disputas via Strategy + recuo RN011 + break RN007 | `d5c26bf` Lucas Stopinski (server) — par com Pedro | `src/modules/simulador/` | 14 |
| Resolucao de partida, ranking e trofeus | `63f8e57` Lucas Stopinski (server) — par com Pedro | `src/modules/partida/partida.service.ts` | 14 |
| Endpoint /salvar-estado para snapshot por rodada | `01dbeb0` Lucas Stopinski (server) — par com Pedro | `src/modules/equipe/equipe.routes.ts` | 14 |
| ErrorHandler global + enum ErrorCode | `fdbfc57` Lucas Stopinski (server) — par com Pedro | `src/plugins/errorHandler.ts` | 14 |
| Refactor simulador -> SimuladorServiceError | `5b8f8fa` Lucas Stopinski (server) — par com Pedro | `src/modules/simulador/` | 14 |
| Infra i18next com Accept-Language | `fbc1109` Lucas Stopinski (server) — par com Pedro | `src/plugins/i18n.ts` | 15 |
| Substituicao de mensagens hardcoded por chaves i18n | `f0bbbb6` Lucas Stopinski (server) — par com Pedro | varios services | 15 |
| Script i18n:check (paridade pt-BR/en) | `fbb2e71` Lucas Stopinski (server) — par com Pedro | `scripts/check-i18n.mjs` | 15 |
| Externalizacao de descricoes do Swagger para i18n | `70b4c2b` Lucas Stopinski (server) — par com Pedro | `src/i18n/locales/<locale>/swagger.json` | 15/16 |
| Documentacao OpenAPI 3.0 + Swagger UI em /docs | `3e87375` Lucas Stopinski (server) — par com Pedro | `src/plugins/swagger.ts` | 16 |
| Centralizacao de schemas em components.schemas | `90ec409` Lucas Stopinski (server) — par com Pedro | `src/plugins/swagger.schemas.ts` | 16 |
| Renomeacao de URLs e tags Swagger para ingles | `f288b96` Lucas Stopinski (server) — par com Pedro | varias rotas | 16 |
| Coluna role na tabela users + payload JWT | `7ef2986` Lucas Stopinski (server) — par com Pedro | `src/database/migrations/` + `auth.service.ts` | 17 |
| Middleware requireRole + GET /admin/users | `b9b2250` Lucas Stopinski (server) — par com Pedro | `src/modules/auth/auth.middleware.ts` | 17 |
| Stored procedure sp_get_top_athletes_by_role | `e4c50c1` Lucas Stopinski (server) — par com Pedro | `src/database/migrations/20260610220000-create-reports-stored-procedures.cjs` | 18 |
| Suites de integration (auth, equipe, partida) | `fac999c` Lucas Stopinski (server) — par com Pedro | `src/__tests__/integration/*.int.test.ts` | 19 |

**Total Pedro Guligurski (back): 25 evidencias** (2 no autor original do git + 23 em sessoes pareadas com committer Lucas Stopinski, conforme Sprint Planning).

---

## Lucas Bruno e Silva — Infra/QA

Dono logico do suporte ao setup de Docker e revisao de PRs (Sprint 1); US-012, US-013 (apoio), US-016 (Sprint 2); US-027 (apoio), US-032 (Sprint 3); US-046, US-047, US-048, US-051, US-052, US-053, US-057 (Sprint 4).

| Feature | Commit | Arquivo | Slide |
|---|---|---|---|
| Modelagem do banco com Sequelize migrations | `e218bbe` Lucas Bruno e Silva (server) | `src/database/migrations/20260414210000-create-initial-schema.cjs` | 22 |
| Mercado: janela de atletas | `9c4157e` Lucas Bruno (server) | `src/modules/mercado/mercado.service.ts` | 23 |
| Alinhamento de ambiente local do servidor | `c57f529` Lucas Bruno (server) | `docker-compose.yml`, `.env.example` | 26 |
| Atualizacao do lockfile do yarn | `a368f71` Lucas Bruno (server) | `yarn.lock` | 21 |
| Preservar saldo em migration de economia | `5f01889` Lucas Bruno (server) | `src/database/migrations/20260602120000-normalize-economy.cjs` | 22 |
| Seed: atletas curados + oponentes async | `481e8b4` Lucas Bruno (server) | `src/database/seed/` | 22 |
| Integracao team management + battle flow | `21804fe` Lucas Bruno (server) | `src/modules/equipe/` + `src/modules/partida/` | 22 |
| Engine de simulacao shared-field | `54cb9ca` Lucas Bruno (server) | `src/modules/simulador/` | 22 |
| Alinhamento market + progressao de bots | `ab781e2` Lucas Bruno (server) | `src/modules/mercado/`, `src/modules/matchmaking/` | 22 |
| Documentacao de contratos battle/economy | `0d619f8` Lucas Bruno (server) | `docs/api-equipe.md` | 22/23 |
| Campaign: start + abandon flows | `d2f9c0c` Lucas Bruno (server) | `src/modules/partida/campaign.service.ts` | 22 |
| Fix matchmaking first-round roster limit | `4b8bc24` Lucas Bruno (server) | `src/modules/matchmaking/matchmaking.service.ts` | 22 |
| Documentacao do campaign lifecycle | `79d0fad` Lucas Bruno (server) | `docs/api-equipe.md` | 23 |
| Ranking: player metrics + global position | `45289e2` Lucas Bruno (server) | `src/modules/ranking/ranking.service.ts` | 22 |
| Documentacao do ranking contract | `ef74e7d` Lucas Bruno (server) | `docs/api-ranking.md` | 16/23 |
| Conectar market + battles ao backend (front) | `790bf02` Lucas Bruno (front) | `src/services/gameService.ts` | 22 |
| Defer unauthenticated loading update (auth) | `a2d8a96` Lucas Bruno (front) | `src/context/AuthContext.tsx` | 22 |
| Async battle simulation flow | `0f7dd8f` Lucas Bruno (front) | `src/app/battle/BattlePage.tsx` | 22 |
| Drag sell zone no market | `427c665` Lucas Bruno (front) | `src/app/game/MarketPage.tsx` | 22 |
| Naming + surrender flow da campanha | `deacc0d` Lucas Bruno (front) | `src/app/game/` | 22 |
| Render horizontal battles + market costs | `b22bc08` Lucas Bruno (front) | `src/app/battle/`, `src/app/game/` | 22 |
| Build: avoid remote font dependency | `447b8a7` Lucas Bruno (front) | `src/app/layout.tsx` | 24 |
| Guest session antes de entrar no game | `d1ebde9` Lucas Bruno (front) | `src/context/AuthContext.tsx` | 22 |
| Post-match results review | `0f4d57a` Lucas Bruno (front) | `src/app/battle/` | 22 |
| Leaderboard + player metrics view | `90d29bd` Lucas Bruno (front) | `src/app/ranking/page.tsx` | 10/22 |
| Ranking menu entry na navegacao | `68eb2d6` Lucas Bruno (front) | `src/components/` | 22 |
| Declare ant design packages | `69e2c49` Lucas Bruno (front) | `package.json` | 21 |

**Total Lucas Bruno (infra/QA): 27 evidencias** (commits autorais reais no git, incluindo modelagem do banco, engine de simulacao, integracao front-back e ajustes de build/CI).

---

## Notas sobre rastreabilidade

1. **Sprint Planning como fonte de verdade**: o documento `docs/sprints/SPRINT_PLANNING.md` lista a US por sprint e o dono atribuido. Esta tabela complementa indicando o commit que materializa cada US.
2. **Sessoes de pareamento**: durante as Sprints 2-4, varias features de back e infra foram desenvolvidas em pair programming com o committer sendo o Lucas Stopinski. Estas evidencias estao marcadas como "par com <integrante>" e a autoria logica esta no Sprint Planning + branch (`feat/ws-XX-...`).
3. **Branches**: a convencao `tipo/ws-XX-slug` permite rastrear cada feature ao seu workstream (WS-01 a WS-16). Para o detalhamento dos workstreams, ver `PLANO_DE_ACAO.md`.
4. **PRs e peer review**: a Definition of Done global exige peer review por integrante diferente do owner. O historico de PRs no GitHub complementa este mapa.
5. **BDD e UML**: os arquivos `server/docs/features/` e `server/docs/diagrams/` registram a contrapartida documental das features, com mapeamento explicito entre cenarios Gherkin e codigo (arquivo + linha).

> Documento mantido por Lucas Stopinski. Ultima atualizacao: 10/06/2026.
