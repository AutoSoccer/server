#!/usr/bin/env node
/**
 * Test WebSocket de batalha ao vivo (ws-battle).
 *
 * O que faz:
 *  1. Faz login como guest em POST /auth/guest -> recebe { token, user }
 *  2. Busca o time do guest em GET /team/ (seed cria 6 atletas escalados)
 *  3. POST /match/play com positions dos atletas -> recebe { matchId, wsUrl, result }
 *  4. Abre WebSocket em /ws/battle/:matchId?token=<jwt>
 *  5. Imprime cada evento (turno) em tempo real com timestamp
 *
 * Uso:
 *   node scripts/test-ws-battle.mjs
 *   node scripts/test-ws-battle.mjs --base=http://localhost:3333
 *   node scripts/test-ws-battle.mjs --token=<jwt> --match=<uuid>   (pular login)
 *
 * Requer Node 20+ e a dep `ws` instalada (server/package.json).
 */

import WebSocket from 'ws';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const BASE = args.base ?? 'https://autosoccer-api-production.up.railway.app';
const WS_BASE = BASE.replace(/^http/, 'ws');

const log = (tag, ...rest) => {
  const t = new Date().toISOString().slice(11, 23);
  console.log(`[${t}] ${tag}`, ...rest);
};

const die = (msg, extra) => {
  log('FAIL', msg);
  if (extra !== undefined) console.error(extra);
  process.exit(1);
};

function collectAthletes(team) {
  if (!team) return [];
  // tentar varios shapes possiveis: { athletes }, { team: { athletes } }, array direto
  if (Array.isArray(team)) return team;
  if (Array.isArray(team.athletes)) return team.athletes;
  if (team.team && Array.isArray(team.team.athletes)) return team.team.athletes;
  if (Array.isArray(team.slots)) {
    return team.slots
      .map((s) => s.athlete ?? s)
      .filter((a) => a && (a.id ?? a.athleteId ?? a.athlete_id));
  }
  // fallback: percorrer keys procurando array
  for (const v of Object.values(team)) {
    if (Array.isArray(v) && v.length > 0 && (v[0].id || v[0].athleteId || v[0].athlete_id)) {
      return v;
    }
  }
  return [];
}

async function http(method, path, { token, body } = {}) {
  const isPost = method === 'POST' || method === 'PUT' || method === 'PATCH';
  const payload = body !== undefined ? body : isPost ? {} : undefined;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(payload !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) die(`${method} ${path} -> ${res.status}`, data);
  return data;
}

async function main() {
  log('INFO', `Base URL: ${BASE}`);

  let token = args.token;
  let matchId = args.match;

  if (!token) {
    log('STEP', '1/4 Login como guest (POST /auth/guest)');
    const auth = await http('POST', '/auth/guest');
    token = auth.token;
    log('OK  ', `  user.id=${auth.user.id} nickname=${auth.user.nickname}`);
  }

  if (!matchId) {
    log('STEP', '2/4 Busca time + compra atletas se preciso');
    let team = await http('GET', '/team/', { token });
    let slots = collectAthletes(team);
    log('OK  ', `  time atual: ${slots.length} atletas`);

    if (slots.length === 0) {
      log('INFO', '  time vazio — comprando atletas do mercado...');
      const market = await http('GET', '/market/', { token });
      let coins = market.coins;
      const buyable = (market.athletes ?? []).filter((a) => a.cost <= coins).slice(0, 6);
      log('INFO', `  coins=${coins}, ${buyable.length} atletas compraveis`);
      for (const a of buyable) {
        if (a.cost > coins) break;
        await http('POST', '/team/buy-athlete', { token, body: { atleta_id: a.id } });
        coins -= a.cost;
        log('BUY ', `  ${a.name} (${a.type}, custo=${a.cost}) — restam ${coins} coins`);
      }
      team = await http('GET', '/team/', { token });
      slots = collectAthletes(team);
      log('OK  ', `  time agora: ${slots.length} atletas`);
    }

    if (slots.length === 0) {
      die('Nao consegui formar time — verifique mercado/coins do guest');
    }

    // Monta positions: ate 6 atletas em grid 3x2 (posX 0-2, posY 0-1)
    const positions = slots.slice(0, 6).map((a, i) => ({
      athleteId: a.id ?? a.athleteId ?? a.athlete_id,
      posX: i % 3,
      posY: Math.floor(i / 3),
    }));

    log('STEP', '3/4 Joga partida (POST /match/play)');
    const play = await http('POST', '/match/play', {
      token,
      body: { positions },
    });
    matchId = play.matchId;
    log('OK  ', `  matchId=${matchId}`);
    log('INFO', `  resultado pre-calculado: ${play.result?.outcome ?? '?'} ${play.result?.score ?? ''}`);
  }

  log('STEP', `4/4 Conectando WS em ${WS_BASE}/ws/battle/${matchId}?token=...`);
  const ws = new WebSocket(`${WS_BASE}/ws/battle/${matchId}?token=${token}`);

  let turnsReceived = 0;

  ws.on('open', () => log('WS  ', 'conectado, aguardando turnos...'));

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === 'turn') {
      turnsReceived++;
      const t = msg.data;
      const desc = t.description ?? '(sem descricao)';
      const goal = t.goal ? ' ⚽ GOL!' : '';
      const dispute = `${t.kind ?? '?'} ${t.success ? '✓' : '✗'} (${Math.round((t.successChance ?? 0) * 100)}%)`;
      log(
        'TURN',
        `${String(t.turn ?? turnsReceived).padStart(2, ' ')}/12  ${dispute}  ${desc}${goal}`
      );
    } else if (msg.type === 'result') {
      const r = msg.data;
      const score = `${r.score?.player ?? 0}x${r.score?.opponent ?? 0}`;
      log('RESULT', `vencedor=${r.winner ?? '?'}  placar=${score}  turnos=${r.totalTurns ?? '?'}`);
      if (r.rewards || r.coins || r.trophies) {
        log('RESULT', `recompensas: ${JSON.stringify(r.rewards ?? { coins: r.coins, trophies: r.trophies })}`);
      }
    } else if (msg.type === 'error') {
      log('ERROR', JSON.stringify(msg.data));
    } else {
      log('?   ', JSON.stringify(msg));
    }
  });

  ws.on('close', (code, reason) => {
    log('WS  ', `fechado code=${code} reason="${reason?.toString() ?? ''}"`);
    log('DONE', `Total: ${turnsReceived} turnos recebidos`);
    process.exit(0);
  });

  ws.on('error', (e) => die('WS error', e.message));

  // Timeout de seguranca (12 turnos x 800ms + folga = ~15s)
  setTimeout(() => {
    log('WARN', 'Timeout de 30s atingido, fechando WS');
    ws.close();
  }, 30000);
}

main().catch((e) => die('exception', e?.stack ?? e));
