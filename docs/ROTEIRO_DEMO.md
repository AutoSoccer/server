# Roteiro de Apresentacao + Demo — AutoSoccer

> **Apresentacao final:** 23/06/2026 — Disciplina Experiencia Criativa BSI PUCPR 2026/1
> **Tempo total:** 20 minutos (15 min apresentacao + 5 min Q&A)
> **Local:** Auditorio PUCPR — presencial com projetor
> **Equipe:** Lucas Stopinski (front), Pedro Guligurski (back), Lucas Bruno (infra/QA)
> **Driver do demo:** Lucas Stopinski (laptop principal)

---

## Sumario

1. [Plano de tempo](#1-plano-de-tempo-0000--1500)
2. [Demo ao vivo](#2-demo-ao-vivo-4-fluxos)
3. [Plano B (fallback)](#3-plano-b-fallback)
4. [Roteiro de fala por slide](#4-roteiro-de-fala-por-slide)

---

## 1. Plano de tempo (00:00 → 15:00)

Cronograma alvo: 15 min de apresentacao + 5 min de Q&A. Cada slide tem dono primario (fala) e dono secundario (backup caso falte alguem). Demo ao vivo no slide 27 com 4 fluxos cronometrados.

| Tempo | Slide | Dono | Conteudo (1-2 linhas) |
|---|---|---|---|
| 00:00–00:20 | 1. Capa | Grupo (Lucas S abre) | "Boa tarde, somos o grupo do AutoSoccer e vamos apresentar nossa entrega final da Experiencia Criativa." |
| 00:20–00:40 | 2. Agenda | Lucas S | Apresenta o roteiro: produto, front, back, infra, demo, perguntas. |
| 00:40–01:20 | 3. O que e o AutoSoccer | Lucas S | Auto-battler de fantasy soccer com mercado, batalha, ranking e i18n full-stack. |
| 01:20–02:00 | 4. Problema e contexto | Pedro | Por que escolhemos um auto-battler para aplicar ES: dominio rico, regras complexas, varios subsistemas. |
| 02:00–02:10 | 5. FRONT-END (divisor) | Lucas S | Divisor visual de bloco, transicao curta. |
| 02:10–02:40 | 6. Stack front | Lucas S | Next.js 16 App Router + React 19 + antd 6 + axios + next-intl. |
| 02:40–03:20 | 7. i18n com next-intl | Lucas S | Cookie NEXT_LOCALE + namespaces + Accept-Language para SSR. |
| 03:20–04:10 | 8. Layout da batalha | Lucas S | Header unificado, sidebar de logs verticais e animacao da bola via CSS transitions. |
| 04:10–04:40 | 9. Dark Mode + WCAG | Lucas S | Toggle via cookie THEME, CSS vars, contraste AA. |
| 04:40–05:10 | 10. Dashboard ranking | Lucas S | Graficos no /ranking com filtros de periodo. |
| 05:10–05:50 | 11. Testes front (94%) | Lucas S | Vitest + RTL + renderWithProviders. |
| 05:50–06:00 | 12. BACK-END (divisor) | Pedro | Transicao. |
| 06:00–06:30 | 13. Stack back | Pedro | Fastify 5 + Sequelize + MySQL 8 + i18next. |
| 06:30–07:20 | 14. Padroes | Pedro | Strategy nas disputas, Factory nos testes, ErrorHandler global. |
| 07:20–07:50 | 15. i18n no back | Pedro | Accept-Language + 9 namespaces + paridade pt-BR/en. |
| 07:50–08:30 | 16. Swagger 100% | Pedro | 11 schemas centralizados e 20 rotas em ingles. |
| 08:30–09:00 | 17. JWT com 2 permissoes | Pedro | Roles user/admin com middleware requireRole. |
| 09:00–09:50 | 18. Stored procedures + relatorios | Pedro | SP `sp_relatorio_top_atletas` + 3 endpoints admin. |
| 09:50–10:30 | 19. Testes back (84%) | Pedro | 152 testes, 3 suites de integration. |
| 10:30–10:40 | 20. INFRA (divisor) | Lucas B | Transicao. |
| 10:40–11:20 | 21. Git workflow | Lucas B | Conventional commits, branches por WS, integration branch. |
| 11:20–12:10 | 22. UML | Lucas B | Classes + 2 sequencias + atividade em Mermaid. |
| 12:10–12:50 | 23. BDD + User Stories | Lucas B | 3 .feature em Gherkin + 3 US com criterios. |
| 12:50–13:20 | 24. CI/CD GitHub Actions | Lucas B | lint + typecheck + i18n:check + test + build. |
| 13:20–13:50 | 25. Sonar + UptimeRobot | Lucas B | Quality gate + ping /health a cada 5 min. |
| 13:50–14:30 | 26. Deploy + .env | Lucas B | Railway (back + MySQL plugin) + Vercel (front) + secrets sync:false. |
| 14:30–18:30 | 27. DEMO AO VIVO | Lucas S dirige | 4 fluxos cronometrados (ver secao 2). |
| 18:30–19:30 | 28. Metricas + licoes + Q&A | Grupo | Cobertura, criterios atendidos, retro curta. |
| 19:30–20:00 | Q&A | Grupo | Perguntas dos professores. |

> **Buffer:** se a apresentacao adiantar, expandir Q&A; se atrasar, cortar slide 11 (testes front) e slide 19 (testes back) para 20s cada e remover transicoes 5, 12 e 20.

---

## 2. Demo ao vivo (4 fluxos)

Demo ocorre entre 14:30 e 18:30 (4 minutos), driver Lucas S no laptop principal projetando. Pedro e Lucas B acompanham e assumem narracao no fluxo deles.

### Setup pre-apresentacao (checklist 30 min antes)

- [ ] Laptop ligado, carregador conectado, projetor reconhecido em modo espelhado
- [ ] Backend em producao (Railway) respondendo em `https://autosoccer-api-production.up.railway.app/health`
- [ ] Frontend em producao (Vercel) abrindo em `https://autosoccer.vercel.app`
- [ ] Backup local: `yarn dev` rodando no front (porta 3000) e `yarn dev` no back (porta 8080) com MySQL via Docker
- [ ] Conta seed `admin@autosoccer.app` / `Admin123!` testada login OK
- [ ] Conta seed `jogador@autosoccer.app` / `Jogador123!` com time montado
- [ ] Browser limpo, sem extensoes visiveis, modo apresentacao do Chrome (F11)
- [ ] DevTools fechado, zoom 110% para legibilidade no projetor
- [ ] Idioma do navegador em pt-BR inicialmente, tema light
- [ ] Aba 1: front em prod; Aba 2: Swagger; Aba 3: GitHub Actions; Aba 4: Railway dashboard; Aba 5: UptimeRobot dashboard
- [ ] **Terminal lateral pronto** com `cd server && node scripts/test-ws-battle.mjs` digitado (so falta Enter) — usado no fluxo 3.5 para mostrar WebSocket ao vivo
- [ ] Video de backup (`apresentacao/backup-demo.mp4`) acessivel em pasta local
- [ ] Slides .pptx abertos em modo apresentacao em segunda tela

### Fluxo 1 — Login + dashboard (Lucas S) — 14:30–15:30 (~1 min)

**Objetivo:** mostrar landing, i18n, dark mode toggle e dashboard inicial.

1. (00:00) Abrir aba 1: `https://autosoccer.vercel.app/` — landing page com logo arcade
2. (00:10) Clicar no `LanguageSwitcher` no header: PT → EN → PT (mostra textos mudando sem reload)
3. (00:25) Clicar no `ThemeSwitcher`: light → dark (mostra transicao suave + persistencia no cookie THEME)
4. (00:35) Clicar em "Entrar" e usar a conta seed `jogador@autosoccer.app`
5. (00:50) Dashboard /home aparece: cards de status, navegacao lateral, ProfileCorner no topo direito
6. (01:00) Falar enquanto navega: "tudo isso aqui esta rodando em SSR com hidratacao parcial — o tema vem do cookie antes do React montar, sem FOUC"

**Narracao chave:** "i18n, dark mode e auth ja resolvidos no servidor. Zero flicker."

### Fluxo 2 — Mercado de atletas + drag-and-drop (Lucas S) — 15:30–16:30 (~1 min)

**Objetivo:** mostrar mercado, compra e montagem do time via drag-and-drop.

1. (00:00) Navegar para `/market`
2. (00:10) Mostrar lista de atletas disponiveis com filtro por posicao (GOL, ZAG, MEI, ATA)
3. (00:20) Clicar em "Comprar" em 2 atletas (mostra moeda decrementando)
4. (00:35) Comprar 1 item (ex: chuteira +5 ataque)
5. (00:45) Ir para `/team` e fazer drag-and-drop de um atleta da reserva para o campo
6. (00:55) Aplicar o item no atleta (drag do inventario para o card do atleta)

**Narracao chave:** "drag-and-drop com react-dnd, cada interacao gera um PATCH no backend — sem perder estado se a aba fechar."

### Fluxo 3 — Relatorios + Swagger (Pedro) — 16:30–17:30 (~1 min)

**Objetivo:** mostrar API documentada, autenticacao admin e relatorios com stored procedure.

1. (00:00) Lucas S passa a vez para Pedro
2. (00:05) Abrir aba 2: `https://api.autosoccer.app/docs` (Swagger UI)
3. (00:15) Mostrar agrupamento de rotas: Auth, Athletes, Team, Market, Match, Ranking, Admin
4. (00:30) Clicar em `POST /auth/login`, autenticar como `admin@autosoccer.app`, copiar JWT
5. (00:45) Colar JWT no botao "Authorize" do Swagger
6. (00:50) Executar `GET /admin/reports/top-athletes?period=30d` — retorna ranking via SP `sp_relatorio_top_atletas`
7. (01:00) Mostrar resposta JSON e comentar: "essa rota usa stored procedure, indice composto em team_id+rodada, e exige role admin"

**Narracao chave:** "Swagger 100% documentado, role-based access, stored procedure rodando em producao."

### Fluxo 3.5 — Bonus tecnico: WebSocket ao vivo no terminal (Pedro) — 17:20–17:30 (~10s, opcional)

**Quando usar:** se o tempo estiver folgado depois do fluxo 3. Pode ser cortado sem prejuizo.

**Objetivo:** mostrar que a batalha realmente streama via WebSocket — nao e animacao mockada do front.

1. (00:00) Pedro alterna pro terminal lateral (ja preparado, ver checklist)
2. (00:02) Aperta Enter no comando ja digitado: `node scripts/test-ws-battle.mjs`
3. (00:05) Aponta para a tela enquanto turnos chegam (12 turnos x ~800ms = ~10s):
   ```
   [TURN]  1/12  move ✓ (100%)  Lopez avanca com a bola para (2, 1).
   [TURN]  5/12  tackle ✓ (52%)  Lopez vence Marlon Freitas...
   [TURN]  6/12  shot ✓ (83%)  GOL! Lopez finaliza com 83%. ⚽ GOL!
   [RESULT] vencedor=player  placar=1x0
   ```

**Narracao chave:** "Esses turnos sao o que o front recebe e usa pra animar a bola. WebSocket real, com i18n, autenticacao JWT no query param e fallback se a conexao cair."

### Fluxo 4 — Pipeline CI/CD + producao (Lucas B) — 17:30–18:30 (~1 min)

**Objetivo:** mostrar GitHub Actions verde, Railway rodando, UptimeRobot historico.

1. (00:00) Pedro passa a vez para Lucas B
2. (00:05) Abrir aba 3: GitHub Actions do repo `server` — mostrar ultimo workflow verde
3. (00:15) Abrir um job recente: mostrar steps `lint`, `typecheck`, `i18n:check`, `test` (84% cobertura), `build`
4. (00:30) Abrir aba 4: Railway dashboard mostrando service `autosoccer-api` ativo + ultimo deploy verde + plugin MySQL conectado
5. (00:45) Abrir aba 5: UptimeRobot dashboard com uptime 99.9% nos ultimos 7 dias
6. (00:55) Fechar com: "pipeline em PR e main, deploy automatico via Nixpacks no Railway a cada push na main, monitoramento ativo desde 16/06"

**Narracao chave:** "do commit ate o usuario final, tudo automatizado e observavel."

---

## 3. Plano B (fallback)

Cenarios de falha durante a apresentacao com acao imediata. Driver decide em <10s qual rota seguir.

### B1. Sem internet no auditorio

- Acao: `Cmd+Shift+T` para abrir terminal, rodar `cd front && yarn dev` e `cd server && yarn dev` localmente (ja em standby)
- Mostrar `http://localhost:3000` em vez da Vercel
- MySQL via Docker compose (`docker compose up -d mysql`) ja rodando antes da apresentacao
- Avisar audiencia: "estamos rodando localmente porque o auditorio nao tem rede, mas o codigo e o mesmo de producao"

### B2. Backend em producao caiu (Railway down)

- Pular para backend local (passo B1 parcial)
- Se nao houver tempo: usar video gravado `apresentacao/backup-demo.mp4` (60s editado com narracao)
- No slide de Swagger, abrir `apresentacao/screenshots/swagger-overview.png` em vez da URL ao vivo

### B3. Frontend em producao caiu (Vercel down)

- Mesma estrategia: front local em `http://localhost:3000`
- Mostrar `apresentacao/screenshots/dashboard.png`, `market.png`, `team-dnd.png` caso nem local funcione

### B4. Banco de dados sem dados seed (login falha)

- Rodar `cd server && yarn db:seed` no terminal (ja preparado)
- Se o seed demorar: usar conta `convidado` (login sem senha que cria usuario temp)

### B5. Algum integrante ausente

- Cada slide tem dono secundario:
  - Lucas S ausente: Lucas B assume slides 6-11 e o demo (ja praticou no dry run 2)
  - Pedro ausente: Lucas B assume slides 13-19 (le defesa-back.md como roteiro)
  - Lucas B ausente: Pedro assume slides 21-26
- Notificar professores antes da apresentacao se confirmar ausencia

### B6. Projetor nao reconhece o laptop

- Backup: notebook do Pedro com slides .pptx + video gravado pre-carregados
- Cabo HDMI + adaptador USB-C levados na mochila do Lucas Bruno

### B7. Apresentacao passando do tempo

- Sinal combinado: Pedro toca no relogio quando faltar 3 min
- Cortar slides 11 e 19 (testes) para 10s
- Cortar fluxo 2 (mercado) do demo: pular direto do fluxo 1 para o 3

### B8. Pergunta inesperada no Q&A que nenhum sabe

- Resposta padrao: "boa pergunta — esse ponto especifico nao foi nosso foco, mas a arquitetura permite ser estendida assim: [explicar trade-off]"
- Nunca inventar. Reconhecer o limite e oferecer follow-up por email.

### Materiais de backup em pasta `apresentacao/backup/`

- `backup-demo.mp4` — video de 60s com os 4 fluxos ja gravados
- `screenshots/` — 12 PNGs das telas chave (landing, login, dashboard, market, team, battle, ranking, swagger, gh-actions, railway, uptimerobot, sonar)
- `slides-export.pdf` — PDF dos slides caso o PowerPoint trave
- `seed-data.sql` — dump do MySQL com dados de demo prontos

---

## 4. Roteiro de fala por slide

Frase de abertura sugerida (1-2 linhas) para cada slide. Driver pode adaptar com naturalidade, mas mantem a ideia central. Tempo medio: 30-50s por slide.

### Slide 1 — Capa
**Lucas S:** "Boa tarde, professores. Somos o grupo do AutoSoccer — eu, Pedro Guligurski e Lucas Bruno — e vamos apresentar nossa entrega final da Experiencia Criativa do segundo semestre."

### Slide 2 — Agenda
**Lucas S:** "Em 15 minutos passamos pelo produto, depois front-end, back-end, infraestrutura, fazemos uma demo ao vivo de 4 minutos e abrimos para perguntas."

### Slide 3 — O que e o AutoSoccer
**Lucas S:** "AutoSoccer e um auto-battler de fantasy soccer: voce monta seu time no mercado, aplica itens, e disputa rodadas contra outros jogadores em uma campanha por trofeus."

### Slide 4 — Problema e contexto
**Pedro:** "Escolhemos um auto-battler porque o dominio e rico em regras: matchmaking, atributos compostos, balanceamento de itens — perfeito para exercitar padroes de projeto e modelagem relacional."

### Slide 5 — FRONT-END (divisor)
**Lucas S:** "Comecando pelo front, que e a camada que o usuario ve."

### Slide 6 — Stack front
**Lucas S:** "Next.js 16 com App Router para SSR, React 19 com Server Components, antd 6 como design system e axios para chamadas async ao back."

### Slide 7 — i18n com next-intl
**Lucas S:** "Internacionalizacao com next-intl: o idioma vem de um cookie persistente, com fallback para Accept-Language. Temos 9 namespaces de mensagens em paridade pt-BR e en."

### Slide 8 — Layout da batalha
**Lucas S:** "A batalha tem header unificado, sidebar de logs verticais e a bola animada com CSS transitions — sem framework de animacao, apenas atualizacao de coordenadas."

### Slide 9 — Dark Mode + WCAG
**Lucas S:** "Adicionamos dark mode persistente em cookie, com CSS variables. Auditamos contraste WCAG AA com Lighthouse em todas as telas."

### Slide 10 — Dashboard ranking
**Lucas S:** "No ranking, dois graficos: barras horizontais dos top 10 jogadores e linha de evolucao de trofeus. Filtros de periodo: 7d, 30d ou all-time."

### Slide 11 — Testes front (94%)
**Lucas S:** "94% de cobertura com Vitest e Testing Library. Criamos um helper `renderWithProviders` que injeta i18n, tema e router para testes isolados."

### Slide 12 — BACK-END (divisor)
**Pedro:** "Passando para o backend, onde mora a regra de negocio."

### Slide 13 — Stack back
**Pedro:** "Fastify 5 como server, Sequelize 6 como ORM, MySQL 8 como banco e i18next para mensagens de erro localizadas."

### Slide 14 — Padroes
**Pedro:** "Aplicamos Strategy nas disputas — cada tipo de evento tem sua estrategia — Factory nos testes para criar entidades, e um ErrorHandler global que traduz exceptions."

### Slide 15 — i18n no back
**Pedro:** "O backend tambem fala dois idiomas: le Accept-Language e responde mensagens de erro localizadas, com paridade entre pt-BR e en garantida por um script de check."

### Slide 16 — Swagger 100%
**Pedro:** "Todas as rotas — sao 20 — estao documentadas em ingles no Swagger, com 11 schemas centralizados que evitam duplicacao."

### Slide 17 — JWT com 2 permissoes
**Pedro:** "JWT com roles: usuario comum acessa as rotas de gameplay, admin acessa rotas administrativas. Middleware `requireRole` valida e retorna 403 para acesso indevido."

### Slide 18 — Stored procedures + relatorios
**Pedro:** "Tres relatorios gerenciais: um deles usa uma stored procedure `sp_relatorio_top_atletas` para agregar dados pesados no banco. Migration reversa implementada."

### Slide 19 — Testes back (84%)
**Pedro:** "84% de cobertura, 152 testes unitarios e 3 suites de integration que sobem MySQL via Testcontainers."

### Slide 20 — INFRAESTRUTURA (divisor)
**Lucas B:** "Por fim, infraestrutura, deploy e qualidade."

### Slide 21 — Git workflow
**Lucas B:** "Conventional Commits em pt-BR sem acentos, uma branch por workstream, e uma integration branch que serve de snapshot conhecido bom antes do merge na main."

### Slide 22 — UML
**Lucas B:** "Tres tipos de UML em Mermaid: classes dos models, sequencias do login e do jogar-rodada, e um diagrama de atividade da campanha completa."

### Slide 23 — BDD + User Stories
**Lucas B:** "Tres features em Gherkin — autenticacao, mercado e batalha — cobrindo happy path e cenarios de erro. Tres user stories no formato As-Want-So-That com criterios de aceite."

### Slide 24 — CI/CD GitHub Actions
**Lucas B:** "Pipeline com 5 steps: lint, typecheck, i18n:check, test e build. Roda em todo PR e merge na main."

### Slide 25 — Sonar + UptimeRobot
**Lucas B:** "SonarCloud com quality gate aprovado e badge no README. UptimeRobot fazendo ping no /health a cada 5 minutos — 99.9% nos ultimos 7 dias."

### Slide 26 — Deploy + .env
**Lucas B:** "Backend no Railway com Nixpacks + plugin MySQL nativo, frontend na Vercel. Auto-deploy a cada push na main. Secrets no painel, nunca no repo. Sequelize com sync:false — apenas migrations rodam no Start Command."

### Slide 27 — DEMO AO VIVO
**Lucas S:** "Agora deixa eu mostrar o produto rodando. Vou passar por 4 fluxos: login com dark mode, mercado com drag-and-drop, relatorios no Swagger e a pipeline de deploy."

### Slide 28 — Metricas + licoes aprendidas + Q&A
**Lucas S abre, todos contribuem:** "Pra fechar: 94% de cobertura no front, 84% no back, 152 testes, 20 rotas documentadas, deploy automatizado. A maior licao foi alinhar i18n no front e no back desde o inicio — economizou retrabalho. Estamos abertos para perguntas."

---

> Documento mantido por Lucas Stopinski. Ultima atualizacao: 10/06/2026.
