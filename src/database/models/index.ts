import { Ability } from './ability.model';
import { Athlete, ATHLETE_TIERS, ATHLETE_TYPES } from './athlete.model';
import { Item } from './item.model';
import { MarketWindow } from './market-window.model';
import { TeamAthlete } from './team-athlete.model';
import { TeamSnapshot } from './team-snapshot.model';
import { Team } from './team.model';
import { User } from './user.model';
import { UserItem } from './user-item.model';

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

Team.hasMany(TeamSnapshot, {
  foreignKey: 'team_id',
  as: 'snapshots'
});

TeamSnapshot.belongsTo(Team, {
  foreignKey: 'team_id',
  as: 'team'
});

User.hasMany(TeamSnapshot, {
  foreignKey: 'user_id',
  as: 'snapshots'
});

TeamSnapshot.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(UserItem, {
  foreignKey: 'user_id',
  as: 'inventory'
});

UserItem.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Item.hasMany(UserItem, {
  foreignKey: 'item_id',
  as: 'userItems'
});

UserItem.belongsTo(Item, {
  foreignKey: 'item_id',
  as: 'item'
});

export {
  Ability,
  Athlete,
  ATHLETE_TIERS,
  ATHLETE_TYPES,
  Item,
  MarketWindow,
  Team,
  TeamAthlete,
  TeamSnapshot,
  User,
  UserItem
};
