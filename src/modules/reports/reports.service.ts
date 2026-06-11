import { QueryTypes } from 'sequelize';

import { sequelize } from '../../config/database';

export type ReportsServiceErrorCode = 'INVALID_ROLE' | 'INVALID_LIMIT';

export type ReportsServiceErrorOptions = {
  i18nKey?: string;
  params?: Record<string, unknown>;
};

export class ReportsServiceError extends Error {
  public readonly code: ReportsServiceErrorCode;
  public readonly i18nKey: string;
  public readonly params?: Record<string, unknown>;

  constructor(code: ReportsServiceErrorCode, options: ReportsServiceErrorOptions = {}) {
    const i18nKey = options.i18nKey ?? `reports.errors.${code}`;
    super(i18nKey);
    this.name = 'ReportsServiceError';
    this.code = code;
    this.i18nKey = i18nKey;
    this.params = options.params;
  }
}

// Sincronizado com a migration `20260608170000-rework-athlete-types`: o enum
// `athletes.type` so aceita defender/midfielder/attacker apos o rework.
export const REPORT_ROLES = ['defender', 'midfielder', 'attacker'] as const;
export type ReportRole = (typeof REPORT_ROLES)[number];

const DEFAULT_TOP_LIMIT = 10;
const MAX_TOP_LIMIT = 100;
const DEFAULT_TEAM_LIMIT = 20;
const MAX_TEAM_LIMIT = 200;

export type TopAthlete = {
  id: number;
  name: string;
  role: string;
  tier: string;
  velocity: number;
  attack: number;
  defense: number;
  cost: number;
  power: number;
};

export type TopAthletesResponse = {
  role: ReportRole | null;
  limit: number;
  athletes: TopAthlete[];
};

export type TeamPowerEntry = {
  teamId: number;
  teamName: string;
  userId: number;
  userNickname: string;
  athleteCount: number;
  totalPower: number;
  avgPower: number;
  trophies: number;
  victory: number;
  defeat: number;
};

export type TeamPowerRankingResponse = {
  limit: number;
  teams: TeamPowerEntry[];
};

export type MarketTierBreakdown = {
  tier: string;
  athleteCount: number;
  avgCost: number;
  avgPower: number;
};

export type MarketRoleBreakdown = {
  role: string;
  athleteCount: number;
  avgCost: number;
  avgPower: number;
};

export type MarketOverviewResponse = {
  totals: {
    athletes: number;
    avgCost: number;
    avgPower: number;
    activeMarketSlots: number;
  };
  byTier: MarketTierBreakdown[];
  byRole: MarketRoleBreakdown[];
};

const normalizeRole = (raw: unknown): ReportRole | null => {
  if (raw === undefined || raw === null) {
    return null;
  }
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new ReportsServiceError('INVALID_ROLE', { params: { received: String(raw) } });
  }
  const normalized = raw.trim().toLowerCase();
  if (!(REPORT_ROLES as readonly string[]).includes(normalized)) {
    throw new ReportsServiceError('INVALID_ROLE', { params: { received: raw } });
  }
  return normalized as ReportRole;
};

const normalizeLimit = (raw: unknown, fallback: number, max: number): number => {
  if (raw === undefined || raw === null) {
    return fallback;
  }
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ReportsServiceError('INVALID_LIMIT', { params: { received: String(raw) } });
  }
  return Math.min(Math.max(1, Math.floor(parsed)), max);
};

const toNumber = (value: number | string | null | undefined): number =>
  value === null || value === undefined ? 0 : typeof value === 'number' ? value : Number(value);

const toRound = (value: number | string | null | undefined, decimals = 2): number => {
  const n = toNumber(value);
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
};

/**
 * mysql2 retorna `[rows, metadata]` para statements `CALL`. Quando o caller
 * usa `QueryTypes.RAW`, o sequelize devolve essa tupla intacta. Como nossas
 * procedures emitem apenas um `SELECT` (sem OUT params), o primeiro elemento
 * e o array de linhas — o segundo e o pacote OK do mysql.
 */
const extractDataset = <T>(rows: unknown): T[] => {
  const tuple = Array.isArray(rows) ? (rows as unknown[]) : [];
  return (Array.isArray(tuple[0]) ? tuple[0] : tuple) as T[];
};

type RawTopAthleteRow = {
  id: number | string;
  name: string;
  role: string;
  tier: string;
  velocity: number | string;
  attack: number | string;
  defense: number | string;
  cost: number | string;
  power: number | string;
};

/**
 * Top atletas por posicao (`role`) ordenados por poder bruto. Delega para a
 * stored procedure `sp_get_top_athletes_by_role` para que a heuristica de
 * ranking fique versionada no banco junto dos indices que a otimizam.
 */
export const getTopAthletesByRole = async (
  roleInput?: unknown,
  limitInput?: unknown
): Promise<TopAthletesResponse> => {
  const role = normalizeRole(roleInput);
  const limit = normalizeLimit(limitInput, DEFAULT_TOP_LIMIT, MAX_TOP_LIMIT);

  const rows = (await sequelize.query('CALL sp_get_top_athletes_by_role(:role, :limit)', {
    type: QueryTypes.RAW,
    replacements: { role, limit }
  })) as unknown;

  const dataset = extractDataset<RawTopAthleteRow>(rows);

  return {
    role,
    limit,
    athletes: dataset.map((row) => ({
      id: toNumber(row.id),
      name: row.name,
      role: row.role,
      tier: row.tier,
      velocity: toNumber(row.velocity),
      attack: toNumber(row.attack),
      defense: toNumber(row.defense),
      cost: toNumber(row.cost),
      power: toNumber(row.power)
    }))
  };
};

type RawTeamPowerRow = {
  team_id: number | string;
  team_name: string;
  user_id: number | string;
  user_nickname: string;
  athlete_count: number | string;
  total_power: number | string;
  avg_power: number | string;
  trophies: number | string;
  victory: number | string;
  defeat: number | string;
};

/**
 * Ranking das equipes ordenado pelo poder bruto somado dos atletas (vel +
 * atk + def). A agregacao roda na stored procedure `sp_team_power_ranking`,
 * que junta `teams`, `team_athletes` e `athletes` em um unico passo.
 */
export const getTeamPowerRanking = async (
  limitInput?: unknown
): Promise<TeamPowerRankingResponse> => {
  const limit = normalizeLimit(limitInput, DEFAULT_TEAM_LIMIT, MAX_TEAM_LIMIT);

  const rows = (await sequelize.query('CALL sp_team_power_ranking(:limit)', {
    type: QueryTypes.RAW,
    replacements: { limit }
  })) as unknown;

  const dataset = extractDataset<RawTeamPowerRow>(rows);

  return {
    limit,
    teams: dataset.map((row) => ({
      teamId: toNumber(row.team_id),
      teamName: row.team_name,
      userId: toNumber(row.user_id),
      userNickname: row.user_nickname,
      athleteCount: toNumber(row.athlete_count),
      totalPower: toNumber(row.total_power),
      avgPower: toRound(row.avg_power, 2),
      trophies: toNumber(row.trophies),
      victory: toNumber(row.victory),
      defeat: toNumber(row.defeat)
    }))
  };
};

type RawMarketTotalsRow = {
  athlete_count: number | string;
  avg_cost: number | string;
  avg_power: number | string;
  active_market_slots: number | string;
};

type RawMarketTierRow = {
  tier: string;
  athlete_count: number | string;
  avg_cost: number | string;
  avg_power: number | string;
};

type RawMarketRoleRow = {
  role: string;
  athlete_count: number | string;
  avg_cost: number | string;
  avg_power: number | string;
};

/**
 * Visao agregada do mercado: totais globais, breakdown por tier e por
 * posicao. Tres SELECTs sao emitidos pela stored procedure
 * `sp_market_overview` e consumidos abaixo na ordem em que retornam.
 */
export const getMarketOverview = async (): Promise<MarketOverviewResponse> => {
  const rows = (await sequelize.query('CALL sp_market_overview()', {
    type: QueryTypes.RAW
  })) as unknown;

  // Quando uma procedure emite varios SELECTs, mysql2 devolve um array de
  // arrays. O sequelize repassa essa estrutura em modo RAW.
  const buckets = Array.isArray(rows) ? (rows as unknown[]) : [];
  const totalsRows = (Array.isArray(buckets[0]) ? buckets[0] : []) as RawMarketTotalsRow[];
  const tierRows = (Array.isArray(buckets[1]) ? buckets[1] : []) as RawMarketTierRow[];
  const roleRows = (Array.isArray(buckets[2]) ? buckets[2] : []) as RawMarketRoleRow[];

  const totalsRow = totalsRows[0];

  return {
    totals: {
      athletes: toNumber(totalsRow?.athlete_count),
      avgCost: toRound(totalsRow?.avg_cost, 2),
      avgPower: toRound(totalsRow?.avg_power, 2),
      activeMarketSlots: toNumber(totalsRow?.active_market_slots)
    },
    byTier: tierRows.map((row) => ({
      tier: row.tier,
      athleteCount: toNumber(row.athlete_count),
      avgCost: toRound(row.avg_cost, 2),
      avgPower: toRound(row.avg_power, 2)
    })),
    byRole: roleRows.map((row) => ({
      role: row.role,
      athleteCount: toNumber(row.athlete_count),
      avgCost: toRound(row.avg_cost, 2),
      avgPower: toRound(row.avg_power, 2)
    }))
  };
};
