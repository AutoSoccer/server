# language: pt
# Feature BDD da campanha e da rodada (batalha auto-battler).
#
# Mapeamento com o codigo real:
#   - POST /match/start       -> src/modules/partida/partida.routes.ts (linhas 314-349)
#                                src/modules/partida/campaign.service.ts (startCampaign, linhas 127-209)
#   - POST /match/abandon     -> src/modules/partida/partida.routes.ts (linhas 351-370)
#                                src/modules/partida/campaign.service.ts (abandonCampaign, linhas 64-121)
#   - POST /match/play        -> src/modules/partida/partida.routes.ts (linhas 372-433)
#                                src/modules/partida/rodada.service.ts (jogarRodadaComFormacao, linhas 551-568)
#   - POST /match/play-round  -> src/modules/partida/partida.routes.ts (linhas 435-488)
#                                src/modules/partida/rodada.service.ts (jogarRodada, linhas 428-545)
#
# Regras de negocio aplicadas:
#   - RN001: WINS_TO_WIN_MATCH = 10        (partida/rodada.logic.ts:5)
#   - RN002: LOSSES_TO_LOSE_MATCH = 5      (partida/rodada.logic.ts:7)
#   - RF004: TROPHIES_ON_WIN = +30, TROPHIES_ON_LOSS = -15
#                                          (partida/rodada.logic.ts:22-24)
#   - RF005: convidado (is_guest) nao ganha/perde trofeus
#                                          (rodada.service.ts:356-364)
#   - RF010: COINS_PER_ROUND = 10          (partida/rodada.logic.ts:10)
#   - MIN/MAX_POSITIONED_ATHLETES = 1..6   (equipe/team-snapshot.service.ts:17-18)
#
# Codigos de erro: ErrorCode.RodadaTeamEmpty ('TEAM_EMPTY'),
# ErrorCode.RodadaTeamNotFound ('TEAM_NOT_FOUND'),
# ErrorCode.RodadaNoOpponentFound ('NO_OPPONENT_FOUND'),
# ErrorCode.CampaignInvalidTeamName ('INVALID_TEAM_NAME') definidos em
# src/modules/shared/errorCodes.ts.

Funcionalidade: Campanha e rodadas de batalha
  Como jogador autenticado com equipe formada
  Quero iniciar uma campanha, jogar rodadas e abandonar quando quiser
  Para acumular vitorias, trofeus e progredir no ranking persistente

  Contexto:
    Dado que estou autenticado com um token JWT valido
    E meu usuario nao e convidado (is_guest = false)

  Cenario: Iniciar campanha com nome valido
    Dado que ainda nao iniciei nenhuma campanha nesta sessao
    Quando envio POST para "/match/start" com o corpo:
      """
      { "name": "Tigres FC" }
      """
    Entao a resposta tem status 200
    E o corpo contem "team.name" igual a "Tigres FC"
    E o corpo contem "team.round" igual a 1
    E o corpo contem "team.victory" igual a 0
    E o corpo contem "team.lose" igual a 0
    E o corpo contem "user.coins" igual a 10 (COINS_PER_ROUND)
    E qualquer MarketWindow anterior do usuario e destruida

  Cenario: Iniciar campanha com nome vazio retorna 400
    Quando envio POST para "/match/start" com nome ""
    Entao a resposta tem status 400
    E o corpo contem "code" igual a "INVALID_TEAM_NAME"

  Cenario: Iniciar campanha com nome maior que 40 caracteres retorna 400
    Quando envio POST para "/match/start" com nome de 41 caracteres
    Entao a resposta tem status 400
    E o corpo contem "code" igual a "INVALID_TEAM_NAME"

  Cenario: Jogar rodada com formacao valida
    Dado que iniciei a campanha "Tigres FC"
    E comprei 3 atletas do mercado e estao no meu time
    Quando envio POST para "/match/play" com positions contendo 3 atletas
      e items vazio:
      """
      {
        "positions": [
          { "athleteId": 21, "posX": 0, "posY": 0 },
          { "athleteId": 22, "posX": 1, "posY": 1 },
          { "athleteId": 23, "posX": 2, "posY": 2 }
        ],
        "items": []
      }
      """
    Entao a resposta tem status 200
    E o corpo contem "winner" igual a "player", "opponent" ou "draw"
    E o corpo contem "totalTurns" igual a 12
    E o corpo contem o array "events" com o log de cada turno
    E o corpo contem "matchmaking" com o snapshot do adversario fantasma (RN006)
    E o corpo contem "initiative" com quem comeca com a posse (RN009)
    E o corpo contem "resolution.coinsEarned" igual a 10
    E o corpo contem "resolution.matchStatus" igual a "in_progress",
      "won" ou "lost"

  Cenario: Jogar rodada com formacao vazia retorna 400
    Quando envio POST para "/match/play" com positions = []
    Entao a resposta tem status 400
    E a mensagem indica que positions precisa ter entre 1 e 6 atletas

  Cenario: Jogar rodada com mais de 6 atletas retorna 400
    Quando envio POST para "/match/play" com positions contendo 7 atletas
    Entao a resposta tem status 400
    E a mensagem indica violacao do limite maximo de 6 atletas

  Cenario: Jogar rodada sem time formado retorna TEAM_EMPTY
    Dado que iniciei uma campanha porem nao comprei nenhum atleta
    Quando envio POST para "/match/play-round" sem snapshot_id
    Entao a resposta tem status de erro de dominio
    E o corpo contem "code" igual a "TEAM_EMPTY"

  Cenario: Vitoria de rodada incrementa team.victory e ganha 10 moedas
    Dado que iniciei a campanha "Tigres FC"
    E o motor de simulacao retorna winner = "player"
    Quando envio POST para "/match/play" com formacao valida
    Entao "persisted.victory" e incrementado em 1
    E "persisted.lose" continua igual
    E "resolution.coinsEarned" = 10
    E "resolution.trophiesDelta" = 0 enquanto a partida segue (in_progress)

  Cenario: Derrota de rodada incrementa team.lose mas mantem coins
    Dado que iniciei a campanha "Tigres FC"
    E o motor de simulacao retorna winner = "opponent"
    Quando envio POST para "/match/play" com formacao valida
    Entao "persisted.lose" e incrementado em 1
    E "persisted.victory" continua igual
    E "resolution.coinsEarned" = 10
    E "resolution.matchStatus" segue "in_progress" enquanto lose < 5

  Cenario: Decima vitoria encerra partida com sucesso e aplica trofeus
    Dado que ja venci 9 rodadas nesta campanha
    Quando envio POST para "/match/play" e o motor retorna winner = "player"
    Entao "resolution.matchEnded" e true
    E "resolution.matchStatus" e "won"
    E "resolution.trophiesDelta" e +30 (TROPHIES_ON_WIN)
    E user.victory e incrementado em 1
    E o progresso do time (victory, lose, round) e zerado para a proxima campanha
    E os atletas em team_athletes sao removidos

  Cenario: Quinta derrota encerra partida com fracasso e perde trofeus
    Dado que ja perdi 4 rodadas nesta campanha
    Quando envio POST para "/match/play" e o motor retorna winner = "opponent"
    Entao "resolution.matchEnded" e true
    E "resolution.matchStatus" e "lost"
    E "resolution.trophiesDelta" e -15 (TROPHIES_ON_LOSS)
    E user.defeat e incrementado em 1
    E user.trophies nao fica abaixo de zero (applyTrophies)

  Cenario: Convidado nao recebe trofeus mesmo encerrando a partida
    Dado que estou autenticado como convidado (is_guest = true)
    E ja venci 9 rodadas nesta campanha
    Quando envio POST para "/match/play" e o motor retorna winner = "player"
    Entao "resolution.matchEnded" e true
    E "resolution.matchStatus" e "won"
    E "resolution.trophiesDelta" e 0
    E "resolution.isGuest" e true
    E user.trophies nao e alterado

  Cenario: Abandonar a campanha apaga progresso porem mantem trofeus
    Dado que iniciei a campanha "Tigres FC" e venci 3 rodadas
    E ja possuo 60 trofeus acumulados
    Quando envio POST para "/match/abandon"
    Entao a resposta tem status 200
    E o corpo contem "team.round" igual a 1
    E o corpo contem "team.victory" igual a 0
    E o corpo contem "team.lose" igual a 0
    E "team.athletesCount" igual a 0
    E "user.coins" igual a 10 (COINS_PER_ROUND inicial)
    E "user.trophies" continua igual a 60 (trofeus persistem)

  Cenario: Empate em rodada conta como rodada jogada e mantem partida em curso
    Dado que iniciei a campanha "Tigres FC"
    Quando envio POST para "/match/play" e o motor retorna winner = "draw"
    Entao "persisted.victory" nao e alterado
    E "persisted.lose" nao e alterado
    E "team.draw" e incrementado em 1
    E "resolution.matchStatus" segue "in_progress"
