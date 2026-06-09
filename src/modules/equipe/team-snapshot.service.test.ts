import { describe, expect, it } from 'vitest';

import {
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

const expectValidationCode = (
  callback: () => unknown,
  code: TeamSnapshotError['code']
) => {
  try {
    callback();
    throw new Error(`Era esperado o erro ${code}.`);
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(TeamSnapshotError);
    expect((error as TeamSnapshotError).code).toBe(code);
  }
};

describe('validateAthletePositions', () => {
  it('aceita formacoes entre 1 e 6 atletas', () => {
    expect(
      validateAthletePositions([
        position(1, 0, 0)
      ])
    ).toHaveLength(MIN_POSITIONED_ATHLETES);

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

  it('recusa formacao vazia ou com mais de 6 atletas', () => {
    expectValidationCode(
      () => validateAthletePositions([]),
      'WRONG_ATHLETE_COUNT'
    );

    expectValidationCode(
      () => validateAthletePositions([
        position(1, 0, 0),
        position(2, 1, 0),
        position(3, 2, 0),
        position(4, 0, 1),
        position(5, 1, 1),
        position(6, 2, 1),
        position(7, 0, 2)
      ]),
      'WRONG_ATHLETE_COUNT'
    );
  });

  it('recusa atleta ou celula duplicados', () => {
    expectValidationCode(
      () => validateAthletePositions([
        position(1, 0, 0),
        position(1, 1, 0)
      ]),
      'DUPLICATE_ATHLETE'
    );

    expectValidationCode(
      () => validateAthletePositions([
        position(1, 0, 0),
        position(2, 0, 0)
      ]),
      'DUPLICATE_POSITION'
    );
  });

  it('recusa coordenadas fora do grid 3x3', () => {
    expectValidationCode(
      () => validateAthletePositions([
        position(1, 3, 0)
      ]),
      'OUT_OF_BOUNDS'
    );
  });
});
