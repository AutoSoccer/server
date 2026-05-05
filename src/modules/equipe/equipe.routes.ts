import { type FastifyPluginAsync } from 'fastify';

import { authenticate } from '../auth/auth.middleware';
import { buyAthlete, EquipeServiceError, getMyTeam } from './equipe.service';

type BuyAthleteBody = {
  atleta_id: number;
  user_id?: number;
};

export const equipeRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const team = await getMyTeam(request.user!.id);
    return reply.code(200).send(team);
  });

  app.post<{ Body: BuyAthleteBody }>(
    '/comprar-atleta',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = request.body;
      const athleteId = Number(body?.atleta_id);

      if (!Number.isInteger(athleteId) || athleteId <= 0) {
        return reply.code(400).send({ message: 'Campo atleta_id invalido.' });
      }

      const authenticatedUserId = request.user!.id;

      if (
        body?.user_id !== undefined &&
        Number(body.user_id) !== authenticatedUserId
      ) {
        return reply
          .code(403)
          .send({ message: 'user_id nao corresponde ao usuario autenticado.' });
      }

      try {
        const result = await buyAthlete(authenticatedUserId, athleteId);
        return reply.code(201).send(result);
      } catch (error: unknown) {
        if (error instanceof EquipeServiceError) {
          if (error.code === 'USER_NOT_FOUND') {
            return reply.code(404).send({ message: error.message, code: error.code });
          }

          if (error.code === 'ATHLETE_NOT_AVAILABLE') {
            return reply.code(404).send({ message: error.message, code: error.code });
          }

          return reply.code(400).send({ message: error.message, code: error.code });
        }

        throw error;
      }
    }
  );
};
