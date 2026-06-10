export type SimuladorServiceErrorCode =
  | 'NO_RECEIVER_AVAILABLE'
  | 'INVALID_TOTAL_TURNS'
  | 'BALL_HOLDER_NOT_FOUND';

const STATUS_BY_CODE: Record<SimuladorServiceErrorCode, number> = {
  NO_RECEIVER_AVAILABLE: 500,
  INVALID_TOTAL_TURNS: 400,
  BALL_HOLDER_NOT_FOUND: 500
};

export type SimuladorServiceErrorOptions = {
  i18nKey?: string;
  params?: Record<string, unknown>;
};

export class SimuladorServiceError extends Error {
  public readonly code: SimuladorServiceErrorCode;
  public readonly statusCode: number;
  public readonly i18nKey: string;
  public readonly params?: Record<string, unknown>;

  constructor(
    code: SimuladorServiceErrorCode,
    options: SimuladorServiceErrorOptions = {}
  ) {
    const i18nKey = options.i18nKey ?? `simulador.errors.${code}`;
    super(i18nKey);
    this.name = 'SimuladorServiceError';
    this.code = code;
    this.statusCode = STATUS_BY_CODE[code];
    this.i18nKey = i18nKey;
    this.params = options.params;
  }
}
