# Plano de Acao — Apresentacao Final AutoSoccer

> **Disciplina:** Experiencia Criativa: Projetando Sistemas de Informacao — BSI PUCPR 2026/1
> **Professores:** Cleverson Avelino, Vinicius G. Mendonca
> **Apresentacao:** 23/06/2026 (auditorio) — presencial
> **Entrega:** mesma data (adiada do cronograma original de 09/06)
> **Grupo:** Lucas Stopinski da Silva, Pedro Henrique Silva Guligurski, Lucas Bruno e Silva

---

## 1. Objetivo

Maximizar pontuacao na rubrica `Avaliacao_ExpCriativa2026.xlsx` (max 19.5 pts)
e entregar apresentacao polida que demonstre RA1 (propor solucoes com ES) e
RA2 (implementar sistema real) com defesa de autoria individual.

**Meta de nota:** >= 18 / 19.5 (92%+)
**Estado atual estimado:** ~13 / 19.5 (66%)
**Quick wins planejados:** +6 a +8 pts

---

## 2. Mapeamento Tarefas -> Criterios da Rubrica

| # Rubrica | Criterio | Peso | Estado Atual | Tarefa Planejada | Responsavel | Ganho |
|---|---|---|---|---|---|---|
| 10 | Front separado do back (JSON async) | 0.5 | 100% | — | — | 0 |
| 11 | CRUD com verbos HTTP | 0.5 | 100% | — | — | 0 |
| 12 | Dashboard com graficos e filtros | 0.5 | 0% | T1 — Grafico no ranking | Lucas S | +0.5 |
| 13 | Sprints registradas (TDE) | 0.5 | 40% | T9 — Sprints em GitHub Projects | Lucas B | +0.5 |
| 14 | GitHub + gitflow | 0.5 | 100% | — | — | 0 |
| 15 | JWT com 2+ permissoes | 0.5 | 40% | T5 — Roles admin/user | Pedro | +0.5 |
| 16 | Requisitos com Cucumber/BDD | 1.0 | 0% | T3 — .feature files Gherkin | Lucas B | +1.0 |
| 17 | Cobertura backend > 75% | 1.0 | 100% (84%) | — | — | 0 |
| 18 | Cobertura frontend > 75% | 1.0 | 100% (94%) | — | — | 0 |
| 19 | 3 Features + 3 User Stories | 1.0 | 0% | T3 — junto com BDD | Lucas B | +1.0 |
| 20 | OpenAPI/Swagger documentado | 1.0 | 100% | — | — | 0 |
| 21 | Responsivo + Dark Mode | 1.0 | 70% | T2 — Dark Mode | Lucas S | +0.5 |
| 22 | CI/CD por ambiente + monitoramento | 1.5 | 40% | T8 — Sonar + UptimeRobot | Lucas B | +0.5 |
| 23 | i18n (textos + conteudo + moeda) | 1.5 | 100% | — | — | 0 |
| 24 | Microsservicos | 1.5 | 0% | *nao vale a pena* | — | 0 |
| 25 | Indices + stored procedures | 1.5 | 40% | T6 — SP + 3 relatorios | Pedro | +1.5 |
| 26 | Upload com CDN | 1.5 | 0% | *nao vale a pena* | — | 0 |
| 27 | UML (classes + sequencia + atividade) | 1.5 | 0% | T4 — Mermaid/PlantUML | Lucas B | +1.5 |
| 28 | Outra tecnologia | 0.5-1.5 | nao validado | descartado (decisao do grupo em 10/06) | — | 0 |

**Estimativa final:** 13 + 7 = **20 / 19.5** (capped em 19.5)

---

## 3. Tarefas Detalhadas

### T1. Dashboard com grafico no ranking [Front]

- **Responsavel:** Lucas Stopinski
- **Branch:** `feat/dashboard-grafico-ranking`
- **Pontos:** +0.5 (criterio 12)
- **Esforco:** 3h
- **Prazo:** 13/06
- **Entregavel:**
  - Instalar `@ant-design/charts` ou `recharts`
  - Adicionar 2 graficos na pagina `/ranking`:
    - Barras horizontais: top 10 jogadores por trofeus
    - Linha: evolucao de trofeus do usuario logado nas ultimas N campanhas
  - Filtros: periodo (7d, 30d, all-time), tipo (so eu vs todos)
  - Responsivo e respeitando i18n
- **Criterio de aceite:**
  - Grafico renderiza sem erro
  - Filtros funcionam e atualizam o grafico
  - Testes unitarios do componente (>= 3 casos)

### T2. Dark Mode [Front]

- **Responsavel:** Lucas Stopinski
- **Branch:** `feat/dark-mode`
- **Pontos:** +0.5 (criterio 21 — sobe de 70% para 100%)
- **Esforco:** 4h
- **Prazo:** 12/06
- **Entregavel:**
  - Adicionar `data-theme="dark"` no root + CSS vars `--dark-*` em `globals.css`
  - Toggle no `ProfileCorner` (ao lado do `LanguageSwitcher`)
  - Persistir em cookie `THEME` (igual `NEXT_LOCALE`)
  - Aplicar tema em todas as paginas (auth, home, market, battle, ranking, profile)
  - Garantir contraste WCAG AA em dark mode
- **Criterio de aceite:**
  - Toggle muda visual sem reload abrupto
  - Cookie persiste entre sessoes
  - Todas as paginas legiveis em dark
  - Teste unitario do toggle

### T3. Features BDD + User Stories [Doc]

- **Responsavel:** Lucas Bruno
- **Branch:** `docs/features-bdd-user-stories`
- **Pontos:** +2.0 (criterios 16 e 19)
- **Esforco:** 3h
- **Prazo:** 12/06
- **Entregavel:**
  - Criar `server/docs/features/` com 3 arquivos Gherkin:
    - `autenticacao.feature` (login com email/senha, login convidado, logout)
    - `mercado.feature` (listar atletas, comprar atleta, refresh do mercado)
    - `batalha.feature` (iniciar campanha, jogar rodada, finalizar campanha)
  - Criar `server/docs/user-stories.md` com 3 user stories detalhadas:
    - Como **jogador casual**, quero login rapido para experimentar sem cadastro
    - Como **jogador competitivo**, quero ver meu progresso no ranking
    - Como **estrategista**, quero aplicar itens nos meus atletas para melhorar atributos
  - Cada US com criterios de aceite e definicao de pronto (DoD)
- **Criterio de aceite:**
  - 3 .feature files validos em Gherkin (Given/When/Then)
  - 3 user stories com formato As-Want-So-That
  - Cobertura de cenarios de erro alem do happy path

### T4. Diagramas UML [Doc]

- **Responsavel:** Lucas Bruno
- **Branch:** `docs/diagramas-uml`
- **Pontos:** +1.5 (criterio 27)
- **Esforco:** 5h
- **Prazo:** 14/06
- **Entregavel:**
  - Criar `server/docs/diagrams/` com diagramas em **Mermaid** (renderizam direto no GitHub):
    1. `classes.md` — diagrama de classes dos models (User, Team, Athlete, Item, TeamSnapshot, Campaign)
    2. `seq-login.md` — sequencia de login JWT (Front -> Fastify -> auth.service -> DB -> resposta)
    3. `seq-jogar-rodada.md` — sequencia de jogar rodada (Front -> POST /match/play-round -> rodada.service -> simulador -> matchmaking -> snapshot -> DB -> resposta com log de turnos)
    4. `atividade-campanha.md` — atividade de campanha completa (start -> compra/venda no mercado -> aplica itens -> joga rodada -> repete -> finaliza/desiste)
  - Anexar imagens PNG dos diagramas renderizados em `server/docs/diagrams/png/`
- **Criterio de aceite:**
  - Diagramas renderizam direto no GitHub
  - Pelo menos 1 diagrama de classes E 2 sequencias E 1 atividade (atende 100% do criterio)
  - Mencionados no README do server e no `PLANO_DE_ACAO.md`

### T5. JWT com 2 permissoes [Back]

- **Responsavel:** Pedro Guligurski
- **Branch:** `feat/roles-permissions`
- **Pontos:** +0.5 (criterio 15 — sobe de 40% para 100%)
- **Esforco:** 3h
- **Prazo:** 13/06
- **Entregavel:**
  - Migration adicionando coluna `role` em `users` (enum: `'user'`, `'admin'`)
  - Atualizar `auth.service.ts` para incluir `role` no JWT payload
  - Middleware `requireRole('admin')` em `auth.middleware.ts`
  - Pelo menos 1 endpoint admin-only (ex: `POST /admin/seed-reset` ou `GET /admin/users`)
  - Testes de integracao validando 401/403 para role incorreto
  - Seed cria 1 admin padrao
- **Criterio de aceite:**
  - Login admin retorna JWT com role
  - Rota admin retorna 403 para user comum
  - Rota admin funciona com token admin
  - Documentado no Swagger

### T6. Stored procedure + 3 relatorios [Back]

- **Responsavel:** Pedro Guligurski
- **Branch:** `feat/relatorios-stored-procedures`
- **Pontos:** +1.5 (criterio 25)
- **Esforco:** 5h
- **Prazo:** 16/06
- **Entregavel:**
  - Migration adicionando indices estrategicos (team.user_id ja tem; adicionar em athlete.team_id, team_snapshot.user_id+round, etc.)
  - Migration criando stored procedure `sp_relatorio_top_atletas` (top 10 atletas mais comprados nas ultimas N rodadas)
  - 3 endpoints novos em `/admin/reports/`:
    - `GET /admin/reports/top-athletes?period=30d` — usa a SP
    - `GET /admin/reports/win-rate-by-role` — query dinamica com JOIN agregado
    - `GET /admin/reports/trophy-evolution?userId=` — query dinamica com agregacao temporal
  - Cada endpoint com Swagger e teste de integracao
  - Migration reversa (down) implementada
- **Criterio de aceite:**
  - 3 relatorios funcionais
  - Pelo menos 1 usa stored procedure
  - Documentado no `docs/api-team.md` ou `docs/api-reports.md`

### T7. Sprints em TDE formal [Doc/Infra]

- **Responsavel:** Lucas Bruno
- **Branch:** `docs/sprints-tde`
- **Pontos:** +0.1 (criterio 13 — completa para 100%, ja temos PLANO_DE_ACAO)
- **Esforco:** 2h
- **Prazo:** 15/06
- **Entregavel:**
  - Criar GitHub Project (kanban) `AutoSoccer Sprints` em ambos repos (ou um central)
  - Milestones: Sprint 1, 2, 3, 4 + Sprint 5 (apresentacao)
  - Backlog organizado em colunas: To do, In progress, Done
  - Issues criadas a posteriori representando cada workstream WS-01 a WS-16
  - Documentar em `server/docs/sprints/` 1 retrospectiva por sprint:
    - `sprint-1.md` (o que deu certo / o que melhorar / acoes)
    - `sprint-2.md`, `sprint-3.md`, `sprint-4.md`
- **Criterio de aceite:**
  - Kanban visivel publicamente no GitHub
  - 4 retrospectivas escritas
  - Backlog refletindo todas as WS-01 a WS-16
  - Linkado no README

### T8. SonarCloud + Healthcheck monitoring [Infra]

- **Responsavel:** Lucas Bruno
- **Branch:** `chore/monitoring-sonar-uptime`
- **Pontos:** +0.5 (criterio 22 — sobe de 40% para 100%)
- **Esforco:** 3h
- **Prazo:** 16/06
- **Entregavel:**
  - Habilitar SonarCloud (free) para ambos os repos
  - Adicionar `sonar-project.properties` em cada repo
  - Step no CI rodando `sonar-scanner` apos os testes
  - UptimeRobot configurado para fazer ping em `https://autosoccer-api-production.up.railway.app/health` a cada 5 min
  - Screenshot dos dashboards Sonar + UptimeRobot no `server/docs/monitoring.md`
  - **Atencao:** depende de deploy ativo no Railway (ja em producao)
  - **Limpeza:** remover `server/.github/workflows/cd-production.yml` (morto-codigo da tentativa Cloudways via SSH, nunca foi usado em prod)
- **Criterio de aceite:**
  - Badge do Sonar no README (lines coverage, quality gate)
  - URL publica do UptimeRobot ou screenshot anexado
  - Mencao no CI/CD da apresentacao

### T9. CI/CD por ambiente [Infra]

- **Responsavel:** Lucas Bruno
- **Branch:** `chore/ci-environments`
- **Pontos:** +0.5 (parte do criterio 22)
- **Esforco:** 2h
- **Prazo:** 17/06
- **Entregavel:**
  - Atualizar `.github/workflows/ci.yml` com 3 jobs: `lint-test`, `deploy-staging` (PR), `deploy-production` (main)
  - Variavel `NODE_ENV` (dev/test/prod) afetando comportamento
  - Railway: 2 services no mesmo projeto (`autosoccer-api-staging` e `autosoccer-api-production`) com branches diferentes (`staging` e `main`)
  - Plugin MySQL separado por service (database distinto por ambiente) ou 2 projetos Railway distintos
- **Criterio de aceite:**
  - PR triggers staging deploy
  - Merge main triggers prod deploy
  - URLs distintas funcionando

### T10. Slides .pptx — capa + intro + outro [P3]

- **Responsavel:** Lucas Stopinski (lidera, todos contribuem)
- **Pontos:** apresentacao
- **Esforco:** 4h
- **Prazo:** 17/06
- **Entregavel:**
  - Arquivo `apresentacao/AutoSoccer_Apresentacao.pptx`
  - **Estilo arcade:** fundo `#111827` ou `#1a1a1a`, accent `#f97316`, border 4px, font Inter/Poppins weight 900, drop shadows estilo botao de fliperama
  - Estrutura completa de 28 slides (ver secao 5 deste documento)
  - Logo do AutoSoccer + identidade visual do projeto
  - Cada slide com placeholders preenchidos pelo dono da secao

### T11. Slides — Frontend (Lucas Stopinski) [P3]

- **Esforco:** 3h
- **Prazo:** 19/06
- **Conteudo:** 7 slides (Next.js, antd, i18n, layout batalha, dark mode, dashboard, testes)

### T12. Slides — Backend (Pedro) [P3]

- **Esforco:** 3h
- **Prazo:** 19/06
- **Conteudo:** 7 slides (Fastify, Sequelize, padroes, i18n, Swagger, JWT roles, relatorios)

### T13. Slides — Infra (Lucas Bruno) [P3]

- **Esforco:** 3h
- **Prazo:** 19/06
- **Conteudo:** 7 slides (Git workflow, CI/CD, deploy, monitoramento, UML, BDD/US, banco)

### T14. Roteiro de demo cronometrado [P3]

- **Responsavel:** Lucas Stopinski (driver do demo)
- **Esforco:** 2h
- **Prazo:** 20/06
- **Entregavel:** Arquivo `apresentacao/ROTEIRO_DEMO.md` com:
  - Setup pre-apresentacao: laptop pronto, dev rodando, browser limpo, contas seed criadas
  - Sequencia de 4 min:
    - 0:00-0:30 — landing page + LanguageSwitcher (PT->EN->PT)
    - 0:30-1:00 — login convidado (mostra dark mode toggle)
    - 1:00-2:00 — mercado: comprar 2 atletas + 1 item, drag pro campo
    - 2:00-3:00 — jogar 1 rodada completa (animacao da bola + logs verticais)
    - 3:00-3:30 — modal de fim de rodada -> menu
    - 3:30-4:00 — ranking com dashboard
  - Plano B caso algo falhe (capturas de tela e video)

### T15. Defesa de autoria — cheat sheets [P3]

- **Esforco:** 2h por integrante
- **Prazo:** 21/06
- **Entregavel:** 3 arquivos `apresentacao/defesa-<nome>.md` com:
  - Perguntas previsiveis e respostas
  - Decisoes arquiteturais com justificativa
  - "Por que NAO usei X"
  - Mapeamento codigo -> conceito da disciplina
- **Exemplo Lucas S (front):**
  - Por que Next.js 16 e nao Vite? (App Router, SSR, otimizacao de fontes)
  - Por que antd e nao Tailwind? (componentes prontos, theming, i18n integrado)
  - Como funciona a animacao da bola na batalha? (CSS transitions + atualizacao de coords)
  - Como o dark mode persiste? (cookie + CSS vars)
  - Como testou o componente X? (renderWithProviders + RTL)

### T16. README final + URLs publicas [P3]

- **Responsavel:** Lucas Bruno
- **Esforco:** 1h
- **Prazo:** 22/06
- **Entregavel:**
  - README de ambos repos com:
    - Badge Sonar
    - URL Railway publica do back (production e staging) + URL Vercel do front
    - URL Swagger publica
    - Link do video demo backup
    - Link da apresentacao .pptx

---

## 4. Cronograma Dia a Dia (10/06 a 23/06)

| Data | Lucas S (Front) | Pedro (Back) | Lucas B (Infra/Docs) | Eventos |
|---|---|---|---|---|
| 10/06 (hoje) | Planejamento + setup branches | Planejamento + setup branches | Planejamento + setup branches | **Plano aprovado** |
| 11/06 | T2 Dark Mode (inicio) | T5 JWT roles (inicio) | T3 BDD .feature (inicio) | — |
| 12/06 | T2 Dark Mode (finaliza) | T5 JWT roles (finaliza) | T3 BDD + User Stories (finaliza) | **Merge T2, T5, T3** |
| 13/06 | T1 Dashboard grafico | T6 Stored procedures (inicio) | T4 Diagramas UML (inicio) | — |
| 14/06 | Polish + testes T1+T2 | T6 Stored procedures + relatorios | T4 Diagramas UML (finaliza) | **Merge T1, T4** |
| 15/06 | Buffer / ajustes | T6 Stored procedures (finaliza) | T7 Sprints TDE + retrospectivas | **Merge T6, T7** |
| 16/06 | Inicio slides front | Inicio slides back | T8 SonarCloud + UptimeRobot | **Merge T8** |
| 17/06 | T11 Slides front (cont.) | T12 Slides back (cont.) | T9 CI por ambiente + T10 estrutura slides | **Capa + intro pronta** |
| 18/06 | T11 Slides front (finaliza) | T12 Slides back (finaliza) | T13 Slides infra | — |
| 19/06 | Revisao geral de slides | Revisao geral de slides | T13 Slides infra (finaliza) | **Slides 100%** |
| 20/06 | T14 Roteiro demo | T15 Defesa autoria back | T15 Defesa autoria infra | — |
| 21/06 | T15 Defesa autoria front + dry run 1 | dry run 1 | dry run 1 + T16 README | **Dry run 1** |
| 22/06 | dry run 2 + ajustes | dry run 2 + ajustes | dry run 2 + ajustes + screenshots | **Dry run 2** |
| 23/06 | **APRESENTACAO** | **APRESENTACAO** | **APRESENTACAO** | 🎯 |

---

## 5. Estrutura dos Slides (28 slides)

> **Estilo:** arcade combinando com o front. Fundo escuro `#111827`, accent `#f97316`, font weight 900, letter-spacing wide, drop shadow tipo botao de fliperama. Borda 4px nos cards. Animacao discreta de hover.

| # | Slide | Responsavel | Tempo | Indicadores |
|---|---|---|---|---|
| 1 | Capa: logo AutoSoccer + equipe + data + disciplina | grupo | 0:20 | — |
| 2 | Agenda da apresentacao | Lucas S | 0:20 | — |
| 3 | O que e o AutoSoccer (1 frase + screenshot) | Lucas S | 0:40 | RA2 |
| 4 | Problema e contexto (engenharia de software aplicada a um auto-battler) | Pedro | 0:40 | RA1 |
| 5 | **FRONT-END** | Lucas S | — | — |
| 6 | Stack front: Next.js 16 + React 19 + antd 6 + axios | Lucas S | 0:30 | ID2.4 |
| 7 | i18n com next-intl (cookie + namespaces + Accept-Language) | Lucas S | 0:40 | ID2.4 |
| 8 | Layout da batalha (header unificado + sidebar logs + animacao bola) | Lucas S | 0:50 | ID2.1 |
| 9 | **NOVO** Dark Mode + responsividade + WCAG | Lucas S | 0:30 | ID2.2 |
| 10 | **NOVO** Dashboard com graficos no ranking | Lucas S | 0:30 | ID2.3 |
| 11 | Testes front (94% cobertura, vitest + RTL + renderWithProviders) | Lucas S | 0:40 | ID2.2 |
| 12 | **BACK-END** | Pedro | — | — |
| 13 | Stack back: Fastify 5 + Sequelize + MySQL + i18next | Pedro | 0:30 | ID2.4 |
| 14 | Padroes: Strategy (disputas) + Factory (testes) + ErrorHandler global | Pedro | 0:50 | ID2.2 |
| 15 | i18n no back: Accept-Language + 9 namespaces + paridade pt-BR/en | Pedro | 0:30 | ID2.4 |
| 16 | Swagger 100% (11 schemas centralizados + 20 rotas em ingles) | Pedro | 0:40 | ID1.2 |
| 17 | **NOVO** JWT com 2 permissoes (user / admin) | Pedro | 0:30 | ID2.3 |
| 18 | **NOVO** Stored procedures + 3 relatorios gerenciais | Pedro | 0:50 | ID2.3 |
| 19 | Testes back (84% cobertura, 152 testes, 3 suites integration) | Pedro | 0:40 | ID2.2 |
| 20 | **INFRAESTRUTURA** | Lucas B | — | — |
| 21 | Git workflow (conventional commits, branches por WS, integration branch) | Lucas B | 0:40 | ID1.3, ID1.4 |
| 22 | **NOVO** UML: classes + sequencia + atividade | Lucas B | 0:50 | ID1.2 |
| 23 | **NOVO** Features BDD + User Stories | Lucas B | 0:40 | ID1.1 |
| 24 | CI/CD GitHub Actions (lint + typecheck + i18n + test + build) | Lucas B | 0:30 | ID1.4 |
| 25 | **NOVO** Sonar + UptimeRobot monitoring + healthcheck | Lucas B | 0:30 | ID1.4 |
| 26 | Deploy Railway (back) + Vercel (front) + .env por ambiente | Lucas B | 0:40 | ID2.4 |
| 27 | **DEMO AO VIVO** (4 min cronometrados) | Lucas S dirige | 4:00 | tudo |
| 28 | Metricas finais + licoes aprendidas + Q&A | grupo | 1:00 | — |

**Tempo total estimado:** ~20 min (objetivo: 15-20 min com Q&A)

---

## 6. Distribuicao Final por Integrante

### Lucas Stopinski da Silva (Front-end)

**Implementacao:** T1 Dashboard + T2 Dark Mode
**Documentacao:** T11 Slides front + T14 Roteiro demo + T15 Defesa autoria front
**Demo:** dirige a demo ao vivo (4 min)
**Estimativa de carga:** ~20h em 13 dias

### Pedro Henrique Silva Guligurski (Back-end)

**Implementacao:** T5 JWT roles + T6 Stored procedures + 3 relatorios
**Documentacao:** T12 Slides back + T15 Defesa autoria back
**Demo:** apoia em endpoints (caso a demo precise mostrar Swagger ao vivo)
**Estimativa de carga:** ~22h em 13 dias

### Lucas Bruno e Silva (Infraestrutura)

**Implementacao:** T8 SonarCloud + UptimeRobot + T9 CI por ambiente
**Documentacao:** T3 BDD + User Stories + T4 UML + T7 Sprints TDE + T13 Slides infra + T15 Defesa autoria infra + T16 README final
**Demo:** apoia mostrando GitHub Actions / Sonar / kanban se perguntado
**Estimativa de carga:** ~25h em 13 dias

---

## 7. Riscos e Contingencias

| Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|
| Railway/Vercel down no dia da apresentacao | media | alto | Demo local no laptop + screenshots backup + video gravado |
| Algum integrante doente / ausente | baixa | alto | Cada slide tem **2 donos** que podem apresentar (registrar no .pptx) |
| MySQL local nao roda no notebook do apresentador | media | alto | Docker compose + dados de seed + testar 48h antes |
| Bug critico em prod descoberto na vespera | media | medio | Rollback rapido para `integration/grupo-1` (snapshot conhecido bom) |
| T6 (stored procedures) muito demorada | media | medio | Reduzir escopo: 2 relatorios em vez de 3 |
| WCAG falhar em alguma tela em dark mode | baixa | baixo | Audit com Chrome Lighthouse antes de mergear T2 |
| Slide com texto demais (overload) | media | medio | Regra: max 6 bullets por slide, sem paragrafos |
| Apresentar passar de 20 min | media | medio | Cronometrar dry runs e cortar |

---

## 8. Itens Urgentes (proximas 24h)

> **Decisao final de deploy (20/06/2026):** durante a sprint 5 o grupo testou a migracao Render -> Cloudways (PaaS via SSH/PM2/Nginx), mas a configuracao manual no painel + ausencia de deploy declarativo em arquivo no repo nao se pagaram para o contexto academico. **Decidimos manter o back no Railway**, que ja estava em uso desde a sprint 3 e oferece auto-deploy via push, Nixpacks como builder e plugin MySQL gerenciado nativo no mesmo projeto. O front continua na **Vercel** (sem mudanca). Arquivos legados a remover: `server/.github/workflows/cd-production.yml` (workflow Cloudways via SSH que nunca foi acionado em prod) e qualquer mencao residual a `server/render.yaml`.

- [x] **Aprovar este plano** — confirmado por Lucas Stopinski em 10/06 com aval pra commitar com info da equipe
- [x] **Decisao sobre criterio 28** — descartado, vamos focar em pontuar os outros criterios
- [x] **Deploy Railway (back)** — JA ATIVO em `https://autosoccer-api-production.up.railway.app` com plugin MySQL nativo. T8 (Sonar + UptimeRobot) desbloqueada.
- [ ] **Deploy Vercel (front)** — confirmar que o projeto front esta linkado e com `NEXT_PUBLIC_API_URL` apontando para a URL Railway do back
- [ ] **Cada integrante criar branch local a partir do main** (`git checkout -b <branch>`)
- [ ] **Agendar 2 reunioes de sincronizacao:** quarta 17/06 (status checkpoint) + domingo 22/06 (dry run final)

### Guia rapido para subir o deploy no Railway (back) + Vercel (front)

**Back-end no Railway:**

1. Lucas Bruno: criar conta em https://railway.com (login com GitHub)
2. Criar **New Project > Empty Project**
3. Adicionar plugin de banco: **+ New > Database > MySQL** (o plugin expoe `MYSQL_URL` automaticamente)
4. Adicionar o servico do back: **+ New > GitHub Repo > AutoSoccer/server** (Railway detecta Node.js via Nixpacks, sem precisar de Dockerfile custom)
5. Em **Settings > Build**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run db:migrate && node dist/index.js` (migrations rodam **antes** do servidor subir; se falhar, versao antiga permanece)
6. Em **Variables**, configurar todas as vars de producao:
   - `DATABASE_URL=${{MySQL.MYSQL_URL}}` (referencia ao plugin MySQL)
   - `DB_SSL=false` (rede interna do Railway nao exige SSL)
   - `JWT_SECRET=<gerar com openssl rand -base64 48>` (secret, nunca em codigo)
   - `JWT_EXPIRES_IN=7d`
   - `NODE_ENV=production`
   - `APP_HOST=0.0.0.0`
   - `PORT=3000`
   - `CORS_ORIGIN=<URL do front na Vercel>` (em prod o boot quebra se for `*` ou vazio — guard de seguranca em `src/config/env.ts`)
7. Em **Settings > Networking**, clicar em **Generate Domain** — Railway provisiona `https://autosoccer-api-production.up.railway.app`
8. Validar:
   - `GET /health` retorna `200` com `{ status: 'ok' }`
   - `GET /docs` exibe o Swagger UI

**Deploy continuo (auto-deploy):**

A cada `git push origin main`, o Railway reconstroi e publica via webhook do GitHub. Para deploy manual rapido sem commit, usar a Railway CLI:

```bash
npm install -g @railway/cli
railway login
railway link        # dentro de server/, selecionar o service autosoccer-api
railway up          # upload direto + build + deploy
```

**Front-end na Vercel (sem mudanca):**

9. Confirmar projeto front no painel Vercel apontando para o repo `front`, branch `main`
10. Env var `NEXT_PUBLIC_API_URL` = `https://autosoccer-api-production.up.railway.app`
11. Redeploy o front para pegar a env var atualizada
12. Voltar no back e atualizar `CORS_ORIGIN` com a URL Vercel do front no painel Railway (auto-redeploy ao salvar var)
13. Smoke test final: abrir o front na Vercel, fazer login convidado, verificar comunicacao com o back
14. Configurar UptimeRobot fazendo ping em `https://autosoccer-api-production.up.railway.app/health` a cada 5 min

---

## 9. Definicoes de Pronto (DoD)

Para considerar uma tarefa **completa**:

1. Branch mergeada na `main` de cada repo (sem warnings de typecheck/lint)
2. Testes passam (`yarn test` ou `npm test`) com cobertura >= 75% no que foi adicionado
3. i18n parity check passa (`yarn i18n:check`) — quando aplicavel
4. Documentado no README ou no PLANO_DE_ACAO.md ou em arquivo dedicado em `docs/`
5. Mencionado no slide correspondente (se aplicavel a apresentacao)

---

## 10. Ferramentas Externas Necessarias

| Ferramenta | Conta | Quem cria | Custo |
|---|---|---|---|
| Railway (back + plugin MySQL) | grupo | Lucas B | plano Hobby (creditos free + pay-as-you-go, ~$5/mes no uso atual) — plugin MySQL gerenciado nativo |
| Vercel (front) | grupo | Lucas B | free tier (hobby) |
| SonarCloud | grupo | Lucas B | free para repos publicos |
| UptimeRobot | grupo | Lucas B | free tier (50 monitors, 5min check) |
| GitHub Projects | ja existe | Lucas B | free |

---

## 11. Criterio 28 — Decisao do grupo

Item 28 da rubrica vale 0.5 a 1.5 mas exige **validacao com professores ate a 3a sprint**. Como ja passamos da 3a sprint sem ter feito essa validacao, o grupo decidiu em **10/06/2026** descartar este criterio e concentrar esforco em maximizar os outros que ja estao definidos.

Tecnologias extras que naturalmente aparecem no projeto (i18n full-stack, animation tracker da bola na batalha, Strategy pattern do engine de simulacao) podem ser mencionadas como destaques na apresentacao para reforcar a qualidade do produto, mas sem pleitear pontos do criterio 28.

---

## 12. Convencoes de commit

Conforme `server/CONTRIBUTING.md` e `front/AGENTS.md`:
- Conventional Commits em **pt-BR sem acentos** (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`)
- Titulo <= 72 chars, modo imperativo
- **Sem Co-Authored-By** (decisao do grupo desde a Sprint 4)
- Branches no padrao `feat|fix|test|docs|chore|refactor/ws-XX-<slug>` ou `feat|docs/<slug>` para tarefas de apresentacao

Os tres integrantes (Lucas Stopinski, Pedro Guligurski, Lucas Bruno) estao cientes da divisao de tarefas e do cronograma desde 10/06/2026.

---

> Documento mantido por: Lucas Stopinski (com input de Pedro Guligurski e Lucas Bruno)
> Ultima atualizacao: 10/06/2026
