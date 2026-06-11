# Arquitetura do Back-end — AutoSoccer

> Guia técnico de autoria para defesa na banca (23/06/2026).
> Cada seção descreve o que o código REALMENTE faz — use para responder perguntas dos professores Cleverson e Vinícius.
> Integrante responsável: **Pedro Henrique Silva Guligurski**

---

## Stack

| Tecnologia | Versão | Por que foi escolhida |
|---|---|---|
| Fastify | 5 | 2× mais rápido que Express em throughput; plugin system com encapsulamento real; JSON Schema serve tanto para validação quanto para Swagger |
| Sequelize | 6 | ORM maduro com migrations versionadas e suporte a MySQL 8 |
| MySQL | 8 | Banco relacional com stored procedures nativas (necessário para o critério T6) |
| JWT (`@fastify/jwt`) | — | Stateless, sem necessidade de session store; payload carrega `id`, `nickname` e `role` |
| `@fastify/websocket` | 11 | Integração nativa de WebSocket no Fastify sem sair do modelo de plugins |
| Zod | 3 | Validação de regras de negócio que dependem de estado do banco (diferente dos schemas JSON do Fastify) |
| Vitest | 4 | Mesmo bundler do front — consistência no projeto; suporte a fake timers para testes do motor de batalha |

---

## Estrutura de módulos

```
src/modules/
  auth/          registro, login, perfil (GET /auth/me), conta convidado
  equipe/        time do usuário, compra/venda de atletas, snapshots
  itens/         catálogo da loja, compra e aplicação de itens
  matchmaking/   encontra adversário fantasma por victory_ratio
  mercado/       janela de mercado personalizada por usuário
  partida/       motor de batalha, rotas de partida, WebSocket
  ranking/       listagem de jogadores por troféus
  reports/       relatórios gerenciais via stored procedures
  simulador/     motor puro de simulação (sem I/O, sem DB)
  admin/         listagem de usuários (role admin)
  shared/        tipos e utilitários compartilhados
```

---

## Motor de simulação (simulador/)

### Por que existe como módulo separado?

O simulador é **puro** — não acessa banco, não faz I/O, recebe dados e retorna resultado. Isso permite:
- Testar o motor com `vi.fn()` como função aleatória (seed determinístico)
- Reusar a lógica em contextos diferentes (REST e WebSocket)
- Isolar bugs de lógica de negócio de bugs de infraestrutura

### Fluxo de um turno

```
computeInitiative(playerTeam, opponentTeam)
  → identifica atacante com maior velocidade na coluna da frente
  → equipe com iniciativa começa o turno

Para cada turno (1..12):
  1. Atacante avança em direção ao gol
  2. Se encontra adversário → disputa por atributos (attack vs defense)
  3. Resultado da disputa determina posse da bola e movimento no campo
  4. Se bola chega à linha de gol → gol marcado
  5. Turno é registrado como TurnEvent com movements[], ball, goal, description
```

### Formula de disputa

```ts
// src/modules/simulador/formula.ts
effectiveAttribute = baseAttribute + bonus (item aplicado)
successChance = effectiveAttribute / (effectiveAttribute + opponentAttribute)
// Resultado: Math.random() < successChance → sucesso
```

### Campo

- Grid 6×3 (6 linhas, 3 colunas)
- Time do jogador começa nas linhas 0–2, adversário nas linhas 3–5
- Coluna 0 = esquerda, coluna 5 = gol do adversário (para o jogador)

### Arquivos relevantes

- [`src/modules/simulador/simulador.service.ts`](../src/modules/simulador/simulador.service.ts) — motor principal, `processarRodada()`
- [`src/modules/simulador/formula.ts`](../src/modules/simulador/formula.ts) — cálculo de atributos efetivos e chance de sucesso
- [`src/modules/simulador/types.ts`](../src/modules/simulador/types.ts) — todos os tipos do motor (TurnEvent, FieldPosition, etc.)

---

## Autenticação e Roles

### Fluxo JWT

1. `POST /auth/login` → valida credenciais → assina JWT com `{ id, nickname, role }`
2. Cliente salva o token e envia em todo request via `Authorization: Bearer <token>`
3. Plugin `@fastify/jwt` decodifica e decora `request.user`
4. Middleware `requireRole('admin')` verifica `request.user.role` e retorna 403 se não for admin

### Roles disponíveis

- `user` — padrão para todos os cadastros normais e convidados
- `admin` — acesso a `GET /admin/users`; só pode ser definido direto no banco (sem rota pública de promoção)

> **Resposta para a banca:** "O role vem no payload do JWT. Criamos um middleware `requireRole` que verifica o campo antes de passar para o handler. Se o token não tiver o role correto, retorna 403 FORBIDDEN com mensagem traduzida."

### Arquivos relevantes

- [`src/modules/auth/auth.routes.ts`](../src/modules/auth/auth.routes.ts)
- [`src/modules/admin/admin.routes.ts`](../src/modules/admin/admin.routes.ts) — rota protegida por `requireRole('admin')`

---

## Partida e WebSocket

### Por que store em memória (Map) e não banco?

O `match-stream.store.ts` guarda os eventos da batalha por 60 segundos em um `Map<matchId, { result, expiresAt }>`.

Razão: o resultado já foi persistido no MySQL antes do WebSocket abrir. A store é só um buffer para o streaming — guardar os eventos no banco para depois transmitir via WS adicionaria uma leitura extra por partida sem benefício real. TTL de 60s é mais do que suficiente para o cliente abrir a conexão.

### Padrão sendAndClose

```ts
// Garante que a última mensagem é recebida antes do socket fechar
const sendAndClose = (socket, msg) => new Promise((resolve) => {
  socket.send(JSON.stringify(msg), () => {
    socket.close();
    resolve();
  });
});
```

`socket.close()` dentro do callback de `send()` garante que o envio foi confirmado antes de fechar. Sem isso, o último `result` pode ser descartado pelo kernel antes de sair.

### Fluxo WebSocket

```
Cliente → GET /ws/battle/:matchId?token=<jwt>  (upgrade HTTP → WS)
  Server verifica JWT → 401 se inválido
  Server busca matchId na store → MATCH_NOT_FOUND se expirado ou já consumido
  Store é consumida (one-shot: cada matchId só pode ser aberto uma vez)
  Loop de 12 turnos:
    send({ type: "turn", data: TurnEvent })
    await sleep(800ms)
  sendAndClose({ type: "result", data: MatchResponse })
```

### Arquivos relevantes

- [`src/modules/partida/match-stream.store.ts`](../src/modules/partida/match-stream.store.ts) — buffer em memória com TTL
- [`src/modules/partida/ws-battle.handler.ts`](../src/modules/partida/ws-battle.handler.ts) — handler WebSocket
- [`src/modules/partida/partida.routes.ts`](../src/modules/partida/partida.routes.ts) — `POST /match/play` que gera o matchId

---

## Validação em dois níveis

| Nível | Ferramenta | Quando usar |
|---|---|---|
| Forma (shape) | JSON Schema do Fastify | Body, params, querystring — retorna 400 antes de chegar no controller |
| Semântica (regra de negócio) | Código no service | Ex: "atleta já está no time", "saldo insuficiente", "snapshot vazio" |

Zod é usado pontualmente em forms do front — no back, a validação de negócio vive nos services com erros tipados (`RodadaServiceErrorCode`, etc.).

---

## Migrations e banco

### Disciplina de migrations

- Cada migration tem `up` e `down` — toda mudança é reversível
- `sync: false` hardcoded no Sequelize — nunca deixamos o ORM alterar o schema automaticamente
- Start Command no Railway: `yarn db:migrate && node dist/index.js` — migrations rodam antes do servidor subir
- Em CI: `yarn db:migrate` roda antes dos testes de integração

### Stored procedures (T6)

Três stored procedures criadas via migration (arquivo `create-reports-stored-procedures.cjs`):

| Procedure | O que faz |
|---|---|
| `sp_get_top_athletes_by_role` | Top atletas por poder (attack + defense + velocity), filtrado por posição |
| `sp_team_power_ranking` | Ranking de equipes pelo poder bruto da formação |
| `sp_market_overview` | Visão agregada do mercado (totais, breakdown por tier e posição) |

Chamadas via `sequelize.query('CALL sp_nome(?)', { replacements: [...], type: QueryTypes.SELECT })`.

> **Resposta para a banca:** "Usamos stored procedures para os relatórios gerenciais porque a agregação é feita direto no MySQL — mais eficiente do que trazer os dados brutos para o Node e agregar em memória. Cada procedure foi criada e pode ser removida por migrations reversíveis."

---

## Swagger / OpenAPI

- Documentação automática gerada pelo `@fastify/swagger` a partir dos JSON Schemas das rotas
- UI disponível em `GET /docs`
- Schemas compartilhados em `src/plugins/swagger.schemas.ts` são registrados via `app.addSchema()` e referenciados com `$ref` nas rotas
- Textos (summaries, descriptions) em arquivos de i18n `src/i18n/locales/pt-BR/swagger.json` e `en/swagger.json`
- Endpoint WebSocket (`/ws/battle/:matchId`) não aparece no Swagger UI (limitação do OpenAPI 3.0 — não suporta WebSocket nativamente); documentado na tag "WebSocket" e na descrição do `POST /match/play`

---

## CI/CD

### Pipelines

- **`ci-pr.yml`** — roda em todo PR para `main`: lint → typecheck → i18n-check → test:coverage → build
- **`ci-main.yml`** — roda ao mergear em `main`: mesmos steps + SonarCloud Scan + tag de staging
- **`cd-production.yml`** — deploy automático no Railway ao mergear em `main`

### Variáveis de ambiente necessárias (Railway)

| Variável | Valor |
|---|---|
| `DATABASE_URL` | URL do MySQL no Railway |
| `JWT_SECRET` | String aleatória longa (nunca exposta em código) |
| `CORS_ORIGIN` | `https://autosoccer.vercel.app` |
| `NODE_ENV` | `production` |

> Em `NODE_ENV=production`, o servidor **recusa subir** se `CORS_ORIGIN` for wildcard (`*` ou vazio) — guard de segurança em `src/config/env.ts`.

---

## Perguntas prováveis da banca e respostas curtas

### "Por que Fastify e não Express?"
Fastify é ~2× mais rápido em throughput por causa do roteador `find-my-way` e serialização JSON por schema. O sistema de plugins tem encapsulamento real (`register` cria escopo) — em Express, middlewares são globais por padrão. E o JSON Schema que valida o body é o mesmo que documenta o Swagger, sem duplicação.

### "Como funciona o motor de batalha (12 turnos)?"
O módulo `simulador/` é puro — sem banco, sem I/O. Recebe dois `TeamDTO` com posições e atributos, calcula `computeInitiative` (quem começa pelo atacante mais avançado), e itera 12 turnos. Cada turno resolve uma disputa por atributos usando chance estatística (`attack / (attack + defense)`). O resultado é determinístico dado a mesma semente aleatória — usado nos testes.

### "Como vocês testam o motor sem banco?"
O `processarRodada()` aceita um parâmetro `random: RandomFn = Math.random`. Nos testes, passamos `vi.fn().mockReturnValue(0.5)` — isso torna o resultado determinístico e testável sem depender de aleatoriedade.

### "Como funciona o matchmaking?"
`findOpponentSnapshot` busca no banco um time fantasma (CPU) cujo `victory_ratio` seja próximo do jogador. Ordenação por `|ratio_adversario - ratio_jogador|` — o mais parecido vence. Se não encontrar adversário (banco vazio), retorna erro `NO_OPPONENT_FOUND`.

### "Por que stored procedures e não queries no ORM?"
Performance e separação de responsabilidades. As agregações dos relatórios envolvem JOINs em múltiplas tabelas com GROUP BY — fazer isso via Sequelize geraria N queries ou SQL gerado sub-ótimo. Na stored procedure, o banco otimiza o plano de execução internamente.

### "Como o WebSocket se integra com o Fastify?"
Registramos `@fastify/websocket` como plugin e declaramos a rota WS com `{ websocket: true }`. O handler recebe `socket` (instância ws) e `request` (request HTTP do handshake). A autenticação usa o token no query param porque a browser WebSocket API não suporta headers customizados.

### "O que acontece se o WebSocket falhar?"
O front tem fallback automático: se `matchId` não vier na resposta, ou o token não estiver no localStorage, ou a conexão expirar (timeout de 5s), a batalha é animada localmente com `setInterval` de 850ms — sem diferença visível para o usuário.
