# Mapping i18n -> codigos de erro

Esta tabela mantem o mapeamento canonico entre os codes do enum
[`ErrorCode`](../src/modules/shared/errorCodes.ts), as classes de
`ServiceError` que os lancam e as chaves de i18n usadas pelo
[`errorHandler`](../src/plugins/errorHandler.ts) para traduzir o `message`
final da resposta.

> Convencao: a chave de fallback usada pelo handler e sempre
> `<namespace>.errors.<CODE>` (onde `<namespace>` vem do mapa
> `NAMESPACE_BY_ERROR_CLASS` no `errorHandler.ts`). Servicos podem indicar
> um `i18nKey` mais especifico (ex.: `equipe.buyAthlete.insufficientBalance`)
> para mensagens com contexto adicional.

## Como ler a tabela

- **ErrorCode**: nome no enum em `src/modules/shared/errorCodes.ts`.
- **Code string**: valor SCREAMING_SNAKE_CASE retornado no payload `{ code }`.
- **Classe**: ServiceError concreto que lanca o erro.
- **HTTP**: status mapeado em `STATUS_BY_KEY` (`errorHandler.ts`).
- **Chave i18n (fallback)**: chave consultada pelo handler quando o servico
  nao define `i18nKey`.
- **Chaves i18n especificas**: usadas via `i18nKey` em fluxos com mensagem
  contextual (todas tambem precisam existir em `pt-BR` e `en`).

## Namespace: `auth`

| ErrorCode | Code string | Classe | HTTP | Chave i18n (fallback) |
| --- | --- | --- | --- | --- |
| `Conflict` | `CONFLICT` | `AuthServiceError` | 409 | `auth.errors.CONFLICT` |
| `InvalidCredentials` | `INVALID_CREDENTIALS` | `AuthServiceError` | 401 | `auth.errors.INVALID_CREDENTIALS` |
| `NotFound` | `NOT_FOUND` | `AuthServiceError` | 404 | `auth.errors.NOT_FOUND` |
| `Forbidden` | `FORBIDDEN` | `AuthServiceError` | 403 | `auth.errors.FORBIDDEN` |

Chaves especificas usadas pelos fluxos:

- `auth.tokenMissing`, `auth.tokenInvalid`
- `auth.forbidden` (usada pelo `requireRole` com param `{{role}}`)
- `auth.register.nameRequired`, `auth.register.fieldInUse`, `auth.register.uniqueConstraint`
- `auth.guest.createFailed`
- `auth.me.userNotFound`
- `auth.login.invalidCredentials`

## Namespace: `mercado`

| ErrorCode | Code string | Classe | HTTP | Chave i18n (fallback) |
| --- | --- | --- | --- | --- |
| `MercadoUserNotFound` | `USER_NOT_FOUND` | `MercadoServiceError` | 404 | `mercado.errors.USER_NOT_FOUND` |
| `MercadoInsufficientCoins` | `INSUFFICIENT_COINS` | `MercadoServiceError` | 400 | `mercado.errors.INSUFFICIENT_COINS` |

Chaves especificas: `mercado.refresh.userNotFound`,
`mercado.refresh.insufficientBalance`, `mercado.get.userNotFound`.

## Namespace: `equipe`

| ErrorCode | Code string | Classe | HTTP | Chave i18n (fallback) |
| --- | --- | --- | --- | --- |
| `EquipeUserNotFound` | `USER_NOT_FOUND` | `EquipeServiceError` | 404 | `equipe.errors.USER_NOT_FOUND` |
| `EquipeTeamNotFound` | `TEAM_NOT_FOUND` | `EquipeServiceError` | 404 | `equipe.errors.TEAM_NOT_FOUND` |
| `EquipeAthleteNotAvailable` | `ATHLETE_NOT_AVAILABLE` | `EquipeServiceError` | 404 | `equipe.errors.ATHLETE_NOT_AVAILABLE` |
| `EquipeAthleteNotOwned` | `ATHLETE_NOT_OWNED` | `EquipeServiceError` | 404 | `equipe.errors.ATHLETE_NOT_OWNED` |
| `EquipeInsufficientCoins` | `INSUFFICIENT_COINS` | `EquipeServiceError` | 400 | `equipe.errors.INSUFFICIENT_COINS` |
| `EquipeTeamFull` | `TEAM_FULL` | `EquipeServiceError` | 400 | `equipe.errors.TEAM_FULL` |

Chaves contextuais: `equipe.buyAthlete.*`, `equipe.sellAthlete.*`.

## Namespace: `equipe` (TeamSnapshotError)

| ErrorCode | Code string | Classe | HTTP | Chave i18n (fallback) |
| --- | --- | --- | --- | --- |
| `SnapshotTeamNotFound` | `TEAM_NOT_FOUND` | `TeamSnapshotError` | 404 | `equipe.errors.TEAM_NOT_FOUND` |
| `SnapshotInvalidBody` | `INVALID_BODY` | `TeamSnapshotError` | 400 | `equipe.errors.INVALID_BODY` |
| `SnapshotWrongAthleteCount` | `WRONG_ATHLETE_COUNT` | `TeamSnapshotError` | 400 | `equipe.errors.WRONG_ATHLETE_COUNT` |
| `SnapshotDuplicateAthlete` | `DUPLICATE_ATHLETE` | `TeamSnapshotError` | 400 | `equipe.errors.DUPLICATE_ATHLETE` |
| `SnapshotDuplicatePosition` | `DUPLICATE_POSITION` | `TeamSnapshotError` | 400 | `equipe.errors.DUPLICATE_POSITION` |
| `SnapshotOutOfBounds` | `OUT_OF_BOUNDS` | `TeamSnapshotError` | 400 | `equipe.errors.OUT_OF_BOUNDS` |
| `SnapshotAthleteNotInTeam` | `ATHLETE_NOT_IN_TEAM` | `TeamSnapshotError` | 400 | `equipe.errors.ATHLETE_NOT_IN_TEAM` |
| `SnapshotItemNotInInventory` | `ITEM_NOT_IN_INVENTORY` | `TeamSnapshotError` | 400 | `equipe.errors.ITEM_NOT_IN_INVENTORY` |

Chaves contextuais: `equipe.snapshot.*` (com sub-chaves `invalidBody.*`,
`outOfBounds`, `wrongAthleteCount`, `duplicateAthlete`, etc.).

## Namespace: `itens`

| ErrorCode | Code string | Classe | HTTP | Chave i18n (fallback) |
| --- | --- | --- | --- | --- |
| `ItemUserNotFound` | `USER_NOT_FOUND` | `ItemServiceError` | 404 | `itens.errors.USER_NOT_FOUND` |
| `ItemNotFound` | `ITEM_NOT_FOUND` | `ItemServiceError` | 404 | `itens.errors.ITEM_NOT_FOUND` |
| `ItemInactive` | `ITEM_INACTIVE` | `ItemServiceError` | 400 | `itens.errors.ITEM_INACTIVE` |
| `ItemInsufficientCoins` | `INSUFFICIENT_COINS` | `ItemServiceError` | 400 | `itens.errors.INSUFFICIENT_COINS` |
| `ItemNoInventoryItem` | `NO_INVENTORY_ITEM` | `ItemServiceError` | 400 | `itens.errors.NO_INVENTORY_ITEM` |
| `ItemNoSnapshot` | `NO_SNAPSHOT` | `ItemServiceError` | 400 | `itens.errors.NO_SNAPSHOT` |
| `ItemAthleteNotInSnapshot` | `ATHLETE_NOT_IN_SNAPSHOT` | `ItemServiceError` | 400 | `itens.errors.ATHLETE_NOT_IN_SNAPSHOT` |
| `ItemStackNotAllowed` | `STACK_NOT_ALLOWED` | `ItemServiceError` | 400 | `itens.errors.STACK_NOT_ALLOWED` |

Chaves contextuais: `itens.buy.*`, `itens.apply.*` e
`itens.catalog.<slug>.{name,description}` para nomes localizados.

## Namespace: `partida`

| ErrorCode | Code string | Classe | HTTP | Chave i18n (fallback) |
| --- | --- | --- | --- | --- |
| `RodadaTeamNotFound` | `TEAM_NOT_FOUND` | `RodadaServiceError` | 404 | `partida.errors.TEAM_NOT_FOUND` |
| `RodadaSnapshotNotFound` | `SNAPSHOT_NOT_FOUND` | `RodadaServiceError` | 404 | `partida.errors.SNAPSHOT_NOT_FOUND` |
| `RodadaUserNotFound` | `USER_NOT_FOUND` | `RodadaServiceError` | 404 | `partida.errors.USER_NOT_FOUND` |
| `RodadaSnapshotForbidden` | `SNAPSHOT_FORBIDDEN` | `RodadaServiceError` | 403 | `partida.errors.SNAPSHOT_FORBIDDEN` |
| `RodadaTeamEmpty` | `TEAM_EMPTY` | `RodadaServiceError` | 400 | `partida.errors.TEAM_EMPTY` |
| `RodadaNoOpponentFound` | `NO_OPPONENT_FOUND` | `RodadaServiceError` | 400 | `partida.errors.NO_OPPONENT_FOUND` |
| `CampaignUserNotFound` | `USER_NOT_FOUND` | `CampaignServiceError` | 404 | `partida.errors.USER_NOT_FOUND` |
| `CampaignInvalidTeamName` | `INVALID_TEAM_NAME` | `CampaignServiceError` | 400 | `partida.errors.INVALID_TEAM_NAME` |
| `MatchmakingNoOpponentFound` | `NO_OPPONENT_FOUND` | `MatchmakingError` | 400 | `partida.errors.NO_OPPONENT_FOUND` |

Chaves contextuais: `partida.rodada.*`, `partida.campaign.*`,
`partida.matchmaking.*`.

## Namespace: `ranking`

| ErrorCode | Code string | Classe | HTTP | Chave i18n (fallback) |
| --- | --- | --- | --- | --- |
| `RankingUserNotFound` | `USER_NOT_FOUND` | `RankingServiceError` | 404 | `ranking.errors.USER_NOT_FOUND` |

Chave contextual: `ranking.userNotFound`.

## Namespace: `simulador`

| ErrorCode | Code string | Classe | HTTP | Chave i18n (fallback) |
| --- | --- | --- | --- | --- |
| `SimuladorInvalidTotalTurns` | `INVALID_TOTAL_TURNS` | `SimuladorServiceError` | 400 | `simulador.errors.INVALID_TOTAL_TURNS` |
| `SimuladorNoReceiverAvailable` | `NO_RECEIVER_AVAILABLE` | `SimuladorServiceError` | 500 | `simulador.errors.NO_RECEIVER_AVAILABLE` |
| `SimuladorBallHolderNotFound` | `BALL_HOLDER_NOT_FOUND` | `SimuladorServiceError` | 500 | `simulador.errors.BALL_HOLDER_NOT_FOUND` |

Chaves contextuais: `simulador.noReceiverAvailable`,
`simulador.invalidTotalTurns`, `simulador.ballHolderNotFound`.

## Erros de config / boot

| ErrorCode | Code string | Classe | HTTP | Observacao |
| --- | --- | --- | --- | --- |
| `ConfigMissingEnv` | `CONFIG_MISSING_ENV` | `ConfigError` | n/a | Lancado antes do app subir; nao chega no handler. |
| `ConfigInvalidEnv` | `CONFIG_INVALID_ENV` | `ConfigError` | n/a | Idem. |

## Erros do Fastify / fallback global

O handler tambem cobre:

- **Validation errors** do `Ajv` (rota com `schema`): code `VALIDATION_ERROR`,
  status preservado (`error.statusCode`), mensagem traduzida via
  `common.validationError`, `details` com o array de validacoes.
- **Fastify internals** (`FST_*`): mantem `error.code` e `error.message`
  originais com o `statusCode` do Fastify.
- **Erros nao tratados**: retornam 500 `INTERNAL_ERROR` com mensagem de
  `common.internalError`.

## Como adicionar um novo erro

1. Crie a constante no enum
   [`ErrorCode`](../src/modules/shared/errorCodes.ts) seguindo o padrao
   `<NamespacePascal><PropriedadePascal>` + valor SCREAMING_SNAKE_CASE.
2. Adicione a chave `errors.<CODE>` no namespace correto, em **pt-BR** e
   **en** (`yarn i18n:check` falha se faltar paridade).
3. Mapeie o status HTTP em `STATUS_BY_KEY` no
   [`errorHandler`](../src/plugins/errorHandler.ts).
4. Lance `throw new <ClasseServiceError>(ErrorCode.MeuCode, params)` no
   service (status vem do mapping; nao precisa repetir).
5. Atualize esta tabela.
