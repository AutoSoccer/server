import bcrypt from 'bcryptjs';

import { SeedError } from '../modules/shared/seedError';
import {
  Ability,
  Athlete,
  ATHLETE_TIERS,
  ATHLETE_TYPES,
  Item,
  Team,
  TeamAthlete,
  TeamSnapshot,
  User,
  UserItem
} from './models';
import type {
  SnapshotAthlete,
  SnapshotPositions
} from './models/team-snapshot.model';

/** Saldo inicial padrao de coins para usuarios (RF010). */
const DEFAULT_COINS = 10;

/** Custo fixo de atleta (economia original). */
const ATHLETE_COST = 3;

type AthleteTier = (typeof ATHLETE_TIERS)[number];
type AthleteType = (typeof ATHLETE_TYPES)[number];

type CuratedPlayer = {
  name: string;
  type: AthleteType;
  tier: AthleteTier;
};

const TIER_BASE_STATS: Record<AthleteTier, number> = {
  bronze: 50,
  silver: 63,
  gold: 75,
  epic: 86,
  legend: 93
};

const POSITION_STAT_OFFSETS: Record<
  AthleteType,
  { velocity: number; attack: number; defense: number }
> = {
  defender: { velocity: -2, attack: -10, defense: 12 },
  midfielder: { velocity: 1, attack: 4, defense: 4 },
  attacker: { velocity: 10, attack: 12, defense: -8 }
};

const ABILITY_BY_TYPE: Record<AthleteType, string> = {
  defender: 'Defesa Solida',
  midfielder: 'Visao de Jogo',
  attacker: 'Chute Potente'
};

const DEFAULT_ABILITIES = [
  { name: 'Chute Potente', description: 'Aumenta a forca de finalizacao em jogadas longas.' },
  { name: 'Drible Rapido', description: 'Permite ganhar espaco em duelos um contra um.' },
  { name: 'Defesa Solida', description: 'Reduz danos sofridos em disputas defensivas.' },
  { name: 'Visao de Jogo', description: 'Melhora a leitura de passes e o domínio de bola.' },
  { name: 'Velocidade Extrema', description: 'Aumenta a velocidade em arrancadas curtas.' }
];

const DEFAULT_PASSWORD = '123456';

const CURATED_PLAYER_POOL: CuratedPlayer[] = [
  { name: 'Marquinhos', type: 'defender', tier: 'legend' },
  { name: 'Gabriel Magalhaes', type: 'defender', tier: 'epic' },
  { name: 'Bremer', type: 'defender', tier: 'gold' },
  { name: 'Ibanez', type: 'defender', tier: 'gold' },
  { name: 'Leo Pereira', type: 'defender', tier: 'gold' },
  { name: 'Wesley', type: 'defender', tier: 'silver' },
  { name: 'Alex Sandro', type: 'defender', tier: 'gold' },
  { name: 'Douglas Santos', type: 'defender', tier: 'silver' },
  { name: 'Danilo', type: 'defender', tier: 'gold' },
  { name: 'Casemiro', type: 'midfielder', tier: 'legend' },
  { name: 'Bruno Guimaraes', type: 'midfielder', tier: 'epic' },
  { name: 'Danilo Santos', type: 'midfielder', tier: 'gold' },
  { name: 'Lucas Paqueta', type: 'midfielder', tier: 'epic' },
  { name: 'Fabinho', type: 'midfielder', tier: 'gold' },
  { name: 'Raphinha', type: 'attacker', tier: 'legend' },
  { name: 'Vinicius Junior', type: 'attacker', tier: 'legend' },
  { name: 'Luiz Henrique', type: 'attacker', tier: 'epic' },
  { name: 'Gabriel Martinelli', type: 'attacker', tier: 'epic' },
  { name: 'Neymar', type: 'attacker', tier: 'legend' },
  { name: 'Endrick', type: 'attacker', tier: 'gold' },
  { name: 'Matheus Cunha', type: 'attacker', tier: 'epic' },
  { name: 'Rayan', type: 'attacker', tier: 'gold' },
  { name: 'Igor Thiago', type: 'attacker', tier: 'gold' },
  { name: 'Benedetti', type: 'defender', tier: 'bronze' },
  { name: 'Bruno Fuchs', type: 'defender', tier: 'silver' },
  { name: 'Gustavo Gomez', type: 'defender', tier: 'epic' },
  { name: 'Murilo', type: 'defender', tier: 'gold' },
  { name: 'Agustin Giay', type: 'defender', tier: 'silver' },
  { name: 'Khellven', type: 'defender', tier: 'silver' },
  { name: 'Arthur', type: 'defender', tier: 'bronze' },
  { name: 'Jefte', type: 'defender', tier: 'silver' },
  { name: 'Joaquin Piquerez', type: 'defender', tier: 'gold' },
  { name: 'Andreas Pereira', type: 'midfielder', tier: 'gold' },
  { name: 'Emiliano Martinez', type: 'midfielder', tier: 'silver' },
  { name: 'Felipe Anderson', type: 'midfielder', tier: 'gold' },
  { name: 'Figueiredo', type: 'midfielder', tier: 'bronze' },
  { name: 'Larson', type: 'midfielder', tier: 'bronze' },
  { name: 'Lucas Evangelista', type: 'midfielder', tier: 'silver' },
  { name: 'Marlon Freitas', type: 'midfielder', tier: 'gold' },
  { name: 'Mauricio', type: 'midfielder', tier: 'gold' },
  { name: 'Allan', type: 'attacker', tier: 'silver' },
  { name: 'Jhon Arias', type: 'attacker', tier: 'epic' },
  { name: 'Lopez', type: 'attacker', tier: 'gold' },
  { name: 'Luighi', type: 'attacker', tier: 'bronze' },
  { name: 'Paulinho', type: 'attacker', tier: 'gold' },
  { name: 'Ramon Sosa', type: 'attacker', tier: 'gold' },
  { name: 'Vitor Roque', type: 'attacker', tier: 'epic' }
];

const BOT_OPPONENTS = [
  {
    email: 'bot.canela@autosoccer.local',
    name: 'Bot Canela Nervosa',
    nickname: 'bot_canela',
    teamName: 'Canela Nervosa FC'
  },
  {
    email: 'bot.retranca@autosoccer.local',
    name: 'Bot Retranca de Gravata',
    nickname: 'bot_retranca',
    teamName: 'Retranca de Gravata'
  },
  {
    email: 'bot.planilha@autosoccer.local',
    name: 'Bot Planilha do Contra',
    nickname: 'bot_planilha',
    teamName: 'Planilha do Contra'
  },
  {
    email: 'bot.bicuda@autosoccer.local',
    name: 'Bot Professor Bicuda',
    nickname: 'bot_bicuda',
    teamName: 'Professor Bicuda FC'
  },
  {
    email: 'bot.tabelinha@autosoccer.local',
    name: 'Bot Tabelinha Caotica',
    nickname: 'bot_tabelinha',
    teamName: 'Tabelinha Caotica'
  },
  {
    email: 'bot.cafe@autosoccer.local',
    name: 'Bot Ataque do Cafe',
    nickname: 'bot_cafe',
    teamName: 'Ataque do Cafe'
  },
  {
    email: 'bot.zap@autosoccer.local',
    name: 'Bot Zaga do Zap',
    nickname: 'bot_zap',
    teamName: 'Zaga do Zap'
  },
  {
    email: 'bot.pantufa@autosoccer.local',
    name: 'Bot Drible de Pantufa',
    nickname: 'bot_pantufa',
    teamName: 'Drible de Pantufa'
  },
  {
    email: 'bot.escanteio@autosoccer.local',
    name: 'Bot Escanteio Curto',
    nickname: 'bot_escanteio',
    teamName: 'Escanteio Curto'
  },
  {
    email: 'bot.meiaboca@autosoccer.local',
    name: 'Bot Meia Boca',
    nickname: 'bot_meiaboca',
    teamName: 'Meia Boca FC'
  }
] as const;

const DEFAULT_USERS = [
  {
    email: 'lucas@gmail.com',
    name: 'Lucas Stopinski',
    nickname: 'lucas',
    phone_number: '11900000001'
  },
  {
    email: 'robson@gmail.com',
    name: 'Robson Souza',
    nickname: 'robson',
    phone_number: '11900000002'
  },
  {
    email: 'pedro@gmail.com',
    name: 'Pedro Lima',
    nickname: 'pedro',
    phone_number: '11900000003'
  }
] as const;

export const seedDefaultUsers = async (): Promise<void> => {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const userData of DEFAULT_USERS) {
    const existing = await User.findOne({ where: { email: userData.email } });

    if (existing) {
      continue;
    }

    await User.create({
      name: userData.name,
      nickname: userData.nickname,
      email: userData.email,
      phone_number: userData.phone_number,
      hashed_password: hashedPassword,
      victory: 0,
      defeat: 0,
      trophies: 0,
      coins: DEFAULT_COINS
    });
  }
};

export const seedDefaultAbilities = async (): Promise<Ability[]> => {
  const abilities: Ability[] = [];
  for (const data of DEFAULT_ABILITIES) {
    const [ability] = await Ability.findOrCreate({
      where: { name: data.name },
      defaults: {
        name: data.name,
        description: data.description,
        is_active: true
      }
    });
    abilities.push(ability);
  }
  return abilities;
};

const clampStat = (value: number): number => Math.max(30, Math.min(99, value));

const nameHash = (value: string): number =>
  value.split('').reduce((total, char) => total + char.charCodeAt(0), 0);

const statsForPlayer = (
  player: CuratedPlayer
): { velocity: number; attack: number; defense: number } => {
  const base = TIER_BASE_STATS[player.tier];
  const offsets = POSITION_STAT_OFFSETS[player.type];
  const hash = nameHash(player.name);

  return {
    velocity: clampStat(base + offsets.velocity + (hash % 7) - 3),
    attack: clampStat(base + offsets.attack + (hash % 9) - 4),
    defense: clampStat(base + offsets.defense + (hash % 11) - 5)
  };
};

const createAbilityMap = (abilities: Ability[]): Map<string, Ability> =>
  new Map(abilities.map((ability) => [ability.name, ability]));

export const seedDefaultAthletes = async (): Promise<void> => {
  const abilities = await seedDefaultAbilities();
  const abilityByName = createAbilityMap(abilities);

  for (const player of CURATED_PLAYER_POOL) {
    const ability =
      abilityByName.get(ABILITY_BY_TYPE[player.type]) ?? abilities[0];
    const stats = statsForPlayer(player);
    const existing = await Athlete.findOne({ where: { name: player.name } });

    if (existing) {
      await existing.update({
        ...stats,
        ability_id: ability.id,
        tier: player.tier,
        type: player.type,
        cost: ATHLETE_COST
      });
      continue;
    }

    await Athlete.create({
      name: player.name,
      ...stats,
      ability_id: ability.id,
      tier: player.tier,
      type: player.type,
      cost: ATHLETE_COST
    });
  }
};

const DEFAULT_ITEMS = [
  {
    name: 'Chuteira de Ouro',
    description: 'Aumenta a forca de finalizacao do atleta.',
    modifier_attack: 12,
    modifier_defense: 0,
    modifier_velocity: 0,
    cost: 150,
    stackable: false
  },
  {
    name: 'Luvas Reforcadas',
    description: 'Reforca a defesa do atleta.',
    modifier_attack: 0,
    modifier_defense: 12,
    modifier_velocity: 0,
    cost: 150,
    stackable: false
  },
  {
    name: 'Tornozeleira Leve',
    description: 'Ganho de velocidade nas arrancadas.',
    modifier_attack: 0,
    modifier_defense: 0,
    modifier_velocity: 12,
    cost: 150,
    stackable: false
  },
  {
    name: 'Energetico',
    description: 'Pequeno bonus geral; pode ser empilhado.',
    modifier_attack: 5,
    modifier_defense: 5,
    modifier_velocity: 5,
    cost: 100,
    stackable: true
  },
  {
    name: 'Faixa de Capitao',
    description: 'Inspira o atleta: ataque e defesa.',
    modifier_attack: 6,
    modifier_defense: 6,
    modifier_velocity: 0,
    cost: 200,
    stackable: false
  }
] as const;

export const seedDefaultItems = async (): Promise<void> => {
  for (const data of DEFAULT_ITEMS) {
    await Item.findOrCreate({
      where: { name: data.name },
      defaults: { ...data, is_active: true }
    });
  }
};

type AthleteBuckets = Record<AthleteType, Athlete[]>;

const createAthleteBuckets = (athletes: Athlete[]): AthleteBuckets => ({
  defender: athletes.filter((athlete) => athlete.type === 'defender'),
  midfielder: athletes.filter((athlete) => athlete.type === 'midfielder'),
  attacker: athletes.filter((athlete) => athlete.type === 'attacker')
});

const CURATED_PLAYER_NAMES = new Set(
  CURATED_PLAYER_POOL.map((player) => player.name)
);

const createCuratedAthleteBuckets = (athletes: Athlete[]): AthleteBuckets =>
  createAthleteBuckets(
    athletes.filter((athlete) => CURATED_PLAYER_NAMES.has(athlete.name))
  );

const emptySnapshotPositions = (): SnapshotPositions =>
  Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => null as SnapshotAthlete | null)
  );

const toSnapshotAthlete = (athlete: Athlete): SnapshotAthlete => ({
  id: athlete.id,
  name: athlete.name,
  velocity: athlete.velocity,
  attack: athlete.attack,
  defense: athlete.defense,
  type: athlete.type
});

export type BotFormationSlot = {
  type: AthleteType;
  row: number;
  col: number;
};

const FORMATION_ROWS: Array<{ type: AthleteType; row: number }> = [
  { type: 'defender', row: 0 },
  { type: 'midfielder', row: 1 },
  { type: 'attacker', row: 2 }
];

export const botAthleteCountForRound = (round: number): 3 | 6 =>
  round <= 1 ? 3 : 6;

export const buildBotFormation = (
  seed: number,
  athleteCount: 3 | 6 = 6
): BotFormationSlot[] => {
  const normalizedSeed = Math.abs(Math.trunc(seed));

  return FORMATION_ROWS.flatMap(({ type, row }, rowIndex) => {
    const selectedColumn = Math.floor(normalizedSeed / 3 ** rowIndex) % 3;
    const columns =
      athleteCount === 3
        ? [selectedColumn]
        : [0, 1, 2].filter((col) => col !== selectedColumn);

    return columns.map((col) => ({ type, row, col }));
  });
};

const buildBotPositions = (
  byType: AthleteBuckets,
  seed: number,
  athleteCount: 3 | 6
): SnapshotPositions => {
  const grid = emptySnapshotPositions();
  const cursor: Record<AthleteType, number> = {
    defender: seed * 2,
    midfielder: seed * 2,
    attacker: seed * 2
  };

  for (const slot of buildBotFormation(seed, athleteCount)) {
    const pool = byType[slot.type];
    if (pool.length === 0) {
      throw new SeedError(
        'SEED_DATA_INVARIANT',
        `Nao ha atletas do tipo ${slot.type} para popular bots.`
      );
    }

    const athlete = pool[cursor[slot.type] % pool.length];
    cursor[slot.type] += 1;
    grid[slot.row][slot.col] = toSnapshotAthlete(athlete);
  }

  return grid;
};

const computeSnapshotVictoryRatio = (victory: number, lose: number, draw = 0): number => {
  const total = victory + lose + draw;
  return total <= 0 ? 0 : victory / total;
};

type CampaignState = {
  victory: number;
  lose: number;
  draw: number;
};

const buildCampaignStates = (): CampaignState[] => {
  const states: CampaignState[] = [];
  for (let victory = 0; victory < 10; victory += 1) {
    for (let lose = 0; lose < 5; lose += 1) {
      states.push({ victory, lose, draw: 0 });
    }
  }
  return states;
};

type BotRecord = {
  user: User;
  team: Team;
};

const ensureBotTeams = async (hashedPassword: string): Promise<BotRecord[]> => {
  const bots: BotRecord[] = [];

  for (const bot of BOT_OPPONENTS) {
    const [user] = await User.findOrCreate({
      where: { email: bot.email },
      defaults: {
        name: bot.name,
        nickname: bot.nickname,
        email: bot.email,
        phone_number: null,
        hashed_password: hashedPassword,
        victory: 0,
        defeat: 0,
        trophies: 0,
        coins: DEFAULT_COINS,
        is_guest: true
      }
    });

    if (user.name !== bot.name || user.nickname !== bot.nickname || !user.is_guest) {
      await user.update({
        name: bot.name,
        nickname: bot.nickname,
        is_guest: true
      });
    }

    let team = await Team.findOne({
      where: { user_id: user.id },
      order: [['id', 'ASC']]
    });

    if (!team) {
      team = await Team.create({
        user_id: user.id,
        name: bot.teamName,
        round: 1,
        victory: 0,
        lose: 0,
        draw: 0
      });
    } else if (team.name !== bot.teamName) {
      await team.update({ name: bot.teamName });
    }

    bots.push({ user, team });
  }

  return bots;
};

export const seedBotOpponents = async (): Promise<void> => {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const bots = await ensureBotTeams(hashedPassword);
  const athletes = await Athlete.findAll({ order: [['id', 'ASC']] });
  const byType = createCuratedAthleteBuckets(athletes);
  const states = buildCampaignStates();
  const existingByTeam = new Map<number, Map<string, TeamSnapshot>>();

  for (const bot of bots) {
    const existingSnapshots = await TeamSnapshot.findAll({
      where: { team_id: bot.team.id },
      order: [['id', 'ASC']]
    });
    existingByTeam.set(
      bot.team.id,
      new Map(
        existingSnapshots.map(
          (snapshot) => [
            `${snapshot.victory}:${snapshot.lose}:${snapshot.draw}`,
            snapshot
          ]
        )
      )
    );
  }

  for (let index = 0; index < states.length; index += 1) {
    const state = states[index];
    const bot = bots[index % bots.length];
    const key = `${state.victory}:${state.lose}:${state.draw}`;
    const existing = existingByTeam.get(bot.team.id) ?? new Map<string, TeamSnapshot>();
    const round = state.victory + state.lose + state.draw + 1;
    const snapshotData = {
      round,
      victory: state.victory,
      lose: state.lose,
      draw: state.draw,
      victory_ratio: computeSnapshotVictoryRatio(
        state.victory,
        state.lose,
        state.draw
      ),
      positions: buildBotPositions(
        byType,
        index,
        botAthleteCountForRound(round)
      )
    };
    const existingSnapshot = existing.get(key);

    if (existingSnapshot) {
      await TeamSnapshot.update(snapshotData, {
        where: { id: existingSnapshot.id }
      });
      continue;
    }

    const createdSnapshot = await TeamSnapshot.create({
      team_id: bot.team.id,
      user_id: bot.user.id,
      ...snapshotData
    });

    existing.set(key, createdSnapshot);
    existingByTeam.set(bot.team.id, existing);
  }
};

/**
 * Deixa os usuarios padrao prontos para jogar: cada um recebe um time montado
 * com 6 atletas (2 defensores, 2 meias, 2 atacantes) e 3 itens no inventario.
 * Idempotente: so monta o time/itens de quem ainda nao os possui, e cada
 * usuario recebe atletas distintos (cursores por tipo).
 */
export const seedReadyTeams = async (): Promise<void> => {
  const athletes = await Athlete.findAll({ order: [['id', 'ASC']] });
  const byType = createCuratedAthleteBuckets(athletes);
  const items = await Item.findAll({ order: [['id', 'ASC']] });

  // Cursores para nao repetir o mesmo atleta entre usuarios.
  const cursor: Record<AthleteType, number> = {
    defender: 0,
    midfielder: 0,
    attacker: 0
  };
  const take = (type: AthleteType): Athlete | undefined =>
    byType[type][cursor[type]++];

  // Composicao 2 DEF + 2 MID + 2 ATK = 6 atletas (TEAM_MAX).
  const composition: AthleteType[] = [
    'defender',
    'defender',
    'midfielder',
    'midfielder',
    'attacker',
    'attacker'
  ];

  for (const userData of DEFAULT_USERS) {
    const user = await User.findOne({ where: { email: userData.email } });
    if (!user) {
      continue;
    }

    // Time com 6 atletas (so monta se ainda nao houver atletas no time).
    let team = await Team.findOne({ where: { user_id: user.id } });
    if (!team) {
      team = await Team.create({
        user_id: user.id,
        name: `Equipe ${userData.name.split(' ')[0]}`,
        round: 1,
        victory: 0,
        lose: 0,
        draw: 0
      });
    }

    const athleteCount = await TeamAthlete.count({ where: { team_id: team.id } });
    if (athleteCount === 0) {
      for (const type of composition) {
        const athlete = take(type);
        if (athlete) {
          await TeamAthlete.create({ team_id: team.id, athlete_id: athlete.id });
        }
      }
    }

    // Inventario com 3 itens nao consumidos (so se o usuario ainda nao tem itens).
    const itemCount = await UserItem.count({ where: { user_id: user.id } });
    if (itemCount === 0) {
      for (const item of items.slice(0, 3)) {
        await UserItem.create({
          user_id: user.id,
          item_id: item.id,
          consumed: false
        });
      }
    }
  }
};

export const runDatabaseSeeds = async (): Promise<void> => {
  await seedDefaultUsers();
  await seedDefaultAthletes();
  await seedDefaultItems();
  await seedReadyTeams();
  await seedBotOpponents();
};
