import { Op } from 'sequelize';

import { User } from '../../database/models';

export type RankingEntry = {
  position: number;
  userId: number;
  nickname: string;
  name: string;
  trophies: number;
  victory: number;
  defeat: number;
};

export type RankingResponse = {
  ranking: RankingEntry[];
};

const DEFAULT_RANKING_LIMIT = 50;

/**
 * RF004 — ranking geral por trofeus (decrescente). Convidados (is_guest) ficam
 * de fora porque nao contabilizam trofeus (RF005). Desempata por mais vitorias
 * e, por fim, pelo id (estavel).
 */
export const getRanking = async (limit = DEFAULT_RANKING_LIMIT): Promise<RankingResponse> => {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);

  const users = await User.findAll({
    where: { is_guest: { [Op.ne]: true } },
    order: [
      ['trophies', 'DESC'],
      ['victory', 'DESC'],
      ['id', 'ASC']
    ],
    limit: safeLimit
  });

  return {
    ranking: users.map((user, index) => ({
      position: index + 1,
      userId: user.id,
      nickname: user.nickname,
      name: user.name,
      trophies: user.trophies,
      victory: user.victory,
      defeat: user.defeat
    }))
  };
};
