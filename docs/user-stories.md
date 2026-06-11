# User Stories — AutoSoccer

Este documento consolida o levantamento formal de requisitos no formato
**As / Want / So that**, complementando as
[features BDD em Gherkin](./features/) e o
[plano de acao consolidado](./PLANO_DE_ACAO.md) (RF001-014, RN001-013).

Cada user story abaixo inclui:

- Persona e motivacao no formato As-Want-So-That.
- Criterios de aceite verificaveis (4-6 por story).
- Definicao de pronto (DoD) cobrindo implementacao, testes, i18n e Swagger.
- Mapeamento para o codigo real (arquivo + linhas), de modo que o leitor
  possa rastrear cada criterio ate sua origem na codebase do `server/`.

---

## US1: Login rapido para jogador casual (RF005)

**Como** jogador casual sem tempo para preencher um cadastro completo,
**Quero** entrar no jogo com um unico click via login de convidado,
**Para que** eu possa experimentar o auto-battler do AutoSoccer sem friccao
e decidir depois se vou criar uma conta permanente.

### Criterios de aceite

- [ ] Botao "Entrar como convidado" disponivel na pagina inicial do front.
- [ ] Chamada `POST /auth/guest` cria a conta automaticamente, sem body, e
  retorna HTTP 201 com `{ token, user }`.
- [ ] A conta gerada tem `is_guest = true` e `coins = GUEST_INITIAL_COINS`
  (constante definida em `auth.service.ts:202`).
- [ ] O `nickname` segue o padrao `guest_<sufixo>` com sufixo aleatorio de
  ate 12 chars (caber em VARCHAR(20)).
- [ ] O backend reemite um token JWT assinado com `JWT_SECRET` e expira em
  `JWT_EXPIRES_IN` (env vars).
- [ ] Apos o login, o frontend persiste o token em `localStorage` e
  redireciona para a tela de mercado/`/match/start`.
- [ ] Trofeus, vitorias e derrotas de um convidado **nao** sao contabilizados
  no ranking persistente nem alteram o perfil (RF005).

### Definicao de pronto (DoD)

- [ ] Implementado em `createGuest` —
  `server/src/modules/auth/auth.service.ts` linhas **204-242** (retry em
  ate 3 tentativas para colisao de nickname).
- [ ] Rota `POST /auth/guest` registrada em
  `server/src/modules/auth/auth.routes.ts` linhas **106-123** com schema
  Swagger e `i18n` (`auth.guest.summary` / `auth.guest.description`).
- [ ] Convidado e excluido do ranking via filtro `is_guest: false` em
  `server/src/modules/ranking/ranking.service.ts` linhas **63-66**
  (`eligibleRankingWhere`).
- [ ] Bloco "RF004/RF005: trofeus e perfil so mudam ao encerrar a partida e
  se nao for convidado" em
  `server/src/modules/partida/rodada.service.ts` linhas **354-364**.
- [ ] Coberto por testes unitarios em `auth.service.test.ts` e integration
  em `src/__tests__/integration/auth.int.test.ts`.
- [ ] Textos em pt-BR e en sincronizados (rodar `yarn i18n:check`).

---

## US2: Ranking competitivo para jogador veterano (RF003)

**Como** jogador veterano que ja venceu varias campanhas,
**Quero** consultar minha posicao no ranking geral por trofeus e ver
  metricas de win rate, vitorias e derrotas,
**Para que** eu possa comparar meu desempenho com outros jogadores e
  decidir se vou seguir competindo ou refinar minha estrategia.

### Criterios de aceite

- [ ] Endpoint `GET /ranking?limit=<n>` retorna HTTP 200 com
  `{ ranking: RankingEntry[], currentUser }`.
- [ ] `limit` aceita valores entre 1 e `MAX_RANKING_LIMIT = 100`
  (default `DEFAULT_RANKING_LIMIT = 50`) — valores fora da faixa sao
  saturados, nao rejeitados.
- [ ] Cada entrada tras `position`, `userId`, `nickname`, `trophies`,
  `victory`, `defeat`, `completedCampaigns`, `winRate` e `lossRate` (uma
  casa decimal).
- [ ] O ranking exclui contas com `is_guest = true` ou sem nenhuma
  campanha concluida (`victory = 0 AND defeat = 0`).
- [ ] Ordenacao deterministica: `trophies DESC`, `victory DESC`,
  `defeat ASC`, `id ASC` (desempate por id mais antigo).
- [ ] O bloco `currentUser` informa minha posicao global mesmo quando eu
  estou fora do `limit` solicitado, com `appearsInRanking: false` nesse
  caso.

### Definicao de pronto (DoD)

- [ ] Implementado em `getRanking` —
  `server/src/modules/ranking/ranking.service.ts` linhas **124-187**
  (com `calculateRankingMetrics` em **71-90** e `outranksCurrentUserWhere`
  em **92-117**).
- [ ] Rota registrada em
  `server/src/modules/ranking/ranking.routes.ts` linhas **74-126** com
  schema Swagger e querystring tipada (`RankingQuery`).
- [ ] Trofeus aplicados no encerramento da partida em
  `server/src/modules/partida/rodada.service.ts` linhas **354-364**,
  respeitando `TROPHIES_ON_WIN = 30` e `TROPHIES_ON_LOSS = 15`
  (`server/src/modules/partida/rodada.logic.ts` linhas **22-24**).
- [ ] `applyTrophies` impede saldo negativo —
  `server/src/modules/partida/rodada.logic.ts` linhas **55-56**.
- [ ] Coberto por `ranking.service.test.ts` (unit) e
  `src/__tests__/integration/ranking.int.test.ts` (integration).
- [ ] Documentado em `server/docs/api-ranking.md` e nos namespaces i18n
  `ranking.json` (pt-BR e en).

---

## US3: Itens estrategicos para o estrategista (RF014)

**Como** jogador estrategista que ja domina a economia base do mercado,
**Quero** comprar itens da loja e aplica-los nos atletas da minha equipe
  para somar buffs de attack, defense e velocity,
**Para que** eu maximize o overall do meu time antes da proxima rodada
  e suba no ranking competitivo.

### Criterios de aceite

- [ ] Endpoint `GET /items` retorna o catalogo de itens ativos
  (`is_active = true`), ordenados por `cost ASC, id ASC`.
- [ ] `POST /items/buy` debita `item.cost` do saldo do usuario e cria uma
  instancia em `user_items` com `consumed = false`, tudo dentro de uma
  transacao Sequelize.
- [ ] Erro `INSUFFICIENT_COINS` retorna codigo de dominio quando
  `user.coins < item.cost`, sem efeitos colaterais no inventario.
- [ ] Erro `ITEM_INACTIVE` retorna quando o item nao esta ativo na loja
  (`is_active = false`).
- [ ] `POST /items/apply` aplica o modificador no snapshot do atleta
  alvo, marca o `UserItem` como `consumed` e respeita a regra de stack
  (`STACK_NOT_ALLOWED` para itens nao stackaveis ja aplicados ao mesmo
  atleta).
- [ ] Os buffs (`attack`, `defense`, `velocity`) sao propagados para o
  motor de simulacao via `SnapshotAthlete.bonus` e usados no calculo de
  ataques/defesas durante os 12 turnos.

### Definicao de pronto (DoD)

- [ ] Implementado em
  `server/src/modules/itens/itens.service.ts`: `listarItens` (linhas
  **65-74**), `comprarItem` (linhas **86-...**, transacionada) e
  `aplicarItem` (mesmo arquivo, com merge via `mergeBonus` de
  `itens.logic.ts`).
- [ ] Rotas em `server/src/modules/itens/itens.routes.ts` linhas
  **30-205** com Swagger completo (`items.list`, `items.buy`,
  `items.apply`) e validacao de `user_id` x token (`USER_MISMATCH`).
- [ ] Bonus consumido pelo motor em
  `server/src/modules/partida/rodada.service.ts` linhas **204-212**
  (`if (cell.bonus) a.bonus = cell.bonus`).
- [ ] Cobertura: `itens.service.test.ts`, `itens.logic.test.ts` e
  integration em `src/__tests__/integration/itens.int.test.ts`.
- [ ] Textos sincronizados em `itens.json` para pt-BR e en, validados
  por `yarn i18n:check`.
- [ ] Documentado no Swagger sob a tag `Items` (registrada em
  `src/plugins/swagger.ts`).
