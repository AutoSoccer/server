# Diagrama de Classes - AutoSoccer

Modelo de dominio do AutoSoccer extraido de `src/database/models/`. As classes
representam tabelas Sequelize com seus principais atributos e relacionamentos
(cardinalidades inferidas das chaves estrangeiras e das tabelas de juncao).

Resumo das entidades:

- **User** — jogador autenticado (ou convidado) com saldo de moedas e trofeus.
- **Team** — equipe pertencente ao usuario; guarda placar/round da campanha atual.
- **Athlete** — atleta jogavel com stats, tier e tipo (defender/midfielder/attacker).
- **Ability** — habilidade descritiva referenciada por `Athlete`.
- **TeamAthlete** — tabela de juncao N:N entre `Team` e `Athlete`.
- **Item** — item de buff comprado pelo usuario com modificadores de atributos.
- **UserItem** — instancia de item no inventario, com consumo registrado.
- **TeamSnapshot** — fotografia imutavel da formacao da equipe antes da rodada.
- **MarketWindow** — janela de mercado (3 slots) por usuario.
- **RoundLog** — registro imutavel de uma rodada jogada.

```mermaid
classDiagram
    class User {
        +id: number
        +name: string
        +nickname: string
        +email: string
        +hashed_password: string
        +phone_number: string
        +victory: number
        +defeat: number
        +trophies: number
        +coins: number
        +is_guest: boolean
    }

    class Team {
        +id: number
        +user_id: number
        +name: string
        +round: number
        +victory: number
        +lose: number
        +draw: number
    }

    class Athlete {
        +id: number
        +name: string
        +velocity: number
        +attack: number
        +defense: number
        +ability_id: number
        +tier: enum
        +type: enum
        +cost: number
    }

    class Ability {
        +id: number
        +name: string
        +description: string
        +is_active: boolean
    }

    class TeamAthlete {
        +id: number
        +team_id: number
        +athlete_id: number
    }

    class Item {
        +id: number
        +name: string
        +description: string
        +modifier_attack: number
        +modifier_defense: number
        +modifier_velocity: number
        +cost: number
        +stackable: boolean
        +is_active: boolean
    }

    class UserItem {
        +id: number
        +user_id: number
        +item_id: number
        +consumed: boolean
        +athlete_id: number
        +snapshot_id: number
        +consumed_at: Date
        +created_at: Date
    }

    class TeamSnapshot {
        +id: number
        +team_id: number
        +user_id: number
        +round: number
        +victory: number
        +lose: number
        +draw: number
        +victory_ratio: number
        +positions: SnapshotPositions
        +created_at: Date
    }

    class MarketWindow {
        +id: number
        +user_id: number
        +athlete_id: number
        +slot: number
        +refreshed_at: Date
    }

    class RoundLog {
        +id: number
        +user_id: number
        +team_id: number
        +snapshot_id: number
        +opponent_snapshot_id: number
        +round: number
        +winner: enum
        +player_score: number
        +opponent_score: number
        +match_status: enum
        +trophies_delta: number
        +created_at: Date
    }

    User "1" --> "N" Team : possui
    User "1" --> "N" UserItem : inventario
    User "1" --> "N" TeamSnapshot : historico
    User "1" --> "N" MarketWindow : slots de mercado
    User "1" --> "N" RoundLog : log de rodadas

    Team "1" --> "N" TeamAthlete : escalacao
    Athlete "1" --> "N" TeamAthlete : escalado em
    Team "1" --> "N" TeamSnapshot : snapshots
    Team "1" --> "N" RoundLog : rodadas jogadas

    Athlete "N" --> "1" Ability : tem
    Athlete "1" --> "N" MarketWindow : ofertado em
    Athlete "1" --> "N" UserItem : alvo do item

    Item "1" --> "N" UserItem : instanciado como
    TeamSnapshot "1" --> "N" UserItem : aplicado em
    TeamSnapshot "1" --> "N" RoundLog : referenciado por
```

## Notas

- `TeamAthlete` materializa N:N entre `Team` e `Athlete` (unique index em
  `team_id + athlete_id`).
- `UserItem` materializa N:N entre `User` e `Item` com payload de consumo:
  guarda em qual `Athlete` e em qual `TeamSnapshot` o buff foi aplicado.
- `TeamSnapshot.positions` e um JSON 3x3 (`SnapshotPositions`) que congela
  atletas + bonus + ancoragem (RN011) no instante anterior ao motor de
  simulacao.
- `RoundLog` referencia dois snapshots distintos: o do jogador e o do
  oponente fantasma escolhido pelo matchmaking (RN006).
