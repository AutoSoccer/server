export class Athlete {
  id: number = 0;
  name: string = '';
  velocity: number = 50;
  attack: number = 50;
  defense: number = 50;
}

export class TeamDTO {
  id: number = 0;
  name: string = '';
  athlethes: Athlete[] = [];
  turn: number = 0;
  victorys: number = 0;
  loses: number = 0;
  athletesPositions: (Athlete | null)[][] = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => null)
  );
}

export type Possession = 'player' | 'opponent';
export type BallRow = 0 | 1 | 2;
export type DisputeKind = 'pass' | 'tackle' | 'shot' | 'turnover';

export type TurnEvent = {
  turn: number;
  possession: Possession;
  ballRow: BallRow;
  kind: DisputeKind;
  attackerTeamId: number;
  defenderTeamId: number;
  attackerId: number | null;
  attackerName: string | null;
  defenderId: number | null;
  defenderName: string | null;
  attackerRoll: number;
  defenderRoll: number;
  success: boolean;
  goal: boolean;
  description: string;
};

export type MatchScore = {
  player: number;
  opponent: number;
};

export type MatchWinner = 'player' | 'opponent' | 'draw';

export type MatchResult = {
  player: TeamDTO;
  opponent: TeamDTO;
  score: MatchScore;
  winner: MatchWinner;
  totalTurns: number;
  events: TurnEvent[];
};

export type RandomFn = () => number;

export type SimulationOptions = {
  /** Gerador de aleatoriedade injetavel para tornar a simulacao deterministica em testes. */
  rng?: RandomFn;
  /** Numero total de turnos. RN008 fixa em 12, mas o motor aceita override em testes. */
  totalTurns?: number;
};
