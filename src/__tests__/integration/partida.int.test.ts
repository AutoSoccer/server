import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  startCampaign: vi.fn(),
  abandonCampaign: vi.fn(),
  jogarRodada: vi.fn(),
  jogarRodadaComFormacao: vi.fn()
}));

vi.mock('../../config/database', async () => {
  const { Sequelize } = await import('sequelize');
  const sequelize = new Sequelize('test', 'test', 'test', {
    dialect: 'mysql',
    logging: false
  });
  return {
    sequelize,
    connectDatabase: vi.fn().mockResolvedValue(undefined)
  };
});

vi.mock('../../modules/partida/campaign.service', async () => {
  const actual = await vi.importActual<typeof import('../../modules/partida/campaign.service')>(
    '../../modules/partida/campaign.service'
  );
  return {
    ...actual,
    startCampaign: mocks.startCampaign,
    abandonCampaign: mocks.abandonCampaign
  };
});

vi.mock('../../modules/partida/rodada.service', async () => {
  const actual = await vi.importActual<typeof import('../../modules/partida/rodada.service')>(
    '../../modules/partida/rodada.service'
  );
  return {
    ...actual,
    jogarRodada: mocks.jogarRodada,
    jogarRodadaComFormacao: mocks.jogarRodadaComFormacao
  };
});

import { partidaRoutes } from '../../modules/partida/partida.routes';
import { CampaignServiceError } from '../../modules/partida/campaign.service';
import { bearer, buildTestApp, signTestToken } from '../helpers/buildApp';

const token = signTestToken({ id: 1, nickname: 'lucas' });

const buildApp = () => buildTestApp([{ plugin: partidaRoutes, prefix: '/partida' }]);

const campaignSuccess = {
  user: { id: 1, coins: 10, trophies: 0 },
  team: {
    id: 10,
    name: 'Time A',
    round: 1,
    victory: 0,
    lose: 0,
    draw: 0,
    athletesCount: 0
  }
};

describe('integration: /partida', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /partida/iniciar responde 200 quando o name eh valido', async () => {
    const app = await buildApp();
    mocks.startCampaign.mockResolvedValue(campaignSuccess);

    const response = await app.inject({
      method: 'POST',
      url: '/partida/iniciar',
      headers: bearer(token),
      payload: { name: 'Time A' }
    });

    expect(response.statusCode).toBe(200);
    expect(mocks.startCampaign).toHaveBeenCalledWith(1, 'Time A');

    await app.close();
  });

  it('POST /partida/iniciar responde 400 quando body nao tem name', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/partida/iniciar',
      headers: bearer(token),
      payload: {}
    });

    expect(response.statusCode).toBe(400);
    expect(mocks.startCampaign).not.toHaveBeenCalled();

    await app.close();
  });

  it('POST /partida/desistir responde 200 quando ha campanha', async () => {
    const app = await buildApp();
    mocks.abandonCampaign.mockResolvedValue(campaignSuccess);

    const response = await app.inject({
      method: 'POST',
      url: '/partida/desistir',
      headers: bearer(token)
    });

    expect(response.statusCode).toBe(200);
    expect(mocks.abandonCampaign).toHaveBeenCalledWith(1);

    await app.close();
  });

  it('POST /partida/desistir responde 404 quando user nao encontrado', async () => {
    const app = await buildApp();
    mocks.abandonCampaign.mockRejectedValue(
      new CampaignServiceError('USER_NOT_FOUND')
    );

    const response = await app.inject({
      method: 'POST',
      url: '/partida/desistir',
      headers: bearer(token)
    });

    expect(response.statusCode).toBe(404);

    await app.close();
  });

  it('POST /partida/jogar-rodada responde com o formato esperado (smoke)', async () => {
    const app = await buildApp();
    mocks.jogarRodada.mockResolvedValue({
      player: {},
      opponent: {},
      score: { player: 2, opponent: 1 },
      winner: 'player',
      totalTurns: 12,
      initialBall: {
        team: 'player',
        athleteId: 1,
        athleteName: 'A',
        position: { x: 0, y: 0 }
      },
      events: [],
      lineups: {
        player: { snapshotId: 11, teamId: 10, name: 'A', positions: [] },
        opponent: { snapshotId: 22, teamId: 20, name: 'B', positions: [] }
      },
      matchmaking: {
        snapshotId: 11,
        opponentSnapshotId: 22,
        opponentUserId: 2,
        victoryRatio: 0,
        delta: 0,
        windowUsed: 0
      },
      initiative: {
        playerLeadVelocity: 0,
        opponentLeadVelocity: 0,
        startsWith: 'player',
        carrier: {
          team: 'player',
          athleteId: 1,
          athleteName: 'A',
          position: { x: 0, y: 0 }
        }
      },
      persisted: { teamId: 10, victory: 1, lose: 0, round: 2 },
      resolution: {
        matchStatus: 'in_progress',
        matchEnded: false,
        trophiesDelta: 0,
        trophies: 0,
        coinsEarned: 10,
        coins: 10,
        userVictory: 0,
        userDefeat: 0,
        isGuest: false,
        roundLogId: 1
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/partida/jogar-rodada',
      headers: bearer(token),
      payload: {}
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.winner).toBe('player');
    expect(body.matchmaking.opponentSnapshotId).toBe(22);
    expect(body.resolution.matchStatus).toBe('in_progress');
    expect(mocks.jogarRodada).toHaveBeenCalledWith({
      userId: 1,
      snapshotId: undefined
    });

    await app.close();
  });

  it('POST /partida/jogar-rodada responde 403 quando user_id nao bate', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/partida/jogar-rodada',
      headers: bearer(token),
      payload: { user_id: 999 }
    });

    expect(response.statusCode).toBe(403);
    expect(mocks.jogarRodada).not.toHaveBeenCalled();

    await app.close();
  });
});
