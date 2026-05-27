import { Op } from 'sequelize';

import { sequelize } from '../../config/database';
import { TeamSnapshot } from '../../database/models';

/**
 * RN006 — janelas progressivas de tolerancia para o matchmaking baseado em vitorias.
 * O sistema procura primeiro adversarios com proporcao victory_ratio muito proxima
 * e vai alargando a faixa caso nao encontre.
 */
const VICTORY_RATIO_WINDOWS = [0.05, 0.1, 0.2, 0.35, 1] as const;

const MATCHMAKING_QUERY_LIMIT = 5;

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

/**
 * Calcula a razao vitoria/(vitoria+derrota) usada como criterio de balanceamento.
 * Adicionamos 1 ao denominador para suavizar contas com poucas partidas.
 */
export const computeVictoryRatio = (victory: number, lose: number): number => {
  const total = victory + lose;
  if (total <= 0) {
    return 0;
  }
  return victory / total;
};

/**
 * RN006: dado o snapshot do jogador, busca o snapshot mais recente de outro
 * usuario cuja proporcao vitoria/derrotas seja proxima. Usa janelas
 * progressivas e respeita um limit pequeno para nao travar a requisicao.
 */
export const findOpponentSnapshot = async (
  playerSnapshot: TeamSnapshot
): Promise<MatchmakingResult> => {
  const ratio = Number(playerSnapshot.victory_ratio ?? 0);

  for (const window of VICTORY_RATIO_WINDOWS) {
    const candidate = await TeamSnapshot.findOne({
      where: {
        user_id: { [Op.ne]: playerSnapshot.user_id },
        id: { [Op.ne]: playerSnapshot.id },
        victory_ratio: {
          [Op.between]: [
            Math.max(0, ratio - window),
            Math.min(1, ratio + window)
          ]
        }
      },
      order: [
        [sequelize.literal(`ABS(victory_ratio - ${ratio})`), 'ASC'],
        ['created_at', 'DESC']
      ],
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

    // Heuristica: ao expandir a janela, ainda limitamos a busca por tempo
    // examinando apenas N candidatos para nao varrer o banco inteiro.
    const sampled = await TeamSnapshot.findAll({
      where: {
        user_id: { [Op.ne]: playerSnapshot.user_id },
        id: { [Op.ne]: playerSnapshot.id }
      },
      order: [['created_at', 'DESC']],
      limit: MATCHMAKING_QUERY_LIMIT
    });

    const candidateInSample = sampled.find((snap) => {
      const diff = Math.abs(Number(snap.victory_ratio) - ratio);
      return diff <= window;
    });

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
