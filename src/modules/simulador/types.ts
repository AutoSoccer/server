export type AttributeBonus = {
  attack?: number;
  defense?: number;
  velocity?: number;
};

export class Athlete {
  id: number = 0;
  name: string = '';
  velocity: number = 50;
  attack: number = 50;
  defense: number = 50;
  /**
   * Bonus acumulado de itens aplicados nesta rodada (Task 4.1).
   * Somado aos atributos base ao calcular cada disputa (RN012).
   */
  bonus?: AttributeBonus;
  /**
   * RN011: quando true, o atleta NAO recua para a defesa ao perder a posse
   * na linha de ataque (habilidade especial que ancora a posicao).
   */
  holdsPosition?: boolean;
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

/**
 * Resultado bruto de uma disputa individual resolvida por uma Strategy (RN012).
 */
export type DisputeOutcome = {
  /** Atributo efetivo do atacante (base + bonus de itens). */
  attackerAttribute: number;
  /** Atributo efetivo do defensor (base + bonus de itens). */
  defenderAttribute: number;
  /** Chance de sucesso do atacante no intervalo [0, 1] (RN012). */
  successChance: number;
  /** Numero sorteado via RNG no intervalo [0, 1). */
  roll: number;
  /** true se o atacante venceu a disputa. */
  success: boolean;
  /** true se o sucesso resultou em gol (estrategia de chute). */
  goal: boolean;
};

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
  /** Numero maximo de turnos. RN008 fixa em 12; pode ser sobrescrito em testes. */
  totalTurns?: number;
  /**
   * Time que comeca com a posse de bola (RN009).
   * Quando omitido, o motor sorteia via RNG.
   */
  initialPossession?: Possession;
};
