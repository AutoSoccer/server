# Conteudo dos Slides — AutoSoccer (Apresentacao Final 23/06/2026)

> Disciplina Experiencia Criativa BSI PUCPR 2026/1 — entrega T11 (slides front), T12 (slides back) e T13 (slides infra) consolidados.
> Layout pronto para copiar para PowerPoint, Keynote ou Google Slides. Cada slide segue o padrao: titulo, subtitulo, ate 6 bullets, notas do apresentador, visual sugerido e dono primario.
> Estilo arcade: fundo `#111827`, accent `#F97316`, titulos peso 900, separadores em laranja com tipografia gigante.

---

## Slide 1 — AutoSoccer

**Subtitulo:** Fantasy soccer auto-battler com engenharia de software aplicada

**Bullets**
- Disciplina Experiencia Criativa BSI PUCPR 2026/1
- Apresentacao final em 23/06/2026
- Lucas Stopinski da Silva — Front-end
- Pedro Henrique Silva Guligurski — Back-end
- Lucas Bruno e Silva — Infra/QA
- Professores Cleverson Avelino e Vinicius G. Mendonca

**Notas do apresentador**
Abrir cumprimentando os professores e a banca. Reforcar que e a entrega final consolidada da disciplina e que os tres integrantes assumem trechos especificos durante a defesa.

**Visual sugerido:** logo AutoSoccer no centro, faixa laranja com nomes do grupo, badge "PUCPR BSI 2026/1" no canto superior direito.

**Quem apresenta:** Lucas Stopinski (abertura do grupo)

---

## Slide 2 — Agenda

**Subtitulo:** Como vamos usar os proximos 15 minutos

**Bullets**
- Produto: o que e o AutoSoccer
- Front-end: stack, i18n, dark mode, dashboard, testes
- Back-end: Fastify, padroes, JWT roles, stored procedures
- Infra/QA: Git workflow, BDD, UML, CI/CD, monitoramento
- Demo ao vivo de 4 minutos
- Metricas, licoes aprendidas e Q&A

**Notas do apresentador**
Sinalizar que o grupo dividiu a apresentacao por area (front/back/infra) e que cada integrante assume o seu bloco. Avisar que a demo aparece no final, antes do Q&A.

**Visual sugerido:** lista numerada com icones arcade. Highlight visual no item da demo ao vivo.

**Quem apresenta:** Lucas Stopinski

---

## Slide 3 — O que e o AutoSoccer

**Subtitulo:** Auto-battler de fantasy soccer com mercado, batalha e ranking

**Bullets**
- Jogador monta time comprando atletas em um mercado rotativo
- Aplica itens com bonus de atributos antes da partida
- Disputa rodadas em sistema de campanha por trofeus
- Matchmaking assincrono contra snapshots de outros jogadores
- Ranking global e perfil persistente com saldo de moedas
- Suporte i18n full-stack (pt-BR e en) desde o primeiro dia

**Notas do apresentador**
Resumir o pitch em duas frases: "monta time, joga rodada, sobe ranking". Mencionar que e auto-battler porque o jogador prepara o time e o motor resolve a partida em turnos sem interacao.

**Visual sugerido:** screenshot grande da tela de batalha com bola animada + 3 mini-cards (mercado, batalha, ranking).

**Quem apresenta:** Lucas Stopinski

---

## Slide 4 — Problema e contexto

**Subtitulo:** Por que um auto-battler para exercitar engenharia de software

**Bullets**
- Dominio rico em regras: matchmaking, atributos compostos, balanceamento
- Varios subsistemas: auth, mercado, batalha, ranking, relatorios
- Permite aplicar padroes de projeto (Strategy, Factory) com proposito
- Exige modelagem relacional nao trivial (N atletas por time, snapshots, itens)
- Sistema observavel e testavel — bom para BDD e cobertura de teste
- Conecta requisitos funcionais (RF001-014) e regras de negocio (RN001-013)

**Notas do apresentador**
Explicar que o auto-battler foi escolhido justamente por dar espaco a multiplas competencias (front, back, infra) sem virar um CRUD trivial. Apontar que a complexidade de regras justifica padroes de projeto reais.

**Visual sugerido:** diagrama de contexto C4 com usuario, front, back, MySQL e modulos principais. Destacar a regra "RN006 matchmaking por vitorias".

**Quem apresenta:** Pedro Guligurski

---

## Slide 5 — FRONT-END

**Subtitulo:** A camada que o usuario ve

**Bullets**
- Stack moderna em Next.js 16 + React 19
- Identidade visual arcade com design system antd 6
- Internacionalizacao no lado do servidor com next-intl
- Layout de batalha com bola animada e logs verticais
- Dark mode persistente em cookie com paridade WCAG AA
- Dashboard de ranking com graficos e filtros

**Notas do apresentador**
Divisor de bloco. Resumir em uma frase: "todo o front foi pensado para experiencia rapida, internacional e acessivel". Avisar que o detalhamento vem nos proximos cinco slides.

**Visual sugerido:** fundo laranja `#F97316` com texto "FRONT-END" gigante em peso 900 e silhueta de um controle de fliperama.

**Quem apresenta:** Lucas Stopinski

---

## Slide 6 — Stack front

**Subtitulo:** Next.js 16 App Router + React 19 + antd 6 + axios

**Bullets**
- Next.js 16.2 com App Router e Turbopack
- React 19.2 com Server Components por padrao
- antd 6 + @ant-design/icons como design system
- next-intl 4 para i18n
- axios para chamadas ao back (porta 3333)
- react-hook-form + zod para forms validados

**Notas do apresentador**
Justificar cada escolha em poucas palavras: App Router porque SSR e o caminho recomendado; antd para componentes acessiveis prontos; axios para previsibilidade. Mencionar que o lockfile oficial e o package-lock.json (npm).

**Visual sugerido:** arvore parcial da pasta `src/` (app, components, services, i18n) com logos de cada lib.

**Quem apresenta:** Lucas Stopinski

---

## Slide 7 — i18n com next-intl

**Subtitulo:** Cookie + Accept-Language + 9 namespaces em paridade

**Bullets**
- Locales `pt-BR` (default) e `en` registrados em `src/i18n/config.ts`
- Server Components usam `getTranslations`, client usam `useTranslations`
- LanguageSwitcher grava cookie `NEXT_LOCALE` e faz reload para re-render RSC
- Fallback automatico no Accept-Language quando ainda nao ha cookie
- Mensagens organizadas em 9 namespaces (auth, home, game, battle, ranking, etc.)
- Script `npm run i18n:check` falha o CI se faltar chave em algum locale

**Notas do apresentador**
Demonstrar a logica do cookie + reload e a paridade pt-BR/en. Citar que mensagens de erro do back ja chegam traduzidas e o front so renderiza — sem duplicar string.

**Visual sugerido:** screenshot do LanguageSwitcher alternando PT-EN + snippet de codigo com `getTranslations`.

**Quem apresenta:** Lucas Stopinski

---

## Slide 8 — Layout da batalha

**Subtitulo:** Header unificado, sidebar de logs e bola animada por CSS

**Bullets**
- Grid 3x6 compartilhado entre as duas equipes
- Header unico com placar, rodada e nome da campanha
- Sidebar vertical com scroll proprio para o log de turnos
- Bola animada via atualizacao de coordenadas + CSS transitions
- Sem framework de animacao: apenas estados e transitions
- Consome `POST /partida/jogar-rodada` e reproduz turno-a-turno

**Notas do apresentador**
Reforcar que a animacao da bola usa apenas CSS e atualizacao de estado — decisao consciente para nao incluir framework extra. Mencionar que o evento de virada de turno e calculado no back e o front so reproduz.

**Visual sugerido:** GIF curto ou screenshot da batalha com setas indicando header, sidebar e bola.

**Quem apresenta:** Lucas Stopinski

---

## Slide 9 — Dark Mode + Responsividade

**Subtitulo:** Tema persistente em cookie com CSS variables e WCAG AA

**Bullets**
- Paleta dark em `globals.css` com tokens `--bg-*`, `--fg-*`, `--accent-*`
- Toggle no `ThemeSwitcher` ao lado do `LanguageSwitcher`
- Cookie `THEME` persistido por 1 ano com aplicacao no `<html>` sem FOUC
- Auditoria de contraste WCAG AA via Lighthouse em todas as telas
- Botoes primary refinados para garantir contraste em light e dark
- Layout responsivo testado em mobile, tablet e desktop

**Notas do apresentador**
Explicar que o tema entra antes do React montar (cookie lido em Server Component), por isso nao tem flash de tela branca. Mostrar print light/dark lado a lado.

**Visual sugerido:** dois prints lado a lado da tela `/home` em light e dark, com badge "AA" do Lighthouse.

**Quem apresenta:** Lucas Stopinski

---

## Slide 10 — Dashboard com graficos no ranking

**Subtitulo:** Recharts + filtros + integracao com API de ranking

**Bullets**
- Grafico de barras horizontais com top 10 jogadores por trofeus
- Grafico de linha com evolucao temporal de trofeus
- Filtros por periodo (7d, 30d, all-time) e escopo (eu vs todos)
- Componente `RankingDashboard` em Server Component que delega ao client
- Cobertura unitaria especifica em `RankingDashboard.test.tsx`
- Renderizacao respeita i18n e o tema escolhido pelo usuario

**Notas do apresentador**
Mostrar o dashboard funcionando no proprio /ranking. Citar que os dados vem do endpoint de ranking do back e que a serializacao foi pensada para o front nao precisar fazer agregacao no cliente.

**Visual sugerido:** screenshot do `/ranking` com os dois graficos visiveis e os controles de filtro.

**Quem apresenta:** Lucas Stopinski

---

## Slide 11 — Testes front

**Subtitulo:** 94% de cobertura com Vitest + Testing Library + happy-dom

**Bullets**
- Stack: Vitest 4 + @testing-library/react 16 + happy-dom 20
- Helper `renderWithProviders` injeta i18n, antd e auth context
- Cobertura por modulo: services, hooks, providers, context, components
- Mocks reutilizaveis em `src/__tests__/mocks/` (router, api, localStorage)
- Smoke tests do dashboard e de transformacoes de dados do ranking
- Pipeline CI roda `npm run test` em todo PR

**Notas do apresentador**
Citar que a regra de ouro foi testar comportamento, nao implementacao — "ao clicar em comprar, dispara axios.post correto". Reforcar que a infra de teste reduziu o custo de cobrir novas telas.

**Visual sugerido:** print do `npm run test:coverage` com a barra global em 94% ou similar + arvore do `__tests__`.

**Quem apresenta:** Lucas Stopinski

---

## Slide 12 — BACK-END

**Subtitulo:** Onde mora a regra de negocio

**Bullets**
- Fastify 5 com schemas validados e Swagger automatico
- Sequelize 6 + MySQL 8 com migrations versionadas
- Padroes de projeto: Strategy nas disputas e Factory nos testes
- i18next com Accept-Language e 10 namespaces
- 20 rotas REST em ingles com Swagger 100% documentado
- JWT com roles user/admin e relatorios via stored procedure

**Notas do apresentador**
Divisor. Reforcar que o back foi pensado para servir tanto o front quanto eventuais integracoes via Swagger. Avisar que os proximos slides aprofundam padroes, i18n, JWT e relatorios.

**Visual sugerido:** fundo laranja com texto "BACK-END" gigante em peso 900.

**Quem apresenta:** Pedro Guligurski

---

## Slide 13 — Stack back

**Subtitulo:** Fastify 5 + Sequelize + MySQL + i18next

**Bullets**
- Fastify 5.8 com plugin system encapsulado
- Sequelize 6.37 + mysql2 com migrations Sequelize CLI
- MySQL 8 via docker-compose para desenvolvimento local
- i18next 26 + i18next-fs-backend para mensagens i18n
- Validacao de body/params/query via JSON Schema
- bcryptjs para hash e jsonwebtoken para JWT

**Notas do apresentador**
Justificar Fastify pela performance (cerca de 2x Express por causa do find-my-way) e pela validacao via schema reusada no Swagger. Citar que o lockfile e yarn.lock.

**Visual sugerido:** diagrama de camadas (rotas -> services -> models -> MySQL) com logos das libs.

**Quem apresenta:** Pedro Guligurski

---

## Slide 14 — Padroes de projeto

**Subtitulo:** Strategy nas disputas, Factory nos testes, ErrorHandler global

**Bullets**
- Strategy: cada tipo de disputa (passe, drible, chute) tem estrategia propria
- Factory: geradores em `src/__tests__/factories/` para user, team, athlete, item
- ErrorHandler global captura `ServiceError` e traduz via i18next
- `ServiceError` carrega `code: ErrorCode`, `status` HTTP e `params` para i18n
- Rotas lancam erros direto, sem try/catch redundante
- Resposta padronizada em `{ code, message }` documentada no Swagger

**Notas do apresentador**
Mostrar um trecho curto da Strategy de disputas e contar como o ErrorHandler permitiu remover try/catch de todas as rotas. Citar o refactor que substituiu throws crus por `SimuladorServiceError`.

**Visual sugerido:** snippet de codigo de uma Strategy + diagrama do fluxo do erro (throw -> handler -> i18n -> resposta).

**Quem apresenta:** Pedro Guligurski

---

## Slide 15 — i18n no back

**Subtitulo:** Accept-Language + 10 namespaces + paridade pt-BR/en garantida

**Bullets**
- Plugin `src/plugins/i18n.ts` registra i18next com fs-backend
- Middleware le `Accept-Language` e injeta `request.i18n.t`
- Namespaces: common, auth, equipe, itens, mercado, partida, ranking, simulador, abilities, swagger
- Mensagens de erro mapeadas via `errors.<CODE>` por namespace
- Descricoes do Swagger tambem passam pelo i18n
- Script `yarn i18n:check` valida paridade pt-BR/en no CI

**Notas do apresentador**
Mostrar o mesmo erro retornado em pt-BR e em en lado a lado. Citar que evita duplicar mensagem hardcoded e foi peca chave para o front so renderizar a mensagem ja traduzida.

**Visual sugerido:** print de duas chamadas curl com `Accept-Language` diferentes retornando mensagens diferentes.

**Quem apresenta:** Pedro Guligurski

---

## Slide 16 — Swagger 100% documentado

**Subtitulo:** 20 rotas em ingles + schemas centralizados via $ref

**Bullets**
- @fastify/swagger + @fastify/swagger-ui em `/docs`
- 20 rotas agrupadas em tags: Auth, Athletes, Team, Market, Match, Ranking, Admin, Reports
- 11 schemas em `src/plugins/swagger.schemas.ts` registrados com `addSchema`
- Reuso por `$ref` em request e response para evitar duplicacao
- Refactor renomeou todas as URLs e tags para ingles
- Spec JSON exposta em `/docs/json` para clientes externos

**Notas do apresentador**
Abrir Swagger no auditorio (se possivel) ou screenshot. Reforcar que cada rota tem `summary`, `description` traduzidos e response codes 200/400/4xx documentados. Mostrar um $ref reaproveitado.

**Visual sugerido:** screenshot do Swagger UI com lista de tags expandida e um modal com um schema centralizado.

**Quem apresenta:** Pedro Guligurski

---

## Slide 17 — JWT com 2 permissoes

**Subtitulo:** Roles user/admin com middleware `requireRole`

**Bullets**
- Coluna `role` adicionada em `users` via migration Sequelize
- Payload JWT inclui `userId`, `email` e `role`
- Plugin `@fastify/jwt` decora `request.user` apos validar assinatura
- Middleware `requireAuth` e `requireRole('admin')` em `auth.middleware.ts`
- Rota `GET /admin/users` retorna 403 para role user e 200 para admin
- Testes de integracao cobrem 401, 403 e 200 em cada rota protegida

**Notas do apresentador**
Explicar que role e enum (`user`, `admin`) e que o middleware retorna 403 com mensagem traduzida via i18n. Citar que tem teste de integracao validando exatamente esses tres cenarios.

**Visual sugerido:** diagrama de sequencia simplificado do login -> JWT -> request com role -> 403 vs 200 + trecho do middleware `requireRole`.

**Quem apresenta:** Pedro Guligurski

---

## Slide 18 — Stored procedures e relatorios

**Subtitulo:** SQL otimizado + 3 endpoints administrativos

**Bullets**
- Migration cria stored procedure `sp_get_top_athletes_by_role`
- Procedure retorna top atletas mais vendidos agrupados por posicao
- Endpoint `GET /admin/reports/top-athletes-by-role` chama a procedure
- Indices estrategicos em `team_id` e `team_snapshots(user_id, round)`
- Migration reversa (down) implementada para rollback seguro
- Documentacao em `docs/api-reports.md` (ou equivalente) com exemplos

**Notas do apresentador**
Mostrar o SQL da procedure (poucas linhas), explicar que o agregado roda no banco para economizar trafego. Citar que a rota e admin-only via middleware do slide anterior.

**Visual sugerido:** snippet do `CREATE PROCEDURE` + screenshot do retorno do endpoint no Swagger.

**Quem apresenta:** Pedro Guligurski

---

## Slide 19 — Testes back

**Subtitulo:** 84% de cobertura com Vitest + factories + integracao

**Bullets**
- 152 testes distribuidos entre unit e integration
- 3 suites de integration: `auth.int.test.ts`, `equipe.int.test.ts`, `partida.int.test.ts`
- Helpers `buildApp()` e `sequelizeStub` em `src/__tests__/helpers/`
- Factories para user, team, athlete e item em `src/__tests__/factories/`
- Cobertura V8 com threshold de branches e linhas configurado
- Pipeline CI roda `yarn test` em todo PR e merge na main

**Notas do apresentador**
Citar que a integracao roda `app.inject()` com o Fastify inteiro registrado, evitando subir HTTP de verdade. Reforcar que a cobertura passou de 84% no servidor sem flakiness.

**Visual sugerido:** print do relatorio de cobertura V8 + arvore dos testes de integracao.

**Quem apresenta:** Pedro Guligurski

---

## Slide 20 — INFRAESTRUTURA

**Subtitulo:** Deploy, qualidade e processo

**Bullets**
- Git workflow com Conventional Commits e branches por workstream
- UML, BDD e User Stories versionados no proprio repo
- CI/CD GitHub Actions com 5 etapas
- Deploy automatizado: Railway (back + plugin MySQL) e Vercel (front)
- Monitoramento ativo: SonarCloud + UptimeRobot
- Scrum adaptado com 4 sprints documentadas

**Notas do apresentador**
Divisor de infra. Reforcar que a infra nao foi tratada como afterthought — ela tem documentacao formal, sprints registradas e quality gate no CI.

**Visual sugerido:** fundo laranja com texto "INFRAESTRUTURA" gigante em peso 900.

**Quem apresenta:** Lucas Bruno

---

## Slide 21 — Git workflow

**Subtitulo:** Conventional Commits + branches por workstream + integration branch

**Bullets**
- Commits em pt-BR sem acentos (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`)
- Branches no padrao `tipo/ws-XX-slug` ou `tipo/slug` para apresentacao
- Branch `integration/grupo-N` como snapshot conhecido bom antes de merge na main
- Husky + commitlint validam mensagem antes do push (quando habilitado)
- CONTRIBUTING.md em ambos os repos documenta o fluxo de PR
- 255 commits combinados entre front (~106) e server (~149)

**Notas do apresentador**
Mostrar o git log do `main` recente para evidenciar o padrao. Citar que peer review e exigido na Definition of Done.

**Visual sugerido:** screenshot do GitHub mostrando network graph ou git log com prefixos coloridos.

**Quem apresenta:** Lucas Bruno

---

## Slide 22 — UML

**Subtitulo:** Classes + sequencias + atividade em Mermaid

**Bullets**
- `classes.md` — diagrama de classes dos models Sequelize
- `seq-login.md` — sequencia de login JWT (Front -> Fastify -> DB)
- `seq-jogar-rodada.md` — sequencia da rodada (matchmaking, simulador, snapshot)
- `atividade-campanha.md` — atividade da campanha (start, mercado, batalha, fim)
- Renderizam direto no GitHub via Mermaid
- Mapeam classes aos models reais e endpoints reais (rastreabilidade)

**Notas do apresentador**
Mostrar o diagrama de classes resumido. Citar que cada sequencia mapeia para um service real do server e que isso facilita onboarding.

**Visual sugerido:** thumbnails dos 4 diagramas em grade 2x2 + um zoom no de classes.

**Quem apresenta:** Lucas Bruno

---

## Slide 23 — Features BDD + User Stories

**Subtitulo:** 3 features Gherkin + 3 User Stories com criterios de aceite

**Bullets**
- `autenticacao.feature` — login, login convidado, logout
- `mercado.feature` — listar atletas, comprar atleta, refresh do mercado
- `batalha.feature` — iniciar campanha, jogar rodada, finalizar campanha
- User Stories no formato As-Want-So-That com criterios e DoD
- Cada cenario referencia o arquivo e linha do service correspondente
- Cobertura de happy path + cenarios de erro

**Notas do apresentador**
Ler 2-3 linhas de um cenario Gherkin para mostrar o estilo Given/When/Then. Citar a rastreabilidade explicita entre cenario e codigo (linha exata).

**Visual sugerido:** trecho de uma feature Gherkin + diagrama mostrando US-01, US-02, US-03 com criterios.

**Quem apresenta:** Lucas Bruno

---

## Slide 24 — CI/CD GitHub Actions

**Subtitulo:** Pipeline de 5 etapas em todo PR e push na main

**Bullets**
- Step 1 — lint (ESLint)
- Step 2 — typecheck (tsc --noEmit)
- Step 3 — i18n:check (paridade pt-BR/en)
- Step 4 — test (Vitest com cobertura)
- Step 5 — build (Next.js / Fastify)
- Cache de `node_modules` via `actions/cache`

**Notas do apresentador**
Mostrar uma run verde do GitHub Actions. Citar que ja pegou regressao real (mensagem i18n faltando) e que o quality gate falha o PR antes de pedir review.

**Visual sugerido:** screenshot de um job verde com os 5 steps expandidos e tempo total.

**Quem apresenta:** Lucas Bruno

---

## Slide 25 — Sonar + UptimeRobot

**Subtitulo:** Quality gate + monitoramento publico

**Bullets**
- SonarCloud conectado em ambos os repos (front e server)
- Quality gate exige cobertura > 80% e zero bugs criticos
- Badge no README com status da qualidade
- UptimeRobot fazendo ping em `/health` a cada 5 minutos
- Tres monitores: API, front e cert SSL
- Status publico para a equipe acompanhar uptime

**Notas do apresentador**
Reforcar que SonarCloud e free para repo publico e UptimeRobot e free para ate 50 monitores. Citar uptime alvo de 99.9% nos ultimos 7 dias.

**Visual sugerido:** prints lado a lado do SonarCloud dashboard e do UptimeRobot.

**Quem apresenta:** Lucas Bruno

---

## Slide 26 — Deploy Railway + Vercel

**Subtitulo:** Back no Railway com plugin MySQL, front na Vercel

**Bullets**
- Railway: servico Node detectado via Nixpacks + plugin MySQL nativo do Railway no mesmo projeto
- Deploy via Git Pull configurado no painel + PM2 como process manager
- Vercel: deploy automatico via GitHub App, preview por PR
- Variaveis de ambiente separadas por ambiente (preview vs production)
- Sequelize com `sync: false` — banco so muda via migration
- `.env.production.example` versionado documentando as variaveis

**Notas do apresentador**
Explicar a escolha do Railway: deploy declarativo via push na main, plugin MySQL gerenciado no mesmo projeto (sem servidor externo), auto-deploy via Nixpacks sem precisar de Dockerfile custom. Mencionar que o front continuou na Vercel sem mudanca.

**Visual sugerido:** diagrama com Railway (service Node + plugin MySQL) -> Vercel (front) -> usuario, setas mostrando o fluxo e URLs publicas (`autosoccer-api-production.up.railway.app` e `autosoccer.vercel.app`).

**Quem apresenta:** Lucas Bruno

---

## Slide 27 — DEMO AO VIVO

**Subtitulo:** 4 fluxos cronometrados — login, mercado, relatorios e CI/CD

**Bullets**
- Fluxo 1 (Lucas S) — login + dark mode + dashboard (~1 min)
- Fluxo 2 (Lucas S) — mercado + drag-and-drop + aplicacao de item (~1 min)
- Fluxo 3 (Pedro) — Swagger autenticado + relatorio via stored procedure (~1 min)
- Fluxo 4 (Lucas B) — GitHub Actions + Railway dashboard + UptimeRobot (~1 min)
- Driver: Lucas S no laptop principal projetando
- Plano B com backup local + video gravado caso a rede falhe

**Notas do apresentador**
Falar pouco neste slide — o slide e apenas estrutura. Toda a narracao acontece durante a demo. Avisar a banca que a transicao entre fluxos vai ser explicita.

**Visual sugerido:** mockup de 4 quadrantes mostrando os 4 fluxos com tempo em cada um.

**Quem apresenta:** Lucas Stopinski dirige; Pedro e Lucas Bruno assumem nos seus fluxos

---

## Slide 28 — Metricas, licoes e Q&A

**Subtitulo:** 94% front, 84% back, 255 commits, 20 rotas

**Bullets**
- Cobertura: 94% front, 84% back
- 152 testes back + cobertura completa de services e components front
- 20 rotas REST documentadas em Swagger com i18n
- 4 sprints registradas com Sprint Planning e backlog formal
- Licao Lucas S — adotaria Tanstack Query desde o dia 1
- Licao Pedro — adotaria Drizzle ORM no lugar de Sequelize
- Licao Lucas B — configuraria GitHub Project e Conventional Commits na sprint 1
- Estamos abertos para perguntas

**Notas do apresentador**
Cada integrante diz a propria licao em uma frase. Encerrar agradecendo e perguntando se a banca tem alguma duvida. Caso sobre tempo, expandir as licoes; caso falte, mostrar so os numeros.

**Visual sugerido:** painel central com numeros gigantes + 3 cards laterais com a licao de cada integrante.

**Quem apresenta:** Grupo (Lucas S abre, todos contribuem nas licoes)

---

> Documento mantido por Lucas Stopinski com input de Pedro Guligurski e Lucas Bruno.
> Layout final do .pptx esta em `apresentacao/AutoSoccer_Apresentacao.pptx`; este markdown e a fonte de texto.
> Ultima atualizacao: 10/06/2026.
