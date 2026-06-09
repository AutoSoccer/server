import { Op, type WhereOptions } from 'sequelize';

import { User } from '../../database/models';

export type RankingMetrics = {
  trophies: number;
  victory: number;
  defeat: number;
  completedCampaigns: number;
  winRate: number;
  lossRate: number;
};

export type RankingEntry = RankingMetrics & {
  position: number;
  userId: number;
  nickname: string;
};

export type CurrentUserRanking = RankingMetrics & {
  userId: number;
  nickname: string;
  isGuest: boolean;
  position: number | null;
  appearsInRanking: boolean;
};

export type RankingResponse = {
  ranking: RankingEntry[];
  currentUser: CurrentUserRanking;
};

export class RankingServiceError extends Error {
  constructor(
    public readonly code: 'USER_NOT_FOUND',
    message: string
  ) {
    super(message);
    this.name = 'RankingServiceError';
  }
}

const DEFAULT_RANKING_LIMIT = 50;
const MAX_RANKING_LIMIT = 100;

const completedCampaignWhere = {
  [Op.or]: [
    { victory: { [Op.gt]: 0 } },
    { defeat: { [Op.gt]: 0 } }
  ]
};

const eligibleRankingWhere: WhereOptions = {
  is_guest: false,
  ...completedCampaignWhere
};

const roundPercentage = (value: number): number =>
  Math.round(value * 10) / 10;

export const calculateRankingMetrics = (
  trophies: number,
  victory: number,
  defeat: number
): RankingMetrics => {
  const completedCampaigns = victory + defeat;
  const winRate =
    completedCampaigns > 0
      ? roundPercentage((victory / completedCampaigns) * 100)
      : 0;

  return {
    trophies,
    victory,
    defeat,
    completedCampaigns,
    winRate,
    lossRate: completedCampaigns > 0 ? roundPercentage(100 - winRate) : 0
  };
};

const outranksCurrentUserWhere = (currentUser: User): WhereOptions => ({
  is_guest: false,
  [Op.and]: [
    completedCampaignWhere,
    {
      [Op.or]: [
        { trophies: { [Op.gt]: currentUser.trophies } },
        {
          trophies: currentUser.trophies,
          victory: { [Op.gt]: currentUser.victory }
        },
        {
          trophies: currentUser.trophies,
          victory: currentUser.victory,
          defeat: { [Op.lt]: currentUser.defeat }
        },
        {
          trophies: currentUser.trophies,
          victory: currentUser.victory,
          defeat: currentUser.defeat,
          id: { [Op.lt]: currentUser.id }
        }
      ]
    }
  ]
});

/**
 * Ranking geral por trofeus. Apenas contas reais com ao menos uma campanha
 * concluida aparecem. O usuario autenticado sempre recebe suas metricas e sua
 * posicao global, mesmo quando estiver fora do limite solicitado.
 */
export const getRanking = async (
  currentUserId: number,
  limit = DEFAULT_RANKING_LIMIT
): Promise<RankingResponse> => {
  const safeLimit = Math.min(
    Math.max(1, Math.floor(limit)),
    MAX_RANKING_LIMIT
  );

  const [users, currentUser] = await Promise.all([
    User.findAll({
      where: eligibleRankingWhere,
      order: [
        ['trophies', 'DESC'],
        ['victory', 'DESC'],
        ['defeat', 'ASC'],
        ['id', 'ASC']
      ],
      limit: safeLimit
    }),
    User.findByPk(currentUserId)
  ]);

  if (!currentUser) {
    throw new RankingServiceError(
      'USER_NOT_FOUND',
      'Usuario autenticado nao encontrado.'
    );
  }

  const currentMetrics = calculateRankingMetrics(
    currentUser.trophies,
    currentUser.victory,
    currentUser.defeat
  );
  const isEligible =
    !currentUser.is_guest && currentMetrics.completedCampaigns > 0;
  const currentPosition = isEligible
    ? (await User.count({
        where: outranksCurrentUserWhere(currentUser)
      })) + 1
    : null;

  return {
    ranking: users.map((user, index) => ({
      position: index + 1,
      userId: user.id,
      nickname: user.nickname,
      ...calculateRankingMetrics(
        user.trophies,
        user.victory,
        user.defeat
      )
    })),
    currentUser: {
      userId: currentUser.id,
      nickname: currentUser.nickname,
      isGuest: currentUser.is_guest,
      position: currentPosition,
      appearsInRanking:
        currentPosition !== null && currentPosition <= safeLimit,
      ...currentMetrics
    }
  };
};
