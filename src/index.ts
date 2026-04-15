import { buildApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import './database/models';
import { env } from './config/env';

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const app = await buildApp();

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'Shutting down application');

    await app.close();
    await disconnectDatabase();
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT').finally(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM').finally(() => process.exit(0));
  });

  await app.listen({
    host: '0.0.0.0',
    port: env.port
  });
};

void startServer().catch((error: unknown) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
