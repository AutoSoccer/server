# API de equipe, mercado e partida

Este documento descreve o contrato usado pelo frontend no fluxo principal:
carregar mercado, comprar ou vender atletas, montar a formacao e jogar uma
rodada contra um snapshot assincrono.

## Autenticacao

Todas as rotas abaixo exigem JWT:

```http
Authorization: Bearer <token>
```

Quando `user_id` for enviado, ele precisa ser igual ao usuario do token. O
backend sempre considera o usuario autenticado.

## Regras atuais

- Usuario novo comeca com 10 moedas.
- Cada atleta custa 3 moedas.
- O mercado exibe no maximo 3 atletas.
- Atualizar o mercado custa 1 moeda.
- A venda de um atleta devolve 2 moedas.
- O time pode ter no maximo 6 atletas.
- E permitido jogar com uma formacao de 1 a 6 atletas.
- Cada rodada define o saldo do jogador como 10 moedas; o valor nao acumula.
- Vitorias nao concedem bonus adicional de moedas.
- A campanha termina com 10 vitorias ou 5 derrotas.
- Cada derrota remove uma vida; o jogador comeca com 5 vidas.
- Empates avancam a rodada, mas nao alteram vitorias, derrotas ou vidas.
- Ao terminar a campanha, o progresso e a equipe atual sao zerados.
- Snapshots anteriores permanecem salvos para o multiplayer assincrono.
- Os adversarios iniciais usam formacoes variadas entre esquerda, centro e direita.
- Na rodada 1, os adversarios iniciais possuem 3 atletas: um por setor.
- A partir da rodada 2, as snapshots dos adversarios podem possuir ate 6 atletas.
- O matchmaking prioriza o mesmo total de vitorias, derrotas e empates, mesmo
  que precise repetir uma snapshot ja enfrentada.
- Tipos ativos de atleta: `defender`, `midfielder` e `attacker`.

## GET /mercado

Retorna os atletas disponiveis no mercado do usuario.

```json
{
  "refresh_cost": 1,
  "refreshed_at": null,
  "coins": 10,
  "athletes": [
    {
      "id": 21,
      "name": "Jogador X",
      "velocity": 70,
      "attack": 80,
      "defense": 60,
      "ability_id": 4,
      "tier": "gold",
      "type": "attacker",
      "overall": 70,
      "cost": 3,
      "status": "MARKET"
    }
  ]
}
```

## POST /mercado/refresh

Desconta 1 moeda, sorteia uma nova selecao de no maximo 3 atletas e retorna o
mesmo formato de `GET /mercado`, incluindo o saldo atualizado em `coins`.

## GET /equipe

Retorna o time atual. Quando o usuario ainda nao possui time, retorna `null`.

```json
{
  "id": 1,
  "name": "Equipe 1",
  "round": 1,
  "victory": 0,
  "lose": 0,
  "athletes_count": 1,
  "max_athletes": 6,
  "athletes": [
    {
      "id": 21,
      "name": "Jogador X",
      "velocity": 70,
      "attack": 80,
      "defense": 60,
      "ability_id": 4,
      "tier": "gold",
      "type": "attacker",
      "cost": 3,
      "overall": 70
    }
  ]
}
```

## POST /equipe/comprar-atleta

Compra um atleta disponivel no mercado.

```json
{
  "atleta_id": 21
}
```

Resposta `201`:

```json
{
  "user": {
    "id": 1,
    "coins": 7
  },
  "team": {
    "id": 1,
    "athletes_count": 1
  },
  "athlete": {
    "id": 21,
    "name": "Jogador X",
    "cost": 3,
    "tier": "gold",
    "type": "attacker"
  }
}
```

Erros principais:

- `400 TEAM_FULL`
- `400 INSUFFICIENT_COINS`
- `404 USER_NOT_FOUND`
- `404 ATHLETE_NOT_AVAILABLE`

## POST /equipe/vender-atleta

Remove um atleta do time e credita 2 moedas.

```json
{
  "atleta_id": 21
}
```

Resposta `200`:

```json
{
  "user": {
    "id": 1,
    "coins": 12
  },
  "team": {
    "id": 1,
    "athletes_count": 0
  },
  "athlete": {
    "id": 21,
    "name": "Jogador X",
    "refund": 2,
    "tier": "gold",
    "type": "attacker"
  }
}
```

Erros principais:

- `404 TEAM_NOT_FOUND`
- `404 ATHLETE_NOT_OWNED`
- `404 ATHLETE_NOT_AVAILABLE`
- `404 USER_NOT_FOUND`

## POST /partida/jogar

Este e o endpoint principal do botao **Jogar**. Ele:

1. valida a formacao atual;
2. salva um snapshot imutavel;
3. encontra um snapshot adversario com campanha semelhante;
4. simula a rodada;
5. persiste resultado, moedas e progresso da campanha.

### Regras da simulacao

- Os dois grids 3x3 sao espelhados em um campo compartilhado 3x6.
- A iniciativa usa a soma de velocidade da linha ocupada mais avancada de cada
  time. Em empate, o inicio e sorteado.
- A bola comeca com o atleta mais veloz dessa linha.
- Cada movimento, passe ou chute consome uma das 12 acoes da rodada.
- Uma disputa faz parte da acao que a causou e nao consome uma acao adicional.
- Somente o portador da bola se movimenta.
- O portador prioriza avancar reto; quando bloqueado por companheiro, tenta
  diagonal para frente e depois movimento lateral.
- Defensores e meias tentam passar para o atacante mais proximo. Sem atacante,
  escolhem o companheiro elegivel mais proximo.
- O passe pode atravessar mais de uma casa.
- O adversario mais proximo do receptor tenta interceptar o passe.
- Interceptacao usa `velocidade_receptor / (velocidade_receptor +
  velocidade_interceptor)`.
- Disputa durante o avanco usa `ataque_portador / (ataque_portador +
  defesa_adversario)`.
- Ao perder uma disputa na zona de ataque, o portador recua para uma vaga livre
  da propria defesa.
- Na ultima linha, a chance de gol e igual ao ataque do portador em percentual.
  Exemplo: 75 de ataque representa 75% de chance.
- Se o chute falhar, o adversario mais proximo recebe a bola. Empates de
  distancia sao resolvidos por RNG.
- O primeiro gol encerra a rodada.
- Sem gol depois de 12 acoes, a rodada termina empatada.
- A posicao original do atleta nao concede bonus nem penalidade de atributos.
- Na primeira rodada, o matchmaking ignora snapshots adversarios com mais de
  tres atletas, inclusive snapshots antigos de jogadores reais.

Body com 1 a 6 atletas:

```json
{
  "positions": [
    {
      "athleteId": 21,
      "posX": 0,
      "posY": 2
    }
  ]
}
```

As coordenadas validas sao de `0` a `2`, formando um grid 3x3. Nao e
permitido repetir atleta nem celula.

Resposta `200` resumida:

```json
{
  "lineups": {
    "player": {
      "snapshotId": 10,
      "teamId": 1,
      "name": "Equipe 1",
      "positions": [
        [null, null, null],
        [null, null, null],
        [
          {
            "id": 21,
            "name": "Jogador X",
            "velocity": 70,
            "attack": 80,
            "defense": 60
          },
          null,
          null
        ]
      ]
    },
    "opponent": {
      "snapshotId": 42,
      "teamId": 8,
      "name": "Canela Nervosa FC",
      "positions": [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ]
    }
  },
  "score": {
    "player": 1,
    "opponent": 0
  },
  "winner": "player",
  "totalTurns": 12,
  "initialBall": {
    "team": "player",
    "athleteId": 21,
    "athleteName": "Jogador X",
    "position": {
      "x": 0,
      "y": 2
    }
  },
  "events": [
    {
      "turn": 1,
      "possession": "player",
      "ballRow": 3,
      "kind": "move",
      "attackerId": 21,
      "success": true,
      "goal": false,
      "movements": [
        {
          "team": "player",
          "athleteId": 21,
          "from": { "x": 0, "y": 2 },
          "to": { "x": 0, "y": 3 }
        }
      ],
      "ball": {
        "team": "player",
        "athleteId": 21,
        "athleteName": "Jogador X",
        "position": { "x": 0, "y": 3 }
      },
      "description": "Jogador X avanca com a bola para (0, 3)."
    }
  ],
  "persisted": {
    "teamId": 1,
    "victory": 1,
    "lose": 0,
    "round": 2
  },
  "resolution": {
    "matchStatus": "in_progress",
    "matchEnded": false,
    "trophiesDelta": 0,
    "trophies": 0,
    "coinsEarned": 10,
    "coins": 10,
    "userVictory": 0,
    "userDefeat": 0,
    "isGuest": false,
    "roundLogId": 15
  }
}
```

`lineups.player.positions` e `lineups.opponent.positions` formam o estado
inicial. O oponente deve ser espelhado no campo 3x6. Cada entrada de `events`
informa movimentos e o estado da bola depois da acao, alimentando o log e a
animacao da batalha.

Erros de formacao:

- `400 WRONG_ATHLETE_COUNT`: precisa de 1 a 6 atletas.
- `400 DUPLICATE_ATHLETE`
- `400 DUPLICATE_POSITION`
- `400 OUT_OF_BOUNDS`
- `400 ATHLETE_NOT_IN_TEAM`
- `404 TEAM_NOT_FOUND`

## POST /equipe/salvar-estado

Rota de baixo nivel para salvar somente o snapshot, sem jogar a rodada. Aceita
o mesmo array `positions` de 1 a 6 atletas. O frontend principal deve preferir
`POST /partida/jogar`, que salva e joga em uma unica operacao.

## POST /partida/desistir

Abandona a campanha autenticada sem registrar derrota nem alterar trofeus.

Ao confirmar a desistencia, o backend executa tudo em uma unica transacao:

- restaura o saldo para 10 moedas;
- zera vitorias, derrotas e empates;
- retorna a equipe para a rodada 1;
- remove todos os atletas da equipe atual;
- preserva snapshots e logs anteriores como historico.

O endpoint nao exige corpo e retorna o estado inicial do usuario e da equipe.

## POST /partida/iniciar

Inicia uma campanha nova com o nome de time escolhido pelo usuario.

```json
{
  "name": "Canela de Vidro FC"
}
```

O nome e obrigatorio, nao precisa ser unico e deve ter entre 1 e 40
caracteres. Sempre que este endpoint e chamado:

- a equipe e criada ou recebe o novo nome;
- o saldo volta para 10 moedas;
- vitorias, derrotas, empates e rodada voltam ao estado inicial;
- os atletas atuais sao removidos;
- a janela do mercado e renovada ao abrir a nova campanha;
- trofeus, snapshots e logs historicos sao preservados.

## POST /partida/jogar-rodada

Rota de baixo nivel para executar a simulacao usando um snapshot existente. O
frontend principal nao precisa chama-la diretamente.

## Fluxo recomendado no frontend

1. No menu principal, solicitar o nome do time.
2. Enviar o nome para `POST /partida/iniciar`.
3. Carregar `/auth/me`, `/mercado` e `/equipe`.
4. Comprar ou vender atletas e atualizar moedas com a resposta da API.
5. Permitir posicionar de 1 a 6 atletas no grid.
6. Enviar a formacao para `POST /partida/jogar`.
7. Renderizar os campos a partir de `lineups`.
8. Animar os eventos e mostrar o resultado retornado pelo backend.
9. Voltar ao mercado e recarregar o estado persistido.
