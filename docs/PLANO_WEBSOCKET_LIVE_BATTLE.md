# Plano de Acao — WebSockets para Batalha ao Vivo

## Contexto

O AutoSoccer e um auto-battler de fantasy soccer. Hoje a batalha funciona assim:
1. Front chama `POST /match/play` com as posicoes dos atletas
2. Server roda os 12 turnos do `Simulador` e retorna **tudo de uma vez** em `MatchResult`
3. Front recebe e anima progressivamente com `setInterval` de 850ms

**Objetivo:** substituir a resposta unica por um **stream de eventos via WebSocket**, onde cada turno chega individualmente do server. A experiencia vira "partida ao vivo" — o front nao sabe o resultado final ate o ultimo turno.

**Criterio da disciplina:** rubrica de avaliacao cita "web sockets" como tecnologia bonus (+0.5 a +1.5 pts).

---

## Arquitetura

```
Front (Next.js 16)                    Server (Fastify 5)
─────────────────                    ──────────────────
                                     
BattlePage.tsx                       ws-battle.handler.ts
  │                                    │
  ├─ POST /match/play ────────────►  partidaRoutes (existente)
  │   (inicia partida,                 │ retorna { matchId }
  │    recebe matchId)                 │
  │                                    │
  ├─ WS /ws/battle/:matchId ──────►  wsHandler
  │                                    │ autentica JWT do query param
  │   ◄── evento "turn" ────────────   │ roda Simulador turno-a-turno
  │   ◄── evento "turn" ────────────   │ envia TurnEvent a cada 800ms
  │   ◄── evento "turn" ────────────   │ ...
  │   ◄── evento "result" ──────────   │ envia MatchResult final
  │                                    │ fecha conexao
  │                                    │
  └─ atualiza UI turno-a-turno         
```

**Fallback:** se o WebSocket falhar (timeout 5s), o front volta ao comportamento atual (POST retorna tudo de uma vez). Zero breaking changes.

---

## Fase 1 — Server (branch `feat/ws-live-battle`)

### 1.1 Instalar dependencia

```bash
cd server
yarn add @fastify/websocket
```

### 1.2 Registrar plugin WebSocket

**Arquivo:** `src/app.ts`

Adicionar apos os plugins existentes (`@fastify/cors`, `@fastify/swagger`):

```ts
import websocket from '@fastify/websocket';

// dentro do buildApp():
await app.register(websocket);
```

### 1.3 Refatorar Simulador para emitir turnos individualmente

**Arquivo:** `src/modules/simulador/simulador.service.ts`

O metodo `processarRodada()` (linha ~755) hoje roda todos os 12 turnos em loop e retorna `MatchResult` com `events: TurnEvent[]`.

Criar um **novo metodo** `processarRodadaStream()` que usa um **generator**:

```ts
*processarRodadaStream(
  player: TeamDTO,
  opponent: TeamDTO,
  options?: SimulationOptions
): Generator<TurnEvent, MatchResult, void> {
  // mesma logica de setup (initiative, initial ball, etc.)
  // ...

  for (let turn = 1; turn <= totalTurns; turn++) {
    const event = this.executeTurn(turn, /* ... */);
    yield event; // emite turno individual

    if (event.goal) break; // gol encerra
  }

  // return final com MatchResult completo
  return {
    player,
    opponent,
    score,
    winner,
    totalTurns: turnCount,
    initialBall,
    events: allEvents,
  };
}
```

**IMPORTANTE:** NAO alterar o `processarRodada()` existente. O metodo original continua funcionando para o endpoint REST (fallback). O generator e um metodo **adicional**.

### 1.4 Criar handler WebSocket

**Novo arquivo:** `src/modules/partida/ws-battle.handler.ts`

```ts
import { FastifyInstance } from 'fastify';
import { verifyToken } from '../auth/auth.service'; // usar funcao existente
import { Simulador } from '../simulador/simulador.service';

// Shape dos eventos enviados pelo WS
interface WsMessage {
  type: 'turn' | 'result' | 'error';
  data: unknown;
}

export async function wsBattleRoutes(app: FastifyInstance) {
  app.get(
    '/ws/battle/:matchId',
    { websocket: true },
    async (socket, request) => {
      // 1. Autenticar via query param ?token=<jwt>
      const token = (request.query as Record<string, string>).token;
      const payload = verifyToken(token);
      if (!payload) {
        socket.send(JSON.stringify({ type: 'error', data: { code: 'UNAUTHORIZED' } }));
        socket.close();
        return;
      }

      // 2. Buscar dados da partida pendente pelo matchId
      const matchId = (request.params as Record<string, string>).matchId;
      // ... buscar jogador, oponente, posicoes do snapshot salvo

      // 3. Rodar simulacao turno-a-turno
      const simulador = new Simulador();
      const gen = simulador.processarRodadaStream(player, opponent);

      let result: IteratorResult<TurnEvent, MatchResult>;
      do {
        result = gen.next();

        if (!result.done) {
          // Emite turno individual
          socket.send(JSON.stringify({
            type: 'turn',
            data: result.value,
          } satisfies WsMessage));

          // Delay entre turnos (800ms) para efeito dramatico
          await new Promise(resolve => setTimeout(resolve, 800));
        } else {
          // Emite resultado final
          socket.send(JSON.stringify({
            type: 'result',
            data: result.value,
          } satisfies WsMessage));
        }
      } while (!result.done);

      socket.close();
    }
  );
}
```

### 1.5 Registrar rota WS no app

**Arquivo:** `src/app.ts`

```ts
import { wsBattleRoutes } from './modules/partida/ws-battle.handler';

// apos as rotas existentes:
app.register(wsBattleRoutes);
```

### 1.6 Adaptar POST /match/play para retornar matchId

**Arquivo:** `src/modules/partida/partida.routes.ts` (linha ~372, rota `POST /match/play`)

Hoje essa rota roda o simulador e retorna o resultado completo. Adaptar para:

1. Gerar um `matchId` unico (uuid ou nanoid)
2. Salvar snapshot dos dados (jogador, oponente, posicoes) em memoria (Map<string, SnapshotData>)
3. Retornar `{ matchId, wsUrl: '/ws/battle/<matchId>' }` em vez do resultado completo
4. **Manter** o campo `result` na resposta para fallback — se o front nao suportar WS, ele usa direto

```ts
// Resposta adaptada:
{
  matchId: string;
  wsUrl: string;
  result: MatchResult; // fallback — front pode ignorar se usar WS
}
```

**TTL do snapshot:** limpar apos 60s ou apos consumo pelo WS (o que vier primeiro).

### 1.7 Testes server

**Novo arquivo:** `src/modules/simulador/__tests__/simulador-stream.test.ts`

- Testar que `processarRodadaStream()` emite N eventos (1 <= N <= 12)
- Testar que o ultimo `return` e um `MatchResult` valido
- Testar que gol encerra antes dos 12 turnos

**Novo arquivo:** `src/modules/partida/__tests__/ws-battle.test.ts`

- Testar conexao WS com token valido recebe eventos
- Testar conexao sem token recebe erro e fecha
- Testar que todos os turnos chegam na ordem certa

---

## Fase 2 — Front (branch `feat/ws-live-battle`)

### 2.1 Criar hook useBattleStream

**Novo arquivo:** `src/hooks/useBattleStream.ts`

```ts
'use client';

import { useState, useCallback, useRef } from 'react';
import { TurnEvent, MatchResult } from '@/services/gameService';

type BattleStreamState =
  | { status: 'idle' }
  | { status: 'connecting' }
  | { status: 'streaming'; events: TurnEvent[]; currentTurn: number }
  | { status: 'finished'; events: TurnEvent[]; result: MatchResult }
  | { status: 'error'; fallbackResult?: MatchResult };

const WS_TIMEOUT_MS = 5000;

export function useBattleStream() {
  const [state, setState] = useState<BattleStreamState>({ status: 'idle' });
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((matchId: string, token: string, fallbackResult?: MatchResult) => {
    setState({ status: 'connecting' });

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?/, protocol) || `${protocol}://localhost:3333`;
    const ws = new WebSocket(`${baseUrl}/ws/battle/${matchId}?token=${token}`);
    wsRef.current = ws;

    const events: TurnEvent[] = [];

    // Timeout: se nao conectar em 5s, usa fallback
    const timeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        setState({ status: 'error', fallbackResult });
      }
    }, WS_TIMEOUT_MS);

    ws.onopen = () => clearTimeout(timeout);

    ws.onmessage = (msg) => {
      const parsed = JSON.parse(msg.data);

      if (parsed.type === 'turn') {
        events.push(parsed.data);
        setState({
          status: 'streaming',
          events: [...events],
          currentTurn: parsed.data.turn,
        });
      }

      if (parsed.type === 'result') {
        setState({
          status: 'finished',
          events: [...events],
          result: parsed.data,
        });
      }

      if (parsed.type === 'error') {
        setState({ status: 'error', fallbackResult });
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      setState({ status: 'error', fallbackResult });
    };

    ws.onclose = () => clearTimeout(timeout);
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  return { state, connect, disconnect };
}
```

### 2.2 Adaptar BattlePage.tsx

**Arquivo:** `src/app/battle/BattlePage.tsx`

Hoje (linhas 312-375) o fluxo e:
1. Chama `gameService.playMatch(positions)`
2. Recebe tudo em `response`
3. Faz `setInterval` de 850ms para revelar eventos via `setVisibleLogs`

**Novo fluxo:**
1. Chama `gameService.playMatch(positions)` — agora retorna `{ matchId, wsUrl, result }`
2. Chama `connect(matchId, token, result)` do hook
3. O hook emite eventos um a um — cada novo evento atualiza o state
4. `BattlePage` reage ao state do hook:
   - `streaming` → renderiza campo e logs ate o turno atual (reutiliza a mesma logica de `visibleEventCount`)
   - `finished` → mostra modal de resultado
   - `error` → fallback: usa `result` do POST e volta ao comportamento antigo com `setInterval`

**Mudancas no componente:**

```tsx
// Importar hook
import { useBattleStream } from '@/hooks/useBattleStream';

// Dentro do componente:
const { state: wsState, connect, disconnect } = useBattleStream();

// No useEffect de inicio de batalha, apos chamar playMatch:
const response = await gameService.playMatch(positions);

if (response.matchId) {
  // Modo WebSocket
  connect(response.matchId, authToken, response.result);
} else {
  // Fallback: servidor antigo sem WS — usar logica atual
  startEventAnimation(response);
}

// Substituir o setInterval atual por reatividade ao wsState:
useEffect(() => {
  if (wsState.status === 'streaming') {
    setVisibleLogs(wsState.events);
    setCurrentTurn(wsState.currentTurn);
  }
  if (wsState.status === 'finished') {
    setMatchResult(wsState.result);
    handleMatchEnd(wsState.result);
  }
  if (wsState.status === 'error' && wsState.fallbackResult) {
    // fallback para animacao local
    startEventAnimation(wsState.fallbackResult);
  }
}, [wsState]);

// Cleanup
useEffect(() => disconnect, [disconnect]);
```

**IMPORTANTE:** manter a funcao `startEventAnimation()` existente (o setInterval de 850ms) como fallback. Extrair para funcao separada se ainda nao estiver.

### 2.3 Atualizar gameService.ts

**Arquivo:** `src/services/gameService.ts` (linha ~250)

Atualizar o tipo de retorno de `playMatch()`:

```ts
interface PlayMatchResponse {
  matchId?: string;   // novo — presente quando WS esta disponivel
  wsUrl?: string;     // novo
  result: MatchResult; // sempre presente (fallback)
}
```

### 2.4 Internacionalizacao (i18n)

**Arquivos:**
- `src/i18n/messages/pt-BR/battle.json`
- `src/i18n/messages/en/battle.json`

Adicionar chaves:

```json
{
  "live": {
    "connecting": "Conectando ao servidor...",
    "streaming": "Partida ao vivo — Turno {turn} de {total}",
    "connectionLost": "Conexao perdida. Reproduzindo resultado..."
  }
}
```

### 2.5 Indicador visual de "ao vivo"

No header da BattlePage (linhas 400-419), adicionar badge pulsante quando `wsState.status === 'streaming'`:

```tsx
{wsState.status === 'streaming' && (
  <span className={styles.liveBadge}>
    ● {t('live.streaming', { turn: wsState.currentTurn, total: 12 })}
  </span>
)}
```

CSS para o badge pulsante:

```css
.liveBadge {
  color: var(--brand-primary);
  font-weight: 900;
  font-size: 0.75rem;
  text-transform: uppercase;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

### 2.6 Testes front

**Novo arquivo:** `src/hooks/__tests__/useBattleStream.test.ts`

- Mock de WebSocket (`vi.stubGlobal('WebSocket', MockWebSocket)`)
- Testar transicao de estados: idle → connecting → streaming → finished
- Testar fallback em caso de erro/timeout
- Testar disconnect no unmount

**Atualizar:** `src/app/battle/__tests__/BattlePage.test.tsx`

- Testar renderizacao turno-a-turno via WS mock
- Testar fallback quando WS falha

---

## Fase 3 — Integracao e polish

### 3.1 CORS/Origem WebSocket

**Arquivo:** `src/app.ts` (config do `@fastify/cors`)

Garantir que a origem do front esta permitida tambem para upgrade de WebSocket. O `@fastify/websocket` herda o CORS do Fastify por padrao.

### 3.2 Deploy

- Railway: nao precisa config extra — suporta WebSocket nativamente
- Verificar que o plano nao tem restricao de conexoes persistentes

### 3.3 Swagger

Documentar o endpoint WS em `partida.routes.ts` com anotacao descritiva (Swagger nao suporta WS nativamente, mas pode documentar como nota).

---

## Checklist de entrega

### Server
- [ ] `yarn add @fastify/websocket`
- [ ] Plugin registrado em `app.ts`
- [ ] `Simulador.processarRodadaStream()` como generator
- [ ] Handler WS em `ws-battle.handler.ts`
- [ ] `POST /match/play` retorna `matchId` + `wsUrl` + `result`
- [ ] Map de snapshots com TTL de 60s
- [ ] Testes do generator (simulador-stream.test.ts)
- [ ] Testes do handler WS (ws-battle.test.ts)

### Front
- [ ] Hook `useBattleStream.ts`
- [ ] `BattlePage.tsx` adaptado com fallback
- [ ] `gameService.ts` tipo atualizado
- [ ] i18n keys (pt-BR + en)
- [ ] Badge "ao vivo" pulsante
- [ ] Testes do hook
- [ ] Testes da BattlePage atualizados

### Integracao
- [ ] Testar local: `npm run dev` (front) + `yarn dev` (server)
- [ ] Testar fallback: desligar WS e verificar que comportamento antigo funciona
- [ ] Deploy Railway e testar WS em producao

---

## Convencoes do projeto (SEGUIR)

- **Branch:** `feat/ws-live-battle` (mesma branch para front e server)
- **Commits:** Conventional Commits em **pt-BR sem acentos**, titulo <= 72 chars, imperativo
  - `feat(ws): adiciona processarRodadaStream como generator`
  - `feat(ws): cria handler WebSocket para batalha ao vivo`
  - `feat(battle): integra useBattleStream na BattlePage`
  - `test(ws): cobre generator e handler WS`
- **Testes:** nome igual ao arquivo testado. `describe` = sujeito, `it` = comportamento
- **Lockfile server:** `yarn.lock` (usar `yarn add`)
- **Lockfile front:** `package-lock.json` (usar `npm install`). Apos instalar deps, rodar `npm run lock:linux` + `npm install`
- **NAO usar Co-Authored-By** nos commits
- **NAO adicionar comentarios desnecessarios** no codigo
