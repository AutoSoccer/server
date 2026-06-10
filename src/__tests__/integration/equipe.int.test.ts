import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getMyTeam: vi.fn(),
  buyAthlete: vi.fn(),
  sellAthlete: vi.fn(),
  salvarEstadoEquipe: vi.fn()
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

vi.mock('../../modules/equipe/equipe.service', async () => {
  const actual = await vi.importActual<typeof import('../../modules/equipe/equipe.service')>(
    '../../modules/equipe/equipe.service'
  );
  return {
    ...actual,
    getMyTeam: mocks.getMyTeam,
    buyAthlete: mocks.buyAthlete,
    sellAthlete: mocks.sellAthlete
  };
});

vi.mock('../../modules/equipe/team-snapshot.service', async () => {
  const actual = await vi.importActual<typeof import('../../modules/equipe/team-snapshot.service')>(
    '../../modules/equipe/team-snapshot.service'
  );
  return {
    ...actual,
    salvarEstadoEquipe: mocks.salvarEstadoEquipe
  };
});

import { equipeRoutes } from '../../modules/equipe/equipe.routes';
import { EquipeServiceError } from '../../modules/equipe/equipe.service';
import { bearer, buildTestApp, signTestToken } from '../helpers/buildApp';

const token = signTestToken({ id: 1, nickname: 'lucas' });

const buildApp = () => buildTestApp([{ plugin: equipeRoutes, prefix: '/team' }]);

describe('integration: /team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /team responde 200 com o resumo do time autenticado', async () => {
    const app = await buildApp();
    mocks.getMyTeam.mockResolvedValue({
      id: 10,
      name: 'Time A',
      round: 1,
      victory: 0,
      lose: 0,
      athletes_count: 0,
      max_athletes: 6,
      athletes: []
    });

    const response = await app.inject({
      method: 'GET',
      url: '/team',
      headers: bearer(token)
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().id).toBe(10);
    expect(mocks.getMyTeam).toHaveBeenCalledWith(1);

    await app.close();
  });

  it('GET /team responde 401 sem bearer', async () => {
    const app = await buildApp();

    const response = await app.inject({ method: 'GET', url: '/team' });

    expect(response.statusCode).toBe(401);
    expect(mocks.getMyTeam).not.toHaveBeenCalled();

    await app.close();
  });

  it('POST /team/buy-athlete responde 201 quando ok', async () => {
    const app = await buildApp();
    mocks.buyAthlete.mockResolvedValue({
      user: { id: 1, coins: 8 },
      team: { id: 10, athletes_count: 1 },
      athlete: { id: 5, name: 'Atleta', cost: 2, tier: 'bronze', type: 'midfielder' }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/team/buy-athlete',
      headers: bearer(token),
      payload: { atleta_id: 5 }
    });

    expect(response.statusCode).toBe(201);
    expect(mocks.buyAthlete).toHaveBeenCalledWith(1, 5);

    await app.close();
  });

  it('POST /team/buy-athlete responde 400 quando saldo insuficiente', async () => {
    const app = await buildApp();
    mocks.buyAthlete.mockRejectedValue(
      new EquipeServiceError('INSUFFICIENT_COINS')
    );

    const response = await app.inject({
      method: 'POST',
      url: '/team/buy-athlete',
      headers: bearer(token),
      payload: { atleta_id: 5 }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe('INSUFFICIENT_COINS');

    await app.close();
  });

  it('POST /team/buy-athlete responde 404 quando atleta nao esta no mercado', async () => {
    const app = await buildApp();
    mocks.buyAthlete.mockRejectedValue(
      new EquipeServiceError('ATHLETE_NOT_AVAILABLE')
    );

    const response = await app.inject({
      method: 'POST',
      url: '/team/buy-athlete',
      headers: bearer(token),
      payload: { atleta_id: 5 }
    });

    // ATHLETE_NOT_AVAILABLE => 404 no errorHandler
    expect(response.statusCode).toBe(404);

    await app.close();
  });

  it('POST /team/sell-athlete responde 200 quando ok', async () => {
    const app = await buildApp();
    mocks.sellAthlete.mockResolvedValue({
      user: { id: 1, coins: 12 },
      team: { id: 10, athletes_count: 0 },
      athlete: { id: 5, name: 'A', refund: 2, tier: 'bronze', type: 'midfielder' }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/team/sell-athlete',
      headers: bearer(token),
      payload: { atleta_id: 5 }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().athlete.refund).toBe(2);

    await app.close();
  });

  it('POST /team/sell-athlete responde 404 quando atleta nao pertence', async () => {
    const app = await buildApp();
    mocks.sellAthlete.mockRejectedValue(
      new EquipeServiceError('ATHLETE_NOT_OWNED')
    );

    const response = await app.inject({
      method: 'POST',
      url: '/team/sell-athlete',
      headers: bearer(token),
      payload: { atleta_id: 5 }
    });

    expect(response.statusCode).toBe(404);

    await app.close();
  });

  it('POST /team/save-state responde 200 com snapshotId', async () => {
    const app = await buildApp();
    mocks.salvarEstadoEquipe.mockResolvedValue({
      snapshotId: 77,
      teamId: 10,
      round: 1,
      victory: 0,
      lose: 0,
      victoryRatio: 0,
      positions: []
    });

    const response = await app.inject({
      method: 'POST',
      url: '/team/save-state',
      headers: bearer(token),
      payload: {
        positions: [{ athleteId: 21, posX: 0, posY: 0 }]
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().snapshotId).toBe(77);
    expect(mocks.salvarEstadoEquipe).toHaveBeenCalled();

    await app.close();
  });
});
