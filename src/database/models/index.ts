import { Ability } from './ability.model';
import { Athlete, ATHLETE_TIERS, ATHLETE_TYPES } from './athlete.model';
import { MarketWindow } from './market-window.model';
import { TeamAthlete } from './team-athlete.model';
import { Team } from './team.model';
import { User } from './user.model';

Ability.hasMany(Athlete, {
  foreignKey: 'ability_id',
  as: 'athletes'
});

Athlete.belongsTo(Ability, {
  foreignKey: 'ability_id',
  as: 'ability'
});

User.hasMany(Team, {
  foreignKey: 'user_id',
  as: 'teams'
});

Team.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Team.belongsToMany(Athlete, {
  through: TeamAthlete,
  foreignKey: 'team_id',
  otherKey: 'athlete_id',
  as: 'athletes'
});

Athlete.belongsToMany(Team, {
  through: TeamAthlete,
  foreignKey: 'athlete_id',
  otherKey: 'team_id',
  as: 'teams'
});

User.hasMany(MarketWindow, {
  foreignKey: 'user_id',
  as: 'marketWindow'
});

MarketWindow.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Athlete.hasMany(MarketWindow, {
  foreignKey: 'athlete_id',
  as: 'marketEntries'
});

MarketWindow.belongsTo(Athlete, {
  foreignKey: 'athlete_id',
  as: 'athlete'
});

export {
  Ability,
  Athlete,
  ATHLETE_TIERS,
  ATHLETE_TYPES,
  MarketWindow,
  Team,
  TeamAthlete,
  User
};
