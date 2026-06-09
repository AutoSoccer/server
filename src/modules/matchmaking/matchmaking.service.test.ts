import { describe, expect, it } from 'vitest';

import type { SnapshotPositions } from '../../database/models/team-snapshot.model';
import type { TeamSnapshot } from '../../database/models';
import {
  countSnapshotAthletes,
  isEligibleOpponentSnapshot,
  maxOpponentAthletesForProgress
} from './matchmaking.service';

const positionsWithAthletes = (count: number): SnapshotPositions => {
  const positions: SnapshotPositions = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => null)
  );

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / 3);
    const col = index % 3;
    positions[row][col] = {
      id: index + 1,
      name: `Atleta ${index + 1}`,
      velocity: 50,
      attack: 50,
      defense: 50,
      type: 'midfielder'
    };
  }

  return positions;
};

const snapshotWithAthletes = (count: number): TeamSnapshot =>
  ({
    positions: positionsWithAthletes(count)
  }) as TeamSnapshot;

describe('limite de atletas no matchmaking', () => {
  it('limita adversarios da primeira rodada a tres atletas', () => {
    const maxAthletes = maxOpponentAthletesForProgress(0, 0, 0);

    expect(maxAthletes).toBe(3);
    expect(isEligibleOpponentSnapshot(snapshotWithAthletes(3), maxAthletes)).toBe(
      true
    );
    expect(isEligibleOpponentSnapshot(snapshotWithAthletes(6), maxAthletes)).toBe(
      false
    );
  });

  it('permite ate seis atletas depois da primeira rodada', () => {
    const maxAthletes = maxOpponentAthletesForProgress(1, 0, 0);

    expect(maxAthletes).toBe(6);
    expect(isEligibleOpponentSnapshot(snapshotWithAthletes(6), maxAthletes)).toBe(
      true
    );
  });

  it('conta somente celulas ocupadas da formacao', () => {
    expect(countSnapshotAthletes(snapshotWithAthletes(1))).toBe(1);
    expect(countSnapshotAthletes(snapshotWithAthletes(3))).toBe(3);
    expect(countSnapshotAthletes(snapshotWithAthletes(6))).toBe(6);
  });
});
