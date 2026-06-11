# language: pt
# Feature BDD do mercado e compra/venda de atletas.
#
# Mapeamento com o codigo real:
#   - GET  /market         -> src/modules/mercado/mercado.routes.ts (linhas 44-63)
#                             src/modules/mercado/mercado.service.ts (getMarket, linhas 191-236)
#   - POST /market/refresh -> src/modules/mercado/mercado.routes.ts (linhas 65-85)
#                             src/modules/mercado/mercado.service.ts (refreshMarket, linhas 140-189)
#   - POST /team/buy       -> src/modules/equipe/equipe.routes.ts
#                             src/modules/equipe/equipe.service.ts (buyAthlete, linhas 167-259)
#   - POST /team/sell      -> src/modules/equipe/equipe.service.ts (sellAthlete, linhas 261-340)
#
# Constantes reais do dominio:
#   - MARKET_SIZE = 3            (mercado.service.ts:6)
#   - REFRESH_COST = 1           (mercado.service.ts:7)
#   - TEAM_MAX_ATHLETES = 6      (equipe.service.ts:6)
#   - ATHLETE_SELL_REFUND = 2    (equipe.service.ts:7)
#
# Codigos de erro: ErrorCode.MercadoInsufficientCoins ('INSUFFICIENT_COINS'),
# ErrorCode.EquipeAthleteNotAvailable ('ATHLETE_NOT_AVAILABLE'),
# ErrorCode.EquipeTeamFull ('TEAM_FULL') definidos em
# src/modules/shared/errorCodes.ts.

Funcionalidade: Mercado e gestao de atletas
  Como jogador autenticado
  Quero comprar, vender e atualizar a vitrine de atletas do mercado
  Para montar uma equipe competitiva dentro do meu orcamento

  Contexto:
    Dado que estou autenticado com um token JWT valido
    E meu saldo atual e de 10 moedas (COINS_PER_ROUND inicial)
    E minha equipe atual nao excede 6 atletas (TEAM_MAX_ATHLETES)

  Cenario: Listar atletas disponiveis no mercado
    Quando envio GET para "/market" com header Authorization
    Entao a resposta tem status 200
    E o corpo contem "refresh_cost" igual a 1
    E o corpo contem "coins" igual ao saldo atual do usuario
    E o corpo contem ate 3 atletas no array "athletes" (MARKET_SIZE)
    E cada atleta possui os campos id, name, velocity, attack, defense,
      ability_id, tier, type, overall, cost e status

  Cenario: Mercado e gerado automaticamente quando ainda nao existe janela
    Dado que o jogador nunca abriu o mercado nesta sessao
    Quando envio GET para "/market"
    Entao o servico cria uma nova janela de mercado com 3 atletas
    E a resposta tem status 200
    E "refreshed_at" e preenchido com timestamp ISO 8601

  Cenario: Comprar atleta com saldo suficiente
    Dado que existe um atleta com id 21, cost 5 e status "MARKET" na minha janela
    E meu saldo atual e maior ou igual a 5 moedas
    Quando envio POST para "/team/buy" com o corpo:
      """
      { "athlete_id": 21 }
      """
    Entao a resposta tem status 201
    E o corpo contem "user.coins" reduzido em 5 moedas
    E o corpo contem "team.athletes_count" incrementado em 1
    E o atleta deixa de aparecer na janela de mercado do jogador

  Cenario: Comprar atleta com saldo insuficiente retorna erro
    Dado que existe um atleta com id 42 e cost 9999 na minha janela
    E meu saldo atual e menor que 9999 moedas
    Quando envio POST para "/team/buy" com athlete_id 42
    Entao a resposta tem status de erro de dominio
    E o corpo contem "code" igual a "INSUFFICIENT_COINS"
    E meu saldo nao e alterado
    E o atleta continua disponivel na janela de mercado

  Cenario: Comprar atleta com equipe cheia retorna 400/422
    Dado que minha equipe ja possui 6 atletas (TEAM_MAX_ATHLETES)
    Quando envio POST para "/team/buy" com qualquer athlete_id valido
    Entao o servico lanca EquipeServiceError
    E o corpo contem "code" igual a "TEAM_FULL"

  Cenario: Comprar atleta que nao esta na minha janela retorna erro
    Dado que o atleta com id 999 nao esta na minha MarketWindow
    Quando envio POST para "/team/buy" com athlete_id 999
    Entao a resposta tem status de erro de dominio
    E o corpo contem "code" igual a "ATHLETE_NOT_AVAILABLE"

  Cenario: Refresh do mercado custa REFRESH_COST e gera nova janela
    Dado que meu saldo atual e maior ou igual a 1 moeda (REFRESH_COST)
    E existem atletas suficientes no banco que nao estao na minha equipe
    Quando envio POST para "/market/refresh" com header Authorization
    Entao a resposta tem status 200
    E o corpo contem "coins" reduzido em 1 moeda
    E o corpo contem 3 novos atletas no array "athletes" (MARKET_SIZE)
    E "refreshed_at" e atualizado para o timestamp da operacao

  Cenario: Refresh do mercado sem saldo retorna erro
    Dado que meu saldo atual e menor que 1 moeda
    Quando envio POST para "/market/refresh"
    Entao a resposta tem status de erro de dominio
    E o corpo contem "code" igual a "INSUFFICIENT_COINS"
    E minha janela de mercado anterior nao e alterada

  Cenario: Vender atleta da equipe devolve ATHLETE_SELL_REFUND moedas
    Dado que meu time possui o atleta com id 21
    Quando envio POST para "/team/sell" com athlete_id 21
    Entao a resposta tem status 200
    E o corpo contem "user.coins" incrementado em 2 moedas (ATHLETE_SELL_REFUND)
    E o corpo contem "team.athletes_count" decrementado em 1
    E o registro em team_athletes do atleta e removido

  Cenario: Vender atleta que nao pertence ao time retorna erro
    Dado que o atleta com id 77 nao esta no meu time
    Quando envio POST para "/team/sell" com athlete_id 77
    Entao a resposta tem status de erro de dominio
    E o corpo contem "code" igual a "ATHLETE_NOT_OWNED"
