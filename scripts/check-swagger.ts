/* Smoke-test do Swagger: instancia uma instancia Fastify, registra todas as
 * rotas (sem subir banco) e imprime cobertura de tags/summary/responses. */
import Fastify from 'fastify';
import { registerSwagger } from '../src/plugins/swagger';
import { authRoutes } from '../src/modules/auth/auth.routes';
import { equipeRoutes } from '../src/modules/equipe/equipe.routes';
import { itensRoutes } from '../src/modules/itens/itens.routes';
import { mercadoRoutes } from '../src/modules/mercado/mercado.routes';
import { partidaRoutes } from '../src/modules/partida/partida.routes';
import { rankingRoutes } from '../src/modules/ranking/ranking.routes';

const run = async (): Promise<void> => {
  const app = Fastify({
    ajv: { customOptions: { strict: false, keywords: ['example'] } }
  });
  await registerSwagger(app);
  app.get(
    '/health',
    {
      schema: {
        tags: ['System'],
        summary: 'Health check',
        response: { 200: { type: 'object' } }
      }
    },
    async () => ({ ok: true })
  );
  app.get(
    '/healthz',
    {
      schema: {
        tags: ['System'],
        summary: 'Health check (alias)',
        response: { 200: { type: 'object' } }
      }
    },
    async () => ({ ok: true })
  );
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(mercadoRoutes, { prefix: '/market' });
  await app.register(equipeRoutes, { prefix: '/team' });
  await app.register(itensRoutes, { prefix: '/items' });
  await app.register(partidaRoutes, { prefix: '/match' });
  await app.register(rankingRoutes, { prefix: '/ranking' });

  await app.ready();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spec: any = app.swagger();
  const paths = Object.keys(spec.paths || {});
  let totalOps = 0;
  const missing: string[] = [];
  for (const p of paths) {
    for (const method of Object.keys(spec.paths[p])) {
      const op = spec.paths[p][method];
      totalOps += 1;
      const issues: string[] = [];
      if (!op.tags || op.tags.length === 0) issues.push('no tag');
      if (!op.summary) issues.push('no summary');
      if (!op.responses || Object.keys(op.responses).length === 0) {
        issues.push('no responses');
      }
      if (issues.length) missing.push(`${method.toUpperCase()} ${p}: ${issues.join(', ')}`);
    }
  }
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        totalRoutes: totalOps,
        paths,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tags: (spec.tags || []).map((t: any) => t.name),
        componentSchemas: Object.keys(spec.components?.schemas || {}),
        missing
      },
      null,
      2
    )
  );

  // Sanity: ErrorResponse precisa estar exposto em components.schemas
  if (!spec.components?.schemas?.ErrorResponse) {
    throw new Error('ErrorResponse nao foi exportado para components.schemas');
  }

  await app.close();
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
