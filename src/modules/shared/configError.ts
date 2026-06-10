export type ConfigErrorCode =
  | 'CONFIG_MISSING_ENV'
  | 'CONFIG_INVALID_ENV'
  | 'CONFIG_CORS_WILDCARD_IN_PRODUCTION';

/**
 * Erro tipado de inicializacao/boot. Usado por configuracoes obrigatorias
 * (env vars, seed) que nao podem assumir um default razoavel. Nao deve
 * escapar para o error handler do Fastify — em geral resulta em
 * `process.exit(1)` antes do servidor subir.
 */
export class ConfigError extends Error {
  public readonly code: ConfigErrorCode;

  constructor(code: ConfigErrorCode, message: string) {
    super(message);
    this.name = 'ConfigError';
    this.code = code;
  }
}
