# Sprint Planning

Documento formal de planejamento das 4 sprints do projeto AutoSoccer, conforme metodologia Scrum adaptada à disciplina de Experiência Criativa BSI PUCPR 2026/1.

## Metadados do projeto

| Item               | Valor                                    |
| ------------------ | ---------------------------------------- |
| Projeto            | AutoSoccer (fantasy soccer auto-battler) |
| Disciplina         | Experiência Criativa BSI PUCPR 2026/1    |
| Período            | 01/03/2026 a 09/06/2026                  |
| Apresentação final | 23/06/2026                               |
| Sprint length      | 2 semanas                                |
| Total de sprints   | 4                                        |
| Grupo              | 3 integrantes                            |

## Time e papéis (cross-functional)

| Integrante                      | Papel principal | Frentes                                                                     |
| ------------------------------- | --------------- | --------------------------------------------------------------------------- |
| Lucas Stopinski da Silva        | Front-end lead  | Next.js, design tokens, dark mode, i18n front, integrações                  |
| Pedro Henrique Silva Guligurski | Back-end lead   | Fastify, autenticação JWT, regras de negócio, relatórios, stored procedures |
| Lucas Bruno e Silva             | Infra/QA lead   | Docker, CI, BDD, UML, deploy, testes de integração                          |

Não há Product Owner externo; o papel é rotativo a cada sprint entre os três integrantes. O Scrum Master fixo é Lucas Bruno (responsável por agendar dailies e revisar o board).

## Cerimônias adotadas

- **Daily**: 15 min, segunda/quarta/sexta, assíncrona via grupo do WhatsApp.
- **Planning**: 1h no início de cada sprint.
- **Review**: 30 min no último dia.
- **Retrospectiva**: 30 min após a review.

## Definition of Ready (DoR) — global

Uma user story só entra na sprint se:

1. Tem critérios de aceite mensuráveis (Gherkin ou bullet list).
2. Tem owner declarado.
3. Tem estimativa em story points (Fibonacci 1, 2, 3, 5, 8, 13).
4. Está mapeada para um requisito funcional (RFxxx) ou regra de negócio (RNxxx) quando aplicável.
5. Dependências externas (libs, APIs) estão identificadas.

## Definition of Done (DoD) — global

Uma user story só é considerada concluída se:

1. Código mergeado na branch `integration/grupo-1`.
2. Testes unitários e/ou de integração passando.
3. Commit segue Conventional Commits em pt-BR sem acentos.
4. Lint e typecheck verdes.
5. Documentação atualizada (README, Swagger, AGENTS.md ou docs/) quando o escopo exigir.
6. Code review por pelo menos um integrante diferente do owner (peer review assíncrono via PR).

---

## Sprint 1 — Fundacao (01/03/2026 a 14/03/2026)

### Objetivo

Estabelecer a infraestrutura inicial dos dois projetos (server e front), implementar autenticação básica e modelar o banco de dados do MVP.

### Backlog priorizado

- US-001 Scaffolding inicial do projeto Next.js (front) com estrutura de pastas, axios e tokens de design.
- US-002 Scaffolding inicial do servidor Fastify com TypeScript e Sequelize.
- US-003 Tela de login responsiva com validação via Zod e React Hook Form.
- US-004 Tela de cadastro responsiva com validação.
- US-005 Integração das telas de auth com a API de registro e login.
- US-006 Middleware JWT no backend e endpoint `GET /auth/me`.
- US-007 Persistência de token e contexto global de auth no front (auth context + localStorage).
- US-008 Redesign da home com renderização condicional baseada em estado de autenticação.

### Atribuição

| Integrante                      | Stories                                        |
| ------------------------------- | ---------------------------------------------- |
| Lucas Stopinski da Silva        | US-001, US-003, US-004, US-005, US-007, US-008 |
| Pedro Henrique Silva Guligurski | US-002, US-006                                 |
| Lucas Bruno e Silva             | Suporte ao setup de Docker, revisão de PRs     |

### Definition of Ready específica

- ER (Entidade-Relacionamento) das tabelas `users` e `athletes` aprovada em planning.
- Stack confirmada (Next.js 16, Fastify 5, Sequelize, MySQL 8).

### Definition of Done específica

- Usuário consegue se cadastrar, fazer login e obter um JWT válido.
- Health check do server respondendo em `/health` ou `/`.
- Front consegue persistir o token e exibir nome do usuário logado.

---

## Sprint 2 — Mercado, motor e i18n (15/03/2026 a 28/03/2026)

### Objetivo

Entregar o ciclo principal de jogabilidade no backend: mercado de atletas, motor de simulação de partidas e expor APIs documentadas via Swagger.

### Backlog priorizado

- US-009 Modelagem completa do banco com migrations Sequelize (athletes, items, abilities, market).
- US-010 Endpoint de mercado com janela de atletas (rotação por usuário/rodada).
- US-011 Compra de atletas com transação atômica e desconto de coins.
- US-012 Seeds de usuários e atletas para desenvolvimento.
- US-013 Motor de simulação de partida (12 turnos, RNG, regras RN001-RN013).
- US-014 Endpoint `POST /partida/simular` que aciona o motor.
- US-015 Documentação OpenAPI 3.0 com Swagger UI em `/docs`.
- US-016 Configuração do MySQL no docker-compose (porta 3306).

### Atribuição

| Integrante                      | Stories                                        |
| ------------------------------- | ---------------------------------------------- |
| Lucas Stopinski da Silva        | Refino visual do mercado, drag-and-drop        |
| Pedro Henrique Silva Guligurski | US-009, US-010, US-011, US-013, US-014, US-015 |
| Lucas Bruno e Silva             | US-012, US-016, validação de RN no simulador   |

### Definition of Ready específica

- Regras de negócio RN001-RN013 documentadas em `docs/PLANO_DE_ACAO.md`.
- Schemas das responses definidos em conjunto pelos três integrantes.

### Definition of Done específica

- Swagger UI acessível com todos os endpoints do MVP.
- Simulador devolve resultado consistente em 100 execuções de regression sample (smoke local).
- Seed reprodutível via `yarn seed`.

---

## Sprint 3 — Robustez, qualidade e deploy (29/03/2026 a 09/05/2026)

### Objetivo

Endurecer o sistema com error handler global, cobertura de testes ampla, internacionalização full-stack e infraestrutura de deploy. Sprint estendida em 1 semana para absorver o feriado de Páscoa e a revisão parcial G1.

### Backlog priorizado

- US-017 Snapshot de equipe por rodada (`/salvar-estado`) para matchmaking RN006.
- US-018 Rota `POST /partida/jogar-rodada` com matchmaking baseado em vitórias.
- US-019 Disputas via Strategy pattern, RNG justo e regras RN007/RN011.
- US-020 Resolução de partida, ranking e troféus (RF004, RF010).
- US-021 Compra e aplicação de itens com stacking de bônus.
- US-022 Login de convidado com saldo inicial de 2500 coins (RF005, RF010).
- US-023 Campanha: start e abandon flows com naming.
- US-024 Refactor de simulador para `SimuladorServiceError` em vez de throws crus.
- US-025 ErrorHandler global no Fastify com enum `ErrorCode`.
- US-026 Testes unitários de auth, equipe, mercado, itens e rodada.
- US-027 Testes de integração para auth, equipe e partida.
- US-028 Infraestrutura i18n no backend com i18next e header `Accept-Language`.
- US-029 Substituição de mensagens hardcoded por chaves i18n.
- US-030 Externalização de descrições do Swagger para i18n.
- US-031 Script de verificação de paridade pt-BR/en.
- US-032 Adaptação do server para Render (host, port, CORS, DATABASE_URL).
- US-033 Dashboard de ranking no front com Recharts.
- US-034 Layout de batalha horizontal com bola animada (RF006).
- US-035 Integração mercado/equipe/itens/convidado/ranking no front.

### Atribuição

| Integrante                      | Stories                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| Lucas Stopinski da Silva        | US-033, US-034, US-035, ajustes de UX do mercado e profile arcade |
| Pedro Henrique Silva Guligurski | US-017 a US-031 (backend, i18n, testes)                           |
| Lucas Bruno e Silva             | US-027 (integração), US-032 (deploy Render), revisão de regras    |

### Definition of Ready específica

- Catálogo de chaves i18n acordado em planning (namespaces `auth`, `market`, `battle`, `ranking`).
- Render account criada e variáveis de ambiente listadas.

### Definition of Done específica

- Cobertura de testes acima de 80% no server.
- Render staging respondendo a smoke test manual.
- `npm run i18n:check` verde nas duas locales.

---

## Sprint 4 — Polimento, BDD, UML e entrega final (10/05/2026 a 09/06/2026)

### Objetivo

Fechar gaps de avaliação da disciplina (BDD, UML, papéis de usuário, dark mode, deploy produtivo) e preparar a defesa. Sprint final de 4 semanas para consolidação.

### Backlog priorizado

- US-036 Renomeação de rotas e tags Swagger para inglês (consistência de API).
- US-037 Atualização de testes e docs para os novos paths em inglês.
- US-038 Migração do front para `next-intl` com cookie de locale.
- US-039 Namespaces base pt-BR e en no front.
- US-040 LanguageSwitcher no `ProfileCorner`.
- US-041 Integração de mensagens Zod e erros do backend com `next-intl`.
- US-042 Vitest, RTL e setup base no front.
- US-043 Helpers de teste (`renderWithProviders`, mocks de api/router/localStorage).
- US-044 Cobertura de testes de services, hooks, providers, context e components no front.
- US-045 CORS rejeitando wildcard em produção (hardening).
- US-046 GitHub Actions com lint, typecheck, tests e build (CI).
- US-047 CONTRIBUTING.md em front e server.
- US-048 READMEs atualizados com seções i18n, testes, swagger e erros.
- US-049 Paleta dark mode em `globals.css` do front (token-driven).
- US-050 Dashboard de ranking final com gráficos Recharts e filtros.
- US-051 Features BDD em Gherkin para auth, mercado e batalha.
- US-052 User stories formais com critérios de aceite.
- US-053 Diagramas UML de classes, sequência e atividade em Mermaid.
- US-054 Coluna `role` na tabela `users` e propagação no payload JWT.
- US-055 Middleware `requireRole` e rota `GET /admin/users`.
- US-056 Stored procedure `sp_get_top_athletes_by_role` para relatórios.
- US-057 Deploy no Railway (homologação da entrega final).
- US-058 Plano de ação para apresentação final 23/06.

### Atribuição

| Integrante                      | Stories                                                |
| ------------------------------- | ------------------------------------------------------ |
| Lucas Stopinski da Silva        | US-038 a US-044, US-049, US-050, US-058                |
| Pedro Henrique Silva Guligurski | US-036, US-037, US-045, US-054, US-055, US-056         |
| Lucas Bruno e Silva             | US-046, US-047, US-048, US-051, US-052, US-053, US-057 |

### Definition of Ready específica

- Critérios da rubrica da disciplina mapeados (BDD, UML, roles, deploy).
- Templates de Gherkin e Mermaid acordados.

### Definition of Done específica

- Deploy Railway respondendo na URL pública.
- BDD, UML e user stories versionados em `server/docs/`.
- Dark mode acessível via toggle e respeitando `prefers-color-scheme`.
- Apresentação final ensaiada pelo menos uma vez com tempo cronometrado.

---

## Riscos e mitigacoes mapeados em planning

| Risco                               | Probabilidade | Impacto | Mitigacao                                  |
| ----------------------------------- | ------------- | ------- | ------------------------------------------ |
| Atraso em testes de integração      | Média         | Alto    | Pareamento Pedro + Lucas Bruno na sprint 3 |
| Deploy quebrar em produção          | Média         | Alto    | Staging no Render desde sprint 3           |
| Conflitos de merge entre os 3 repos | Alta          | Médio   | Branch `integration/grupo-1` central       |
| i18n gerar regressão silenciosa     | Média         | Médio   | Script `i18n:check` + smoke manual         |
| BDD/UML deixados para o final       | Alta          | Alto    | US dedicadas no início da sprint 4         |
