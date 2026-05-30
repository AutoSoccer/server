import type { Athlete, TeamDTO } from './types';

const DEFENSE_ROW = 0;
const ATTACK_ROW = 2;

/**
 * RN011 — localiza o atleta em qualquer linha a frente da defesa e o recoloca
 * numa vaga livre da linha de defesa (row 0). Retorna true se o recuo ocorreu.
 */
export const moveAthleteToDefense = (team: TeamDTO, athleteId: number): boolean => {
  for (let row = DEFENSE_ROW + 1; row < team.athletesPositions.length; row++) {
    const cols = team.athletesPositions[row];
    for (let col = 0; col < cols.length; col++) {
      const entry = cols[col];
      if (entry && entry.id === athleteId) {
        const defenseRow = team.athletesPositions[DEFENSE_ROW];
        const freeCol = defenseRow.findIndex((slot) => slot === null);
        if (freeCol === -1) {
          return false;
        }
        cols[col] = null;
        defenseRow[freeCol] = entry;
        return true;
      }
    }
  }
  return false;
};

/**
 * RN011 — aplica o recuo quando um atleta perde a posse na linha de ataque,
 * exceto se ele possui habilidade que ancora a posicao (holdsPosition).
 * Retorna true se houve recuo.
 */
export const retreatOnPossessionLoss = (
  team: TeamDTO,
  attacker: Athlete,
  ballRow: number
): boolean => {
  if (ballRow < ATTACK_ROW || attacker.holdsPosition) {
    return false;
  }
  return moveAthleteToDefense(team, attacker.id);
};
