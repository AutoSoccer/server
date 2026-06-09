import { Op, type Order } from 'sequelize';

import { sequelize } from '../../config/database';
import { TeamSnapshot } from '../../database/models';

/**
 * RN006 — janelas progressivas de tolerancia para o matchmaking baseado em vitorias.
 * O sistema procura primeiro adversarios com proporcao victory_ratio muito proxima
 * e vai alargando a faixa caso nao encontre.
 */
const VICTORY_RATIO_WINDOWS = [0.05, 0.1, 0.2, 0.35, 1] as const;

const MATCHMAKING_QUERY_LIMIT = 10;

export type MatchmakingErrorCode = 'NO_OPPONENT_FOUND';

export class MatchmakingError extends Error {
  public readonly code: MatchmakingErrorCode;

  constructor(code: MatchmakingErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type MatchmakingResult = {
  opponent: TeamSnapshot;
  delta: number;
  windowUsed: number;
};

export type FindOpponentOptions = {
  /** IDs de snapshots ja enfrentados — evita repetir o mesmo fantasma. */
  excludeSnapshotIds?: number[];
};

/**
 * RN006 — proporcao de vitorias considerando TODAS as rodadas jogadas
 * (vitorias + derrotas + empates). Empates contam como rodada jogada, entao
 * nao inflam o ratio mas aproximam jogadores com volume de partidas parecido.
 */
export const computeVictoryRatio = (
  victory: number,
  lose: number,
  draw = 0
): number => {
  const total = victory + lose + draw;
  if (total <= 0) {
    return 0;
  }
  return victory / total;
};

/** Rodadas ja jogadas por um snapshot (RN006 — "rodadas ja jogadas"). */
const roundsPlayed = (snapshot: TeamSnapshot): number =>
  (snapshot.victory ?? 0) + (snapshot.lose ?? 0) + (snapshot.draw ?? 0);

/**
 * RN006: dado o snapshot do jogador, busca o snapshot de outro usuario cuja
 * proporcao vitoria/rodadas seja proxima. Usa janelas progressivas e, dentro de
 * cada janela, prioriza tambem quem tem numero de rodadas jogadas semelhante.
 * Snapshots ja enfrentados (excludeSnapshotIds) sao ignorados.
 */
export const findOpponentSnapshot = async (
  playerSnapshot: TeamSnapshot,
  options: FindOpponentOptions = {}
): Promise<MatchmakingResult> => {
  const ratio = Number(playerSnapshot.victory_ratio ?? 0);
  const playerRounds = roundsPlayed(playerSnapshot);
  const excluded = [playerSnapshot.id, ...(options.excludeSnapshotIds ?? [])];
  const exactProgressWhere = {
    user_id: { [Op.ne]: playerSnapshot.user_id },
    victory: playerSnapshot.victory,
    lose: playerSnapshot.lose,
    draw: playerSnapshot.draw
  };

  const exactOpponent = await TeamSnapshot.findOne({
    where: {
      ...exactProgressWhere,
      id: { [Op.notIn]: excluded }
    },
    order: [['created_at', 'DESC']]
  });

  if (exactOpponent) {
    return {
      opponent: exactOpponent,
      delta: Math.abs(Number(exactOpponent.victory_ratio) - ratio),
      windowUsed: 0
    };
  }

  // Uma snapshot com o mesmo progresso e ja enfrentada ainda e mais justa do
  // que trocar por um adversario de outra rodada apenas para evitar repeticao.
  if ((options.excludeSnapshotIds?.length ?? 0) > 0) {
    const repeatedExactOpponent = await TeamSnapshot.findOne({
      where: {
        ...exactProgressWhere,
        id: { [Op.ne]: playerSnapshot.id }
      },
      order: [['created_at', 'DESC']]
    });

    if (repeatedExactOpponent) {
      return {
        opponent: repeatedExactOpponent,
        delta: Math.abs(
          Number(repeatedExactOpponent.victory_ratio) - ratio
        ),
        windowUsed: 0
      };
    }
  }

  // Ordena por proximidade de ratio e, em empate, por proximidade de rodadas
  // jogadas (RN006); por fim pelo snapshot mais recente.
  // CAST p/ SIGNED evita underflow de BIGINT UNSIGNED quando a soma < playerRounds.
  const order: Order = [
    [sequelize.literal(`ABS(victory_ratio - ${ratio})`), 'ASC'],
    [
      sequelize.literal(`ABS(CAST(victory + lose + draw AS SIGNED) - ${playerRounds})`),
      'ASC'
    ],
    ['created_at', 'DESC']
  ];

  for (const window of VICTORY_RATIO_WINDOWS) {
    const candidate = await TeamSnapshot.findOne({
      where: {
        user_id: { [Op.ne]: playerSnapshot.user_id },
        id: { [Op.notIn]: excluded },
        victory_ratio: {
          [Op.between]: [Math.max(0, ratio - window), Math.min(1, ratio + window)]
        }
      },
      order,
      limit: 1,
      subQuery: false
    });

    if (candidate) {
      return {
        opponent: candidate,
        delta: Math.abs(Number(candidate.victory_ratio) - ratio),
        windowUsed: window
      };
    }

    // Fallback: examina apenas N candidatos recentes (fora os excluidos) para
    // nao varrer o banco inteiro ao expandir a janela.
    const sampled = await TeamSnapshot.findAll({
      where: {
        user_id: { [Op.ne]: playerSnapshot.user_id },
        id: { [Op.notIn]: excluded }
      },
      order: [['created_at', 'DESC']],
      limit: MATCHMAKING_QUERY_LIMIT
    });

    const candidateInSample = sampled.find(
      (snap) => Math.abs(Number(snap.victory_ratio) - ratio) <= window
    );

    if (candidateInSample) {
      return {
        opponent: candidateInSample,
        delta: Math.abs(Number(candidateInSample.victory_ratio) - ratio),
        windowUsed: window
      };
    }
  }

  throw new MatchmakingError(
    'NO_OPPONENT_FOUND',
    'Nenhum oponente compativel encontrado para esta rodada.'
  );
};
