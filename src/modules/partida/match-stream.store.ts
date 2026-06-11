import { randomUUID } from 'crypto';
import { type JogarRodadaResult } from './rodada.service';

type StoreEntry = {
  result: JogarRodadaResult;
  expiresAt: number;
};

const TTL_MS = 60_000;
const store = new Map<string, StoreEntry>();

const cleanup = (): void => {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expiresAt <= now) {
      store.delete(id);
    }
  }
};

setInterval(cleanup, TTL_MS);

export const createMatchEntry = (result: JogarRodadaResult): string => {
  const matchId = randomUUID();
  store.set(matchId, { result, expiresAt: Date.now() + TTL_MS });
  return matchId;
};

export const consumeMatchEntry = (matchId: string): JogarRodadaResult | null => {
  const entry = store.get(matchId);
  if (!entry) return null;
  store.delete(matchId);
  return entry.result;
};
