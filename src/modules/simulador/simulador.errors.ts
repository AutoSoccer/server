export type SimuladorServiceErrorCode =
  | 'NO_RECEIVER_AVAILABLE'
  | 'INVALID_TOTAL_TURNS'
  | 'BALL_HOLDER_NOT_FOUND';

const STATUS_BY_CODE: Record<SimuladorServiceErrorCode, number> = {
  NO_RECEIVER_AVAILABLE: 500,
  INVALID_TOTAL_TURNS: 400,
  BALL_HOLDER_NOT_FOUND: 500
};

export class SimuladorServiceError extends Error {
  public readonly code: SimuladorServiceErrorCode;
  public readonly statusCode: number;

  constructor(code: SimuladorServiceErrorCode, message: string) {
    super(message);
    this.name = 'SimuladorServiceError';
    this.code = code;
    this.statusCode = STATUS_BY_CODE[code];
  }
}
