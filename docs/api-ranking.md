# API de Ranking

## Visao geral

O ranking geral usa o total atual de trofeus do usuario. Apenas contas reais
com pelo menos uma campanha concluida aparecem na classificacao.

- Convidados podem consultar o ranking, mas nunca aparecem nele.
- Contas sem campanhas concluidas nao aparecem.
- Uma campanha concluida e uma vitoria ou derrota registrada no perfil.
- O limite padrao e 50 e o maximo permitido e 100.

## Criterios de ordenacao

1. maior quantidade de trofeus;
2. maior quantidade de vitorias;
3. menor quantidade de derrotas;
4. usuario criado primeiro, usando o menor `id`.

## GET `/ranking`

Requer `Authorization: Bearer <token>`. Tokens de convidados sao aceitos.

### Query

| Campo | Tipo | Obrigatorio | Regra |
| --- | --- | --- | --- |
| `limit` | inteiro | nao | Entre 1 e 100. Padrao: 50. |

### Resposta `200`

```json
{
  "ranking": [
    {
      "position": 1,
      "userId": 12,
      "nickname": "camisa10",
      "trophies": 120,
      "victory": 6,
      "defeat": 2,
      "completedCampaigns": 8,
      "winRate": 75,
      "lossRate": 25
    }
  ],
  "currentUser": {
    "userId": 37,
    "nickname": "canela",
    "isGuest": false,
    "position": 64,
    "appearsInRanking": false,
    "trophies": 15,
    "victory": 2,
    "defeat": 3,
    "completedCampaigns": 5,
    "winRate": 40,
    "lossRate": 60
  }
}
```

`currentUser` sempre representa o usuario autenticado. Assim, o front consegue
mostrar suas metricas e sua posicao global mesmo quando ele estiver fora do
limite da lista.

Para convidados e contas sem campanhas concluidas, `position` e `null` e
`appearsInRanking` e `false`.

Os percentuais possuem no maximo uma casa decimal e sao calculados apenas com
campanhas encerradas:

```text
winRate = victory / (victory + defeat) * 100
lossRate = 100 - winRate
```

### Erros

- `401`: token ausente, invalido ou expirado.
- `404 USER_NOT_FOUND`: o usuario do token nao existe mais no banco.
