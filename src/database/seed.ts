import bcrypt from 'bcryptjs';

import {
  Ability,
  Athlete,
  ATHLETE_TIERS,
  ATHLETE_TYPES,
  Item,
  User
} from './models';

const TIER_COSTS: Record<(typeof ATHLETE_TIERS)[number], number> = {
  bronze: 50,
  silver: 120,
  gold: 250,
  epic: 500,
  legend: 1000
};

const TIER_STATS: Record<
  (typeof ATHLETE_TIERS)[number],
  { min: number; max: number }
> = {
  bronze: { min: 30, max: 55 },
  silver: { min: 50, max: 70 },
  gold: { min: 65, max: 80 },
  epic: { min: 75, max: 90 },
  legend: { min: 85, max: 99 }
};

const DEFAULT_ABILITIES = [
  { name: 'Chute Potente', description: 'Aumenta a forca de finalizacao em jogadas longas.' },
  { name: 'Drible Rapido', description: 'Permite ganhar espaco em duelos um contra um.' },
  { name: 'Defesa Solida', description: 'Reduz danos sofridos em disputas defensivas.' },
  { name: 'Visao de Jogo', description: 'Melhora a leitura de passes e o domínio de bola.' },
  { name: 'Velocidade Extrema', description: 'Aumenta a velocidade em arrancadas curtas.' }
];

const NAME_POOL = [
  'Marcelo',
  'Rafael',
  'Bruno',
  'Diego',
  'Fernando',
  'Carlos',
  'Eduardo',
  'Henrique',
  'Igor',
  'Joao',
  'Kaio',
  'Leandro',
  'Matheus',
  'Nelson',
  'Otavio',
  'Pedro',
  'Quintino',
  'Ricardo',
  'Samuel',
  'Tiago',
  'Vitor',
  'Wagner',
  'Yuri',
  'Bernardo',
  'Andre',
  'Caio',
  'Daniel',
  'Felipe',
  'Gabriel',
  'Lucas'
];

const DEFAULT_PASSWORD = '123456';

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
      coins: 1000
    });
  }
};

const randomBetween = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

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

export const seedDefaultAthletes = async (): Promise<void> => {
  const existingCount = await Athlete.count();
  if (existingCount > 0) {
    return;
  }

  const abilities = await seedDefaultAbilities();

  let nameIndex = 0;
  const pickName = (): string => {
    const base = NAME_POOL[nameIndex % NAME_POOL.length];
    const suffix = Math.floor(nameIndex / NAME_POOL.length);
    nameIndex += 1;
    return suffix === 0 ? base : `${base} ${suffix + 1}`;
  };

  const athletesToCreate: Array<{
    name: string;
    velocity: number;
    attack: number;
    defense: number;
    ability_id: number;
    tier: (typeof ATHLETE_TIERS)[number];
    type: (typeof ATHLETE_TYPES)[number];
    cost: number;
  }> = [];

  for (const tier of ATHLETE_TIERS) {
    for (const type of ATHLETE_TYPES) {
      const perBucket = tier === 'legend' ? 1 : tier === 'epic' ? 2 : 3;
      for (let i = 0; i < perBucket; i += 1) {
        const stats = TIER_STATS[tier];
        const ability = abilities[randomBetween(0, abilities.length - 1)];

        athletesToCreate.push({
          name: pickName(),
          velocity: randomBetween(stats.min, stats.max),
          attack: randomBetween(stats.min, stats.max),
          defense: randomBetween(stats.min, stats.max),
          ability_id: ability.id,
          tier,
          type,
          cost: TIER_COSTS[tier]
        });
      }
    }
  }

  await Athlete.bulkCreate(athletesToCreate);
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

export const runDatabaseSeeds = async (): Promise<void> => {
  await seedDefaultUsers();
  await seedDefaultAthletes();
  await seedDefaultItems();
};
