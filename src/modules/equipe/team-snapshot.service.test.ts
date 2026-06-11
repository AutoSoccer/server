import { describe, expect, it } from 'vitest';

import {
  GRID_SIZE,
  MAX_POSITIONED_ATHLETES,
  MIN_POSITIONED_ATHLETES,
  TeamSnapshotError,
  validateAthletePositions
} from './team-snapshot.service';

const position = (athleteId: number, posX: number, posY: number) => ({
  athleteId,
  posX,
  posY
});

const expectValidationCode = (callback: () => unknown, code: TeamSnapshotError['code']) => {
  try {
    callback();
    throw new Error(`Era esperado o erro ${code}.`);
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(TeamSnapshotError);
    expect((error as TeamSnapshotError).code).toBe(code);
  }
};

const expectValidationError = (
  callback: () => unknown,
  expected: { code: TeamSnapshotError['code']; i18nKey?: string }
): TeamSnapshotError => {
  try {
    callback();
    throw new Error(`Era esperado o erro ${expected.code}.`);
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(TeamSnapshotError);
    const snapshotError = error as TeamSnapshotError;
    expect(snapshotError.code).toBe(expected.code);
    if (expected.i18nKey) {
      expect(snapshotError.i18nKey).toBe(expected.i18nKey);
    }
    return snapshotError;
  }
};

describe('TeamSnapshotError', () => {
  it('herda de Error e mantem o nome correto', () => {
    const error = new TeamSnapshotError('TEAM_NOT_FOUND');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TeamSnapshotError);
    expect(error.name).toBe('TeamSnapshotError');
  });

  it('deriva i18nKey automaticamente quando nao fornecida', () => {
    const error = new TeamSnapshotError('TEAM_NOT_FOUND');
    expect(error.i18nKey).toBe('equipe.errors.TEAM_NOT_FOUND');
    expect(error.message).toBe('equipe.errors.TEAM_NOT_FOUND');
  });

  it('aceita i18nKey custom via options', () => {
    const error = new TeamSnapshotError('INVALID_BODY', {
      i18nKey: 'equipe.snapshot.invalidBody.positionsArray'
    });
    expect(error.i18nKey).toBe('equipe.snapshot.invalidBody.positionsArray');
    expect(error.message).toBe('equipe.snapshot.invalidBody.positionsArray');
  });

  it('preserva params para interpolacao no i18n', () => {
    const error = new TeamSnapshotError('OUT_OF_BOUNDS', {
      params: { posX: 5, posY: 2, grid: GRID_SIZE }
    });
    expect(error.params).toEqual({ posX: 5, posY: 2, grid: GRID_SIZE });
  });

  it('params fica undefined quando nao informado', () => {
    const error = new TeamSnapshotError('DUPLICATE_ATHLETE');
    expect(error.params).toBeUndefined();
  });

  it('aceita todos os codes do union type', () => {
    const codes: TeamSnapshotError['code'][] = [
      'TEAM_NOT_FOUND',
      'INVALID_BODY',
      'WRONG_ATHLETE_COUNT',
      'DUPLICATE_ATHLETE',
      'DUPLICATE_POSITION',
      'OUT_OF_BOUNDS',
      'ATHLETE_NOT_IN_TEAM',
      'ITEM_NOT_IN_INVENTORY'
    ];

    for (const code of codes) {
      const error = new TeamSnapshotError(code);
      expect(error.code).toBe(code);
    }
  });
});

describe('validateAthletePositions — shape validation', () => {
  it('recusa entrada nao-array', () => {
    expectValidationError(() => validateAthletePositions(null), {
      code: 'INVALID_BODY',
      i18nKey: 'equipe.snapshot.invalidBody.positionsArray'
    });

    expectValidationError(() => validateAthletePositions(undefined), {
      code: 'INVALID_BODY',
      i18nKey: 'equipe.snapshot.invalidBody.positionsArray'
    });

    expectValidationError(() => validateAthletePositions('foo'), { code: 'INVALID_BODY' });

    expectValidationError(() => validateAthletePositions({ foo: 'bar' }), { code: 'INVALID_BODY' });

    expectValidationError(() => validateAthletePositions(42), { code: 'INVALID_BODY' });
  });

  it('recusa entries que nao sao objetos', () => {
    expectValidationError(() => validateAthletePositions([null]), {
      code: 'INVALID_BODY',
      i18nKey: 'equipe.snapshot.invalidBody.positionsObject'
    });

    expectValidationError(() => validateAthletePositions([undefined]), { code: 'INVALID_BODY' });

    expectValidationError(() => validateAthletePositions(['string-no-objeto']), {
      code: 'INVALID_BODY'
    });

    expectValidationError(() => validateAthletePositions([42]), { code: 'INVALID_BODY' });
  });

  it('inclui shape esperado em params do erro positionsObject', () => {
    const error = expectValidationError(() => validateAthletePositions([null]), {
      code: 'INVALID_BODY'
    });
    expect(error.params).toEqual({ shape: '{ athleteId, posX, posY }' });
  });

  it('recusa athleteId nao-inteiro ou nao-positivo', () => {
    expectValidationError(() => validateAthletePositions([{ athleteId: 0, posX: 0, posY: 0 }]), {
      code: 'INVALID_BODY',
      i18nKey: 'equipe.snapshot.invalidBody.positionsIntegers'
    });

    expectValidationError(() => validateAthletePositions([{ athleteId: -1, posX: 0, posY: 0 }]), {
      code: 'INVALID_BODY'
    });

    expectValidationError(() => validateAthletePositions([{ athleteId: 1.5, posX: 0, posY: 0 }]), {
      code: 'INVALID_BODY'
    });

    expectValidationError(
      () => validateAthletePositions([{ athleteId: 'abc', posX: 0, posY: 0 }]),
      { code: 'INVALID_BODY' }
    );

    expectValidationError(() => validateAthletePositions([{ athleteId: null, posX: 0, posY: 0 }]), {
      code: 'INVALID_BODY'
    });
  });

  it('recusa posX/posY nao-inteiros', () => {
    expectValidationError(() => validateAthletePositions([{ athleteId: 1, posX: 1.5, posY: 0 }]), {
      code: 'INVALID_BODY'
    });

    expectValidationError(() => validateAthletePositions([{ athleteId: 1, posX: 0, posY: 'a' }]), {
      code: 'INVALID_BODY'
    });

    expectValidationError(
      () => validateAthletePositions([{ athleteId: 1, posX: undefined, posY: 0 }]),
      { code: 'INVALID_BODY' }
    );
  });

  it('aceita posX/posY = 0 (limite inferior valido)', () => {
    const result = validateAthletePositions([{ athleteId: 1, posX: 0, posY: 0 }]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ athleteId: 1, posX: 0, posY: 0 });
  });

  it('normaliza strings numericas para number (Number coerce)', () => {
    const result = validateAthletePositions([{ athleteId: '5', posX: '1', posY: '2' }]);
    expect(result).toEqual([{ athleteId: 5, posX: 1, posY: 2 }]);
  });
});

describe('validateAthletePositions — quantidade de atletas', () => {
  it('aceita formacoes entre 1 e 6 atletas', () => {
    expect(validateAthletePositions([position(1, 0, 0)])).toHaveLength(MIN_POSITIONED_ATHLETES);

    expect(
      validateAthletePositions([
        position(1, 0, 0),
        position(2, 1, 0),
        position(3, 2, 0),
        position(4, 0, 1),
        position(5, 1, 1),
        position(6, 2, 1)
      ])
    ).toHaveLength(MAX_POSITIONED_ATHLETES);
  });

  it('recusa formacao vazia com WRONG_ATHLETE_COUNT', () => {
    const error = expectValidationError(() => validateAthletePositions([]), {
      code: 'WRONG_ATHLETE_COUNT',
      i18nKey: 'equipe.snapshot.wrongAthleteCount'
    });
    expect(error.params).toMatchObject({
      min: MIN_POSITIONED_ATHLETES,
      max: MAX_POSITIONED_ATHLETES,
      count: 0
    });
  });

  it('recusa formacao com mais de 6 atletas com count nos params', () => {
    const error = expectValidationError(
      () =>
        validateAthletePositions([
          position(1, 0, 0),
          position(2, 1, 0),
          position(3, 2, 0),
          position(4, 0, 1),
          position(5, 1, 1),
          position(6, 2, 1),
          position(7, 0, 2)
        ]),
      { code: 'WRONG_ATHLETE_COUNT' }
    );
    expect(error.params).toMatchObject({ count: 7 });
  });
});

describe('validateAthletePositions — bounds e duplicacao', () => {
  it('recusa atleta duplicado com athleteId nos params', () => {
    const error = expectValidationError(
      () => validateAthletePositions([position(7, 0, 0), position(7, 1, 0)]),
      {
        code: 'DUPLICATE_ATHLETE',
        i18nKey: 'equipe.snapshot.duplicateAthlete'
      }
    );
    expect(error.params).toEqual({ athleteId: 7 });
  });

  it('recusa celula duplicada com posX/posY nos params', () => {
    const error = expectValidationError(
      () => validateAthletePositions([position(1, 1, 2), position(2, 1, 2)]),
      {
        code: 'DUPLICATE_POSITION',
        i18nKey: 'equipe.snapshot.duplicatePosition'
      }
    );
    expect(error.params).toEqual({ posX: 1, posY: 2 });
  });

  it('recusa coordenadas posX >= GRID_SIZE', () => {
    const error = expectValidationError(() => validateAthletePositions([position(1, 3, 0)]), {
      code: 'OUT_OF_BOUNDS',
      i18nKey: 'equipe.snapshot.outOfBounds'
    });
    expect(error.params).toEqual({ posX: 3, posY: 0, grid: GRID_SIZE });
  });

  it('recusa coordenadas posY >= GRID_SIZE', () => {
    expectValidationError(() => validateAthletePositions([position(1, 0, 3)]), {
      code: 'OUT_OF_BOUNDS'
    });
  });

  it('recusa coordenadas negativas (posX < 0)', () => {
    expectValidationError(() => validateAthletePositions([position(1, -1, 0)]), {
      code: 'OUT_OF_BOUNDS'
    });
  });

  it('recusa coordenadas negativas (posY < 0)', () => {
    expectValidationError(() => validateAthletePositions([position(1, 0, -1)]), {
      code: 'OUT_OF_BOUNDS'
    });
  });

  it('aceita posX = GRID_SIZE - 1 e posY = GRID_SIZE - 1 (limite superior)', () => {
    const result = validateAthletePositions([position(1, GRID_SIZE - 1, GRID_SIZE - 1)]);
    expect(result).toHaveLength(1);
  });

  it('aceita todos os 9 slots do grid 3x3 (max valido com 6 atletas)', () => {
    const result = validateAthletePositions([
      position(1, 0, 0),
      position(2, 1, 0),
      position(3, 2, 0),
      position(4, 0, 1),
      position(5, 1, 1),
      position(6, 2, 1)
    ]);
    expect(result).toHaveLength(6);
  });
});

describe('validateAthletePositions — ordem das validacoes', () => {
  it('valida shape antes da quantidade (positions nao-array da INVALID_BODY)', () => {
    expectValidationError(() => validateAthletePositions(null), { code: 'INVALID_BODY' });
  });

  it('valida quantidade antes de bounds (vazio da WRONG_ATHLETE_COUNT)', () => {
    expectValidationError(() => validateAthletePositions([]), { code: 'WRONG_ATHLETE_COUNT' });
  });

  it('valida bounds antes de duplicacao', () => {
    // Atleta duplicado + out of bounds: deve retornar OUT_OF_BOUNDS primeiro
    expectValidationError(() => validateAthletePositions([position(1, 5, 0), position(1, 0, 0)]), {
      code: 'OUT_OF_BOUNDS'
    });
  });
});

describe('GRID_SIZE constants', () => {
  it('expoe GRID_SIZE = 3', () => {
    expect(GRID_SIZE).toBe(3);
  });

  it('expoe MIN_POSITIONED_ATHLETES = 1', () => {
    expect(MIN_POSITIONED_ATHLETES).toBe(1);
  });

  it('expoe MAX_POSITIONED_ATHLETES = 6', () => {
    expect(MAX_POSITIONED_ATHLETES).toBe(6);
  });
});

// Manter teste antigo para retro-compatibilidade
describe('validateAthletePositions — legacy (mantido)', () => {
  it('recusa atleta duplicado e celula duplicada', () => {
    expectValidationCode(
      () => validateAthletePositions([position(1, 0, 0), position(1, 1, 0)]),
      'DUPLICATE_ATHLETE'
    );

    expectValidationCode(
      () => validateAthletePositions([position(1, 0, 0), position(2, 0, 0)]),
      'DUPLICATE_POSITION'
    );
  });
});
