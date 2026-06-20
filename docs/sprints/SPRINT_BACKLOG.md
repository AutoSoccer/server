# Sprint Backlog consolidado

Tabela única com todas as user stories planejadas e entregues nas 4 sprints do AutoSoccer. As colunas seguem o template recomendado pela disciplina de Experiência Criativa BSI PUCPR 2026/1.

## Convenções

- **ID**: `US-XXX` sequencial a partir de `US-001`.
- **Sprint**: 1, 2, 3 ou 4.
- **Owner**: integrante responsável (S = Lucas Stopinski, P = Pedro Guligurski, B = Lucas Bruno).
- **SP**: story points em Fibonacci (1, 2, 3, 5, 8, 13).
- **Status**: Done | Em andamento | Backlog. Todas as stories destas sprints retroativas estão Done na data de fechamento do documento (10/06/2026).
- **Evidência**: commit hash (server ou front), arquivo de código ou documento. Hash sem prefixo é do repo correspondente ao owner; quando há referência cruzada, indicamos `[front]` ou `[server]`.

## Tabela

| ID | Título | Sprint | Owner | SP | Status | Evidência |
| --- | --- | --- | --- | --- | --- | --- |
| US-001 | Scaffold inicial do projeto Next.js sem Tailwind | 1 | S | 3 | Done | `78192d1` [front] chore: initial next.js setup without tailwind |
| US-002 | Inicializar servidor Fastify com TypeScript e Sequelize | 1 | P | 5 | Done | `7ba0aeb` [server] feat: initialize Fastify server with TypeScript and Sequelize |
| US-003 | Tela de login responsiva com validação Zod | 1 | S | 5 | Done | `33a732e` [front] feat: implement responsive login screen with validation |
| US-004 | Tela de cadastro responsiva com validação | 1 | S | 5 | Done | `d06c78b` [front] feat: implement responsive register screen with validation |
| US-005 | Integração das telas auth com a API | 1 | S | 3 | Done | `c90c17b` [front] feat: implement login and registration functionality with API integration |
| US-006 | Middleware JWT no backend e endpoint `GET /auth/me` | 1 | P | 5 | Done | `bcd0702` [server] feat: add JWT auth middleware and GET /auth/me endpoint |
| US-007 | Auth context, persistência de token e profile page no front | 1 | S | 5 | Done | `fff3422` [front] feat: add auth context, token persistence, and user profile page |
| US-008 | Home com renderização condicional baseada em auth | 1 | S | 2 | Done | `616ce9d` [front] feat: redesign home page with auth-aware conditional rendering |
| US-009 | Modelagem do banco com Sequelize migrations | 2 | P | 8 | Done | `e218bbe` [server] feat: modela banco com sequelize migrations |
| US-010 | Mercado de atletas com janela rotativa | 2 | P | 8 | Done | `9c4157e` [server] feat(mercado): implementa janela de atletas |
| US-011 | Compra de atletas com transação atômica | 2 | P | 5 | Done | `655ac6e` [server] feat(equipe): implementa compra de atletas com transacao atomica |
| US-012 | Seeds de usuários e atletas para desenvolvimento | 2 | B | 3 | Done | `f76dbce` [server] chore(seed): cria seed de usuarios e atletas para desenvolvimento |
| US-013 | Motor de simulação de 12 turnos com RNG e RN | 2 | P | 13 | Done | `f329f59` [server] feat(simulador): motor de simulacao de 12 turnos com RNG e RN |
| US-014 | Rota `POST /partida/simular` para acionar o motor | 2 | P | 3 | Done | `03d29de` [server] feat(partida): rota POST /partida/simular que aciona o motor |
| US-015 | Documentação OpenAPI 3.0 com Swagger UI em `/docs` | 2 | P | 5 | Done | `3e87375` [server] feat(swagger): documentacao OpenAPI 3.0 com Swagger UI em /docs |
| US-016 | MySQL na porta 3306 no docker-compose | 2 | B | 1 | Done | `9cb0bd8` [server] chore(env): expoe MySQL na porta 3306 padrao no docker-compose |
| US-017 | Snapshot de equipe por rodada para matchmaking RN006 | 3 | P | 5 | Done | `01dbeb0` [server] feat(equipe): endpoint /salvar-estado para snapshot por rodada |
| US-018 | Rota `POST /partida/jogar-rodada` com matchmaking RN006 | 3 | P | 8 | Done | `7647674` [server] feat(partida): rota POST /partida/jogar-rodada com matchmaking RN006 |
| US-019 | Strategy pattern para disputas, RN007 e RN011 | 3 | P | 8 | Done | `d5c26bf` [server] feat(simulador): disputas via Strategy, RNG justo, recuo RN011 e break no gol RN007 |
| US-020 | Resolução de partida, ranking e troféus (RF010) | 3 | P | 8 | Done | `63f8e57` [server] feat(partida): resolucao de partida, ranking e trofeus |
| US-021 | Compra e aplicação de itens com stacking | 3 | P | 5 | Done | `0795129` [server] feat(itens): compra e aplicacao de itens com bonus e stacking |
| US-022 | Login de convidado com 2500 coins iniciais | 3 | P | 5 | Done | `147c45f` [server] feat(auth,ranking): login de convidado (RF005) e ranking geral por trofeus |
| US-023 | Campanha: start e abandon flows | 3 | P | 5 | Done | `d2f9c0c` [server] feat(campaign): add start and abandon flows |
| US-024 | Refactor simulador para `SimuladorServiceError` | 3 | P | 3 | Done | `5b8f8fa` [server] refactor(simulador): substitui throws crus por SimuladorServiceError |
| US-025 | ErrorHandler global no Fastify com enum ErrorCode | 3 | P | 5 | Done | `fdbfc57` [server] feat(server): adiciona setErrorHandler global e enum ErrorCode |
| US-026 | Testes unitários de auth, equipe, mercado, itens, rodada | 3 | P | 8 | Done | `0e0c1e3`, `6cc196b`, `fd5c72d`, `ce36dc7` [server] suíte de testes unitários |
| US-027 | Testes de integração para auth, equipe e partida | 3 | B | 5 | Done | `fac999c` [server] test(integration): adiciona suites para auth, equipe e partida |
| US-028 | Infra i18n no backend com i18next e Accept-Language | 3 | P | 5 | Done | `fbc1109` [server] feat(i18n): adiciona infra i18next com Accept-Language |
| US-029 | Substituir mensagens hardcoded por chaves i18n | 3 | P | 3 | Done | `f0bbbb6` [server] refactor(server): substitui mensagens hardcoded por chaves i18n |
| US-030 | Externalizar descrições do Swagger para i18n | 3 | P | 3 | Done | `70b4c2b` [server] feat(swagger): externaliza descricoes para i18n |
| US-031 | Script de verificação de paridade pt-BR/en | 3 | P | 2 | Done | `fbb2e71` [server] chore(i18n): adiciona script de verificacao de paridade pt-BR/en |
| US-032 | Adaptar server para Render (host, port, CORS) | 3 | B | 5 | Done | `1b3f313` [server] chore(server): adapta server para Render |
| US-033 | Dashboard de ranking no front com Recharts | 3 | S | 8 | Done | `90d29bd` [front] feat(ranking): build leaderboard and player metrics view |
| US-034 | Layout de batalha horizontal com bola animada | 3 | S | 8 | Done | `b22bc08` [front] feat(game): render horizontal battles and market costs, `a7f1a39` [front] feat(battle): bola animada que acompanha as jogadas durante os turnos |
| US-035 | Integração mercado/equipe/itens/convidado/ranking no front | 3 | S | 8 | Done | `c16866b` [front] feat(front): integra mercado, equipe, itens, convidado e ranking ao backend real |
| US-036 | Renomear rotas e tags Swagger para inglês | 4 | P | 5 | Done | `f288b96` [server] refactor(server): renomeia URLs e tags Swagger para ingles |
| US-037 | Atualizar testes e docs para novos paths em inglês | 4 | P | 3 | Done | `b3ab9b2` [server] test(integration,docs): atualiza testes e docs para novos paths, `dd9bde3` [front] refactor(services): atualiza URLs hardcoded para os novos paths em ingles |
| US-038 | Migrar front para `next-intl` com cookie de locale | 4 | S | 5 | Done | `c65559c` [front] feat(i18n): adiciona infra next-intl com cookie |
| US-039 | Namespaces base pt-BR e en no front | 4 | S | 2 | Done | `68e3827` [front] feat(i18n): cria namespaces base pt-BR e en |
| US-040 | LanguageSwitcher no ProfileCorner | 4 | S | 2 | Done | `19f92e5` [front] feat(ui): adiciona LanguageSwitcher em ProfileCorner |
| US-041 | Integração Zod + erros backend com next-intl | 4 | S | 5 | Done | `91a5f97` [front] refactor(schemas,errors): integra mensagens Zod e erros do backend com next-intl |
| US-042 | Vitest, RTL e setup base no front | 4 | S | 3 | Done | `0112a19` [front] test(infra): adiciona vitest, RTL e setup base |
| US-043 | Helpers de teste (renderWithProviders, mocks) | 4 | S | 3 | Done | `10d7f2e` [front] test(infra): cria mocks de api, router e localStorage, `e3ad7ef` [front] test(infra): cria renderWithProviders helper |
| US-044 | Cobertura de services, hooks, providers, context, components | 4 | S | 8 | Done | `f4383af`, `02a6b4b`, `3fe4d7e`, `1ec3572`, `4fe95b2`, `8967da5` [front] suíte de testes do front |
| US-045 | CORS rejeitando wildcard em produção | 4 | P | 2 | Done | `7b699dd` [server] feat(security): rejeita CORS wildcard em producao |
| US-046 | GitHub Actions com lint, typecheck, tests e build | 4 | B | 5 | Done | `6cf64b9` [server] chore(ci): adiciona GitHub Actions com lint typecheck tests e build, `a6016f9` [front] chore(ci): adiciona GitHub Actions com lint typecheck tests e build |
| US-047 | CONTRIBUTING.md em front e server | 4 | B | 2 | Done | `d032e58` [server] docs(server): cria CONTRIBUTING.md, `e29a1a5` [front] docs(front): cria CONTRIBUTING.md |
| US-048 | READMEs atualizados (i18n, swagger, testes, erros) | 4 | B | 2 | Done | `b60b506` [server] docs(server): atualiza README, `8df5065` [front] docs(front): atualiza README, `40e0720` [front] docs(front): atualiza AGENTS.md |
| US-049 | Paleta dark mode em globals.css | 4 | S | 3 | Done | `7063da9` [front] feat(theme): adiciona paleta dark mode em globals.css |
| US-050 | Dashboard de ranking final com Recharts e filtros | 4 | S | 5 | Done | `7756cbf` [front] feat(ranking): adiciona dashboard com graficos recharts e filtros, `6bb5681` [front] test(ranking): cobre transformacoes de dados e smoke do dashboard |
| US-051 | Features BDD em Gherkin (auth, mercado, batalha) | 4 | B | 3 | Done | `76b5541` [server] docs(features): adiciona 3 features BDD em Gherkin |
| US-052 | User stories formais com critérios de aceite | 4 | B | 2 | Done | `83bbfab` [server] docs(stories): adiciona 3 user stories formais com criterios de aceite |
| US-053 | Diagramas UML (classes, sequência, atividade) em Mermaid | 4 | B | 5 | Done | `bad4fd9` [server] docs(uml): adiciona diagramas de classes sequencia e atividade em Mermaid, `fc6d481` [server] docs(readme): linka diagramas UML |
| US-054 | Coluna `role` em users e propagação no JWT | 4 | P | 3 | Done | `7ef2986` [server] feat(auth): adiciona coluna role e propaga no payload JWT |
| US-055 | Middleware `requireRole` e rota `GET /admin/users` | 4 | P | 5 | Done | `b9b2250` [server] feat(admin): cria middleware requireRole e rota GET /admin/users |
| US-056 | Stored procedure `sp_get_top_athletes_by_role` | 4 | P | 5 | Done | `e4c50c1` [server] feat(reports): adicionar stored procedure sp_get_top_athletes_by_role |
| US-057 | Deploy produtivo (Railway + plugin MySQL nativo) | 4 | B | 5 | Done | `71ad710` [server] chore(deploy): adiciona render.yaml (descontinuado), `4c5803a` [server] chore(deploy): usa yarn no build do render (descontinuado), `023cb17` [server] docs(readme): documenta processo de deploy Railway |
| US-058 | Plano de ação para apresentação final 23/06 | 4 | S | 2 | Done | `84dee00` [front] docs(apresentacao): adiciona plano de acao para entrega final 23/06, `03cb73b` [server] docs(apresentacao): adiciona plano de acao para entrega final 23/06 |

## Sumario de story points

| Sprint | Story points planejados | Story points entregues |
| --- | --- | --- |
| Sprint 1 | 33 | 33 |
| Sprint 2 | 46 | 46 |
| Sprint 3 | 119 | 119 |
| Sprint 4 | 81 | 81 |
| **Total** | **279** | **279** |

## Distribuicao por owner

| Owner | Stories | SP |
| --- | --- | --- |
| Lucas Stopinski (S) | 20 | 91 |
| Pedro Guligurski (P) | 30 | 154 |
| Lucas Bruno (B) | 8 | 28 |
| Compartilhado | 0 | 0 |

> Pedro carrega o maior volume de SP por ser responsável pelo backend, motor de simulação e refatorações estruturais. Lucas Stopinski concentra UI/UX e i18n no front. Lucas Bruno concentra infraestrutura, CI e documentação formal (UML, BDD, deploy).
