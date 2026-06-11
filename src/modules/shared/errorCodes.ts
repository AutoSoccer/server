/**
 * Codigos de erro centralizados do server.
 *
 * Esta enumeracao reune todos os codes lancados pelas classes ServiceError
 * existentes (auth, equipe, itens, mercado, partida, ranking, simulador,
 * matchmaking, snapshot). Eles serao usados como chaves de i18n (WS-02) e
 * tambem alimentam a documentacao Swagger (WS-04).
 *
 * Mantemos os codes "legados" em SCREAMING_SNAKE_CASE (forma usada hoje pelas
 * classes existentes) para evitar quebrar contratos antes de WS-02. Os codes
 * novos adicionados nesta migracao (simulador.*) seguem o formato hierarquico
 * mencionado no plano (WS-01 -> WS-02).
 */
export const ErrorCode = {
  // Auth (ServiceError)
  Conflict: 'CONFLICT',
  InvalidCredentials: 'INVALID_CREDENTIALS',
  NotFound: 'NOT_FOUND',
  Forbidden: 'FORBIDDEN',

  // Equipe (EquipeServiceError)
  EquipeInsufficientCoins: 'INSUFFICIENT_COINS',
  EquipeTeamFull: 'TEAM_FULL',
  EquipeAthleteNotAvailable: 'ATHLETE_NOT_AVAILABLE',
  EquipeAthleteNotOwned: 'ATHLETE_NOT_OWNED',
  EquipeTeamNotFound: 'TEAM_NOT_FOUND',
  EquipeUserNotFound: 'USER_NOT_FOUND',

  // Itens (ItemServiceError)
  ItemUserNotFound: 'USER_NOT_FOUND',
  ItemNotFound: 'ITEM_NOT_FOUND',
  ItemInactive: 'ITEM_INACTIVE',
  ItemInsufficientCoins: 'INSUFFICIENT_COINS',
  ItemNoInventoryItem: 'NO_INVENTORY_ITEM',
  ItemNoSnapshot: 'NO_SNAPSHOT',
  ItemAthleteNotInSnapshot: 'ATHLETE_NOT_IN_SNAPSHOT',
  ItemStackNotAllowed: 'STACK_NOT_ALLOWED',

  // Mercado (MercadoServiceError)
  MercadoInsufficientCoins: 'INSUFFICIENT_COINS',
  MercadoUserNotFound: 'USER_NOT_FOUND',

  // Partida / Rodada (RodadaServiceError)
  RodadaTeamNotFound: 'TEAM_NOT_FOUND',
  RodadaTeamEmpty: 'TEAM_EMPTY',
  RodadaSnapshotNotFound: 'SNAPSHOT_NOT_FOUND',
  RodadaSnapshotForbidden: 'SNAPSHOT_FORBIDDEN',
  RodadaNoOpponentFound: 'NO_OPPONENT_FOUND',
  RodadaUserNotFound: 'USER_NOT_FOUND',

  // Partida / Campaign (CampaignServiceError)
  CampaignUserNotFound: 'USER_NOT_FOUND',
  CampaignInvalidTeamName: 'INVALID_TEAM_NAME',

  // Ranking (RankingServiceError)
  RankingUserNotFound: 'USER_NOT_FOUND',

  // Matchmaking (MatchmakingError)
  MatchmakingNoOpponentFound: 'NO_OPPONENT_FOUND',

  // Team Snapshot (TeamSnapshotError)
  SnapshotTeamNotFound: 'TEAM_NOT_FOUND',
  SnapshotInvalidBody: 'INVALID_BODY',
  SnapshotWrongAthleteCount: 'WRONG_ATHLETE_COUNT',
  SnapshotDuplicateAthlete: 'DUPLICATE_ATHLETE',
  SnapshotDuplicatePosition: 'DUPLICATE_POSITION',
  SnapshotOutOfBounds: 'OUT_OF_BOUNDS',
  SnapshotAthleteNotInTeam: 'ATHLETE_NOT_IN_TEAM',
  SnapshotItemNotInInventory: 'ITEM_NOT_IN_INVENTORY',

  // Simulador (SimuladorServiceError) — novos codes introduzidos em WS-01.
  SimuladorNoReceiverAvailable: 'NO_RECEIVER_AVAILABLE',
  SimuladorInvalidTotalTurns: 'INVALID_TOTAL_TURNS',
  SimuladorBallHolderNotFound: 'BALL_HOLDER_NOT_FOUND',

  // Config / boot
  ConfigMissingEnv: 'CONFIG_MISSING_ENV',
  ConfigInvalidEnv: 'CONFIG_INVALID_ENV',
  ConfigCorsWildcardInProduction: 'CONFIG_CORS_WILDCARD_IN_PRODUCTION'
} as const;

export type ErrorCodeKey = keyof typeof ErrorCode;
export type ErrorCodeValue = (typeof ErrorCode)[ErrorCodeKey];
