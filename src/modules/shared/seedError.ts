export type SeedErrorCode = 'SEED_DATA_INVARIANT';

/**
 * Erro tipado para invariantes quebrados no seed inicial do banco
 * (ex.: nao ha atletas suficientes do tipo X para popular bots).
 * Como ocorre durante o bootstrap, nao chega ao error handler do
 * Fastify — interrompe o processo de inicializacao.
 */
export class SeedError extends Error {
  public readonly code: SeedErrorCode;

  constructor(code: SeedErrorCode, message: string) {
    super(message);
    this.name = 'SeedError';
    this.code = code;
  }
}
