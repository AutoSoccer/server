# API - Equipe (Time do jogador)

Este documento descreve como a API de equipe funciona, para integrar o frontend.

## Autenticacao

Todas as rotas exigem Bearer Token (JWT) no header:

```
Authorization: Bearer <token>
```

O `user_id` considerado e sempre o do token. Se o body enviar `user_id`, ele precisa bater com o usuario autenticado.

## Dados principais (visao do backend)

- `teams`: time do usuario (nome, rodada, vitorias, derrotas).
- `team_athletes`: tabela de ligacao time <-> atletas.
- `team_snapshots`: snapshot imutavel da formacao por rodada (grid 3x3), usado pelo matchmaking/simulacao.

## Endpoints

### GET /equipe

Retorna o time do usuario autenticado.

**Resposta 200**

```
{
  "id": 1,
  "name": "Equipe 1",
  "round": 1,
  "victory": 0,
  "lose": 0,
  "athletes_count": 3,
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

**Resposta 200 (sem time criado)**

```
null
```

### POST /equipe/comprar-atleta

Compra um atleta do mercado atual e adiciona no time do usuario.

**Body**

```
{
  "atleta_id": 21,
  "user_id": 1
}
```

`user_id` e opcional. Se enviado, precisa bater com o token.

**Resposta 201**

```
{
    
  "user": {
    "id": 1,
    "coins": 7
  },
  "team": {
    "id": 1,
    "athletes_count": 4
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

**Erros possiveis**

- `400 TEAM_FULL`: time ja possui 6 atletas.
- `400 INSUFFICIENT_COINS`: moedas insuficientes.
- `404 USER_NOT_FOUND`: usuario nao encontrado.
- `404 ATHLETE_NOT_AVAILABLE`: atleta nao esta disponivel no mercado atual ou nao existe.

### POST /equipe/salvar-estado

Salva o snapshot da formacao atual da equipe para a rodada (grid 3x3). Exige exatamente 6 atletas posicionados.

**Body**

```
{
  "user_id": 1,
  "positions": [
    { "athleteId": 21, "posX": 0, "posY": 0 },
    { "athleteId": 22, "posX": 1, "posY": 0 },
    { "athleteId": 23, "posX": 2, "posY": 0 },
    { "athleteId": 24, "posX": 0, "posY": 1 },
    { "athleteId": 25, "posX": 1, "posY": 1 },
    { "athleteId": 26, "posX": 2, "posY": 1 }
  ],
  "items": []
}
```

`items` esta reservado (Sprint 5). Se enviar itens, a API retorna erro.

**Resposta 200**

```
{
  "snapshotId": 10,
  "teamId": 1,
  "round": 1,
  "victory": 0,
  "lose": 0,
  "victoryRatio": 0,
  "positions": [
    [
      { "id": 21, "name": "Jogador X", "velocity": 70, "attack": 80, "defense": 60 },
      { "id": 22, "name": "Jogador Y", "velocity": 65, "attack": 75, "defense": 55 },
      { "id": 23, "name": "Jogador Z", "velocity": 60, "attack": 70, "defense": 50 }
    ],
    [
      { "id": 24, "name": "Jogador A", "velocity": 68, "attack": 72, "defense": 58 },
      { "id": 25, "name": "Jogador B", "velocity": 66, "attack": 74, "defense": 62 },
      { "id": 26, "name": "Jogador C", "velocity": 64, "attack": 76, "defense": 54 }
    ],
    [
      null,
      null,
      null
    ]
  ]
}
```

**Erros possiveis**

- `400 INVALID_BODY`: payload invalido (ex: positions nao e array).
- `400 WRONG_ATHLETE_COUNT`: precisa de exatamente 6 atletas.
- `400 DUPLICATE_ATHLETE`: mesmo atleta enviado duas vezes.
- `400 DUPLICATE_POSITION`: duas entradas na mesma celula.
- `400 OUT_OF_BOUNDS`: posicao fora do grid 3x3.
- `400 ATHLETE_NOT_IN_TEAM`: atleta nao pertence ao time do usuario.
- `400 ITEM_NOT_IN_INVENTORY`: itens ainda nao implementados.
- `404 TEAM_NOT_FOUND`: usuario nao possui time.

## Regras importantes

- O time do usuario pode ser criado automaticamente ao comprar o primeiro atleta.
- O time suporta no maximo 6 atletas.
- O snapshot e imutavel: salva o estado atual (grid) e usa essa foto para rodada/matchmaking.
- `positions` e um grid 3x3 com atletas ou `null`.
- Todo atleta custa 3 moedas/reais.
- Usuario novo comeca com 10 moedas/reais.
- A cada rodada jogada, o usuario recebe 10 moedas/reais.
- O ganho por rodada e fixo e nao acumula no saldo.
- Nao existe bonus extra por vitoria.

## Notas para o frontend

- Use o `GET /equipe` para montar a tela do time e mostrar elenco atual.
- Apos comprar atleta, atualize `coins` do usuario e o contador `athletes_count`.
- Para salvar formacao, envie exatamente 6 atletas e posicoes unicas no grid 3x3.
- Chame `POST /equipe/salvar-estado` somente ao final da organizacao do time.
- O payload deve ser apenas `positions` com as coordenadas do grid (posX, posY) para cada atleta.
- Se receber `null` no `GET /equipe`, trate como "time ainda nao criado".

## Exemplos de chamadas

### cURL

GET /equipe

```
curl -X GET "https://api.seudominio.com/equipe" \
  -H "Authorization: Bearer SEU_TOKEN"
```

POST /equipe/comprar-atleta

```
curl -X POST "https://api.seudominio.com/equipe/comprar-atleta" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"atleta_id\":21}"
```

POST /equipe/salvar-estado

```
curl -X POST "https://api.seudominio.com/equipe/salvar-estado" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"positions\":[{\"athleteId\":21,\"posX\":0,\"posY\":0},{\"athleteId\":22,\"posX\":1,\"posY\":0},{\"athleteId\":23,\"posX\":2,\"posY\":0},{\"athleteId\":24,\"posX\":0,\"posY\":1},{\"athleteId\":25,\"posX\":1,\"posY\":1},{\"athleteId\":26,\"posX\":2,\"posY\":1}]}"
```

### Axios (frontend)

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.seudominio.com',
  headers: { Authorization: `Bearer ${token}` }
});

export async function carregarEquipe() {
  const { data } = await api.get('/equipe');
  return data; // pode ser null
}

export async function comprarAtleta(atletaId: number) {
  const { data } = await api.post('/equipe/comprar-atleta', {
    atleta_id: atletaId
  });
  return data;
}

export async function salvarEstadoEquipe(positions: Array<{ athleteId: number; posX: number; posY: number }>) {
  const { data } = await api.post('/equipe/salvar-estado', {
    positions
  });
  return data;
}
```

## Fluxos recomendados de tela

### Tela "Meu Time"

1. Chame `GET /equipe` ao abrir a tela.
2. Se vier `null`, mostre estado vazio e um CTA para comprar atleta no mercado.
3. Se vier time, renderize elenco e contador `athletes_count/max_athletes`.

### Tela "Salvar Formacao"

1. Valide no frontend se existem exatamente 6 atletas no grid 3x3.
2. Envie `POST /equipe/salvar-estado`.
3. Se sucesso, use `positions` retornado para confirmar o layout salvo.
