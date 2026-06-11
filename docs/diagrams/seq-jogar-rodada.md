# Diagrama de Sequencia - Jogar Rodada

Fluxo do endpoint `POST /match/play-round` (rota em
`src/modules/partida/partida.routes.ts`, orquestrador em
`src/modules/partida/rodada.service.ts > jogarRodada`). Inclui o
matchmaking RN006 (`matchmaking.service.findOpponentSnapshot`), a iniciativa
RN009 (`simulador.computeInitiative`), o motor de 12 turnos
(`simulador.processarRodada`) e a finalizacao transacional
(`finalizeRound`).

```mermaid
sequenceDiagram
    actor Jogador
    participant Front as Frontend
    participant API as Fastify (partida.routes)
    participant Auth as auth.middleware.authenticate
    participant Svc as rodada.service.jogarRodada
    participant SnapSvc as loadOrCreateSnapshot
    participant Mm as matchmaking.service
    participant Sim as simulador (processarRodada)
    participant Fin as finalizeRound (transacao)
    participant DB as MySQL

    Jogador->>Front: clica em "Jogar Rodada"
    Front->>API: POST /match/play-round {snapshot_id?}
    API->>Auth: valida Bearer token
    Auth-->>API: request.user = {id}
    API->>Svc: jogarRodada({userId, snapshotId})

    Svc->>SnapSvc: loadOrCreateSnapshot(userId, snapshotId)
    alt snapshotId informado
        SnapSvc->>DB: TeamSnapshot.findByPk(snapshotId)
        DB-->>SnapSvc: TeamSnapshot
    else cria novo snapshot
        SnapSvc->>DB: Team.findOne({user_id}) include athletes
        DB-->>SnapSvc: Team + athletes
        SnapSvc->>SnapSvc: buildSnapshotPositions(athletes) (grid 3x3)
        SnapSvc->>DB: TeamSnapshot.create(positions, victory_ratio)
        DB-->>SnapSvc: TeamSnapshot
    end
    SnapSvc-->>Svc: playerSnapshot

    Svc->>DB: RoundLog.findAll(user_id) -> opponent_snapshot_ids ja enfrentados
    DB-->>Svc: facedSnapshotIds

    Svc->>Mm: findOpponentSnapshot(playerSnapshot, {excludeSnapshotIds})
    Mm->>DB: busca por progresso exato (victory, lose, draw)
    DB-->>Mm: TeamSnapshot | null
    opt nao encontrou exato
        loop janelas RN006 (0.05, 0.1, 0.2, 0.35, 1)
            Mm->>DB: WHERE ABS(victory_ratio - ratio) <= window
            DB-->>Mm: candidatos elegiveis
        end
    end
    Mm-->>Svc: {opponent, delta, windowUsed}

    Svc->>DB: Team.findByPk(playerSnapshot.team_id)
    DB-->>Svc: playerTeam
    Svc->>DB: Team.findByPk(opponentSnapshot.team_id)
    DB-->>Svc: opponentTeam

    Svc->>Svc: snapshotToTeamDto(player) + snapshotToTeamDto(opponent)
    Svc->>Sim: computeInitiative(playerDto, opponentDto, rng) (RN009)
    Sim-->>Svc: {startsWith, carrier, leadVelocity...}
    Svc->>Sim: processarRodada(playerDto, opponentDto, {initialPossession, initialCarrierId})
    Note over Sim: 12 turnos no grid 3x3 - Strategy resolve velocidade/ataque/defesa
    Sim-->>Svc: MatchResult {score, winner, events}

    Svc->>Fin: finalizeRound({userId, teamId, result, snapshots})
    Fin->>DB: BEGIN TRANSACTION
    Fin->>DB: Team.findByPk(LOCK UPDATE) + User.findByPk(LOCK UPDATE)
    DB-->>Fin: team, user
    Fin->>Fin: atualiza victory/lose/draw/round do team
    Fin->>Fin: resolveMatchStatus(victory, lose) RN001/RN002
    Fin->>Fin: coinsForRound(winner) RF010
    Fin->>DB: user.save() (coins sempre, trofeus so se matchEnded)
    Fin->>DB: RoundLog.create({winner, score, match_status, trophies_delta})
    opt partida encerrada (won/lost)
        Fin->>DB: zera placar do team e TeamAthlete.destroy(team_id)
    end
    Fin->>DB: team.save() + COMMIT
    DB-->>Fin: OK
    Fin-->>Svc: RoundResolution

    Svc-->>API: JogarRodadaResult (lineups, events, persisted, resolution)
    API-->>Front: 200 JSON
    Front-->>Jogador: renderiza placar + log dos 12 turnos
```

## Notas

- O `request.user.id` vem do JWT decodificado no `authenticate`; o backend
  ignora qualquer `user_id` enviado no body.
- RN006 (matchmaking): primeiro tenta progresso identico
  (`victory + lose + draw`) e, em seguida, alarga janelas progressivas de
  `victory_ratio`; snapshots ja enfrentados pelo jogador entram em
  `excludeSnapshotIds` para evitar adversario repetido.
- RN009 (iniciativa): soma a velocidade da linha mais avancada de cada time;
  empate e desempatado pelo `rng` (injetavel para testes).
- O motor de simulacao (Task 4.2) gera ate 12 turnos no grid 3x3,
  resolvendo cada evento (move/pass/tackle/shot/turnover) com Strategy
  baseada em velocidade/ataque/defesa.
- `finalizeRound` roda em transacao com `LOCK UPDATE` no `User` e no `Team`
  para evitar condicao de corrida no saldo de moedas/trofeus.
- `coins` sao redefinidas (sem acumular) a cada rodada (RF010); `trophies`
  so mudam quando a partida encerra e o usuario nao e convidado (RF004/RF005).
